import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'

// Math Rules Reference (Updated):
// Good 1: NOVA. A(Cost=300000, NOVA * 1.25), B(Cost=150000, NOVA * 1.12), C(Cost=0, NOVA * 1.0)
// Good 2: VOLT. A(Cost=200000, VOLT * 1.20), B(Cost=100000, VOLT * 1.10), C(Cost=0, VOLT * 0.98)
// Good 3: FINCO. A(Cost=250000, FINCO * 1.22), B(Cost=100000, FINCO * 1.09), C(Cost=0, FINCO * 1.0)
// Bad 1: NOVA. A(Cost=0, NOVA * 0.85). B(Cost=0, Exit NOVA). C(Cost=100000, NOVA * 1.15)
// Bad 2: SHIPX. A(Cost=0, SHIPX * 0.88). B(Cost=0, Exit SHIPX). C(Cost=100000, SHIPX * 1.05)
// Bad 3: FRESH. A(Cost=0, FRESH * 0.90). B(Cost=0, Exit FRESH). C(Cost=150000, FRESH * 1.08)

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

        // Note: For global pricing, the script allows prices to vary per team,
        // because each team makes different choices (e.g. Protect vs Hold).
        // A team's PortfolioItem.currentPrice tracks their specific valuation.

        for (const eventId of eventsToProcess) {
          const decision = team.decisions.find(d => d.eventId === eventId);
          if (!decision) continue;
          processedDecisions++;
          const choice = decision.choice;

          // Helper to get holding
          const getPortfolio = (sym: string) => team.portfolio.find(p => p.stockSymbol === sym);

          if (eventId === 1) { // Good Event 1: NOVA
            let mult = choice === 'A' ? 1.25 : (choice === 'B' ? 1.12 : 1.0);
            const p = getPortfolio('NOVA');
            if (p) await tx.portfolioItem.update({ where: { id: p.id }, data: { currentPrice: p.currentPrice * mult } });
          }
          
          if (eventId === 2) { // Good Event 2: VOLT
            let mult = choice === 'A' ? 1.20 : (choice === 'B' ? 1.10 : 0.98);
            const p = getPortfolio('VOLT');
            if (p) await tx.portfolioItem.update({ where: { id: p.id }, data: { currentPrice: p.currentPrice * mult } });
          }
          
          if (eventId === 3) { // Good Event 3: FINCO
            let mult = choice === 'A' ? 1.22 : (choice === 'B' ? 1.09 : 1.0);
            const p = getPortfolio('FINCO');
            if (p) await tx.portfolioItem.update({ where: { id: p.id }, data: { currentPrice: p.currentPrice * mult } });
          }
          
          if (eventId === 4) { // Bad Event 1: NOVA
            const p = getPortfolio('NOVA');
            if (choice === 'A') { // HOLD
              if (p) await tx.portfolioItem.update({ where: { id: p.id }, data: { currentPrice: p.currentPrice * 0.85 } });
            } else if (choice === 'B') { // EXIT
              if (p) {
                updatedBalance += (p.shares * p.currentPrice);
                await tx.portfolioItem.update({ where: { id: p.id }, data: { shares: 0 } });
              }
            } else if (choice === 'C') { // DOUBLE_DOWN
              if (p) await tx.portfolioItem.update({ where: { id: p.id }, data: { currentPrice: p.currentPrice * 1.15 } });
            }
          }

          if (eventId === 5) { // Bad Event 2: SHIPX
            const p = getPortfolio('SHIPX');
            if (choice === 'A') { // HOLD
              if (p) await tx.portfolioItem.update({ where: { id: p.id }, data: { currentPrice: p.currentPrice * 0.88 } });
            } else if (choice === 'B') { // EXIT
              if (p) {
                updatedBalance += (p.shares * p.currentPrice);
                await tx.portfolioItem.update({ where: { id: p.id }, data: { shares: 0 } });
              }
            } else if (choice === 'C') { // HEDGE
              if (p) await tx.portfolioItem.update({ where: { id: p.id }, data: { currentPrice: p.currentPrice * 1.05 } });
            }
          }

          if (eventId === 6) { // Bad Event 3: FRESH
            const p = getPortfolio('FRESH');
            if (choice === 'A') { // HOLD
              if (p) await tx.portfolioItem.update({ where: { id: p.id }, data: { currentPrice: p.currentPrice * 0.90 } });
            } else if (choice === 'B') { // EXIT
              if (p) {
                updatedBalance += (p.shares * p.currentPrice);
                await tx.portfolioItem.update({ where: { id: p.id }, data: { shares: 0 } });
              }
            } else if (choice === 'C') { // PIVOT
              if (p) await tx.portfolioItem.update({ where: { id: p.id }, data: { currentPrice: p.currentPrice * 1.08 } });
            }
          }
          
          if (eventId === 7) { // Final Event: Deploy Remaining Cash Balance
            let yld = choice === 'PATH_1' ? 1.05 : (choice === 'PATH_2' ? 1.12 : 1.25);
            updatedBalance = updatedBalance * yld;
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
