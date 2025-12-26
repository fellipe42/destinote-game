// app/api/goals/route.ts
// GET /api/goals?limit=1000&lang=pt|en
//
// Internacionalização:
// - Retorna `title`, `local`, `description` já no idioma pedido.
// - Mantém campos *_pt/*_en (snake_case) para debug/futuro.

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { normalizeLang } from '@/lib/lang';

function pick(lang: 'pt' | 'en', pt?: string | null, en?: string | null): string | null {
  const v = lang === 'en' ? en : pt;
  if (typeof v === 'string' && v.trim().length > 0) return v;
  return null;
}

export async function GET(req: NextRequest) {
  try {
    const limitRaw = req.nextUrl.searchParams.get('limit');
    const limit = limitRaw ? Number(limitRaw) : undefined;
    const take = Number.isFinite(limit) && (limit as number) > 0 ? Math.min(limit as number, 5000) : undefined;

    const lang = normalizeLang(req.nextUrl.searchParams.get('lang'));

    const goals = await prisma.goal.findMany({
      take,
      orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
      include: {
        category: { include: { macroCategory: true } },
        categories: { include: { category: { include: { macroCategory: true } } } },
      },
    });

    const mapped = goals.map((g) => {
      const title = pick(lang, g.titlePt, g.titleEn) ?? g.title;
      const local = pick(lang, g.locationPt, g.locationEn) ?? g.local ?? null;
      const description =
        pick(lang, g.notesPt, g.notesEn) ?? (typeof g.description === 'string' ? g.description : null);

      const mapMacro = (m: any) =>
        m
          ? {
              id: m.id,
              name: pick(lang, m.namePt, m.nameEn) ?? m.namePt,
              namePt: m.namePt,
              nameEn: m.nameEn,
              slug: m.slug,
              colorHex: m.colorHex,
              order: m.order,
            }
          : null;

      const mapCat = (c: any) => ({
        id: c.id,
        name: pick(lang, c.namePt, c.nameEn) ?? c.name,
        namePt: c.namePt,
        nameEn: c.nameEn,
        slug: c.slug,
        color: c.color ?? null,
        macroCategoryId: c.macroCategoryId ?? null,
        order: c.order ?? 0,
        macroCategory: mapMacro(c.macroCategory),
      });

      return {
        id: g.id,
        isTopTen: g.isTopTen,
        imageUrl: g.imageUrl,
        title,
        local,
        description,

        // extras (úteis pra debug / futuras telas)
        title_pt: g.titlePt,
        title_en: g.titleEn,
        local_pt: g.locationPt,
        local_en: g.locationEn,
        description_pt: g.notesPt,
        description_en: g.notesEn,

        cod2: g.cod2,
        cod3: g.cod3,
        refBase: g.refBase,

        category: mapCat(g.category),
        categories: (g.categories ?? []).map((gc: any) => ({
          goalId: gc.goalId,
          categoryId: gc.categoryId,
          category: mapCat(gc.category),
        })),
      };
    });

    return NextResponse.json({ goals: mapped });
  } catch (err) {
    console.error('Erro ao buscar goals:', err);
    return NextResponse.json({ error: 'Erro ao buscar goals' }, { status: 500 });
  }
}
