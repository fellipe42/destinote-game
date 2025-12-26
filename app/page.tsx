// app/page.tsx
// [SPRINT-A] Motivo: implementar filtros via URL + chips sticky + toggle Top10 (tri-state auto/show/hide) sem regredir Hero/Backgrounds/UX original.
'use client';

import type { CSSProperties } from 'react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { useSearchParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';

import Navbar from '@/components/Navbar';
import ScrollBackgrounds from '@/components/ScrollBackgrounds';
import RotatingGlobe from '@/components/RotatingGlobe';
import GoalCard from '@/components/GoalCard';
import GoalModal from '@/components/GoalModal';
import AboutSection from '@/components/AboutSection';
import ActiveFiltersBar, { type FilterChip } from '@/components/ActiveFiltersBar';
import QuantumTitle from '@/components/QuantumTitle';

import { Goal } from '@/types/goal';
import { useExpandedGoals } from '@/contexts/ExpandedGoalsContext';
import { useBulkSelect } from '@/contexts/BulkSelectContext';

import { ui } from '@/lib/lang';
import { useLang } from '@/lib/useLang';

import {
  parseCsvIntList,
  parseIntSafe,
  serializeCsvIntList,
  toggleIntInList,
} from '@/lib/filters';

type MacroDTO = {
  id: number;
  namePt?: string;
  nameEn?: string;
  name?: string;
};

type TopTenMode = 'auto' | 'show' | 'hide';

