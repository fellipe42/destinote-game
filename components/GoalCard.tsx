// components/GoalCard.tsx
'use client';

import {
  motion,
  useMotionValue,
  useTransform,
  AnimatePresence,
} from 'framer-motion';
import type { MotionStyle } from 'framer-motion';

import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { X, ZoomIn, Plus, Check, Minus } from 'lucide-react';

import { useExpandedGoals } from '@/contexts/ExpandedGoalsContext';
import { useBulkSelect } from '@/contexts/BulkSelectContext';
import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import { useLang } from '@/lib/useLang';

interface Category {
  id: number;
  name: string;
  color?: string | null;
}

export interface GoalCardProps {
  id: number;
  title: string;
  category: Category;
  variant?: 'top10' | 'regular' | 'mini';
  imageUrl?: string | null;
  local?: string | null;
  description?: string | null;

  // props legadas
  isTopTen?: boolean;
  isRegular?: boolean;
  onClick?: () => void;
}

type ListChangedDetail = { source?: string; goalId?: number; inList?: boolean };
type DoneChangedDetail = { goalId: number; done: boolean; source?: string };

function normalizeHex(hex?: string | null) {
  if (!hex) return null;
  return hex.startsWith('#') ? hex.slice(1) : hex;
}

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null;
}

function getApiErrorMessage(data: unknown, fallback: string) {
  if (isObject(data)) {
    const err = (data as any).error ?? (data as any).message;
    if (typeof err === 'string' && err.trim()) return err;
  }
  return fallback;
}

// Sprint 3.3 — override global de cor do card via CSS var (sem acoplar lógica ao GoalCard).
// Defina em qualquer lugar do CSS/theme:
//   html[data-dn-theme="dark"] { --dn-card-override: #0f0f14; }
// Para desligar:
//   --dn-card-override: none;
function readCssVar(name: string): string | null {
  if (typeof window === 'undefined') return null;
  const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  if (!v) return null;
  if (v.toLowerCase() === 'none') return null;
  return v;
}

