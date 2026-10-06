import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

export async function DELETE(req: NextRequest) {
  const { teamId } = await req.json()
  
  const team = await prisma.team.findUnique({ where: { id: teamId } })
  if (!team) return NextResponse.json({ error: "Team not found" }, { status: 404 })

  await prisma.team.delete({
    where: { id: teamId }
  })
  
  // Also delete associated user
  await prisma.user.delete({
    where: { id: team.userId }
  })
  
  return NextResponse.json({ success: true })
}
