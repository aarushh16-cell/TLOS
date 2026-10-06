import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'

export const dynamic = 'force-dynamic'



export async function GET(req: NextRequest) {
  // Skipping auth for prototype ease
  
  const state = await prisma.systemState.findUnique({ where: { id: 'singleton' } })
  const teams = await prisma.team.findMany({ 
    include: { 
      portfolio: {
        include: { stock: true }
      },
      decisions: true,
      transactions: true
    } 
  })
  
  // Calculate leaderboards using the real Stock currentPrice or PortfolioItem currentPrice based on phase
  const leaderboards = teams.map(team => {
    const portfolioValue = team.portfolio.reduce((acc, p) => {
       const priceToUse = state?.currentPhase === 'PORTFOLIO' ? p.stock.currentPrice : p.currentPrice;
       return acc + (p.shares * priceToUse);
    }, 0)
    return {
      id: team.id,
      name: team.name,
      balance: team.balance,
      portfolioValue,
      totalValue: team.balance + portfolioValue,
      decisions: team.decisions,
      transactions: team.transactions,
      portfolio: team.portfolio
    }
  }).sort((a, b) => b.totalValue - a.totalValue)

  const stocks = await prisma.stock.findMany();

  return NextResponse.json({
    phase: state?.currentPhase || 'PORTFOLIO',
    isTradingEnabled: state?.isTradingEnabled ?? true,
    leaderboards,
    teams: teams.map(t => ({ id: t.id, name: t.name, balance: t.balance, userId: t.userId })),
    stocks
  })
}
