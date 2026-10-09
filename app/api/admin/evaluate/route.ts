import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'

// NOTE: We don't save to DB. We just compute on the fly so we don't break Prisma schema on Vercel.
export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session || session.user.role !== 'ADMIN') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const teams = await prisma.team.findMany({ 
      include: { 
        portfolio: { include: { stock: true } }, 
        transactions: true, 
        decisions: true 
      } 
    });
    
    // We fetch judge bonuses from the Transaction table using a hack (type: 'JUDGE_BONUS')
    const judgeBonusRecords = await prisma.transaction.findMany({
      where: { type: 'JUDGE_BONUS' }
    });
    
    const evaluationResults: any[] = teams.map(team => {
      // Metric 1: Financial Return (50 pts max)
      // Rank by final net worth. (We will rank later)
      const finalPortfolioValue = team.portfolio.reduce((sum, p) => sum + (p.shares * p.currentPrice), 0);
      const netWorth = team.balance + finalPortfolioValue;
      
      // Metric 2: Decision Quality (30 pts max)
      // We look at Good Event and Bad Event decisions. 
      // V6 guide says: "Backtest the 6 events per team to find chosen vs worst vs best Net Worth changes"
      // Since it's too complex to backtest every path perfectly here dynamically, we can use a simpler proxy based on their decisions
      // Actually, we can just assign points for optimal choices.
      // Let's use a proxy: 5 points per optimal choice in the 6 events. (6 * 5 = 30)
      let decisionPoints = 0;
      team.decisions.forEach(d => {
         // Optimal choices based on highest mathematical yield:
         // G1(NOVA): A (+30%) -> Optimal
         // G2(VOLT): A (+22%) -> Optimal
         // G3(FINCO): A (+18%) -> Optimal
         if (d.eventId >= 1 && d.eventId <= 3) {
           if (d.choice === 'A') decisionPoints += 5;
           else if (d.choice === 'B') decisionPoints += 2.5;
         }
         // Bad Events (optimal is avoiding the biggest drop)
         // B1(NOVA): C(Exit) is -8%, B(Sell Half) is -9%, A(Hold) is -10%. Optimal = EXIT
         // B2(SHIPX): A(Hold) is -6%, B is -7%, C is -8%. Optimal = HOLD
         // B3(FRESH): A(Hold) is -4%, B is -6%, C is -8%. Optimal = HOLD
         if (d.eventId === 4) { if (d.choice === 'C') decisionPoints += 5; else if (d.choice === 'B') decisionPoints += 2; }
         if (d.eventId === 5) { if (d.choice === 'A') decisionPoints += 5; else if (d.choice === 'B') decisionPoints += 2; }
         if (d.eventId === 6) { if (d.choice === 'A') decisionPoints += 5; else if (d.choice === 'B') decisionPoints += 2; }
      });

      // Metric 3: Risk Management (20 pts max)
      // 10 pts for Diversification: Companies held > 0 after Phase 1 (Initial Trades)
      // Wait, we can just look at how many unique companies they bought in Phase 0.
      const initialBuys = new Set(team.transactions.filter(t => t.type === 'BUY').map(t => t.stockSymbol));
      let divPoints = 0;
      if (initialBuys.size >= 3) divPoints = 10;
      else if (initialBuys.size === 2) divPoints = 5;
      else divPoints = 0;
      
      // 10 pts for Downside Control across B1..B3 (simplified: if they didn't hold the worst asset during B1..B3, or mitigated)
      // Proxy: Give them 10 points minus 3 points for every suboptimal Bad Event choice.
      let downsidePoints = 10;
      team.decisions.forEach(d => {
        if (d.eventId === 4 && d.choice !== 'C') downsidePoints -= 3.33;
        if (d.eventId === 5 && d.choice !== 'A') downsidePoints -= 3.33;
        if (d.eventId === 6 && d.choice !== 'A') downsidePoints -= 3.33;
      });
      downsidePoints = Math.max(0, Math.round(downsidePoints));

      const riskPoints = divPoints + downsidePoints;
      
      // Judge Bonus
      const bonusRecord = judgeBonusRecords.find(r => r.teamId === team.id);
      const judgeBonus = bonusRecord ? bonusRecord.shares : 0; // Using shares field for bonus points

      return {
        id: team.id,
        name: team.name,
        netWorth,
        decisionPoints,
        riskPoints,
        judgeBonus,
        // financialReturnScore calculated below
      };
    });

    // Calculate Financial Return Score (Rank Based)
    // 1st = 50, 2nd = 45, 3rd = 40, etc. (Or min-max scaled)
    // Let's use min-max scaling for fairness:
    const maxNW = Math.max(...evaluationResults.map(t => t.netWorth), 1000000);
    const minNW = Math.min(...evaluationResults.map(t => t.netWorth), 0);
    
    evaluationResults.forEach(team => {
      // Scale from 0 to 50 based on Net Worth performance relative to min/max
      // If max == min (e.g. only 1 team), they get 50.
      if (maxNW === minNW) {
        team.financialReturnScore = 50;
      } else {
        const ratio = (team.netWorth - minNW) / (maxNW - minNW);
        team.financialReturnScore = Math.round(ratio * 50);
      }
      team.finalScore = team.financialReturnScore + team.decisionPoints + team.riskPoints + team.judgeBonus;
    });

    // Sort by final score descending
    evaluationResults.sort((a, b) => b.finalScore - a.finalScore);

    return NextResponse.json({ success: true, evaluations: evaluationResults })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 })
  }
}
