import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session || !session.user || (session.user as any).role !== 'TEAM') {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  const teamId = (session.user as any).teamId as string
  const body = await req.json()
  const { stockSymbol, shares, type } = body

  if (!stockSymbol || typeof shares !== 'number' || shares <= 0 || !['BUY', 'SELL'].includes(type)) {
    return NextResponse.json({ success: false, error: 'Invalid parameters' }, { status: 400 })
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      const state = await tx.systemState.findUnique({ where: { id: 'singleton' } })
      if (state && (!state.isTradingEnabled || state.currentPhase !== 'PORTFOLIO')) {
        throw new Error('Trading is only permitted during the Initial Buy Phase.')
      }

      const team = await tx.team.findUnique({ where: { id: teamId }, include: { portfolio: true } })
      const stock = await tx.stock.findUnique({ where: { symbol: stockSymbol } })

      if (!team || !stock) {
        throw new Error('Entity not found')
      }

      const totalCost = stock.currentPrice * shares;
      const portfolioItem = team.portfolio.find(p => p.stockSymbol === stockSymbol);
      const currentShares = portfolioItem?.shares || 0;

      let updatedTeam;
      let updatedStock;

      if (type === 'BUY') {
        if (team.balance < totalCost) {
          throw new Error('Insufficient funds')
        }
        if (stock.availableShares < shares) {
          throw new Error('Not enough shares available in the market')
        }
        if (currentShares + shares > 2000) {
          throw new Error(`Holding limit reached! You can only own a maximum of 2,000 shares of ${stock.symbol}.`)
        }
        
        updatedTeam = await tx.team.update({ 
          where: { id: team.id }, 
          data: { balance: team.balance - totalCost } 
        });
        
        await tx.portfolioItem.upsert({
          where: { teamId_stockSymbol: { teamId: team.id, stockSymbol: stock.symbol } },
          update: { shares: currentShares + shares },
          create: { teamId: team.id, stockSymbol: stock.symbol, shares: shares, currentPrice: stock.currentPrice }
        });

        updatedStock = await tx.stock.update({
          where: { symbol: stock.symbol },
          data: { availableShares: stock.availableShares - shares }
        });
      } else { // SELL
        if (currentShares < shares) {
          throw new Error('Insufficient shares in portfolio')
        }
        
        updatedTeam = await tx.team.update({ 
          where: { id: team.id }, 
          data: { balance: team.balance + totalCost } 
        });
        
        if (currentShares - shares === 0) {
          await tx.portfolioItem.delete({ where: { teamId_stockSymbol: { teamId: team.id, stockSymbol: stock.symbol } } });
        } else {
          await tx.portfolioItem.update({
            where: { teamId_stockSymbol: { teamId: team.id, stockSymbol: stock.symbol } },
            data: { shares: currentShares - shares }
          });
        }

        updatedStock = await tx.stock.update({
          where: { symbol: stock.symbol },
          data: { availableShares: stock.availableShares + shares }
        });
      }

      await tx.transaction.create({
        data: {
          teamId: team.id,
          stockSymbol: stock.symbol,
          type: type,
          shares: shares,
          priceAtTransaction: stock.currentPrice
        }
      });

      // No price impact during Phase 1 (PORTFOLIO phase). Prices remain fixed.
      // Prices only change during events.
      
      return { success: true }
    });

    return NextResponse.json(result)
  } catch (error: any) {
    console.log("Trade failed:", error.message)
    return NextResponse.json({ success: false, error: error.message }, { status: 400 })
  }
}
