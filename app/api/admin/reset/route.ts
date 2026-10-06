import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session || !session.user || (session.user as any).role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Reset all team balances to 1,000,000 and clear portfolios
  await prisma.portfolioItem.deleteMany()
  await prisma.team.updateMany({
    data: { balance: 1000000 }
  })
  
  // Optionally reset stock prices
  await prisma.stock.updateMany({
    data: { currentPrice: 100 }
  })
  
  return NextResponse.json({ success: true })
}
