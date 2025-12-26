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

  await prisma.userListItem.updateMany({
    where: { listId },
    data: {
      doneAt: null, 
      done: false,
    },
  });

  return NextResponse.json({ ok: true });
}
