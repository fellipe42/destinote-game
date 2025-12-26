// GUIDE: API Route - Listar goals salvos na lista personalizada
// GET /api/user/list

import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getCurrentUser, getGoalLimit } from '@/lib/auth-helper';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    // GUIDE: Verificar autenticação
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Não autenticado' },
        { status: 401 }
      );
    }

    // GUIDE: Buscar goals salvos com informações completas
    const userGoals = await prisma.userGoal.findMany({
      where: { userId: user.id },
      include: {
        goal: {
          include: {
            category: true,
          },
        },
      },
      orderBy: {
        addedAt: 'desc',
      },
    });

    const limit = getGoalLimit(user.accessLevel);

    return NextResponse.json({
      success: true,
      data: userGoals,
      count: userGoals.length,
      limit: limit,
    });
  } catch (error: any) {
    console.error('Erro ao buscar lista de goals:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
