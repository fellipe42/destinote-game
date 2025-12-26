// app/my-list/page.tsx
import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';

import { authOptions } from '@/auth';
import prisma from '@/lib/prisma';

import MyListClient, { type GoalDTO } from './MyListClient';
import type { UserListDTO } from './components/ListAlbum';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';
export const revalidate = 0;

export default async function MyListPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) redirect('/entrar');

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true, activeListId: true },
  });

  if (!user) redirect('/entrar');

  const [userGoals, doneRows, lists] = await prisma.$transaction([
    prisma.userGoal.findMany({
      where: { userId: user.id },
      include: { goal: { include: { category: true } } },
      orderBy: { addedAt: 'desc' },
    }),
    prisma.userDone.findMany({
      where: { userId: user.id },
      select: { goalId: true },
    }),
    // ✅ FIX (Sprint 3.5): `isArchived`, `order`, etc não existem no schema.
    // Listas: UserList(id String, name, settings) + UserListItem(sortOrder/isChecked).
    prisma.userList.findMany({
      where: { userId: user.id },
      include: {
        items: {
          orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
        },
      },
      orderBy: { updatedAt: 'desc' },
    }),
  ]);

  const doneSet = new Set(doneRows.map((d) => d.goalId));

  const goals: GoalDTO[] = userGoals.map((ug) => ({
    id: ug.goal.id,
    title: ug.goal.title,
    local: ug.goal.local,
    done: doneSet.has(ug.goal.id),
    category: ug.goal.category
      ? {
          id: ug.goal.category.id,
          name: ug.goal.category.name,
          color: ug.goal.category.color,
        }
      : null,
  }));

  // Sprint 3.5 guarda configs em JSON string dentro de `UserList.settings`.
  function safeParseSettings(raw: string | null | undefined): any {
    if (!raw) return {};
    try {
      return JSON.parse(raw);
    } catch {
      return {};
    }
  }

  const listDTOs: UserListDTO[] = lists.map((l) => {
    const s = safeParseSettings(l.settings);
    const appearanceJson = typeof s?.appearanceJson === 'string' ? s.appearanceJson : '{}';
    const resetRuleJson = typeof s?.resetRuleJson === 'string' ? s.resetRuleJson : null;

    return {
      id: l.id,
      name: l.name,
      isPublic: l.isPublic,
      appearanceJson,
      resetRuleJson,
      updatedAt: l.updatedAt.toISOString(),
      items: l.items
        .filter((it) => typeof it.text === 'string' && it.text.length > 0)
        .map((it) => ({
          id: it.id,
          text: it.text,
          done: !!it.isChecked,
          order: it.sortOrder,
        })),
    };
  });

  return (
    <MyListClient
      initialGoals={goals}
      initialLists={listDTOs}
      initialActiveListId={user.activeListId ?? null}
    />
  );
}
