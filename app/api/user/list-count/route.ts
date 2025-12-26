// app/api/user/list-count/route.ts
//
// ✅ FIX (25/12): removido uso de `isArchived` (não existe).

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

function getPlanLimit(accessLevel: string | null | undefined): number | null {
  const level = (accessLevel ?? 'public').toLowerCase();
  if (level === 'premium') return null;
  if (level === 'plus') return 100;
  if (level === 'user') return 10;
  return 0;
}

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return NextResponse.json(
      { count: 0, limit: 0, hasList: false, listFull: false, accessLevel: 'public' },
      { status: 200 },
    );
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true, accessLevel: true },
  });

  if (!user) {
    return NextResponse.json(
      { count: 0, limit: 0, hasList: false, listFull: false, accessLevel: 'public' },
      { status: 200 },
    );
  }

  const limit = getPlanLimit(user.accessLevel);

  const count = await prisma.userGoal.count({
    where: { userId: user.id },
  });

  return NextResponse.json({
    count,
    limit,
    hasList: count > 0,
    listFull: limit != null ? count >= limit : false,
    accessLevel: user.accessLevel,
  });
}
