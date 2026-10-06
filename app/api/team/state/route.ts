import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session || session.user.role !== 'TEAM') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const teamId = session.user.teamId as string
  const team = await prisma.team.findUnique({
    where: { id: teamId },
    include: { 
      portfolio: {
        include: { stock: true }
      },
      decisions: true
    }
  })
  const state = await prisma.systemState.findUnique({ where: { id: 'singleton' } })
  const stocks = await prisma.stock.findMany()

  return NextResponse.json({
    balance: team?.balance,
    portfolio: team?.portfolio,
    decisions: team?.decisions || [],
    stocks,
    phase: state?.currentPhase,
    isTradingEnabled: state?.isTradingEnabled ?? true,
    activeEvent: null // Not tracking global active event continuously for simplicity, push via SSE
  })
}
