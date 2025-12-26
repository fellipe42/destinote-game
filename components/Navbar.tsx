'use client';

// components/Navbar.tsx
//
// Base funcional do arquivo antigo (links e regras de lista/bulk),
// com layout arredondado do novo e dropdown MacroCategoriesMenu.
//
// Regras de links/estado:
// Não logado/publico:
//   DESTINOTE — Categorias — Filtros — Criar minha lista — Sobre — Idioma — Entrar
// Logado, sem itens:
//   DESTINOTE — Categorias — Filtros — Criar minha lista — Sobre — Idioma — Perfil
// Logado, com itens:
//   DESTINOTE — Categorias — Filtros — Minha Lista — Adicionar à lista — Sobre — Idioma — Perfil
// Logado, lista cheia:
//   DESTINOTE — Categorias — Filtros — Minha Lista — Sobre — Idioma — Perfil
//
// Se lista cheia: NÃO mostra botão "Adicionar à lista" e NÃO abre bulk.
//
// Além disso:
// - Hover dos botões mais evidente (bg + leve scale)
// - Evita “fantasmas” criando stacking context (isolate) e z alto
// - Botão Sobre: se não estiver na Home, navega para /#sobre e faz scroll com fallback

import Link from 'next/link';
import { motion } from 'framer-motion';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSession } from 'next-auth/react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import {
  Grid3x3,
  SlidersHorizontal,
  Info,
  Languages,
  LogIn,
  User,
  Plus,
  X,
  ListChecks,
  Gamepad2,
} from 'lucide-react';

import { useBulkSelect } from '@/contexts/BulkSelectContext';
import MacroCategoriesMenu from '@/components/MacroCategoriesMenu';
import FiltersMenu from '@/components/FiltersMenu';
import { addLangToHref, ui } from '@/lib/lang';
import { useLang } from '@/lib/useLang';

type ListCountResponse = {
  authenticated: boolean;
  count: number;
  limit: number | null; // null = ilimitado
  accessLevel: string;
};

const NAV_H = 96;

function scrollToElWithOffset(el: HTMLElement) {
  const y = el.getBoundingClientRect().top + window.scrollY - NAV_H - 10;
  window.scrollTo({ top: y, behavior: 'smooth' });
}

function scrollToGoalsAnchorWithOffset() {
  const anchor =
    document.getElementById('goals-anchor') ||
    document.getElementById('all-goals-start');

  if (!anchor) return;
  scrollToElWithOffset(anchor);
}

function scrollToCategoriesGridFallback() {
  // tenta por ids comuns; se não existir, procura o H2 "Categorias"
  const idCandidates = [
    'categories-grid',
    'categories',
    'categorias',
    'all-categories',
    'filters-categories',
  ];

  for (const id of idCandidates) {
    const el = document.getElementById(id);
    if (el) {
      scrollToElWithOffset(el);
      return true;
    }
  }

  const h2s = Array.from(document.querySelectorAll('h2'));
  const target = h2s.find(
    (h) => (h.textContent ?? '').trim().toLowerCase() === 'categorias'
  );
  if (target) {
    scrollToElWithOffset(target as HTMLElement);
    return true;
  }

  return false;
}

