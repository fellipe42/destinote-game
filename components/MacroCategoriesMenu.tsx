'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { parseIntSafe } from '@/lib/filters';
import { addLangToHref, ui } from '@/lib/lang';
import { useLang } from '@/lib/useLang';

type MacroCategoryDTO = {
  id: number;
  namePt?: string | null;
  nameEn?: string | null;
  name?: string | null;
  slug?: string;
  order?: number;
};

const DROPDOWN_EVT = 'destinote:dropdown-open';

function compactMacroLabel(raw: string) {
  const trimmed = raw.trim();
  const cutArrow = trimmed.split('→')[0]?.trim() ?? trimmed;
  const cutSlash = cutArrow.split('/')[0]?.trim() ?? cutArrow;
  return cutSlash.replace(/\s+/g, ' ');
}

export default function MacroCategoriesMenu({
  navBtnBase,
  label,
  icon,
}: {
  navBtnBase: string;
  label?: string;
  icon?: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();

  const { lang } = useLang();
  const resolvedLabel = label ?? (ui(lang, 'categories') as string);

  const [open, setOpen] = useState(false);
  const [macros, setMacros] = useState<MacroCategoryDTO[]>([]);
  const closeTimer = useRef<number | null>(null);

  const dropdownRef = useRef<HTMLDivElement | null>(null);
  const [shiftX, setShiftX] = useState(0);

  const activeMacro = useMemo(() => parseIntSafe(sp.get('macro')), [sp]);

  function announceOpen() {
    window.dispatchEvent(new CustomEvent(DROPDOWN_EVT, { detail: 'macros' }));
  }

  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        const res = await fetch(`/api/macro-categories?lang=${lang}`, { cache: 'no-store' });
        const json = await res.json().catch(() => null);

        const list: MacroCategoryDTO[] = Array.isArray(json)
          ? json
          : (json?.data ?? json?.macroCategories ?? []);

        if (!alive) return;
        setMacros(Array.isArray(list) ? list : []);
      } catch {
        // silencioso
      }
    })();

    return () => {
      alive = false;
    };
  }, [lang]);

  function clearCloseTimer() {
    if (closeTimer.current) {
      window.clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
  }

  function scheduleClose() {
    clearCloseTimer();
    closeTimer.current = window.setTimeout(() => setOpen(false), 320);
  }

  // Se outro dropdown abrir, fecha este imediatamente
  useEffect(() => {
    function onOtherOpen(ev: Event) {
      const who = (ev as CustomEvent).detail;
      if (who && who !== 'macros') {
        clearCloseTimer();
        setOpen(false);
      }
    }

    window.addEventListener(DROPDOWN_EVT, onOtherOpen as EventListener);
    return () => window.removeEventListener(DROPDOWN_EVT, onOtherOpen as EventListener);
  }, []);

  function applyMacro(id: number) {
    const params = new URLSearchParams();

    if (lang) params.set('lang', lang);

    const cats = sp.get('cats');
    if (cats) params.set('cats', cats);

    if (activeMacro !== id) params.set('macro', String(id));

    const q = params.toString();
    const nextUrl = q ? `/?${q}` : '/';

    if (pathname === '/') router.replace(nextUrl, { scroll: false });
    else router.push(nextUrl, { scroll: false });

    setOpen(false);
  }

  function clearMacro() {
    const params = new URLSearchParams();

    if (lang) params.set('lang', lang);

    const cats = sp.get('cats');
    if (cats) params.set('cats', cats);

    const q = params.toString();
    const nextUrl = q ? `/?${q}` : '/';

    if (pathname === '/') router.replace(nextUrl, { scroll: false });
    else router.push(nextUrl, { scroll: false });

    setOpen(false);
  }

  // Clamp no viewport
  useEffect(() => {
    if (!open) {
      setShiftX(0);
      return;
    }

    const raf = window.requestAnimationFrame(() => {
      const el = dropdownRef.current;
      if (!el) return;

      const rect = el.getBoundingClientRect();
      const pad = 12;
      let shift = 0;

      if (rect.left < pad) shift += pad - rect.left;
      if (rect.right > window.innerWidth - pad) {
        shift -= rect.right - (window.innerWidth - pad);
      }

      setShiftX(Math.abs(shift) < 0.5 ? 0 : shift);
    });

    return () => window.cancelAnimationFrame(raf);
  }, [open, macros.length]);

  return (
    <div
      className="relative"
      onMouseEnter={() => {
        clearCloseTimer();
        announceOpen();
        setOpen(true);
      }}
      onMouseLeave={() => scheduleClose()}
    >
      <Link href={addLangToHref('/categorias', lang)} className={navBtnBase}>
        {icon}
        {resolvedLabel}
      </Link>

      {open && (
        <div
          ref={dropdownRef}
          className="
            absolute top-full left-1/2 mt-2
            w-max max-w-[210px]
            rounded-2xl border border-white/15
            bg-black/80 backdrop-blur-2xl
            shadow-2xl shadow-black/50
            overflow-hidden
          "
          style={{ transform: `translateX(calc(-50% + ${shiftX}px))` }}
          onMouseEnter={() => {
            clearCloseTimer();
            announceOpen();
            setOpen(true);
          }}
          onMouseLeave={() => scheduleClose()}
        >
          <div className="min-w-[100px]">
            {macros.map((m) => {
              const raw =
                (
                  (lang === 'en' ? m.nameEn : m.namePt) ??
                  m.name ??
                  m.namePt ??
                  m.nameEn ??
                  ''
                )
                  .toString()
                  .trim() || `Macro ${m.id}`;

              const short = compactMacroLabel(raw);
              const isActive = activeMacro === m.id;

              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => (isActive ? clearMacro() : applyMacro(m.id))}
                  className={[
                    'w-full text-left px-4 py-3 text-sm',
                    'transition-colors',
                    'border-b border-white/10 last:border-b-0',
                    'whitespace-nowrap',
                    isActive
                      ? 'bg-white/15 text-white'
                      : 'text-white/85 hover:bg-white/10 hover:text-white',
                  ].join(' ')}
                  title={raw}
                >
                  <span className="block truncate max-w-[200px]">{short}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
