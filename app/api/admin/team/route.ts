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

export async function POST(req: NextRequest) {
  const { teamName, password } = await req.json()
  
  if (!teamName || !password) {
    return NextResponse.json({ error: "Team name and password are required" }, { status: 400 })
  }

  const existing = await prisma.user.findUnique({ where: { username: teamName } })
  if (existing) {
    return NextResponse.json({ error: "Team username already exists" }, { status: 400 })
  }

  try {
    await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          username: teamName,
          password: password,
          role: "TEAM"
        }
      })
      await tx.team.create({
        data: {
          name: teamName,
          userId: user.id
        }
      })
    })
    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 })
  }
}
