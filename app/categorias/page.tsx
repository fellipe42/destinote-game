// app/categorias/page.tsx NOVO
'use client';

// app/categorias/page.tsx
// ============================================================================
// [SPRINT-A] Página de filtros visuais
//
// Requisitos principais:
// - Mostrar macros (7) e categorias (22) com contagem de goals
// - Seleção de macro filtra categorias
// - Seleção de categorias gera query string para /?cats=...&top10=...
// - Não mudar visual do resto do site, só implementar a página
//
// NOTA:
// - Esta versão suporta i18n via query param `lang` + hook `useLang()`
// - Consome:
//   - GET /api/macro-categories?lang=pt|en  -> { success, data: [...] }
//   - GET /api/categories?lang=pt|en        -> array simples: [...]
// ============================================================================

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

import Navbar from '@/components/Navbar';
import ScrollBackgrounds from '@/components/ScrollBackgrounds';
import RotatingGlobe from '@/components/RotatingGlobe';

import { ui } from '@/lib/lang';
import { useLang } from '@/lib/useLang';

type MacroDto = {
  id: number;
  name: string;
  slug?: string | null;
  colorHex?: string | null;
  order?: number | null;
};

type CategoryDto = {
  id: number;
  name: string;
  color?: string | null;
  macroCategoryId?: number | null;
  goalsCount?: number;
};

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null;
}

function unique<T>(arr: T[]) {
  return Array.from(new Set(arr));
}

