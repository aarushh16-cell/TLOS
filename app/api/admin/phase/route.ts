import { prisma } from '@/lib/prisma'
import { eventBus } from '@/lib/sse'
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session || session.user.role !== 'ADMIN') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { phase } = await req.json()
  const currentState = await prisma.systemState.findUnique({ where: { id: 'singleton' } })

  if (currentState?.currentPhase === 'PORTFOLIO' && phase !== 'PORTFOLIO') {
    // Lock in the final global market prices into each team's portfolio before event divergences
    const stocks = await prisma.stock.findMany();
    await prisma.$transaction(
      stocks.map(stock => 
        prisma.portfolioItem.updateMany({
          where: { stockSymbol: stock.symbol },
          data: { currentPrice: stock.currentPrice }
        })
      )
    );
  }

  await prisma.systemState.update({
    where: { id: 'singleton' },
    data: { currentPhase: phase }
  })
  eventBus.emit('update', JSON.stringify({ type: 'PHASE_CHANGED', phase }))

  return NextResponse.json({ success: true, phase })
}
