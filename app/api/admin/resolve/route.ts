import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'

// Math Rules Reference (v6 Spec):
// Good 1: NOVA. A(+30%), B(+15%), C(0%)
// Good 2: VOLT. A(+22%), B(+11%), C(0%)
// Good 3: FINCO. A(+18%), B(+9%), C(0%)
// Bad 1: NOVA. A(-10%), B(-9% and Sell 50%), C(-8% and Sell 100%)
// Bad 2: SHIPX. A(-6%), B(-7% and Sell 50%), C(-8% and Sell 100%)
// Bad 3: FRESH. A(-4%), B(-6% and Sell 50%), C(-8% and Sell 100%)

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
            let mult = choice === 'A' ? 1.30 : (choice === 'B' ? 1.15 : 1.0);
            const p = getPortfolio('NOVA');
            if (p) await tx.portfolioItem.update({ where: { id: p.id }, data: { currentPrice: p.currentPrice * mult } });
          }
          
          if (eventId === 2) { // Good Event 2: VOLT
            let mult = choice === 'A' ? 1.22 : (choice === 'B' ? 1.11 : 1.0);
            const p = getPortfolio('VOLT');
            if (p) await tx.portfolioItem.update({ where: { id: p.id }, data: { currentPrice: p.currentPrice * mult } });
          }
          
          if (eventId === 3) { // Good Event 3: FINCO
            let mult = choice === 'A' ? 1.18 : (choice === 'B' ? 1.09 : 1.0);
            const p = getPortfolio('FINCO');
            if (p) await tx.portfolioItem.update({ where: { id: p.id }, data: { currentPrice: p.currentPrice * mult } });
          }
          
          if (eventId === 4) { // Bad Event 1: NOVA
            const p = getPortfolio('NOVA');
            if (p) {
              if (choice === 'A') { // HOLD
                await tx.portfolioItem.update({ where: { id: p.id }, data: { currentPrice: p.currentPrice * 0.90 } });
              } else if (choice === 'B') { // SELL HALF (-9% drop)
                const newPrice = p.currentPrice * 0.91;
                const sharesToSell = Math.floor(p.shares / 2);
                updatedBalance += (sharesToSell * newPrice);
                await tx.portfolioItem.update({ where: { id: p.id }, data: { currentPrice: newPrice, shares: p.shares - sharesToSell } });
              } else if (choice === 'C') { // EXIT (-8% drop)
                const newPrice = p.currentPrice * 0.92;
                updatedBalance += (p.shares * newPrice);
                await tx.portfolioItem.update({ where: { id: p.id }, data: { currentPrice: newPrice, shares: 0 } });
              }
            }
          }

          if (eventId === 5) { // Bad Event 2: SHIPX
            const p = getPortfolio('SHIPX');
            if (p) {
              if (choice === 'A') { // HOLD
                await tx.portfolioItem.update({ where: { id: p.id }, data: { currentPrice: p.currentPrice * 0.94 } });
              } else if (choice === 'B') { // SELL HALF (-7% drop)
                const newPrice = p.currentPrice * 0.93;
                const sharesToSell = Math.floor(p.shares / 2);
                updatedBalance += (sharesToSell * newPrice);
                await tx.portfolioItem.update({ where: { id: p.id }, data: { currentPrice: newPrice, shares: p.shares - sharesToSell } });
              } else if (choice === 'C') { // EXIT (-8% drop)
                const newPrice = p.currentPrice * 0.92;
                updatedBalance += (p.shares * newPrice);
                await tx.portfolioItem.update({ where: { id: p.id }, data: { currentPrice: newPrice, shares: 0 } });
              }
            }
          }

          if (eventId === 6) { // Bad Event 3: FRESH
            const p = getPortfolio('FRESH');
            if (p) {
              if (choice === 'A') { // HOLD
                await tx.portfolioItem.update({ where: { id: p.id }, data: { currentPrice: p.currentPrice * 0.96 } });
              } else if (choice === 'B') { // SELL HALF (-6% drop)
                const newPrice = p.currentPrice * 0.94;
                const sharesToSell = Math.floor(p.shares / 2);
                updatedBalance += (sharesToSell * newPrice);
                await tx.portfolioItem.update({ where: { id: p.id }, data: { currentPrice: newPrice, shares: p.shares - sharesToSell } });
              } else if (choice === 'C') { // EXIT (-8% drop)
                const newPrice = p.currentPrice * 0.92;
                updatedBalance += (p.shares * newPrice);
                await tx.portfolioItem.update({ where: { id: p.id }, data: { currentPrice: newPrice, shares: 0 } });
              }
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
