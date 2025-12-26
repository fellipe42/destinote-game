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

export async function POST(req: Request, ctx: { params: { listId: string } }) {
  const userId = await getAuthedUserId();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const listId = String(ctx.params.listId);

  const list = await prisma.userList.findFirst({
    where: { id: listId, userId },
    select: { id: true },
  });
  if (!list) return NextResponse.json({ error: 'List not found' }, { status: 404 });

  let body: any = null;
  try {
    body = await req.json();
  } catch {}

  const goalIds: number[] = Array.isArray(body?.goalIds) ? body.goalIds.map((n: any) => Number(n)).filter((n: any) => Number.isFinite(n)) : [];
  if (!goalIds.length) return NextResponse.json({ error: 'goalIds required' }, { status: 400 });

  await prisma.userListItem.updateMany({
    where: { listId, goalId: { in: goalIds } },
    data: { removedAt: null },
  });

  return NextResponse.json({ ok: true, restored: goalIds.length });
}
