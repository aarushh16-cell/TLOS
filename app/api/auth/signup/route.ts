import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const { username, password } = await req.json();

    if (!username || !password) {
      return NextResponse.json(
        { error: "Username and password are required" },
        { status: 400 }
      );
    }

    // Check if team already exists
    const existingUser = await prisma.user.findUnique({
      where: { username },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "Team name already taken" },
        { status: 400 }
      );
    }

    // Create user and associated team
    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          username,
          password, // In a real app, hash this!
          role: "TEAM",
        },
      });

      const team = await tx.team.create({
        data: {
          name: username,
          userId: user.id,
          balance: 1000000, // Initial balance
        },
      });

      return { user, team };
    });

    return NextResponse.json({ success: true, teamId: result.team.id }, { status: 201 });
  } catch (error) {
    console.error("Signup error:", error);
    return NextResponse.json(
      { error: "An error occurred during signup" },
      { status: 500 }
    );
  }
}
