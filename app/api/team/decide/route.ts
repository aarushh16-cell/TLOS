import { prisma } from '@/lib/prisma'
import { eventBus } from '@/lib/sse'
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'

const eventLogic: Record<number, any> = {
  // Good Events (G1, G2, G3) - Moves are percentages. Fees are calculated dynamically (25% of the gain).
  1: { target: 'NOVA',  type: 'growth', choices: { A: { move: 0.30 }, B: { move: 0.15 }, C: { move: 0.00 } } },
  2: { target: 'VOLT',  type: 'growth', choices: { A: { move: 0.22 }, B: { move: 0.11 }, C: { move: 0.00 } } },
  3: { target: 'FINCO', type: 'growth', choices: { A: { move: 0.18 }, B: { move: 0.09 }, C: { move: 0.00 } } },
  // Bad Events (B1, B2, B3)
  4: { target: 'NOVA',  type: 'shock', choices: { A: { action: 'HOLD' }, B: { action: 'SELL_HALF' }, C: { action: 'EXIT' } } },
  5: { target: 'SHIPX', type: 'shock', choices: { A: { action: 'HOLD' }, B: { action: 'SELL_HALF' }, C: { action: 'EXIT' } } },
  6: { target: 'FRESH', type: 'shock', choices: { A: { action: 'HOLD' }, B: { action: 'SELL_HALF' }, C: { action: 'EXIT' } } },
  // Final Decision (Note: v6 doesn't specify options for Event 7 explicitly beyond what's in the guide, keeping as is)
  7: { target: 'ALL', type: 'final', choices: { PATH_1: { action: 'SAFE' }, PATH_2: { action: 'BALANCED' }, PATH_3: { action: 'AGGRESSIVE' } } }
};

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session || session.user.role !== 'TEAM') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { eventId, choice } = await req.json()
  const teamId = session.user.teamId as string
  
  try {
    const result = await prisma.$transaction(async (tx) => {
      const logic = eventLogic[eventId]
      if (!logic) throw new Error("Invalid event ID")
      
      const choiceData = logic.choices[choice]
      if (!choiceData) throw new Error("Invalid choice")
        
      const team = await tx.team.findUnique({ 
        where: { id: teamId },
        include: { portfolio: true }
      })
      if (!team) throw new Error("Team not found")

      // Prevent duplicate decisions
      const existingDecision = await tx.teamDecision.findUnique({ where: { teamId_eventId: { teamId, eventId } } })
      if (existingDecision) throw new Error("You have already made a decision for this event.")

      let updatedTeam = team
      
      // V6 Engine: Good Event Fee Calculation
      if (logic.type === 'growth') {
        const p = team.portfolio.find(x => x.stockSymbol === logic.target);
        
        let totalFee = 0;
        if (p && p.shares > 0) {
          // Fee = 25% of the gain per share
          const gainPerShare = p.currentPrice * choiceData.move;
          const feePerShare = gainPerShare * 0.25;
          totalFee = feePerShare * p.shares;
          
          // Cash guard: if fee is too high, cap it at balance
          if (totalFee > team.balance) {
            totalFee = team.balance;
          }
        }

        if (totalFee > 0) {
          updatedTeam = await tx.team.update({
            where: { id: teamId },
            data: { balance: { decrement: totalFee } },
            include: { portfolio: true }
          })
        }
      }

      // Record the decision. 
      await tx.teamDecision.create({
        data: { teamId, eventId, choice }
      })

      return updatedTeam
    })

    return NextResponse.json({ success: true, balance: result.balance })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 })
  }
}
