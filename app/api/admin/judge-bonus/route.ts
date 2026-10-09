import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session || session.user.role !== 'ADMIN') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { teamId, bonus } = await req.json()
  
  if (!teamId || bonus === undefined) {
    return NextResponse.json({ success: false, error: 'Missing teamId or bonus' }, { status: 400 })
  }

  try {
    // Delete any existing bonus for this team
    await prisma.transaction.deleteMany({
      where: { teamId, type: 'JUDGE_BONUS' }
    });

    // Create a new bonus record
    await prisma.transaction.create({
      data: {
        teamId,
        type: 'JUDGE_BONUS',
        stockSymbol: 'BONUS',
        shares: parseInt(bonus.toString(), 10), // We use 'shares' to store the points
        priceAtTransaction: 0
      }
    });

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 })
  }
}