export default function Navbar() {
  const { data: session, status } = useSession();
  const isLoggedIn = !!session?.user?.email;

  const router = useRouter();
  const pathname = usePathname();

  const bulk = useBulkSelect();

  const sp = useSearchParams();
  const { lang, toggleLang } = useLang();

  const hrefWithLang = useCallback((href: string) => addLangToHref(href, lang), [lang]);

  const setBulkParam = useCallback(
    (on: boolean) => {
      const params = new URLSearchParams(sp.toString());
      if (on) params.set('bulk', '1');
      else params.delete('bulk');

      const q = params.toString();
      router.replace(q ? `${pathname}?${q}` : pathname, { scroll: false });
    },
    [pathname, router, sp]
  );

  const [listCount, setListCount] = useState<number>(0);
  const [listLimit, setListLimit] = useState<number | null>(null);
  const [accessLevel, setAccessLevel] = useState<string>('public');
  const [loaded, setLoaded] = useState(false);

  const fetchListCount = useCallback(async () => {
    if (!isLoggedIn) {
      setListCount(0);
      setListLimit(null);
      setAccessLevel('public');
      setLoaded(true);
      return;
    }

    try {
      const res = await fetch('/api/user/list-count', {
        method: 'GET',
        cache: 'no-store',
      });
      if (!res.ok) throw new Error('Falha ao buscar list-count');

      const data = (await res.json()) as ListCountResponse;

      setListCount(typeof data.count === 'number' ? data.count : 0);
      setListLimit(
        typeof data.limit === 'number' || data.limit === null ? data.limit : null
      );
      setAccessLevel(
        typeof data.accessLevel === 'string' ? data.accessLevel : 'public'
      );
      setLoaded(true);
    } catch (e) {
      console.error(e);
      setListCount(0);
      setListLimit(null);
      setAccessLevel('public');
      setLoaded(true);
    }
  }, [isLoggedIn]);

  useEffect(() => {
    if (status === 'loading') return;
    fetchListCount();
  }, [status, fetchListCount]);

  useEffect(() => {
    const handler = () => fetchListCount();
    window.addEventListener('destinote:list-changed', handler);
    return () => window.removeEventListener('destinote:list-changed', handler);
  }, [fetchListCount]);

  const applyTempCardOverride = useCallback((hex: string | null) => {
    if (typeof window === 'undefined') return;

    const root = document.documentElement;
    const key = '--dn-card-override-temp';

    const current = getComputedStyle(root).getPropertyValue(key).trim().toLowerCase();

    if (!hex) {
      root.style.removeProperty(key);
    } else {
      const next = hex.toLowerCase();
      // clicar de novo na mesma cor = desliga
      if (current && current === next) root.style.removeProperty(key);
      else root.style.setProperty(key, hex);
    }

    window.dispatchEvent(new Event('destinote:card-override-changed'));
  }, []);


  const hasList = loaded && listCount > 0;
  const listFull = listLimit !== null && listCount >= listLimit;

  const canUseBulk = isLoggedIn && accessLevel !== 'public' && accessLevel !== '';

  const openBulk = () => {
    if (!isLoggedIn) {
      router.push(hrefWithLang('/entrar'));
      return;
    }

    if (!canUseBulk) {
      router.push(hrefWithLang('/perfil'));
      return;
    }

    if (listFull) {
      router.push(hrefWithLang('/perfil'));
      return;
    }

    // se não estiver na home, manda pra home com /?bulk=1 (page.tsx consome)
    if (pathname !== '/') {
      router.push(hrefWithLang('/?bulk=1'), { scroll: false });
      return;
    }

    bulk.startBulkMode({ currentCount: listCount, limit: listLimit });
    setBulkParam(true);

    // respiro pro layout
    setTimeout(() => scrollToGoalsAnchorWithOffset(), 80);
  };

  const closeBulk = () => {
    bulk.stopBulkMode();
    setBulkParam(false);
  };

  const handleCreateList = () => {
    if (!isLoggedIn) {
      router.push(hrefWithLang(`/my-list?ts=${Date.now()}`));
      setTimeout(() => router.refresh(), 0);
      return;
    }

    // logado sem itens -> abre bulk (ou fecha se já estiver aberto)
    if (!hasList) {
      if (bulk.active) closeBulk();
      else openBulk();
      return;
    }

    // fallback: se por algum motivo chamarem isso com itens, manda pra Minha Lista
    router.push(hrefWithLang(`/my-list?v=${Date.now()}`));
  };

  const handleOpenMyList = () => {
    router.push(hrefWithLang(`/my-list?v=${Date.now()}`));
  };

  const handleOpenFilters = () => {
    // objetivo: ir para /categorias e scrollar direto para seção das 22 categorias (não macro)
    sessionStorage.setItem('destinote:scrollToCategoriesGrid', '1');
    router.push(hrefWithLang('/categorias'));
  };

  const handleSobre = () => {
    if (pathname === '/') {
      const el = document.getElementById('sobre');
      if (el) scrollToElWithOffset(el);
      return;
    }

    // navega para home e tenta scrollar depois
    sessionStorage.setItem('destinote:scrollToSobre', '1');
    router.push(hrefWithLang('/#sobre'));
  };

  // Pós-navegação: scrolls “inteligentes” (Filtros e Sobre)
  useEffect(() => {
    if (pathname !== '/categorias') return;

    const shouldScroll = sessionStorage.getItem('destinote:scrollToCategoriesGrid');
    if (!shouldScroll) return;

    sessionStorage.removeItem('destinote:scrollToCategoriesGrid');

    // tenta algumas vezes (a página precisa renderizar)
    const t1 = window.setTimeout(() => scrollToCategoriesGridFallback(), 80);
    const t2 = window.setTimeout(() => scrollToCategoriesGridFallback(), 240);
    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
    };
  }, [pathname]);

  useEffect(() => {
    if (pathname !== '/') return;

    const shouldScroll = sessionStorage.getItem('destinote:scrollToSobre');
    if (!shouldScroll) return;

    sessionStorage.removeItem('destinote:scrollToSobre');

    const t1 = window.setTimeout(() => {
      const el = document.getElementById('sobre');
      if (el) scrollToElWithOffset(el);
    }, 120);

    const t2 = window.setTimeout(() => {
      const el = document.getElementById('sobre');
      if (el) scrollToElWithOffset(el);
    }, 280);

    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
    };
  }, [pathname]);

  // Visibilidade dos botões conforme regras
  const showCreateListButton = !hasList; // aparece para público e logados sem itens
  const showMyListButton = isLoggedIn && hasList;
  const showAddButton = isLoggedIn && hasList && !listFull;

  const createListLabel = bulk.active
    ? (ui(lang, 'close') as string)
    : (ui(lang, 'createMyList') as string);

  const navBtnBase = useMemo(() => {
    return [
      'flex items-center gap-2 px-3 py-2',
      'text-white/85 hover:text-white',
      'transition-all duration-200',
      'rounded-md',
      'focus:outline-none focus-visible:ring-2 focus-visible:ring-white/20',
      // hover extra
      'hover:bg-white/10 hover:scale-[1.03] active:scale-[0.99]',
    ].join(' ');
  }, []);

  const ctaBtn =
    'rounded-xl px-4 py-2 text-sm font-semibold bg-purple-600 hover:bg-purple-700 ' +
    'text-white shadow-lg shadow-purple-500/30 transition-all hover:scale-[1.03] ' +
    'focus:outline-none focus-visible:ring-2 focus-visible:ring-white/20';

  return (
    <motion.nav
      initial={{ y: -40, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.45 }}
      className="fixed top-0 inset-x-0 z-[60] px-3 md:px-6 py-3 pointer-events-none"
    >
      <div className="max-w-6xl mx-auto pointer-events-auto isolate">
        <div
          className="
            dn-nav-shell rounded-2xl border
            backdrop-blur-xl
            shadow-lg shadow-black/30
          "
        >
          <div className="flex items-center justify-between px-4 md:px-6 py-3">
                        <div className="relative group">
              <Link
                href={hrefWithLang('/')}
                className="flex items-center gap-2 text-white font-bold tracking-wide hover:text-white transition-colors"
              >
                <span className="text-lg">DESTINOTE</span>
              </Link>

              {/* Dropdown (hover): override TEMPORÁRIO da cor dos GoalCards */}
              <div
                className={[
                  'pointer-events-none opacity-0 translate-y-1',
                  'group-hover:pointer-events-auto group-hover:opacity-100 group-hover:translate-y-0',
                  'transition-all duration-150',
                  'absolute left-0 top-full mt-2 z-50',
                ].join(' ')}
              >
                <div className="rounded-2xl border border-white/10 bg-black/45 backdrop-blur-xl shadow-xl shadow-black/40 p-3 min-w-[220px]">
                  <div className="text-[11px] text-white/70 mb-2">
                    Cor dos cards (temporário)
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {[
                      '#000000', // Epic / Dark
                      '#ffffff',
                      '#E60D00', // Desafio
                      '#137021', // Assistir
                      '#00FFFF', // Explorar (exemplo)
                      '#800080', // Participar (exemplo)
                      '#EBB903', // Aprender (exemplo)
                      '#EF6E03', // Lifestyle (exemplo)
                    ].map((hex) => (
                      <button
                        key={hex}
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          applyTempCardOverride(hex);
                        }}
                        className="w-7 h-7 rounded-md border border-white/15 shadow-sm hover:scale-[1.06] active:scale-[0.98] transition"
                        style={{ background: hex }}
                        aria-label={`Cards ${hex}`}
                        title={`Cards ${hex} (clique p/ alternar)`}
                      />
                    ))}

                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        applyTempCardOverride(null);
                      }}
                      className="ml-auto px-2 py-1 rounded-md text-[11px] text-white/75 hover:text-white hover:bg-white/10 transition border border-white/10"
                      title="Voltar ao normal"
                    >
                      Reset
                    </button>
                  </div>

                  <div
                    className="mt-3 h-2 rounded-full border border-white/10"
                    style={{
                      background:
                        'linear-gradient(90deg,#000000,#2b2b2b,#ffffff,#E60D00,#EBB903,#00FFFF,#800080,#137021)',
                    }}
                  />
                </div>
              </div>
            </div>


            <div className="hidden md:flex items-center gap-1">
              {/* Categorias (dropdown macro) */}
              <MacroCategoriesMenu
                navBtnBase={navBtnBase}
                icon={<Grid3x3 size={18} />}
                label={ui(lang, 'categories') as string}
              />

              {/* Filtros */}
              <div className="relative group">
                <button type="button" className={navBtnBase} onClick={handleOpenFilters}>
                  <SlidersHorizontal size={18} />
                  {ui(lang, 'filters') as string}
                </button>

                {/* Dropdown flutuante (hover) - lista dos filtros disponíveis */}
                <div
                  className={[
                    'pointer-events-none opacity-0 translate-y-1',
                    'group-hover:pointer-events-auto group-hover:opacity-100 group-hover:translate-y-0',
                    'transition-all duration-150',
                    'absolute left-1/2 -translate-x-1/2 top-full mt-3 z-50',
                  ].join(' ')}
                >
                  <FiltersMenu />
                </div>
              </div>


              {/* NOVO: JOGO */}
              <Link href={hrefWithLang('/game')} className={navBtnBase} title="Abrir Game V0">
                <Gamepad2 size={18} />
                {ui(lang, 'game') as string}
              </Link>

              {/* Criar minha lista (público e logado sem itens) */}
              {showCreateListButton && (
                <button type="button" className={navBtnBase} onClick={handleCreateList}>
                  {!hasList && bulk.active ? <X size={18} /> : <ListChecks size={18} />}
                  {createListLabel}
                </button>
              )}

              {/* Minha Lista (logado com itens) */}
              {showMyListButton && (
                <button type="button" className={navBtnBase} onClick={handleOpenMyList}>
                  <ListChecks size={18} />
                  {ui(lang, 'myList') as string}
                </button>
              )}

              {/* Adicionar à lista */}
              {showAddButton && (
                <button
                  type="button"
                  className={navBtnBase}
                  onClick={() => {
                    if (bulk.active) closeBulk();
                    else openBulk();
                  }}
                >
                  {bulk.active ? <X size={18} /> : <Plus size={18} />}
                  {bulk.active ? (ui(lang, 'close') as string) : (ui(lang, 'addToList') as string)}
                </button>
              )}

              {/* Sobre */}
              <button type="button" className={navBtnBase} onClick={handleSobre}>
                <Info size={18} />
                {ui(lang, 'about') as string}
              </button>

              {/* Idioma */}
              <button
                type="button"
                className={navBtnBase}
                onClick={() => toggleLang()}
                title={ui(lang, 'language') as string}
                aria-label={ui(lang, 'language') as string}
              >
                <Languages size={18} />
                <span>{ui(lang, 'languageShort') as string}</span>
              </button>

              {/* Entrar / Perfil */}
              {!isLoggedIn ? (
                <Link href={hrefWithLang('/entrar')} className={ctaBtn}>
                  <span className="inline-flex items-center gap-2">
                    <LogIn size={18} />
                    {ui(lang, 'signIn') as string}
                  </span>
                </Link>
              ) : (
                <Link href={hrefWithLang('/perfil')} className={ctaBtn}>
                  <span className="inline-flex items-center gap-2">
                    <User size={18} />
                    {ui(lang, 'profile') as string}
                  </span>
                </Link>
              )}
            </div>

            {/* Mobile: adiciona um atalho direto pro jogo */}
            <div className="md:hidden flex items-center gap-2">
              <Link
                href={hrefWithLang('/game')}
                className="flex items-center gap-2 px-3 py-2 rounded-md border border-white/10 bg-white/5 text-white/85 hover:bg-white/10"
                aria-label={ui(lang, 'game') as string}
                title={ui(lang, 'game') as string}
              >
                <Gamepad2 size={18} />
                <span className="text-sm font-semibold">{ui(lang, 'game') as string}</span>
              </Link>

              <button
                className="text-white/90 hover:text-white transition-colors"
                type="button"
                aria-label="Menu"
              >
                <span className="text-sm font-semibold">Menu</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </motion.nav>
  );
}