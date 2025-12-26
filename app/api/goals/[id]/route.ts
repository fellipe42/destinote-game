// API Route: GET /api/goals/:id
// Retorna os detalhes de um goal específico

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const goalId = parseInt(params.id);
    
    // Validar ID
    if (isNaN(goalId)) {
      return NextResponse.json(
        {
          success: false,
          error: 'ID inválido',
        },
        { status: 400 }
      );
    }
    
    // Buscar goal com categoria
    const goal = await prisma.goal.findUnique({
      where: { id: goalId },
      include: {
        category: true,
      },
    });
    
    // Verificar se goal existe
    if (!goal) {
      return NextResponse.json(
        {
          success: false,
          error: 'Goal não encontrado',
        },
        { status: 404 }
      );
    }
    
    // Retornar goal
    return NextResponse.json({
      success: true,
      data: goal,
    });
    
  } catch (error) {
    console.error('Erro ao buscar goal:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Erro ao buscar goal',
      },
      { status: 500 }
    );
  }
}

// Preparado para expansão futura: PUT, DELETE para CRUD completo
// export async function PUT(request: NextRequest, { params }: { params: { id: string } }) { ... }
// export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) { ... }
