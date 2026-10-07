import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'

// Math Rules Reference:
// Good 1: NOVA. A(Cost=300000, NOVA * 1.25), B(Cost=150000, NOVA * 1.12), C(Cost=0, NOVA * 1.0)
// Good 2: VOLT+SHIPX. A(Cost=200000, VOLT*1.20, SHIPX*1.15), B(Cost=100000, VOLT*1.10, SHIPX*1.08), C(Cost=0, VOLT*1.0, SHIPX*1.0)
// Good 3: FINCO+FRESH. A(Cost=250000, FINCO*1.18, FRESH*1.10), B(Cost=100000, FINCO*1.10, FRESH*1.04), C(Cost=0, FINCO*1.0, FRESH*1.0)
// Bad 1: NOVA+FINCO. A(Cost=0, NOVA drop 30%, FINCO drop 12%). B(Cost=0, Exit NOVA @ 15% discount, FINCO drop 12%). C(Cost=150000, NOVA drop 5%, FINCO drop 0%)
// Bad 2: VOLT+SHIPX. A(Cost=0, VOLT drop 25%, SHIPX drop 20%). B(Cost=0, Exit both @ 10% discount). C(Cost=120000, VOLT drop 5%, SHIPX +5%)
// Bad 3: FRESH+MEDIX. A(Cost=0, FRESH drop 18%, MEDIX drop 15%). B(Cost=0, Exit both @ 8% discount). C(Cost=100000, FRESH drop 4%, MEDIX drop 2%)

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
          
          if (eventId === 2) { // Good Event 2: VOLT + SHIPX
            let voltMult = choice === 'A' ? 1.20 : (choice === 'B' ? 1.10 : 1.0);
            let shipxMult = choice === 'A' ? 1.15 : (choice === 'B' ? 1.08 : 1.0);
            const pVolt = getPortfolio('VOLT');
            const pShipx = getPortfolio('SHIPX');
            if (pVolt) await tx.portfolioItem.update({ where: { id: pVolt.id }, data: { currentPrice: pVolt.currentPrice * voltMult } });
            if (pShipx) await tx.portfolioItem.update({ where: { id: pShipx.id }, data: { currentPrice: pShipx.currentPrice * shipxMult } });
          }
          
          if (eventId === 3) { // Good Event 3: FINCO + FRESH
            let fincoMult = choice === 'A' ? 1.18 : (choice === 'B' ? 1.10 : 1.0);
            let freshMult = choice === 'A' ? 1.10 : (choice === 'B' ? 1.04 : 1.0);
            const pFinco = getPortfolio('FINCO');
            const pFresh = getPortfolio('FRESH');
            if (pFinco) await tx.portfolioItem.update({ where: { id: pFinco.id }, data: { currentPrice: pFinco.currentPrice * fincoMult } });
            if (pFresh) await tx.portfolioItem.update({ where: { id: pFresh.id }, data: { currentPrice: pFresh.currentPrice * freshMult } });
          }
          
          if (eventId === 4) { // Bad Event 1: NOVA + FINCO
            const pNova = getPortfolio('NOVA');
            const pFinco = getPortfolio('FINCO');
            
            if (choice === 'A') { // Hold
              if (pNova) await tx.portfolioItem.update({ where: { id: pNova.id }, data: { currentPrice: pNova.currentPrice * 0.70 } }); // -30%
              if (pFinco) await tx.portfolioItem.update({ where: { id: pFinco.id }, data: { currentPrice: pFinco.currentPrice * 0.88 } }); // -12%
            } else if (choice === 'B') { // Exit NOVA
              if (pNova) {
                updatedBalance += (pNova.shares * (pNova.currentPrice * 0.85)); // 15% discount
                await tx.portfolioItem.update({ where: { id: pNova.id }, data: { shares: 0 } });
              }
              if (pFinco) await tx.portfolioItem.update({ where: { id: pFinco.id }, data: { currentPrice: pFinco.currentPrice * 0.88 } }); // -12%
            } else if (choice === 'C') { // Protect
              if (pNova) await tx.portfolioItem.update({ where: { id: pNova.id }, data: { currentPrice: pNova.currentPrice * 0.95 } }); // -5%
              // FINCO unchanged
            }
          }

          if (eventId === 5) { // Bad Event 2: VOLT + SHIPX
            const pVolt = getPortfolio('VOLT');
            const pShipx = getPortfolio('SHIPX');
            
            if (choice === 'A') {
              if (pVolt) await tx.portfolioItem.update({ where: { id: pVolt.id }, data: { currentPrice: pVolt.currentPrice * 0.75 } }); // -25%
              if (pShipx) await tx.portfolioItem.update({ where: { id: pShipx.id }, data: { currentPrice: pShipx.currentPrice * 0.80 } }); // -20%
            } else if (choice === 'B') { // Exit Both
              if (pVolt) {
                updatedBalance += (pVolt.shares * (pVolt.currentPrice * 0.90));
                await tx.portfolioItem.update({ where: { id: pVolt.id }, data: { shares: 0 } });
              }
              if (pShipx) {
                updatedBalance += (pShipx.shares * (pShipx.currentPrice * 0.90));
                await tx.portfolioItem.update({ where: { id: pShipx.id }, data: { shares: 0 } });
              }
            } else if (choice === 'C') { // Protect
              if (pVolt) await tx.portfolioItem.update({ where: { id: pVolt.id }, data: { currentPrice: pVolt.currentPrice * 0.95 } }); // -5%
              if (pShipx) await tx.portfolioItem.update({ where: { id: pShipx.id }, data: { currentPrice: pShipx.currentPrice * 1.05 } }); // +5%
            }
          }

          if (eventId === 6) { // Bad Event 3: FRESH + MEDIX
            const pFresh = getPortfolio('FRESH');
            const pMedix = getPortfolio('MEDIX');
            
            if (choice === 'A') {
              if (pFresh) await tx.portfolioItem.update({ where: { id: pFresh.id }, data: { currentPrice: pFresh.currentPrice * 0.82 } }); // -18%
              if (pMedix) await tx.portfolioItem.update({ where: { id: pMedix.id }, data: { currentPrice: pMedix.currentPrice * 0.85 } }); // -15%
            } else if (choice === 'B') { // Exit Both
              if (pFresh) {
                updatedBalance += (pFresh.shares * (pFresh.currentPrice * 0.92)); // 8% discount
                await tx.portfolioItem.update({ where: { id: pFresh.id }, data: { shares: 0 } });
              }
              if (pMedix) {
                updatedBalance += (pMedix.shares * (pMedix.currentPrice * 0.92));
                await tx.portfolioItem.update({ where: { id: pMedix.id }, data: { shares: 0 } });
              }
            } else if (choice === 'C') { // Protect
              if (pFresh) await tx.portfolioItem.update({ where: { id: pFresh.id }, data: { currentPrice: pFresh.currentPrice * 0.96 } }); // -4%
              if (pMedix) await tx.portfolioItem.update({ where: { id: pMedix.id }, data: { currentPrice: pMedix.currentPrice * 0.98 } }); // -2%
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
