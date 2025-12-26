import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ success: true, inList: false });
    }

    const url = new URL(req.url);
    const goalIdRaw = url.searchParams.get('goalId');
    const listId = url.searchParams.get('listId');

    const goalId = goalIdRaw ? Number(goalIdRaw) : NaN;

    if (!Number.isFinite(goalId) || goalId <= 0) {
      return NextResponse.json({ success: false, error: 'goalId inválido' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json({ success: true, inList: false });
    }

    // ✅ Sprint 3.5 — checa dentro de uma lista pessoal específica
    if (typeof listId === 'string' && listId.length > 0) {
      const list = await prisma.userList.findUnique({
        where: { id: listId },
        select: { id: true, userId: true },
      });

      if (!list || list.userId !== user.id) {
        return NextResponse.json({ success: true, inList: false });
      }

      const exists = await prisma.userListItem.findFirst({
        where: { listId: list.id, kind: 'goal', goalId },
        select: { id: true },
      });

      return NextResponse.json({ success: true, inList: !!exists });
    }

    // ✅ Legado — checa lista principal
    const exists = await prisma.userGoal.findFirst({
      where: { userId: user.id, goalId },
      select: { goalId: true },
    });

    return NextResponse.json({ success: true, inList: !!exists });
  } catch (err) {
    console.error('❌ is-in-list error:', err);
    return NextResponse.json({ success: false, error: 'Erro interno' }, { status: 500 });
  }
}
