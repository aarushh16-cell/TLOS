import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const { eventId } = await req.json()
  
  const stocks = await prisma.stock.findMany()
  
  for (const stock of stocks) {
    let multiplier = 1.0;
    
    // Simulate events
    if (eventId === 1 && stock.sector === 'Technology') multiplier = 1.15; // NOVA Boom
    else if (eventId === 2 && stock.sector === 'Energy') multiplier = 1.10; // VOLT Subsidy
    else if (eventId === 3 && stock.sector === 'Finance') multiplier = 1.08; // FINCO Win
    else if (eventId === 4 && stock.sector === 'Technology') multiplier = 0.75; // NOVA Leak
    else if (eventId === 5 && stock.sector === 'Logistics') multiplier = 0.80; // Fuel Crisis
    else {
      // General market noise (+/- 2%)
      multiplier = 1 + (Math.random() * 0.04 - 0.02)
    }

    const newPrice = Math.max(1, stock.currentPrice * multiplier); // Don't go below 1
    
    await prisma.stock.update({
      where: { symbol: stock.symbol },
      data: { currentPrice: newPrice }
    });

    await prisma.priceHistory.create({
      data: {
        stockSymbol: stock.symbol,
        price: newPrice
      }
    });
  }

  return NextResponse.json({ success: true, message: `Event ${eventId} applied.` })
}
