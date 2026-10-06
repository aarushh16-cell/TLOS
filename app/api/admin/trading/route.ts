import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const { isTradingEnabled } = await req.json()
  
  await prisma.systemState.upsert({
    where: { id: 'singleton' },
    update: { isTradingEnabled },
    create: { id: 'singleton', isTradingEnabled }
  })
  
  return NextResponse.json({ success: true, isTradingEnabled })
}
