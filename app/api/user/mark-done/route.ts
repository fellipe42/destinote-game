// app/api/user/mark-done/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, error: 'Não autenticado' },
        { status: 401 }
      );
    }

    const body = await req.json().catch(() => null);
    const goalId = Number(body?.goalId);
    const done = Boolean(body?.done);

    if (!goalId || Number.isNaN(goalId)) {
      return NextResponse.json(
        { success: false, error: 'goalId inválido' },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Usuário não encontrado' },
        { status: 404 }
      );
    }

    // Desmarcar
    if (!done) {
      await prisma.userDone.deleteMany({
        where: { userId: user.id, goalId },
      });

      return NextResponse.json({ success: true, done: false });
    }

    // Marcar
    const goalExists = await prisma.goal.findUnique({
      where: { id: goalId },
      select: { id: true },
    });

    if (!goalExists) {
      return NextResponse.json(
        { success: false, error: 'Goal não encontrado' },
        { status: 404 }
      );
    }

    await prisma.userDone.upsert({
      where: {
        userId_goalId: { userId: user.id, goalId },
      },
      update: {},
      create: { userId: user.id, goalId },
    });

    return NextResponse.json({ success: true, done: true });
  } catch (e) {
    console.error('Erro em /api/user/mark-done:', e);
    return NextResponse.json(
      { success: false, error: 'Erro interno' },
      { status: 500 }
    );
  }
}