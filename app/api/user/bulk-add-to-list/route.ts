import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';
import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export const dynamic = 'force-dynamic';

function getPlanLimit(accessLevel: string | null | undefined): number | null {
  const level = (accessLevel ?? 'public').toLowerCase();
  if (level === 'premium') return null;
  if (level === 'plus') return 100;
  if (level === 'user') return 10;
  return 0;
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ success: false, error: 'Não autorizado' }, { status: 401 });
    }

    const body = (await req.json().catch(() => ({}))) as { goalIds?: unknown; listId?: unknown };

    if (!Array.isArray(body.goalIds)) {
      return NextResponse.json({ success: false, error: 'goalIds inválido' }, { status: 400 });
    }

    const listId = typeof body.listId === 'string' ? body.listId : null;

    // Sanitiza ids
    const goalIds = Array.from(
      new Set(
        body.goalIds
          .map((x) => (typeof x === 'string' ? Number(x) : x))
          .filter((x): x is number => Number.isFinite(x))
          .map((x) => Math.trunc(x))
          .filter((x) => x > 0),
      ),
    );

    if (goalIds.length === 0) {
      return NextResponse.json({ success: true, added: 0, skipped: 0 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, accessLevel: true },
    });

    if (!user) {
      return NextResponse.json({ success: false, error: 'Usuário não encontrado' }, { status: 404 });
    }

    // ✅ Sprint 3.5 — bulk add em lista pessoal
    if (listId) {
      const list = await prisma.userList.findUnique({
        where: { id: listId },
        select: { id: true, userId: true },
      });

      if (!list || list.userId !== user.id) {
        return NextResponse.json({ success: false, error: 'Lista não encontrada' }, { status: 404 });
      }

      const result = await prisma.$transaction(async (tx) => {
        const existing = await tx.userListItem.findMany({
          where: { listId: list.id, kind: 'goal', goalId: { in: goalIds } },
          select: { goalId: true },
        });

        const existingSet = new Set<number>(existing.map((e) => e.goalId ?? -1));
        const toAdd = goalIds.filter((id) => !existingSet.has(id));

        if (toAdd.length === 0) return { added: 0, skipped: goalIds.length };

        const max = await tx.userListItem.aggregate({
          where: { listId: list.id },
          _max: { sortOrder: true },
        });
        let sort = (max._max.sortOrder ?? 0) + 10;

        // Busca títulos para espelhar em "text"
        const goals = await tx.goal.findMany({
          where: { id: { in: toAdd } },
          select: { id: true, titlePt: true, titleEn: true, title: true },
        });
        const titleById = new Map<number, string>();
        for (const g of goals) {
          titleById.set(g.id, (g.titlePt || g.titleEn || g.title || '').slice(0, 200));
        }

        let added = 0;
        for (const gid of toAdd) {
          // só cria se goal existir
          const text = titleById.get(gid);
          if (!text) continue;

          await tx.userListItem.create({
            data: {
              listId: list.id,
              kind: 'goal',
              goalId: gid,
              text,
              sortOrder: sort,
            },
          }).catch(() => {
            // se bater unique (listId,kind,goalId), ignora
          });

          sort += 10;
          added++;
        }

        const skipped = goalIds.length - added;
        return { added, skipped };
      });

      revalidatePath('/my-list');
      return NextResponse.json({ success: true, added: result.added, skipped: result.skipped });
    }

    // ✅ Legado — bulk add na lista principal com limite
    const limit = getPlanLimit(user.accessLevel);
    if (limit === 0) {
      return NextResponse.json(
        { success: false, code: 'PLAN_NOT_ALLOWED', error: 'Seu plano não permite criar lista.' },
        { status: 403 },
      );
    }

    const result = await prisma.$transaction(async (tx) => {
      const currentCount = await tx.userGoal.count({ where: { userId: user.id } });

      if (limit !== null && currentCount >= limit) {
        return { added: 0, skipped: goalIds.length, code: 'LIMIT_REACHED', currentCount, limit };
      }

      const allowed =
        limit === null ? goalIds.length : Math.max(0, Math.min(goalIds.length, limit - currentCount));

      if (allowed <= 0) {
        return { added: 0, skipped: goalIds.length, code: 'LIMIT_REACHED', currentCount, limit };
      }

      const slice = goalIds.slice(0, allowed);

      const existing = await tx.userGoal.findMany({
        where: { userId: user.id, goalId: { in: slice } },
        select: { goalId: true },
      });

      const existingSet = new Set<number>(existing.map((e) => e.goalId));

      let added = 0;
      let skipped = 0;

      for (const goalId of slice) {
        if (existingSet.has(goalId)) {
          skipped++;
          continue;
        }

        await tx.userGoal.create({
          data: { userId: user.id, goalId },
        });

        added++;
      }

      skipped += goalIds.length - slice.length;

      return { added, skipped, code: 'OK', currentCount: currentCount + added, limit };
    });

    if (result.code === 'LIMIT_REACHED') {
      return NextResponse.json(
        {
          success: false,
          code: 'LIMIT_REACHED',
          error: 'Você atingiu o limite do seu plano.',
          limit: result.limit,
          currentCount: result.currentCount,
        },
        { status: 409 },
      );
    }

    revalidatePath('/my-list');

    return NextResponse.json({ success: true, added: result.added, skipped: result.skipped });
  } catch (err) {
    console.error('❌ bulk-add-to-list error:', err);
    return NextResponse.json(
      { success: false, error: 'Erro interno ao adicionar em lote' },
      { status: 500 },
    );
  }
}
