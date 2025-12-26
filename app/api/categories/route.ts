// app/api/categories/route.ts
// GET /api/categories?lang=pt|en
//
// Patch (22/12):
// - Corrige o caso onde a página /categorias mostra os Grupos (macro-categorias)
//   mas não carrega/renderiza as categorias.
// - Mantém compatibilidade do payload: continua retornando um ARRAY simples.
// - Evita depender de `_count` relacional dentro do findMany (que pode causar 500 em alguns ambientes).
//   Em vez disso, calculamos `goalsCount` via `groupBy` no model Goal.

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { normalizeLang } from '@/lib/lang';

type Lang = 'pt' | 'en';

function pickName(lang: Lang, pt: string, en: string, fallback: string): string {
  const primary = lang === 'en' ? en : pt;
  const secondary = lang === 'en' ? pt : en;

  if (typeof primary === 'string' && primary.trim().length > 0) return primary;
  if (typeof secondary === 'string' && secondary.trim().length > 0) return secondary;
  return fallback;
}

export async function GET(req: NextRequest) {
  try {
    const lang = normalizeLang(req.nextUrl.searchParams.get('lang')) as Lang;

    const categories = await prisma.category.findMany({
      select: {
        id: true,
        name: true,
        namePt: true,
        nameEn: true,
        slug: true,
        color: true,
        macroCategoryId: true,
        order: true,
        icon: true,
      },
      orderBy: [{ order: 'asc' }, { id: 'asc' }],
    });

    // ✅ Conte quantos goals existem por categoria sem usar `_count` relacional.
    // Importante: se o groupBy falhar por algum motivo (ex: DB inconsistente), NÃO derruba o endpoint.
    const countByCategoryId = new Map<number, number>();

    try {
      const grouped = await prisma.goal.groupBy({
        by: ['categoryId'],
        _count: { _all: true },
      });

      for (const row of grouped) {
        countByCategoryId.set(row.categoryId, row._count._all);
      }
    } catch (err) {
      console.warn('[api/categories] Falha ao calcular goalsCount via groupBy. Seguindo com 0.', err);
    }

    const payload = categories.map((c) => ({
      id: c.id,
      // Campo consumido pelo front (já vem no idioma pedido)
      name: pickName(lang, c.namePt, c.nameEn, c.name),

      // Campos extras (úteis pra debug/futuro)
      namePt: c.namePt,
      nameEn: c.nameEn,

      slug: c.slug,
      color: c.color ?? null,
      macroCategoryId: c.macroCategoryId ?? null,
      order: c.order ?? 0,
      icon: c.icon ?? null,

      goalsCount: countByCategoryId.get(c.id) ?? 0,
    }));

    // Compat: retorna array simples (como antes)
    return NextResponse.json(payload);
  } catch (err) {
    console.error('Erro ao buscar categorias:', err);
    return NextResponse.json({ error: 'Erro ao buscar categorias' }, { status: 500 });
  }
}
