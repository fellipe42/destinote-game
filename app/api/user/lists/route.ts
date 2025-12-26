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

function json(data: any, init?: { status?: number }) {
  return NextResponse.json(data, { status: init?.status ?? 200 });
}

export async function GET() {
  const userId = await getAuthedUserId();
  if (!userId) return json({ error: 'Unauthorized' }, { status: 401 });

  const lists = await prisma.userList.findMany({
    where: { userId },
    orderBy: { updatedAt: 'desc' },
    select: {
      id: true,
      title: true,
      description: true,
      isPrimary: true,
      createdAt: true,
      updatedAt: true,
      resetFrequency: true,
      resetAt: true,
      archivedAt: true,
      _count: { select: { items: true } },
    },
  });

  return json({ lists });
}

export async function POST(req: Request) {
  const userId = await getAuthedUserId();
  if (!userId) return json({ error: 'Unauthorized' }, { status: 401 });

  let body: any = null;
  try {
    body = await req.json();
  } catch {}

  const title = String(body?.title ?? '').trim();
  const description = String(body?.description ?? '').trim();
  const isPrimary = Boolean(body?.isPrimary ?? false);

  const resetFrequency = (body?.resetFrequency ?? null) as string | null; // e.g. "weekly"
  const resetAt = body?.resetAt ? new Date(body.resetAt) : null;

  if (!title) return json({ error: 'Title required' }, { status: 400 });

  if (isPrimary) {
    await prisma.userList.updateMany({
      where: { userId, isPrimary: true },
      data: { isPrimary: false },
    });
  }

  const created = await prisma.userList.create({
    data: {
      userId,
      title,
      description: description || null,
      isPrimary,
      resetFrequency,
      resetAt,
    },
    select: { id: true, title: true },
  });

  return json({ ok: true, list: created });
}
