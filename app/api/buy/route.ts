import { prisma } from '@/lib/prisma'
import { eventBus } from '@/lib/sse'
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session || session.user.role !== 'TEAM') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { stockSymbol, shares } = await req.json()
  const teamId = session.user.teamId as string

  try {
    const result = await prisma.$transaction(async (tx) => {
      const state = await tx.systemState.findUnique({ where: { id: 'singleton' } })
      if (state?.currentPhase !== 'PORTFOLIO') {
        throw new Error("Buying is only allowed during the PORTFOLIO phase.")
      }

      const stock = await tx.stock.findUnique({ where: { symbol: stockSymbol } })
      if (!stock) throw new Error("Stock not found")
      
      const team = await tx.team.findUnique({ where: { id: teamId } })
      if (!team) throw new Error("Team not found")

      const totalCost = stock.startPrice * shares

      if (team.balance < totalCost) throw new Error("Insufficient balance")
      if (stock.availableShares < shares) throw new Error("Not enough shares available")

      const updatedTeam = await tx.team.update({
        where: { id: teamId },
        data: { balance: { decrement: totalCost } }
      })

      const updatedStock = await tx.stock.update({
        where: { symbol: stockSymbol },
        data: { availableShares: { decrement: shares } }
      })

      const portfolioItem = await tx.portfolioItem.upsert({
        where: { teamId_stockSymbol: { teamId, stockSymbol } },
        create: { teamId, stockSymbol, shares, currentPrice: stock.startPrice },
        update: { shares: { increment: shares } }
      })

      await tx.transaction.create({
        data: {
          teamId,
          stockSymbol,
          type: 'BUY',
          shares,
          priceAtTransaction: stock.startPrice
        }
      })

      return { updatedTeam, updatedStock, portfolioItem }
    })

    eventBus.emit('update', JSON.stringify({ type: 'STOCK_SUPPLY_CHANGED', stockSymbol, newSupply: result.updatedStock.availableShares }))

    return NextResponse.json({ success: true, balance: result.updatedTeam.balance })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 })
  }
}
