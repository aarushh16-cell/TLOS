import { prisma } from '@/lib/prisma'
import { eventBus } from '@/lib/sse'
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'

const eventLogic: Record<number, any> = {
  // Good Events
  1: { target: 'NOVA',  choices: { A: { mult: 1.25 }, B: { mult: 1.12 }, C: { mult: 1.00 } } },
  2: { target: 'VOLT',  choices: { A: { mult: 1.20 }, B: { mult: 1.10 }, C: { mult: 0.98 } } },
  3: { target: 'FINCO', choices: { A: { mult: 1.22 }, B: { mult: 1.09 }, C: { mult: 1.00 } } },
  // Bad Events
  4: { target: 'NOVA',  choices: { A: { action: 'HOLD', mult: 0.85 }, B: { action: 'EXIT', mult: 1.00 }, C: { action: 'DOUBLE_DOWN', mult: 1.15 } } },
  5: { target: 'SHIPX', choices: { A: { action: 'HOLD', mult: 0.88 }, B: { action: 'EXIT', mult: 1.00 }, C: { action: 'HEDGE', mult: 1.05 } } },
  6: { target: 'FRESH', choices: { A: { action: 'HOLD', mult: 0.90 }, B: { action: 'EXIT', mult: 1.00 }, C: { action: 'PIVOT', mult: 1.08 } } },
  // Final
  7: { target: 'ALL', choices: { PATH_1: { yield: 1.05 }, PATH_2: { yield: 1.12 }, PATH_3: { yield: 1.25 } } } // Simplifying Path 3 to 1.25 for now
};

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session || session.user.role !== 'ADMIN') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { type } = await req.json() // 'GOOD', 'BAD', 'FINAL'
  
  let eventsToProcess: number[] = [];
  if (type === 'GOOD') eventsToProcess = [1, 2, 3];
  else if (type === 'BAD') eventsToProcess = [4, 5, 6];
  else if (type === 'FINAL') eventsToProcess = [7];

  try {
    let processedDecisions = 0;
    await prisma.$transaction(async (tx) => {
      const teams = await tx.team.findMany({ include: { portfolio: true, decisions: true } });

      for (const team of teams) {
        let updatedBalance = team.balance;

        for (const eventId of eventsToProcess) {
          const decision = team.decisions.find(d => d.eventId === eventId);
          if (!decision) continue;
          
          processedDecisions++;
          const logic = eventLogic[eventId];
          const choiceData = logic.choices[decision.choice];

          if (type === 'FINAL') {
             updatedBalance = updatedBalance * choiceData.yield;
          } else {
             const portfolioItem = team.portfolio.find(p => p.stockSymbol === logic.target);
             if (portfolioItem && portfolioItem.shares > 0) {
               if (choiceData.action === 'EXIT') {
                 updatedBalance += (portfolioItem.shares * portfolioItem.currentPrice);
                 await tx.portfolioItem.update({
                   where: { id: portfolioItem.id },
                   data: { shares: 0 }
                 });
               } else {
                 await tx.portfolioItem.update({
                   where: { id: portfolioItem.id },
                   data: { currentPrice: portfolioItem.currentPrice * choiceData.mult }
                 });
               }
             }
          }
        }
        
        await tx.team.update({
          where: { id: team.id },
          data: { balance: updatedBalance }
        });
      }
    });

    return NextResponse.json({ success: true, processedDecisions })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 })
  }
}
