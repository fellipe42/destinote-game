import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';

import { authOptions } from '@/auth';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';
export const revalidate = 0;

async function getAuthedUserId() {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email;
  if (!email) return null;

  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  });

  return user?.id ?? null;
}

export async function GET() {
  const userId = await getAuthedUserId();
  if (!userId) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const row = await prisma.userActiveList.findUnique({
    where: { userId },
    select: { listId: true },
  });

  return NextResponse.json({ activeListId: row?.listId ?? null });
}

export async function POST(req: Request) {
  const userId = await getAuthedUserId();
  if (!userId) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  let body: any = null;
  try {
    body = await req.json();
  } catch {}

  const listId = body?.listId ? String(body.listId) : null;

  const updated = await prisma.userActiveList.upsert({
    where: { userId },
    create: { userId, listId },
    update: { listId },
    select: { listId: true },
  });

  return NextResponse.json({ activeListId: updated.listId ?? null });
}