export default function CategoriasPage() {
  const router = useRouter();
  const { lang } = useLang();

  const [loading, setLoading] = useState(true);

  const [macros, setMacros] = useState<MacroDto[]>([]);
  const [categories, setCategories] = useState<CategoryDto[]>([]);

  const [selectedMacro, setSelectedMacro] = useState<number | null>(null);
  const [selectedCats, setSelectedCats] = useState<number[]>([]);

  // UX: modo de seleção
  const [multiMode, setMultiMode] = useState(true);

  // Carregar macros + categorias
  useEffect(() => {
    let alive = true;

    async function load() {
      try {
        setLoading(true);

        const [mRes, cRes] = await Promise.all([
          fetch(`/api/macro-categories?lang=${lang}`, { cache: 'no-store' }),
          fetch(`/api/categories?lang=${lang}`, { cache: 'no-store' }),
        ]);

        const macrosJson = await mRes.json();
        const catsJson = await cRes.json();

        // --- macros: pode vir como { success, data: [...] } ou outros shapes
        const macrosData = isRecord(macrosJson)
          ? ((macrosJson as any).data ??
              (macrosJson as any).macroCategories ??
              (macrosJson as any).items ??
              null)
          : null;

        const nextMacros: MacroDto[] = Array.isArray(macrosData)
          ? macrosData
              .filter(isRecord)
              .map((m: any) => ({
                id: Number(m.id),
                name: String(m.name ?? m.namePt ?? m.nameEn ?? ''),
                slug: m.slug ?? null,
                colorHex: m.colorHex ?? null,
                order: typeof m.order === 'number' ? m.order : null,
              }))
              .filter((m) => Number.isFinite(m.id) && !!m.name)
          : [];

        // --- categories: endpoint retorna array simples (compatível)
        const catsData = Array.isArray(catsJson)
          ? catsJson
          : isRecord(catsJson)
            ? ((catsJson as any).data ??
                (catsJson as any).categories ??
                (catsJson as any).items ??
                null)
            : null;

        const nextCats: CategoryDto[] = Array.isArray(catsData)
          ? catsData
              .filter(isRecord)
              .map((c: any) => {
                const id = Number(c.id);
                const name = String(c.name ?? c.namePt ?? c.nameEn ?? '');
                const goalsCount = typeof c.goalsCount === 'number' ? c.goalsCount : Number(c.goalsCount ?? 0);

                // Importante: manter null quando não existir (evita virar 0 sem querer)
                const macroCategoryId =
                  typeof c.macroCategoryId === 'number'
                    ? c.macroCategoryId
                    : c.macroCategoryId == null
                      ? null
                      : Number(c.macroCategoryId);

                return {
                  id,
                  name,
                  goalsCount: Number.isFinite(goalsCount) ? goalsCount : 0,
                  color: c.color ?? null,
                  macroCategoryId: Number.isFinite(macroCategoryId as number) ? macroCategoryId : null,
                };
              })
              .filter((c) => Number.isFinite(c.id) && !!c.name)
          : [];

        if (!alive) return;

        setMacros(nextMacros);
        setCategories(nextCats);

        // Se uma macro estiver selecionada, manter coerência caso dados mudem
        if (selectedMacro && nextCats.length) {
          const hasAny = nextCats.some((c) => c.macroCategoryId === selectedMacro);
          if (!hasAny) setSelectedMacro(null);
        }
      } catch (err) {
        console.error('Erro ao carregar /categorias:', err);
      } finally {
        if (alive) setLoading(false);
      }
    }

    load();
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lang]);

  // Filtra categorias visíveis
  const visibleCategories = useMemo(() => {
    if (!selectedMacro) return categories;
    return categories.filter((c) => c.macroCategoryId === selectedMacro);
  }, [categories, selectedMacro]);

  function toggleMacro(id: number) {
    setSelectedMacro((prev) => {
      const next = prev === id ? null : id;

      // ao mudar macro, remover cats que não pertencem à macro selecionada
      setSelectedCats((prevCats) => {
        if (!next) return prevCats;
        return prevCats.filter((catId) =>
          categories.some((c) => c.id === catId && c.macroCategoryId === next)
        );
      });

      return next;
    });
  }

  function toggleCat(id: number) {
    if (!multiMode) {
      // modo single: só uma categoria ativa
      setSelectedCats((prev) => (prev[0] === id ? [] : [id]));
      return;
    }

    setSelectedCats((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      return [...prev, id];
    });
  }

  function clearAll() {
    setSelectedMacro(null);
    setSelectedCats([]);
  }

  const canApply = selectedCats.length > 0;

  function applyAndView() {
    // Monta query string no formato já usado no app/page.tsx
    // cats=1,2,3 e mantém top10=auto (ou o padrão que você já implementou)
    const cats = unique(selectedCats).sort((a, b) => a - b).join(',');
    const url = `/?cats=${encodeURIComponent(cats)}&lang=${encodeURIComponent(lang)}`;
    router.push(url);
  }

  // Contagem para alinhar grid (só estética/espacamento consistente)
  const macroPadCount = useMemo(() => {
    const base = 6; // deixa o grid “cheio” em telas médias (ajuste sutil)
    if (macros.length >= base) return 0;
    return base - macros.length;
  }, [macros.length]);

  return (
    <div className="min-h-screen relative">
      <ScrollBackgrounds />
      <RotatingGlobe />
      <Navbar />

      <main className="relative z-10 px-4 pt-24 pb-24">
        <div className="mx-auto max-w-6xl">
          {/* HERO */}
          <header className="mb-10">
            <div className="flex items-center justify-between gap-6 flex-wrap">
              <div>
                <h1 className="text-3xl md:text-4xl font-semibold tracking-tight text-white">
                  {ui(lang, 'filtersCenterTitle') as string}
                </h1>
                <p className="mt-2 text-white/60 max-w-2xl">
                  {ui(lang, 'filtersCenterSubtitle') as string}
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setMultiMode((v) => !v)}
                  className={[
                    'px-4 py-2 rounded-2xl text-sm font-medium transition-all',
                    'bg-white/10 hover:bg-white/15 text-white/80',
                    'border border-white/10',
                  ].join(' ')}
                  title={ui(lang, 'toggleModeTitle') as string}
                >
                  {multiMode ? (ui(lang, 'multiMode') as string) : (ui(lang, 'singleMode') as string)}
                </button>

                <button
                  type="button"
                  onClick={clearAll}
                  className={[
                    'px-4 py-2 rounded-2xl text-sm font-medium transition-all',
                    'bg-white/5 hover:bg-white/10 text-white/70',
                    'border border-white/10',
                  ].join(' ')}
                >
                  {ui(lang, 'clearAll') as string}
                </button>
              </div>
            </div>

            <div className="mt-6 flex items-center gap-3 text-sm text-white/60">
              <span className="px-3 py-1 rounded-full bg-white/5 border border-white/10">
                {ui(lang, 'selectedCats') as string}: <span className="text-white/80 font-semibold">{selectedCats.length}</span>
              </span>

              <span className="px-3 py-1 rounded-full bg-white/5 border border-white/10">
                {(ui(lang, 'showingPlain') as (a: number, b: number) => string)(
                  visibleCategories.length,
                  categories.length
                )}
              </span>
            </div>
          </header>

          {/* MACROS */}
          <section className="mb-10">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-white/85">
                {ui(lang, 'bigThemesTitle') as string}
              </h2>

              {selectedMacro ? (
                <button
                  type="button"
                  onClick={() => setSelectedMacro(null)}
                  className="text-sm text-white/60 hover:text-white/80 transition"
                >
                  {ui(lang, 'showAllMacros') as string}
                </button>
              ) : null}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {macros.map((m) => {
                const active = selectedMacro === m.id;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => toggleMacro(m.id)}
                    className={[
                      'text-left p-5 rounded-3xl border transition-all',
                      'backdrop-blur-xl bg-white/5 hover:bg-white/10',
                      active ? 'border-white/30 shadow-lg shadow-black/30' : 'border-white/10',
                    ].join(' ')}
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <div className="text-white font-semibold text-lg">{m.name}</div>
                        <div className="mt-1 text-xs text-white/45">
                          {ui(lang, 'filterByThemeHint') as string}
                        </div>
                      </div>
                      <div
                        className={[
                          'h-9 w-9 rounded-2xl border',
                          active ? 'border-white/30 bg-white/10' : 'border-white/10 bg-white/5',
                        ].join(' ')}
                        style={{
                          background: m.colorHex ? `${m.colorHex}22` : undefined,
                          borderColor: active ? (m.colorHex ? `${m.colorHex}88` : undefined) : undefined,
                        }}
                      />
                    </div>
                  </button>
                );
              })}

              {/* Preenche grid para consistência visual */}
              {Array.from({ length: macroPadCount }).map((_, i) => (
                <div
                  key={`pad-${i}`}
                  className="p-5 rounded-3xl border border-white/5 bg-white/0"
                />
              ))}
            </div>
          </section>

          {/* CATEGORIES */}
          <section id="categories-grid" className="mb-10">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-white/85">{ui(lang, 'categoriesTitle') as string}</h2>
              {loading ? (
                <span className="text-sm text-white/40">{ui(lang, 'loading') as string}</span>
              ) : null}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {visibleCategories.map((c) => {
                const active = selectedCats.includes(c.id);
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => toggleCat(c.id)}
                    className={[
                      'text-left p-5 rounded-3xl border transition-all',
                      'backdrop-blur-xl bg-white/5 hover:bg-white/10',
                      active ? 'border-white/30 shadow-lg shadow-black/30' : 'border-white/10',
                    ].join(' ')}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="text-white font-semibold">{c.name}</div>
                        <div className="mt-1 text-xs text-white/45">
                          {(ui(lang, 'goalsCountLabel') as (n: number) => string)(c.goalsCount ?? 0)}
                        </div>
                      </div>

                      <div
                        className={[
                          'h-9 w-9 rounded-2xl border shrink-0',
                          active ? 'border-white/30 bg-white/10' : 'border-white/10 bg-white/5',
                        ].join(' ')}
                        style={{
                          background: c.color ? `${c.color}22` : undefined,
                          borderColor: active ? (c.color ? `${c.color}88` : undefined) : undefined,
                        }}
                      />
                    </div>
                  </button>
                );
              })}
            </div>

            {(!loading && visibleCategories.length === 0) ? (
              <div className="mt-6 text-white/50 text-sm">
                {ui(lang, 'noCategoriesInTheme') as string}
              </div>
            ) : null}
          </section>

          {/* ACTIONS */}
          <section className="mt-12">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div className="text-white/60 text-sm">
                {ui(lang, 'readyToViewHint') as string}
              </div>

              <button
                type="button"
                disabled={!canApply}
                onClick={applyAndView}
                className={[
                  'px-6 py-3 rounded-2xl text-base font-semibold transition-all',
                  canApply
                    ? 'bg-gradient-to-r from-purple-600/80 to-cyan-500/80 hover:from-purple-500 hover:to-cyan-400 text-white shadow-lg shadow-purple-900/40'
                    : 'bg-white/10 text-white/40 cursor-not-allowed',
                ].join(' ')}
              >
                {ui(lang, 'viewList') as string}
              </button>
            </div>

            <div className="mt-6 text-xs text-white/40">
              {/* FIX: não use aspas simples aqui; o texto em inglês contém 'it's', e isso quebra o TSX. */}
              {lang === 'en'
                ? "V1: the idea is to take you from curiosity → to a filtered list → to action. Yes, it's a gentle shove."
                : 'V1: a ideia é te levar da curiosidade → pra uma lista filtrada → e daí pra ação. Sim, isso é um empurrãozinho.'}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}


// 'use client';

// /*
//   app/categorias/page.tsx
//   ============================================================================
//   [SPRINT-A] Página de filtros visuais
//
//   Changes Summary:
//   - Grid de macros em 3x3 (layout consistente)
//   - Sem termo "macro-categorias" (copy mais comercial)
//   - Toggle: selecionar uma / selecionar várias categorias
//   - Filtro por macro afeta grid de categorias
//   - Botão "Ver a lista" só ativa com filtros
//   - Mantém visual atual (globo + backgrounds + navbar)
//
//   OBS:
//   - Esta seção abaixo é histórico/rascunho comentado para referência.
// */
// ...