export default function HomePage() {
  const { lang } = useLang();

  const [topTenGoals, setTopTenGoals] = useState<Goal[]>([]);
  const [regularGoals, setRegularGoals] = useState<Goal[]>([]);
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  // ---------- Top10: âncora + scroll sob demanda ----------
  const topTenAnchorRef = useRef<HTMLDivElement | null>(null);
  const pendingScrollToTopTenRef = useRef(false);

  // [SPRINT-A] labels macro (para chip)
  const [macros, setMacros] = useState<MacroDTO[]>([]);

  // Infinite scroll (mantém original)
  const INITIAL_COUNT = 42;
  const BATCH_SIZE = 50;
  const [displayedGoalsCount, setDisplayedGoalsCount] = useState(INITIAL_COUNT);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);

  // Hero fade (mantém original)
  const heroRef = useRef<HTMLDivElement | null>(null);
  const { scrollYProgress } = useScroll();
  const heroOpacity = useTransform(scrollYProgress, [0, 0.3], [1, 0]);
  const heroScale = useTransform(scrollYProgress, [0, 0.3], [1, 0.8]);

  const { toggleGoal, isExpanded: isGoalExpanded } = useExpandedGoals();

  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status } = useSession();
  const isLoggedIn = !!session?.user?.email;

  const bulk = useBulkSelect();
  const pendingScrollRef = useRef(false);
  const didAutoOpenBulk = useRef(false);

  // ---------- [SPRINT-A] Filtros via URL ----------
  const qs = searchParams.toString();

  const activeCats = useMemo(() => {
    const sp = new URLSearchParams(qs);
    return parseCsvIntList(sp.get('cats'));
  }, [qs]);

  const activeMacro = useMemo(() => {
    const sp = new URLSearchParams(qs);
    return parseIntSafe(sp.get('macro'));
  }, [qs]);

  const filterActive = activeCats.length > 0 || activeMacro !== null;

  // Reset paginação só quando filtros mudarem (não por bulk/ruídos)
  const filtersKey = useMemo(() => {
    const sp = new URLSearchParams(qs);
    return `cats=${sp.get('cats') ?? ''}&macro=${sp.get('macro') ?? ''}`;
  }, [qs]);

  useEffect(() => {
    setDisplayedGoalsCount(INITIAL_COUNT);
  }, [filtersKey]);

  // ---------- Top10 tri-state (auto/show/hide) ----------
  // auto: mostra quando não há filtros; esconde quando há filtros
  // show/hide: força o estado, independente dos filtros
  const [topTenMode, setTopTenMode] = useState<TopTenMode>('auto');

  const topTenOpen = useMemo(() => {
    if (topTenMode === 'show') return true;
    if (topTenMode === 'hide') return false;
    return !filterActive; // auto
  }, [topTenMode, filterActive]);

  const topTenVisible = topTenOpen && topTenGoals.length > 0;

  const topTenTitle = useMemo(() => {
    if (topTenMode === 'auto') return 'Top10 (auto) — duplo clique volta para auto';
    if (topTenMode === 'show') return 'Top10 (fixado) — mostrar';
    return 'Top10 (fixado) — ocultar';
  }, [topTenMode]);

  const scrollToTopTen = useCallback(() => {
    const el = topTenAnchorRef.current;
    if (!el) return;
    const y = el.getBoundingClientRect().top + window.scrollY;
    const offset = 96; // navbar + respiro
    window.scrollTo({ top: Math.max(0, y - offset), behavior: 'smooth' });
  }, []);

  const toggleTopTen = useCallback(
    (opts?: { scrollOnOpen?: boolean }) => {
      const prev = topTenMode;
      const prevOpen = prev === 'show' ? true : prev === 'hide' ? false : !filterActive;

      const next: TopTenMode =
        prev === 'auto' ? (prevOpen ? 'hide' : 'show') : prev === 'show' ? 'hide' : 'show';

      const nextOpen = next === 'show' ? true : next === 'hide' ? false : !filterActive;

      if (opts?.scrollOnOpen && nextOpen) pendingScrollToTopTenRef.current = true;
      setTopTenMode(next);
    },
    [topTenMode, filterActive]
  );

  useEffect(() => {
    if (!pendingScrollToTopTenRef.current) return;
    if (!topTenOpen) return;

    pendingScrollToTopTenRef.current = false;
    requestAnimationFrame(() => scrollToTopTen());
  }, [topTenOpen, scrollToTopTen]);

  const TopToggleButton = ({
    scrollOnOpen,
    className = '',
  }: {
    scrollOnOpen?: boolean;
    className?: string;
  }) => (
    <button
      type="button"
      onClick={() => toggleTopTen({ scrollOnOpen })}
      onDoubleClick={() => setTopTenMode('auto')}
      className={[
        'inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold',
        'border border-white/10 bg-white/5 text-white/80 hover:bg-white/10 hover:text-white transition-colors',
        className,
      ].join(' ')}
      title={topTenTitle}
      aria-pressed={topTenOpen}
    >
      <span>Top</span>
      <span className="opacity-85" aria-hidden>
        {topTenOpen ? '▲' : '▼'}
      </span>
    </button>
  );

  // Cache de nomes de categorias baseado nos próprios goals carregados

  const categoryNameById = useMemo(() => {
    const map = new Map<number, string>();
    const all = [...topTenGoals, ...regularGoals];

    for (const g of all) {
      if (g.category?.id && g.category?.name) map.set(g.category.id, g.category.name);
      for (const gc of g.categories ?? []) {
        if (gc.category?.id && gc.category?.name) map.set(gc.category.id, gc.category.name);
      }
    }
    return map;
  }, [topTenGoals, regularGoals]);

  const macroNameById = useMemo(() => {
    const map = new Map<number, string>();
    for (const m of macros) {
      const label = lang === 'en' ? (m.nameEn ?? m.name ?? m.namePt ?? '') : (m.namePt ?? m.name ?? m.nameEn ?? '');
      if (label) map.set(m.id, label);
    }
    return map;
  }, [macros, lang]);

  const replaceParams = useCallback(
    (next: URLSearchParams) => {
      const q = next.toString();
      const hash = typeof window !== 'undefined' ? window.location.hash : '';
      const url = q ? `/?${q}${hash}` : `/${hash || ''}`;
      router.replace(url, { scroll: false });
    },
    [router]
  );

  const setCatsInUrl = useCallback(
    (cats: number[]) => {
      const next = new URLSearchParams(searchParams.toString());
      if (cats.length === 0) next.delete('cats');
      else next.set('cats', serializeCsvIntList(cats));
      replaceParams(next);
    },
    [searchParams, replaceParams]
  );

  const setMacroInUrl = useCallback(
    (macro: number | null) => {
      const next = new URLSearchParams(searchParams.toString());
      if (macro === null) next.delete('macro');
      else next.set('macro', String(macro));
      replaceParams(next);
    },
    [searchParams, replaceParams]
  );

  const clearFilters = useCallback(() => {
    const next = new URLSearchParams(searchParams.toString());
    next.delete('cats');
    next.delete('macro');
    replaceParams(next);
  }, [searchParams, replaceParams]);

  // [SPRINT-A] Clique na tag de categoria do GoalCard -> toggle filtro sem scroll topo
  useEffect(() => {
    const onToggle = (evt: Event) => {
      const e = evt as CustomEvent<{ categoryId: number; source?: string }>;
      const categoryId = e?.detail?.categoryId;
      if (!categoryId) return;

      const nextCats = toggleIntInList(activeCats, categoryId);
      setCatsInUrl(nextCats);
    };

    window.addEventListener('destinote:toggle-category-filter', onToggle);
    return () => window.removeEventListener('destinote:toggle-category-filter', onToggle);
  }, [activeCats, setCatsInUrl]);

  // Chips do banner (macro + cats)
  const chips = useMemo<FilterChip[]>(() => {
    const out: FilterChip[] = [];

    if (activeMacro !== null) {
      const label = macroNameById.get(activeMacro) ?? (lang === 'en' ? `Collection ${activeMacro}` : `Coleção ${activeMacro}`);
      out.push({
        key: `macro-${activeMacro}`,
        label,
        onRemove: () => setMacroInUrl(null),
      });
    }

    for (const id of activeCats) {
      out.push({
        key: `cat-${id}`,
        label: categoryNameById.get(id) ?? (lang === 'en' ? `Category ${id}` : `Categoria ${id}`),
        onRemove: () => setCatsInUrl(activeCats.filter((x) => x !== id)),
      });
    }

    return out;
  }, [activeMacro, activeCats, macroNameById, categoryNameById, setMacroInUrl, setCatsInUrl, lang]);

  // Filtragem aplicada SOMENTE aos regulares (Top10 é vitrine independente)
  const filteredRegularGoals = useMemo(() => {
    if (!filterActive) return regularGoals;

    return regularGoals.filter((g) => {
      const catIds = new Set<number>();
      if (g.category?.id) catIds.add(g.category.id);
      for (const gc of g.categories ?? []) {
        if (gc.category?.id) catIds.add(gc.category.id);
      }

      const passesCats = activeCats.length === 0 ? true : activeCats.some((id) => catIds.has(id));
      if (!passesCats) return false;

      if (activeMacro === null) return true;

      const macroIds = new Set<number>();
      if (g.category?.macroCategoryId) macroIds.add(g.category.macroCategoryId);
      for (const gc of g.categories ?? []) {
        if (gc.category?.macroCategoryId) macroIds.add(gc.category.macroCategoryId);
      }
      return macroIds.has(activeMacro);
    });
  }, [filterActive, regularGoals, activeCats, activeMacro]);

  // ---------- Fetch goals (mantém original) ----------
  useEffect(() => {
    async function fetchGoals() {
      try {
        setLoading(true);
        setDisplayedGoalsCount(INITIAL_COUNT);
        const response = await fetch(`/api/goals?limit=1000&lang=${lang}`, { cache: 'no-store' });
        const json = await response.json();
        const allGoals: Goal[] = Array.isArray(json) ? json : (json.goals ?? []);

        const top10 = allGoals.filter((g) => g.isTopTen).slice(0, 10);

        setTopTenGoals(top10);

        // [PATCH 22/12] Top10 nao e exclusivo: os mesmos itens tambem aparecem na lista principal.
        setRegularGoals(allGoals);
      } catch (error) {
        console.error('Erro ao buscar goals:', error);
        setTopTenGoals([]);
        setRegularGoals([]);
      } finally {
        setLoading(false);
      }
    }

    fetchGoals();
  }, [lang]);

  // Fetch macros (só para label dos chips; não bloqueia a Home)
  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        const res = await fetch(`/api/macro-categories?lang=${lang}`, { cache: 'no-store' });
        const json = await res.json().catch(() => null);

        const list: MacroDTO[] = Array.isArray(json)
          ? json
          : Array.isArray(json?.data)
            ? json.data
            : Array.isArray(json?.macroCategories)
              ? json.macroCategories
              : [];

        if (!alive) return;
        setMacros(list);
      } catch {
        if (!alive) return;
        setMacros([]);
      }
    })();

    return () => {
      alive = false;
    };
  }, [lang]);

  // Infinite scroll baseado no tamanho do resultado filtrado
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const first = entries[0];
        if (!first?.isIntersecting) return;

        setDisplayedGoalsCount((prev) => {
          if (prev >= filteredRegularGoals.length) return prev;
          return Math.min(prev + BATCH_SIZE, filteredRegularGoals.length);
        });
      },
      { threshold: 0, rootMargin: '1400px' }
    );

    const currentRef = loadMoreRef.current;
    if (currentRef) observer.observe(currentRef);

    return () => {
      if (currentRef) observer.unobserve(currentRef);
    };
  }, [filteredRegularGoals.length]);

  // Scroll com offset + auto-correção (mantém original; ligeiramente mais robusto)
  const scrollToGoalsAnchorWithOffset = useCallback((behavior: ScrollBehavior = 'smooth') => {
    const anchor = document.getElementById('goals-anchor');
    if (!anchor) return;

    const NAV_OFFSET = 140;

    const computeTop = () => {
      const rect = anchor.getBoundingClientRect();
      return rect.top + window.scrollY - NAV_OFFSET;
    };

    window.scrollTo({ top: computeTop(), behavior });

    setTimeout(() => window.scrollTo({ top: computeTop(), behavior: 'auto' }), 280);
    setTimeout(() => window.scrollTo({ top: computeTop(), behavior: 'auto' }), 900);
  }, []);

  // Se vier de /categorias com #goals-anchor, corrigimos o offset automaticamente após carregar.
  useEffect(() => {
    if (loading) return;
    if (typeof window === 'undefined') return;
    if (window.location.hash !== '#goals-anchor') return;

    const t = window.setTimeout(() => {
      scrollToGoalsAnchorWithOffset('auto');
    }, 60);

    return () => window.clearTimeout(t);
  }, [loading, scrollToGoalsAnchorWithOffset, filtersKey]);

  // Permite Navbar pedir scroll (mantém original)
  useEffect(() => {
    const handler = () => {
      if (loading) {
        pendingScrollRef.current = true;
        return;
      }
      scrollToGoalsAnchorWithOffset('smooth');
    };

    window.addEventListener('destinote:scroll-to-goals', handler);
    return () => window.removeEventListener('destinote:scroll-to-goals', handler);
  }, [loading, scrollToGoalsAnchorWithOffset]);

  useEffect(() => {
    if (loading) return;
    if (!pendingScrollRef.current) return;
    pendingScrollRef.current = false;
    scrollToGoalsAnchorWithOffset('smooth');
  }, [loading, scrollToGoalsAnchorWithOffset]);

  // /?bulk=1 -> liga modo bulk UMA VEZ e remove o parâmetro (mantém original)
  useEffect(() => {
    if (loading) return;
    if (status === 'loading') return;

    const bulkParam = searchParams.get('bulk');

    if (bulkParam !== '1') {
      didAutoOpenBulk.current = false;
      return;
    }

    if (bulk.active) return;
    if (didAutoOpenBulk.current) return;
    didAutoOpenBulk.current = true;

    if (!isLoggedIn) {
      router.push('/entrar');
      return;
    }

    (async () => {
      try {
        const res = await fetch('/api/user/list-count', {
          method: 'GET',
          cache: 'no-store',
        });

        const data = await res.json().catch(() => ({}));

        const limit =
          typeof data.limit === 'number' || data.limit === null ? data.limit : null;

        const count = typeof data.count === 'number' ? data.count : 0;

        const accessLevel =
          typeof data.accessLevel === 'string' ? data.accessLevel : 'public';

        bulk.startBulkMode({ limit, currentCount: count, accessLevel });
      } catch {
        bulk.startBulkMode({ limit: null, currentCount: 0, accessLevel: 'public' });
      } finally {
        const params = new URLSearchParams(searchParams.toString());
        params.delete('bulk');

        const q = params.toString();
        router.replace(q ? `/?${q}` : '/', { scroll: false });

        setTimeout(() => scrollToGoalsAnchorWithOffset('smooth'), 80);
      }
    })();
  }, [
    loading,
    status,
    searchParams,
    isLoggedIn,
    router,
    bulk,
    scrollToGoalsAnchorWithOffset,
  ]);

  // Teleporte a partir do TopCard (Top10) para o card correspondente na lista principal.
  //
  // Regras pedidas:
  // - Itens Top10 NÃO são exclusivos (eles também aparecem na lista principal).
  // - Clique no Top10 NÃO expande/abre o próprio card Top10; apenas “teleporta” e abre o card regular.
  // - A lista principal tem paginação (infinite scroll), então garantimos que o item esteja renderizado antes do scroll.
  const scrollToGoal = (goalId: number) => {
    // 1) Descobre a posição do goal na lista atual (já com filtros aplicados).
    const idx = filteredRegularGoals.findIndex((g) => g.id === goalId);

    // 2) Se o item estiver fora do range já renderizado, aumentamos o limite para garantir o DOM.
    if (idx >= 0 && idx + 1 > displayedGoalsCount) {
      setDisplayedGoalsCount(idx + 1);
    }

    // 3) Tenta rolar algumas vezes (o React precisa renderizar após o setState).
    const tryScroll = () => {
      const el = document.getElementById(`goal-${goalId}`);
      if (!el) return false;

      el.scrollIntoView({ behavior: 'smooth', block: 'center' });

      window.setTimeout(() => {
        // Abre o card correto na lista principal (sem tocar no card Top10).
        if (!isGoalExpanded(goalId)) toggleGoal(goalId);
      }, 250);

      return true;
    };

    // Tentativa imediata + tentativas atrasadas
    if (tryScroll()) return;
    window.setTimeout(() => tryScroll(), 60);
    window.setTimeout(() => tryScroll(), 180);
    window.setTimeout(() => tryScroll(), 360);
  };

  const scrollToFirstRegularAfterTopTen = () => {
    if (loading) {
      pendingScrollRef.current = true;
      return;
    }
    scrollToGoalsAnchorWithOffset('smooth');
  };

  const handleGoalClick = (goal: Goal) => {
    setSelectedGoal(goal);
    setIsModalOpen(true);
  };

  return (
    <div className="min-h-screen relative">
      <ScrollBackgrounds />
      <RotatingGlobe />
      <Navbar />

      {/* HERO */}
      <motion.section
        ref={heroRef}
        style={{ opacity: heroOpacity, scale: heroScale }}
        className="relative min-h-screen flex items-center justify-center pt-20 px-4"
      >
        <div className="max-w-4xl mx-auto text-center">
          <motion.h1
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 10 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-2xl sm:text-3xl md:text-8xl font-bold text-white mb-2 w-full max-w-full"
            style={{
              textShadow: '0 14px 26px rgba(0,0,0,0.90)',
            }}

          >
            Destinote
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: -20 }}
            transition={{ duration: 0.6, delay: 0.35 }}
            className={["text-base sm:text-lg md:text-7xl text-white/90 w-full max-w-2xl mx-auto", 
            lang === 'en' ? 'pl-12 md:pl-16' : 'pl-6 md:pl-12',   ].join(' ')}            
            style={{ textShadow: '0 6px 22px rgba(0,0,0,0.55)' }}

          >

            <QuantumTitle lang={lang} handDefault align="left" prefixFixed={lang === 'en' ? '1000 things to do' : '1000 coisas para fazer'} />

          </motion.p>


          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="text-xl md:text-2xl text-white/80 mb-6"
          >
            {/* {ui(lang, 'heroTagline') as string} */}
          </motion.p>

          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="text-lg text-white/70 mb-12 max-w-2xl mx-auto"
          >
            {/* {ui(lang, 'heroSubtitle') as string} */}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 45 }}
            transition={{ duration: 0.8, delay: 0.8 }}
            
          >
            <button
              onClick={scrollToFirstRegularAfterTopTen}
              className="
                relative inline-flex items-center gap-2
                px-8 py-2 rounded-full text-lg font-semibold
                bg-gradient-to-r from-purple-600/80 to-cyan-500/80
                hover:from-purple-500 hover:to-cyan-400
                text-white shadow-lg shadow-purple-900/40
                transition-all duration-200
                hover:scale-105 hover:shadow-xl
              "
            >
              {ui(lang, 'exploreList') as string}
              <span className="text-2xl leading-none">↓</span>
            </button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 50 }}
            transition={{ duration: 0.8, delay: 1.0 }}
            className="mt-1 flex justify-center"
          >
            <div className="flex flex-col items-center text-white/60 text-sm">
              <span>{ui(lang, 'scrollToDiscover') as string}</span>
              <motion.span
                animate={{ y: [0, 8, 0] }}
                transition={{ duration: 1.2, repeat: Infinity }}
                className="mt-1 text-xl"
              >
                ⌄
              </motion.span>
            </div>
          </motion.div>
        </div>
      </motion.section>

      {/* LISTAS */}
      <section id="goals-section" className="relative px-4">
        <div className="max-w-7xl mx-auto">
          {loading ? (
            <div className="text-center text-white text-xl">{ui(lang, 'loadingGoals') as string}</div>
          ) : (
            <>
              {/* [SPRINT-A] Banner sticky de filtros (chips) logo abaixo da Navbar */}
              <ActiveFiltersBar chips={chips} onClearAll={clearFilters} />

              {/* Toggle do Top10 (fixo no layout da página, pequeno à esquerda) */}
              <div className="mt-1 mb5 flex items-center justify-start">
                <TopToggleButton scrollOnOpen className="backdrop-blur-sm" />
              </div>

              {/* Âncora para rolar quando abrir o Top10 */}
              <div ref={topTenAnchorRef} id="top10" className="h-px scroll-mt-28" />

              {/* TOP 10 (auto esconde quando há filtro) */}
              {topTenVisible && (
                <div className="mb-20">
                  <div className="flex items-center justify-between gap-3 mb-4">
                    {/* spacer pra manter o título central */}
                    <div className="shrink-0 w-[52px]" />

                    <h2 className="text-4xl md:text-5xl font-bold text-white text-center flex-1">
                      {ui(lang, 'topListTitle') as string}
                    </h2>

                    <div className="shrink-0 w-[52px]" />
                  </div>

                  <p className="text-white/70 text-center mb-12">
                    {(ui(lang, 'topListSubtitle') as (n: number) => string)(topTenGoals.length)}
                  </p>

                  <div className="goals-grid grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-10">
                    {topTenGoals.map((goal) => (
                      <GoalCard
                        key={goal.id}
                        {...goal}
                        variant="top10"
                        onClick={() => scrollToGoal(goal.id)}
                      />
                    ))}
                  </div>
                </div>
              )}


              {/* TODOS OS OBJETIVOS */}
              <div>
                <div id="goals-anchor" className="h-px" />

                <h2 className="text-4xl md:text-5xl font-bold text-white mb-4 text-center">
                  {ui(lang, 'allGoalsTitle') as string}
                </h2>

                <p className="text-white/70 text-center mb-12">
                  {(ui(lang, 'waitingExperiences') as (n: number) => string)(filteredRegularGoals.length)}
                  {displayedGoalsCount < filteredRegularGoals.length && (
                    <span className="ml-2">
                      {(ui(lang, 'showingOf') as (a: number, b: number) => string)(displayedGoalsCount, filteredRegularGoals.length)}
                    </span>
                  )}
                </p>

                <div className="space-y-8 max-w-4xl mx-auto">
                  {filteredRegularGoals.slice(0, displayedGoalsCount).map((goal) => (
                    <div
                      key={goal.id}
                      className="goal-card destinote-idle-float"
                      style={
                        {
                          '--float-dur': `${9 + (goal.id % 7)}s`,
                          '--float-delay': `${-(goal.id % 10) * 0.35}s`,
                          '--float-x': `${1 + (goal.id % 4)}px`,
                          '--float-y': `${2 + (goal.id % 5)}px`,
                          '--float-r': `${0.15 + (goal.id % 5) * 0.06}deg`,
                        } as CSSProperties
                      }
                    >
                      <GoalCard {...goal} variant="regular" onClick={() => handleGoalClick(goal)} />
                    </div>
                  ))}
                </div>

                <div ref={loadMoreRef} className="h-20 flex items-center justify-center">
                  {displayedGoalsCount < filteredRegularGoals.length ? (
                    <div className="text-white/50 text-center">{ui(lang, 'loadingMore') as string}</div>
                  ) : (
                    <div className="text-white/50 text-center">
                      {(ui(lang, 'seenAll') as (n: number) => string)(filteredRegularGoals.length)}
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </section>

      <GoalModal goal={selectedGoal} isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />

      <AboutSection />

      <footer className="relative py-12 px-4 border-t border-white/10">
        <div className="max-w-7xl mx-auto text-center text-white/60">
          <p className="mb-2">{ui(lang, 'footerLine1') as string}</p>
          <p className="text-sm">{ui(lang, 'footerLine2') as string}</p>
        </div>
      </footer>
    </div>
  );
}
