import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session || session.user.role !== 'ADMIN') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { teamId } = await req.json()

  try {
    await prisma.$transaction(async (tx) => {
      if (teamId === 'ALL') {
         const items = await tx.portfolioItem.findMany();
         // Restore availableShares to the global stock supply
         for (const item of items) {
           if (item.shares > 0) {
             await tx.stock.update({
               where: { symbol: item.stockSymbol },
               data: { availableShares: { increment: item.shares } }
             });
           }
         }
         await tx.portfolioItem.deleteMany();
         await tx.team.updateMany({
           data: { balance: 1000000 }
         });
      } else {
         const items = await tx.portfolioItem.findMany({
           where: { teamId }
         });
         // Restore availableShares to the global stock supply
         for (const item of items) {
           if (item.shares > 0) {
             await tx.stock.update({
               where: { symbol: item.stockSymbol },
               data: { availableShares: { increment: item.shares } }
             });
           }
         }
         await tx.portfolioItem.deleteMany({
           where: { teamId }
         });
         await tx.team.update({
           where: { id: teamId },
           data: { balance: 1000000 }
         });
      }
    });

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 })
  }
}
