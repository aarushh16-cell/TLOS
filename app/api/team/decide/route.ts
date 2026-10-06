import { prisma } from '@/lib/prisma'
import { eventBus } from '@/lib/sse'
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'

const eventLogic: Record<number, any> = {
  // Good Events
  1: { target: 'NOVA',  type: 'growth', choices: { A: { cost: 300000, mult: 1.25 }, B: { cost: 150000, mult: 1.12 }, C: { cost: 0, mult: 1.00 } } },
  2: { target: 'VOLT',  type: 'growth', choices: { A: { cost: 200000, mult: 1.20 }, B: { cost: 100000, mult: 1.10 }, C: { cost: 0, mult: 0.98 } } },
  3: { target: 'FINCO', type: 'growth', choices: { A: { cost: 250000, mult: 1.22 }, B: { cost: 100000, mult: 1.09 }, C: { cost: 0, mult: 1.00 } } },
  // Bad Events
  4: { target: 'NOVA',  type: 'shock', choices: { A: { action: 'HOLD', cost: 0, mult: 0.85 }, B: { action: 'EXIT', cost: 0, mult: 1.00 }, C: { action: 'DOUBLE_DOWN', cost: 100000, mult: 1.15 } } },
  5: { target: 'SHIPX', type: 'shock', choices: { A: { action: 'HOLD', cost: 0, mult: 0.88 }, B: { action: 'EXIT', cost: 0, mult: 1.00 }, C: { action: 'HEDGE', cost: 100000, mult: 1.05 } } },
  6: { target: 'FRESH', type: 'shock', choices: { A: { action: 'HOLD', cost: 0, mult: 0.90 }, B: { action: 'EXIT', cost: 0, mult: 1.00 }, C: { action: 'PIVOT', cost: 150000, mult: 1.08 } } },
  // Final Decision
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
        
      const team = await tx.team.findUnique({ where: { id: teamId } })
      if (!team) throw new Error("Team not found")

      // Prevent duplicate decisions
      const existingDecision = await tx.teamDecision.findUnique({ where: { teamId_eventId: { teamId, eventId } } })
      if (existingDecision) throw new Error("You have already made a decision for this event.")

      // Cost deduction (only immediately deduct if there's a cost)
      let cost = choiceData.cost || 0
      if (team.balance < cost) throw new Error("Insufficient cash reserve for this choice.")
      
      let updatedTeam = team
      if (cost > 0) {
        updatedTeam = await tx.team.update({
          where: { id: teamId },
          data: { balance: { decrement: cost } }
        })
      }

      // Record the decision. We DO NOT apply the percentage multipliers or exits here.
      // Those are applied by the Admin during the "Reveal" phase trigger.
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
