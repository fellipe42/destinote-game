// app/api/user/add-to-list/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';
import prisma from '@/lib/prisma';

const LIST_LIMITS: Record<string, number> = {
  public: 0,
  user: 10,
  plus: 100,
  premium: 100000,
};

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ success: false, error: 'Não autenticado' }, { status: 401 });
    }

    const body = await req.json().catch(() => null);
    const goalId = Number(body?.goalId);
    const add = Boolean(body?.add);
    const listId = typeof body?.listId === 'string' ? body.listId : null;

    if (!goalId || Number.isNaN(goalId)) {
      return NextResponse.json({ success: false, error: 'goalId inválido' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, accessLevel: true },
    });

    if (!user) {
      return NextResponse.json({ success: false, error: 'Usuário não encontrado' }, { status: 404 });
    }

    // ✅ Sprint 3.5 — Adiciona/remover goal dentro de uma lista pessoal (UserListItem)
    if (listId) {
      const list = await prisma.userList.findUnique({
        where: { id: listId },
        select: { id: true, userId: true },
      });

      if (!list || list.userId !== user.id) {
        return NextResponse.json({ success: false, error: 'Lista não encontrada' }, { status: 404 });
      }

      if (!add) {
        await prisma.userListItem.deleteMany({
          where: { listId: list.id, kind: 'goal', goalId },
        });
        return NextResponse.json({ success: true, inList: false });
      }

      const goal = await prisma.goal.findUnique({
        where: { id: goalId },
        select: { id: true, titlePt: true, titleEn: true, title: true },
      });

      if (!goal) {
        return NextResponse.json({ success: false, error: 'Goal não encontrado' }, { status: 404 });
      }

      const exists = await prisma.userListItem.findFirst({
        where: { listId: list.id, kind: 'goal', goalId },
        select: { id: true },
      });

      if (exists) {
        return NextResponse.json({ success: true, inList: true });
      }

      const max = await prisma.userListItem.aggregate({
        where: { listId: list.id },
        _max: { sortOrder: true },
      });

      const nextSort = (max._max.sortOrder ?? 0) + 10;

      await prisma.userListItem.create({
        data: {
          listId: list.id,
          kind: 'goal',
          goalId,
          text: (goal.titlePt || goal.titleEn || goal.title || '').slice(0, 200),
          sortOrder: nextSort,
        },
      });

      return NextResponse.json({ success: true, inList: true });
    }

    // ✅ Legado — lista principal (UserGoal), com limite por plano
    const accessLevel = user.accessLevel ?? 'public';
    const limit = LIST_LIMITS[accessLevel] ?? 0;

    // Remove
    if (!add) {
      await prisma.userGoal.deleteMany({
        where: { userId: user.id, goalId },
      });

      return NextResponse.json({ success: true, inList: false });
    }

    // Add (com limite)
    if (limit === 0) {
      return NextResponse.json(
        { success: false, error: 'Seu plano não permite criar lista.' },
        { status: 403 }
      );
    }

    const currentCount = await prisma.userGoal.count({
      where: { userId: user.id },
    });

    if (currentCount >= limit) {
      return NextResponse.json(
        { success: false, error: `Limite atingido (${currentCount}/${limit}).` },
        { status: 403 }
      );
    }

    const goalExists = await prisma.goal.findUnique({
      where: { id: goalId },
      select: { id: true },
    });

    if (!goalExists) {
      return NextResponse.json({ success: false, error: 'Goal não encontrado' }, { status: 404 });
    }

    await prisma.userGoal.upsert({
      where: { userId_goalId: { userId: user.id, goalId } },
      update: {},
      create: { userId: user.id, goalId },
    });

    return NextResponse.json({ success: true, inList: true });
  } catch (e) {
    console.error('Erro em /api/user/add-to-list:', e);
    return NextResponse.json({ success: false, error: 'Erro interno' }, { status: 500 });
  }
}
