import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const user = await prisma.user.upsert({
      where: { username: 'admin' },
      update: { password: 'adminpassword', role: 'ADMIN' },
      create: {
        username: 'admin',
        password: 'adminpassword',
        role: 'ADMIN',
      },
    });
    return NextResponse.json({ success: true, message: 'Admin account created successfully. Username: admin, Password: adminpassword' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
