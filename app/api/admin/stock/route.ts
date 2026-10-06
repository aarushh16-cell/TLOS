import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const data = await req.json()
  
  if (data.id) {
    // Update
    const stock = await prisma.stock.update({
      where: { id: data.id },
      data: {
        name: data.name,
        symbol: data.symbol,
        sector: data.sector,
        currentPrice: parseFloat(data.currentPrice),
        riskProfile: data.riskProfile
      }
    })
    return NextResponse.json({ success: true, stock })
  } else {
    // Create
    const stock = await prisma.stock.create({
      data: {
        name: data.name,
        symbol: data.symbol,
        sector: data.sector,
        currentPrice: parseFloat(data.currentPrice),
        startPrice: parseFloat(data.currentPrice),
        riskProfile: data.riskProfile,
        totalShares: 1000000,
        availableShares: 1000000,
      }
    })
    return NextResponse.json({ success: true, stock })
  }
}

export async function DELETE(req: NextRequest) {
  const { id } = await req.json()
  await prisma.stock.delete({ where: { id } })
  return NextResponse.json({ success: true })
}
