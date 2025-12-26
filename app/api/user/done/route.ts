import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';
import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';

type Body = { goalId?: number; listItemId?: number; done?: boolean };

export const dynamic = 'force-dynamic';

async function getUserIdFromSession() {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email;
  if (!email) return null;
  const user = await prisma.user.findUnique({ where: { email }, select: { id: true } });
  return user?.id ?? null;
}

export async function GET(req: Request) {
  try {
    const userId = await getUserIdFromSession();
    if (!userId) {
      return NextResponse.json({ success: false, error: 'Não autenticado' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const goalIdRaw = searchParams.get('goalId');
    const listItemIdRaw = searchParams.get('listItemId');

    if (listItemIdRaw) {
      const listItemId = Number(listItemIdRaw);
      if (!Number.isFinite(listItemId) || listItemId <= 0) {
        return NextResponse.json({ success: false, error: 'listItemId inválido' }, { status: 400 });
      }

      const item = await prisma.userListItem.findFirst({
        where: { id: listItemId, list: { userId } },
        select: { done: true },
      });

      if (!item) {
        return NextResponse.json({ success: false, error: 'Item não encontrado' }, { status: 404 });
      }

      return NextResponse.json({ success: true, done: Boolean(item.done) });
    }

    const goalId = Number(goalIdRaw);
    if (!Number.isFinite(goalId) || goalId <= 0) {
      return NextResponse.json({ success: false, error: 'goalId inválido' }, { status: 400 });
    }

    const row = await prisma.userDone.findUnique({
      where: { userId_goalId: { userId, goalId } },
    });

    return NextResponse.json({ success: true, done: !!row });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Erro desconhecido';
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const userId = await getUserIdFromSession();
    if (!userId) {
      return NextResponse.json({ success: false, error: 'Não autenticado' }, { status: 401 });
    }

    const body: Body = await req.json().catch(() => ({}));
    const done = Boolean(body.done);

    if (body.listItemId) {
      const listItemId = Number(body.listItemId);
      if (!Number.isFinite(listItemId) || listItemId <= 0) {
        return NextResponse.json({ success: false, error: 'listItemId inválido' }, { status: 400 });
      }

      const item = await prisma.userListItem.findFirst({
        where: { id: listItemId, list: { userId } },
        select: { id: true },
      });

      if (!item) {
        return NextResponse.json({ success: false, error: 'Item não encontrado' }, { status: 404 });
      }

      await prisma.userListItem.update({
        where: { id: listItemId },
        data: { done, completedAt: done ? new Date() : null },
      });

      return NextResponse.json({ success: true });
    }

    const goalId = Number(body.goalId);
    if (!Number.isFinite(goalId) || goalId <= 0) {
      return NextResponse.json({ success: false, error: 'goalId inválido' }, { status: 400 });
    }

    if (done) {
      await prisma.userDone.upsert({
        where: { userId_goalId: { userId, goalId } },
        create: { userId, goalId },
        update: {},
      });
    } else {
      await prisma.userDone.deleteMany({ where: { userId, goalId } });
    }

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Erro desconhecido';
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
