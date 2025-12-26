// app/api/macro-categories/route.ts
// GET /api/macro-categories
// Retorna as macro-categorias (7).
//
// [SPRINT-A] Necessário para:
// - Dropdown flutuante da Navbar (filtro rápido por macro)
// - Página /categorias (chips de macro)

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { normalizeLang } from '@/lib/lang';

export async function GET(req: NextRequest) {
  try {
    const lang = normalizeLang(req.nextUrl.searchParams.get('lang'));
    const macros = await prisma.macroCategory.findMany({
      orderBy: [{ order: 'asc' }, { id: 'asc' }],
    });

    return NextResponse.json({
      success: true,
      data: macros.map((m) => ({
        id: m.id,
        name: lang === 'en' ? m.nameEn : m.namePt,
        namePt: m.namePt,
        nameEn: m.nameEn,
        slug: m.slug,
        colorHex: m.colorHex,
        order: m.order,
      })),
      total: macros.length,
    });
  } catch (error) {
    console.error('Erro ao buscar macro-categorias:', error);
    return NextResponse.json(
      { success: false, error: 'Erro ao buscar macro-categorias' },
      { status: 500 }
    );
  }
}