export default function GoalCard({
  id,
  title,
  category,
  variant,
  imageUrl,
  local,
  description,
  isTopTen = false,
  isRegular = false,
  onClick,
}: GoalCardProps) {
  const { lang } = useLang();

  // PRIORIDADE: variant explícito > isRegular > isTopTen > mini
  const cardVariant: 'top10' | 'regular' | 'mini' =
    variant ?? (isRegular ? 'regular' : isTopTen ? 'top10' : 'mini');

  const canExpand = cardVariant === 'regular';

  const { toggleGoal, isExpanded: isExpandedFromContext } = useExpandedGoals();
  // TOP10 e MINI ignoram completamente o estado de expansão
  const isExpanded = cardVariant === 'regular' ? isExpandedFromContext(id) : false;

  const bulk = useBulkSelect();
  const showBulkToggle = bulk.active && cardVariant === 'regular' && !isExpanded;
  const isSelected = showBulkToggle ? bulk.isSelected(id) : false;
  const wouldHitLimit = showBulkToggle ? bulk.wouldHitLimit(id) : false;

  const handleBulkToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!showBulkToggle) return;
    if (wouldHitLimit) return;
    bulk.toggleSelected(id);
  };

  // [SPRINT-A] Tag de categoria clicável para aplicar/remover filtro sem scroll/topo.
  const toggleCategoryFilter = (categoryId: number) => {
    try {
      window.dispatchEvent(
        new CustomEvent('destinote:toggle-category-filter', {
          detail: { categoryId, source: 'GoalCard' },
        })
      );
    } catch {
      // no-op
    }
  };

  // Estados internos
  const [showCategory, setShowCategory] = useState(false);
  const [showFullText, setShowFullText] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  const [isDone, setIsDone] = useState(false);
  const [isInList, setIsInList] = useState(false);

  const { data: session, status } = useSession();

  // Sprint 3.3 — override global de cor do card (apenas regular/mini; Top10 fica intacto)
  const [cardOverrideColor, setCardOverrideColor] = useState<string | null>(null);

  // Refs
  const cardRef = useRef<HTMLDivElement>(null);
  const hoverTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Mouse values
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  // Rotação 3D
  const rotateX = useTransform(mouseY, [-100, 100], [5, -5]);
  const rotateY = useTransform(mouseX, [-100, 100], [5, -5]);

  // Cor categoria -> RGB
  const getCategoryRGB = useCallback(() => {
    const clean = normalizeHex(category.color);
    if (!clean || clean.length < 6) return { r: 120, g: 120, b: 255 };
    return {
      r: parseInt(clean.substring(0, 2), 16),
      g: parseInt(clean.substring(2, 4), 16),
      b: parseInt(clean.substring(4, 6), 16),
    };
  }, [category.color]);

  const { r, g, b } = getCategoryRGB();

    // ============================================================
  // Card Surface Override (tema + temporário via Navbar)
  // - prioridade: temp > solid(theme) > odd/even(theme)
  // - NÃO persiste (temp) e NÃO altera a cor do badge
  // - Mantém o "neon/glow" ainda baseado na categoria (r,g,b)
  // ============================================================

  const [surfaceOverrideHex, setSurfaceOverrideHex] = useState<string | null>(null);

  const updateSurfaceOverride = useCallback(() => {
    if (typeof window === 'undefined') return;

    const cs = getComputedStyle(document.documentElement);

    const pick = (varName: string) => {
      const v = cs.getPropertyValue(varName).trim();
      if (!v || v === 'none') return null;
      return v;
    };

    const temp = pick('--dn-card-override-temp');
    const solid = pick('--dn-card-override');
    const odd = pick('--dn-card-override-odd');
    const even = pick('--dn-card-override-even');

    let chosen: string | null = temp ?? solid;

    if (!chosen && (odd || even)) {
      const isOdd = id % 2 === 1;
      chosen = (isOdd ? odd : even) ?? odd ?? even ?? null;
    }

    setSurfaceOverrideHex((prev) => (prev === chosen ? prev : chosen));
  }, [id]);

  useEffect(() => {
    updateSurfaceOverride();

    const handler = () => updateSurfaceOverride();
    window.addEventListener('destinote:card-override-changed', handler);

    // observa troca de tema (data-dn-theme) e override inline (style no <html>)
    const mo = new MutationObserver(() => updateSurfaceOverride());
    mo.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-dn-theme', 'style'],
    });

    return () => {
      window.removeEventListener('destinote:card-override-changed', handler);
      mo.disconnect();
    };
  }, [updateSurfaceOverride]);

  const surfaceRGB = useMemo(() => {
    // Top10: por segurança, deixa como está (não mexe no visual especial)
    if (cardVariant === 'top10') return null;

    const clean = normalizeHex(surfaceOverrideHex);
    if (!clean || clean === 'none' || clean.length < 6) return null;

    return {
      r: parseInt(clean.substring(0, 2), 16),
      g: parseInt(clean.substring(2, 4), 16),
      b: parseInt(clean.substring(4, 6), 16),
    };
  }, [surfaceOverrideHex, cardVariant]);

  const sr = surfaceRGB?.r ?? r;
  const sg = surfaceRGB?.g ?? g;
  const sb = surfaceRGB?.b ?? b;


  // Neon / holo
  const neonIntensity = useTransform(mouseX, [-120, 0, 120], [0.4, 1, 0.4]);
  const neonBoxShadow = useTransform(
    neonIntensity,
    (v) => `
      0 0 ${15 + v * 12}px rgba(${r},${g},${b},0.55),
      0 0 ${30 + v * 20}px rgba(${r},${g},${b},0.30)
    `
  );

  const holoX = useTransform(mouseX, [-120, 120], [-10, 10]);
  const holoY = useTransform(mouseY, [-120, 120], [-10, 10]);

  // Texto claro/escuro no badge
  const isLightCategoryText =
    category.color &&
    [
      'FFFFFF',
      'FFC0CB',
      '00FFFF',
      'C0C0C0',
      '20C6B6',
      '90EE90',
      'ADD8E6',
    ].includes(normalizeHex(category.color) || '');

  const defaultDescription =
    lang === 'en'
      ? 'This is one of the goals in the Destinote list. Soon you’ll see tips, extra context, and stories from people who completed it.'
      : 'Este é um dos objetivos da lista Destinote. Em breve, teremos mais informações, dicas e histórias de pessoas que já completaram este objetivo!';
  const displayDescription = description || defaultDescription;
  const isLongText = displayDescription.length > 300;

  const sheenOpacity =
    cardVariant === 'regular' && !isExpanded
      ? 0.03
      : cardVariant === 'regular' && isExpanded
      ? 0.16
      : 0.3;

  const diagOpacity =
    cardVariant === 'regular' && !isExpanded
      ? 0.06
      : cardVariant === 'regular' && isExpanded
      ? 0.18
      : 0.32;

  // “Respiro” (idle) — determinístico por id, um pouco mais rápido
  const breath = useMemo(() => {
    const seed = (id * 9301 + 49297) % 233280;
    const rand = seed / 233280; // 0..1
    const amp = 0.7 + rand * 0.9; // px
    const dur = 2.6 + rand * 1.1; // mais rápido do que antes
    const delay = rand * 0.55;
    return { amp, dur, delay };
  }, [id]);

  // Sprint 3.3 — observa mudanças de tema (data-dn-theme) e atualiza override
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const update = () => {
      const v = readCssVar('--dn-card-override');
      setCardOverrideColor(v);
    };

    update();

    const obs = new MutationObserver(() => update());
    try {
      obs.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ['data-dn-theme', 'style', 'class'],
      });
    } catch {
      // no-op
    }

    const onStorage = (e: StorageEvent) => {
      // tema pode mudar via script no layout / storage
      if (!e.key || e.key.includes('destinote:')) update();
    };
    window.addEventListener('storage', onStorage);

    return () => {
      obs.disconnect();
      window.removeEventListener('storage', onStorage);
    };
  }, []);

  // ----- Fetch helpers (inList / done) -----

  const refreshIsInList = useCallback(async () => {
    if (!session?.user?.email) {
      setIsInList(false);
      return;
    }

    try {
      const res = await fetch(`/api/user/list?goalId=${id}`, { cache: 'no-store' });
      const data: unknown = await res.json().catch(() => ({}));

      if (res.ok && isObject(data) && (data as any).success === true) {
        if (typeof (data as any).inList === 'boolean') {
          setIsInList((data as any).inList);
          return;
        }

        const list = (data as any).data;
        if (Array.isArray(list)) {
          const has = list.some((x) => isObject(x) && Number((x as any).goalId) === id);
          setIsInList(has);
        }
      }
    } catch {
      // silêncio
    }
  }, [id, session?.user?.email]);

  const refreshIsDone = useCallback(async () => {
    if (!session?.user?.email) {
      setIsDone(false);
      return;
    }

    try {
      const res = await fetch(`/api/user/done?goalId=${id}`, { cache: 'no-store' });
      const data: unknown = await res.json().catch(() => ({}));

      if (res.ok && isObject(data) && (data as any).success === true) {
        if (typeof (data as any).done === 'boolean') {
          setIsDone((data as any).done);
          return;
        }

        const list = (data as any).data;
        if (Array.isArray(list)) {
          const has = list.some((x) => isObject(x) && Number((x as any).goalId) === id);
          setIsDone(has);
        }
      }
    } catch {
      // silêncio
    }
  }, [id, session?.user?.email]);

  // Ao abrir expandido, garante estados atualizados
  useEffect(() => {
    if (!isExpanded || cardVariant !== 'regular') return;
    if (status === 'loading') return;

    refreshIsInList();
    refreshIsDone();
  }, [isExpanded, cardVariant, status, refreshIsInList, refreshIsDone]);

  // Listeners globais (sem código solto!)
  useEffect(() => {
    const handlerList = (e: Event) => {
      const ce = e as CustomEvent<ListChangedDetail>;
      if (ce?.detail?.goalId && ce.detail.goalId !== id) return;

      if (cardVariant === 'regular' && isExpanded) {
        refreshIsInList();
      }
    };

    const handlerDone = (e: Event) => {
      const ce = e as CustomEvent<DoneChangedDetail>;
      if (!ce?.detail || ce.detail.goalId !== id) return;
      setIsDone(ce.detail.done);
    };

    window.addEventListener('destinote:list-changed', handlerList as EventListener);
    window.addEventListener('destinote:done-changed', handlerDone as EventListener);

    return () => {
      window.removeEventListener('destinote:list-changed', handlerList as EventListener);
      window.removeEventListener('destinote:done-changed', handlerDone as EventListener);
    };
  }, [id, isExpanded, cardVariant, refreshIsInList]);

  // ----- UI handlers -----

  const handleMouseEnter = () => {
    if (isExpanded) {
      setShowCategory(true);
      return;
    }
    hoverTimeoutRef.current = setTimeout(() => setShowCategory(true), 300);
  };

  const handleMouseLeave = () => {
    if (isExpanded) return;
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }
    setShowCategory(false);

    if (cardVariant === 'regular') {
      mouseX.set(0);
      mouseY.set(0);
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (cardVariant !== 'regular' || !cardRef.current || isExpanded) return;

    const rect = cardRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    mouseX.set(e.clientX - centerX);
    mouseY.set(e.clientY - centerY);
  };

  const handleCardClick = (e: React.MouseEvent) => {
    if (
      (e.target as HTMLElement).closest('button') ||
      (e.target as HTMLElement).closest('.lightbox-trigger')
    ) {
      return;
    }

    // TOP10/MINI: não expandem
    if (!canExpand) {
      onClick?.();
      return;
    }

    toggleGoal(id);
    if (!isExpanded) setShowCategory(true);
  };

  const handleClose = () => {
    toggleGoal(id);
    setShowCategory(false);
    setShowFullText(false);
  };

  const handleMarkDone = async () => {
    if (!session?.user?.email) {
      window.location.href = '/entrar';
      return;
    }

    const nextDone = !isDone;
    setIsDone(nextDone); // otimista

    try {
      const res = await fetch('/api/user/done', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ goalId: id, done: nextDone }),
      });

      const data: unknown = await res.json().catch(() => ({}));
      const ok = res.ok && isObject(data) && (data as any).success === true;

      if (!ok) {
        const msg = getApiErrorMessage(data, 'Erro ao marcar como completo');
        throw new Error(msg);
      }

      window.dispatchEvent(
        new CustomEvent<DoneChangedDetail>('destinote:done-changed', {
          detail: { goalId: id, done: nextDone, source: 'goalcard' },
        })
      );
    } catch (err) {
      setIsDone(!nextDone); // rollback
      console.error(err);
    }
  };

  const handleAddToList = async () => {
    if (!session?.user?.email) {
      window.location.href = '/entrar';
      return;
    }

    const nextInList = !isInList;
    setIsInList(nextInList); // otimista

    try {
      const res = await fetch('/api/user/add-to-list', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ goalId: id, add: nextInList }),
      });

      const data: unknown = await res.json().catch(() => ({}));
      const ok = res.ok && isObject(data) && (data as any).success === true;

      if (!ok) {
        const msg = getApiErrorMessage(data, 'Erro ao atualizar lista');
        throw new Error(msg);
      }

      window.dispatchEvent(
        new CustomEvent<ListChangedDetail>('destinote:list-changed', {
          detail: { source: 'goalcard', goalId: id, inList: nextInList },
        })
      );
    } catch (err) {
      setIsInList(!nextInList); // rollback
      console.error(err);
    }
  };

  // ----- estilo do “vidro” / cloud -----

  const getCloudEffectStyle = () => {
    const borderColor =
      category.color && normalizeHex(category.color)
        ? `#${normalizeHex(category.color)}`
        : 'rgba(255,255,255,0.4)';

    const isRegularCollapsed = cardVariant === 'regular' && !isExpanded;

    if (isRegularCollapsed) {
      return {
        borderColor,
        background: `
          linear-gradient(
            115deg,
            rgba(${sr}, ${sg}, ${sb}, 0.09) 0%,
            rgba(${sr}, ${sg}, ${sb}, 0.15) 48%,
            rgba(${sr}, ${sg}, ${sb}, 0.25) 68%,
            rgba(${sr}, ${sg}, ${sb}, 0.40) 100%
          )
        `,
        backdropFilter: 'blur(0.6px)',
        WebkitBackdropFilter: 'blur(0.6px)',
        boxShadow: `
          0 18px 32px rgba(0, 0, 0, 0.60),
          0 0 8px rgba(${r}, ${g}, ${b}, 0.60),
          inset 0 0 6px rgba(${r}, ${g}, ${b}, 0.99)
        `,
      };
    }

    if (cardVariant === 'regular' && isExpanded) {
      return {
        borderColor,
        background: `
          linear-gradient(
            115deg,
            rgba(${sr}, ${sg}, ${sb}, 0.02) 0%,
            rgba(${sr}, ${sg}, ${sb}, 0.20) 40%,
            rgba(${sr}, ${sg}, ${sb}, 0.60) 100%
          )
        `,
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        boxShadow: `
          0 18px 32px rgba(0, 0, 0, 0.90),
          0 0 26px rgba(${r}, ${g}, ${b}, 0.30),
          inset 0 0 8px rgba(${r}, ${g}, ${b}, 0.80)
        `,
      };
    }

    if (cardVariant === 'top10') {
      return {
        borderColor,
        background: `
          linear-gradient(
            135deg,
            rgba(${sr}, ${sg}, ${sb}, 0.05) 0%,
            rgba(${sr}, ${sg}, ${sb}, 0.10) 50%,
            rgba(${sr}, ${sg}, ${sb}, 0.30) 75%,
            rgba(${sr}, ${sg}, ${sb}, 0.60) 100%
          )
        `,
        backdropFilter: 'blur(5px)',
        WebkitBackdropFilter: 'blur(5px)',
        boxShadow: `
          0 0 10px rgba(${r}, ${g}, ${b}, 0.25),
          0 0 35px rgba(${r}, ${g}, ${b}, 0.35)
        `,
      };
    }

    return {
      borderColor,
      background: `
        linear-gradient(
          135deg,
          rgba(${sr}, ${sg}, ${sb}, 0.10) 0%,
          rgba(${sr}, ${sg}, ${sb}, 0.25) 100%
        )
      `,
      backdropFilter: 'blur(8px)',
      WebkitBackdropFilter: 'blur(8px)',
      boxShadow: `0 0 16px rgba(${r}, ${g}, ${b}, 0.35)`,
    };
  };

  // ====== Ajustes fáceis (pra você brincar depois sem me chamar) ======
  // AQUI você altera o tamanho do título do card colapsado regular:
  const COLLAPSED_TITLE_CLASS =
    'mt-0.5 text-[15px] md:text-[15.5px] font-semibold text-white leading-snug drop-shadow-[0_1px_3px_rgba(0,0,0,0.7)]';
  // ===================================================================

  // Padding do colapsado: regular mais “magro”, top10 preservado (layout antigo)
  const collapsedPaddingClass =
    cardVariant === 'regular' || cardVariant === 'mini'
      ? `pl-4 ${showBulkToggle ? 'pr-[22%]' : 'pr-4'} py-1`
      : 'px-4 py-2';

  return (
    <>
      {/* LIGHTBOX */}
      <AnimatePresence>
        {lightboxOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setLightboxOpen(false)}
              className="fixed inset-0 bg-black/90 z-[60] cursor-pointer"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="fixed inset-0 z-[61] flex items-center justify-center p-8 pointer-events-none"
            >
              <div className="relative max-w-4xl max-h-full pointer-events-auto">
                <button
                  onClick={() => setLightboxOpen(false)}
                  className="absolute -top-10 right-0 text-white hover:text-gray-300 transition-colors"
                >
                  <X size={26} />
                </button>

                {/* Mantém o lightbox completo; usa imageUrl se existir */}
                {imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={imageUrl}
                    alt={title}
                    className="max-w-[min(85vw,1100px)] max-h-[80vh] rounded-lg object-contain bg-black/30"
                  />
                ) : (
                  <div className="bg-gradient-to-br from-purple-600 to-blue-600 rounded-lg flex items-center justify-center min-h-[400px] min-w-[400px]">
                    <span className="text-white text-8xl font-bold opacity-30">{id}</span>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* CARD PRINCIPAL */}
      <motion.div
        id={cardVariant === 'regular' ? `goal-${id}` : undefined}
        ref={cardRef}
        layout
        initial={false}
        animate={
          cardVariant === 'regular' && !isExpanded
            ? { opacity: 1, y: [0, -breath.amp, 0] }
            : { opacity: 1, y: 0 }
        }
        whileHover={
          cardVariant === 'top10'
            ? { scale: 1.06, rotateX: 2, rotateY: -2, transition: { duration: 0.22 } }
            : canExpand && !isExpanded
            ? { scale: 1.035, translateZ: 10, transition: { duration: 0.2 } }
            : {}
        }
        style={
          cardVariant === 'regular' && !isExpanded
            ? { rotateX, rotateY, transformPerspective: 1000 }
            : {}
        }
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onMouseMove={handleMouseMove}
        onClick={handleCardClick}
        className={`
          relative
          ${canExpand ? 'cursor-pointer' : 'cursor-default'}
          ${isExpanded ? 'z-10' : ''}
          ${cardVariant === 'regular' && !isExpanded ? 'max-w-[46rem] mx-auto' : ''}
        `}
        transition={{
          layout: { duration: 0.25, ease: 'easeOut' },
          y:
            cardVariant === 'regular' && !isExpanded
              ? { duration: breath.dur, repeat: Infinity, ease: 'easeInOut', delay: breath.delay }
              : { duration: 0.2 },
        }}
      >
        <Card
          className={`
            overflow-visible transition-all duration-300
            ${cardVariant === 'top10' ? 'min-h-[260px] max-h-[340px] border-2' : ''}
            ${cardVariant === 'regular' && !isExpanded ? 'min-h-[68px] border-0 bg-transparent' : ''}
            ${cardVariant === 'regular' && isExpanded ? 'min-h-[400px] border-0 bg-transparent' : ''}
            ${cardVariant === 'mini' ? 'min-h-[70px] border-2' : ''}
          `}
          style={{
            borderRadius: 18,
            ...getCloudEffectStyle(),
            width: '100%',
            position: 'relative',
          }}
        >
          {/* Sprint 3.3 — TINT GLOBAL (não aplica em Top10 pra não mexer no header/imagem) */}
          {cardOverrideColor && cardVariant !== 'top10' && (
            <span
              className="absolute inset-0 rounded-[inherit] pointer-events-none"
              style={{
                backgroundColor: cardOverrideColor,
                // ajuste fino aqui depois (0.30–0.50). Mantive estável e moderado:
                opacity: 0.42,
                mixBlendMode: 'multiply',
              }}
            />
          )}

          {/* BORDA NEON */}
          <motion.span
            className="absolute inset-0 rounded-[inherit] pointer-events-none"
            style={
              {
                boxShadow: neonBoxShadow,
                opacity:
                  cardVariant === 'regular'
                    ? neonIntensity
                    : cardVariant === 'top10'
                    ? 0.45
                    : 0.5,
              } as unknown as MotionStyle
            }
          />

          {/* SHEEN */}
          <motion.span
            className="absolute inset-0 rounded-[inherit] pointer-events-none"
            style={
              {
                backgroundImage: `
                  radial-gradient(
                    circle at 50% 0%,
                    rgba(255,255,255,0.16),
                    rgba(255,255,255,0.02)
                  )
                `,
                mixBlendMode: 'screen',
                x: holoX,
                y: holoY,
                opacity: sheenOpacity,
              } as unknown as MotionStyle
            }
          />

          {/* HIGHLIGHT */}
          <motion.span
            className="absolute inset-0 rounded-[inherit] pointer-events-none"
            style={
              {
                backgroundImage: `
                  linear-gradient(
                    130deg,
                    rgba(255,255,255,0.14) 0%,
                    rgba(255,255,255,0.02) 40%,
                    rgba(255,255,255,0.10) 100%
                  )
                `,
                x: holoX,
                y: holoY,
                opacity: diagOpacity,
              } as unknown as MotionStyle
            }
          />

          {/* BOTÃO FECHAR */}
          {isExpanded && cardVariant === 'regular' && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleClose();
              }}
              className="absolute top-3 right-3 z-20 text-white/60 hover:text-white transition-colors"
            >
              <X size={20} />
            </button>
          )}

          {/* HEADER TOP10 (mantém como antes) */}
          {cardVariant === 'top10' && (
            // Card é overflow-visible (pra manter o glow). Então o header precisa clipar.
            <div className="relative h-40 overflow-hidden rounded-t-[18px]">
              {imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={imageUrl} alt={title} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center object-cover">
                  <span className="text-white text-6xl font-bold opacity-50">{id}</span>
                </div>
              )}

              <div className="absolute top-2 right-2">
                <Badge className="bg-yellow-500 text-black">⭐ Top 10</Badge>
              </div>
            </div>
          )}

          {/* CONTEÚDO */}
          <div className={isExpanded ? 'px-6 py-4 h-full' : collapsedPaddingClass}>
            {/* COLAPSADO */}
            {!isExpanded && (
              <>
                {/* [SPRINT-A] Bulk strip (20% direita) — sem zona cega e sem expandir */}
                {showBulkToggle && cardVariant === 'regular' && (
                  <button
                    type="button"
                    onClick={handleBulkToggle}
                    onMouseDown={(e) => e.stopPropagation()}
                    onPointerDown={(e) => e.stopPropagation()}
                    disabled={wouldHitLimit}
                    title={
                      wouldHitLimit
                        ? 'Sua lista já atingiu o limite do plano.'
                        : isSelected
                        ? 'Remover da seleção'
                        : 'Adicionar à seleção'
                    }
                    className={[
                      'absolute inset-y-0 right-0 z-30 w-[20%] min-w-[64px]',
                      wouldHitLimit ? 'cursor-not-allowed' : 'cursor-pointer',
                    ].join(' ')}
                  >
                    <span
                      className={[
                        'absolute inset-y-2 right-2 left-2 flex items-center justify-center rounded-2xl',
                        'border border-white/10 bg-black/15 backdrop-blur-md transition-all',
                        wouldHitLimit
                          ? 'opacity-40'
                          : isSelected
                          ? 'opacity-95 shadow-[0_0_18px_rgba(34,211,238,0.35)]'
                          : 'opacity-80 hover:opacity-95 hover:shadow-[0_0_18px_rgba(168,85,247,0.35)]',
                      ].join(' ')}
                    >
                      {isSelected ? <Minus size={18} /> : <Plus size={18} />}
                    </span>
                  </button>
                )}

                {/* ===== TOP10: mantém a estrutura antiga do colapsado ===== */}
                {cardVariant === 'top10' ? (
                  <>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-xs font-medium text-white/60 shrink-0">#{id}</span>

                        <Badge
                          role="button"
                          tabIndex={0}
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleCategoryFilter(category.id);
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              e.stopPropagation();
                              toggleCategoryFilter(category.id);
                            }
                          }}
                          className={`text-[10px] px-2 py-[2px] cursor-pointer hover:brightness-110 active:brightness-95 transition-opacity duration-300 ${
                            showCategory ? 'opacity-100' : 'opacity-0'
                          }`}
                          style={{
                            backgroundColor: category.color ? `#${normalizeHex(category.color)}` : '#555',
                            color: isLightCategoryText ? '#000' : '#fff',
                          }}
                          title="Filtrar por esta categoria"
                        >
                          <span className="truncate max-w-[240px] inline-block">{category.name}</span>
                        </Badge>
                      </div>
                    </div>

                    <div className="flex items-start justify-between gap-3 mb-1">
                      <h3 className="text-lg font-semibold text-white leading-tight drop-shadow-[0_1px_3px_rgba(0,0,0,0.7)] flex-1">
                        {title}
                      </h3>
                    </div>
                  </>
                ) : (
                  <>
                    {/* ===== REGULAR/MINI: novo layout compacto com Local móvel ===== */}
                    <div className="flex items-center gap-2 flex-nowrap min-w-0 min-h-[18px]">
                      <span className="text-xs font-medium text-white/60 shrink-0">#{id}</span>

                      {/* Categoria aparece no hover; não pode quebrar linha */}
                      <AnimatePresence initial={false}>
                        {showCategory && (
                          <motion.div
                            key="cat-badge"
                            layout="position"
                            initial={{ opacity: 0, x: -2 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -2 }}
                            transition={{ duration: 0.16 }}
                            className="shrink-0"
                          >
                            <Badge
                              role="button"
                              tabIndex={0}
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleCategoryFilter(category.id);
                              }}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  toggleCategoryFilter(category.id);
                                }
                              }}
                              className="text-[10px] px-2 py-[2px] cursor-pointer hover:brightness-110 active:brightness-95"
                              style={{
                                backgroundColor: category.color ? `#${normalizeHex(category.color)}` : '#555',
                                color: isLightCategoryText ? '#000' : '#fff',
                              }}
                              title="Filtrar por esta categoria"
                            >
                              <span className="truncate max-w-[140px] inline-block">{category.name}</span>
                            </Badge>
                          </motion.div>
                        )}
                      </AnimatePresence>

                      {/* Local “sobre o título”, e dá um passinho pra direita ao entrar a categoria */}
                      {cardVariant === 'regular' && local && (
                        <motion.div
                          layout="position"
                          transition={{ duration: 0.18, ease: 'easeOut' }}
                          className="flex items-center gap-1 min-w-0 text-[11px] text-white/75"
                        >
                          <span aria-hidden className="shrink-0">
                            📍
                          </span>
                          <span className="truncate">{local}</span>
                        </motion.div>
                      )}
                    </div>

                    <h3 className={COLLAPSED_TITLE_CLASS}>{title}</h3>
                  </>
                )}
              </>
            )}

            {/* EXPANDIDO (REGULAR) */}
            <AnimatePresence mode="wait">
              {isExpanded && cardVariant === 'regular' && (
                <motion.div
                  key="expanded-content"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 8 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-4 h-full flex flex-col"
                >
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm text-white/60">#{id}</span>
                    <Badge
                      style={{
                        backgroundColor: category.color ? `#${normalizeHex(category.color)}` : '#888',
                        color: isLightCategoryText ? '#000' : '#fff',
                      }}
                    >
                      {category.name}
                    </Badge>
                  </div>

                  {/* não corta glow dos CTAs */}
                  <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 overflow-visible">
                    {/* esquerda */}
                    <div className="flex flex-col space-y-3">
                      <div>
                        <h3 className="text-2xl md:text-3xl font-bold text-white">{title}</h3>
                      </div>

                      <div className="flex-1 overflow-y-auto">
                        <h4 className="text-lg font-semibold text-white mb-2">Sobre esse objetivo</h4>
                        <p className="text-white/80 text-sm leading-relaxed">
                          {showFullText
                            ? displayDescription
                            : `${displayDescription.substring(0, 300)}${isLongText ? '...' : ''}`}
                        </p>

                        {isLongText && !showFullText && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setShowFullText(true);
                            }}
                            className="text-purple-300 hover:text-purple-200 text-sm mt-2 underline"
                          >
                            continuar lendo
                          </button>
                        )}
                      </div>

                      {/* CTAs — roxo/azul normal; verde quando clicado */}
                      <div className="flex flex-col gap-2 mt-auto">
                        {/* DONE */}
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleMarkDone();
                          }}
                          className={[
                            'w-full py-3 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 border',
                            isDone
                              ? 'bg-emerald-500/90 hover:bg-emerald-500 text-white border-emerald-200/40 shadow-[0_0_18px_rgba(52,211,153,0.24)] hover:shadow-[0_0_24px_rgba(52,211,153,0.32)]'
                              : 'bg-purple-600/85 hover:bg-purple-600 text-white border-purple-200/15 shadow-[0_0_16px_rgba(168,85,247,0.20)] hover:shadow-[0_0_22px_rgba(168,85,247,0.30)]',
                          ].join(' ')}
                        >
                          {isDone && (
                            <span className="w-4 h-4 rounded-sm border border-emerald-100/60 flex items-center justify-center leading-none drop-shadow-[0_0_8px_rgba(255,255,255,0.25)]">
                              ✓
                            </span>
                          )}
                          <span className={isDone ? 'drop-shadow-[0_0_10px_rgba(255,255,255,0.25)]' : ''}>
                            {isDone ? 'Eu já fiz isso!' : 'Marcar como completo'}
                          </span>
                        </motion.button>

                        {/* LIST */}
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAddToList();
                          }}
                          className={[
                            'w-full py-3 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 border',
                            isInList
                              ? 'bg-emerald-500/90 hover:bg-emerald-500 text-white border-emerald-200/40 shadow-[0_0_18px_rgba(52,211,153,0.22)] hover:shadow-[0_0_24px_rgba(52,211,153,0.30)]'
                              : 'bg-blue-500/85 hover:bg-blue-500 text-white border-blue-200/15 shadow-[0_0_16px_rgba(59,130,246,0.18)] hover:shadow-[0_0_22px_rgba(59,130,246,0.28)]',
                          ].join(' ')}
                        >
                          {isInList && (
                            <span className="w-4 h-4 rounded-sm border border-emerald-100/60 flex items-center justify-center leading-none drop-shadow-[0_0_8px_rgba(255,255,255,0.22)]">
                              <Check size={14} />
                            </span>
                          )}
                          <span className={isInList ? 'drop-shadow-[0_0_10px_rgba(255,255,255,0.22)]' : ''}>
                            {isInList ? 'Isso está na minha lista!' : '+ Adicionar à minha lista'}
                          </span>
                        </motion.button>
                      </div>
                    </div>

                    {/* direita */}
                    <div className="flex flex-col gap-2">
                      {local && (
                        <p className="text-sm text-white/75 flex items-center gap-1">📍 {local}</p>
                      )}

                      <div
                        className="relative rounded-lg overflow-hidden cursor-pointer lightbox-trigger group flex-1"
                        onClick={(e) => {
                          e.stopPropagation();
                          setLightboxOpen(true);
                        }}
                      >
                        {imageUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={imageUrl}
                            alt={title}
                            className="w-full h-full min-h-[260px] md:min-h-[320px] object-cover"
                          />
                        ) : (
                          <div className="w-full h-full min-h-[260px] md:min-h-[320px] bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center">
                            <span className="text-white text-7xl font-bold opacity-30">{id}</span>
                          </div>
                        )}

                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <ZoomIn size={48} className="text-white" />
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </Card>
      </motion.div>
    </>
  );
}
