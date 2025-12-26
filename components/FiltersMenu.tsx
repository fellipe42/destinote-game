'use client';

import { useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

import { parseCsvIntList, toggleIntInList } from '@/lib/filters';
import { ui } from '@/lib/lang';
import { useLang } from '@/lib/useLang';

type CategoryDTO = {
  id: number;
  name?: string | null;
  namePt?: string | null;
  nameEn?: string | null;
  order?: number | null;
};

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null;
}

const DROPDOWN_EVT = 'destinote:dropdown-open';

// Cache simples em memória (evita “piscar” sempre que abrir o menu)
const CAT_CACHE: Partial<Record<'pt' | 'en', CategoryDTO[]>> = {};
const CAT_CACHE_AT: Partial<Record<'pt' | 'en', number>> = {};
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 min

export default function FiltersMenu() {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();
  const { lang } = useLang();

  const [loading, setLoading] = useState(true);
  const [cats, setCats] = useState<CategoryDTO[]>([]);

  const activeCats = useMemo(() => {
    const list = parseCsvIntList(sp.get('cats'));
    return new Set(list);
  }, [sp]);

  useEffect(() => {
    const l = (lang ?? 'pt') as 'pt' | 'en';
    const now = Date.now();
    const cached = CAT_CACHE[l];
    const cachedAt = CAT_CACHE_AT[l] ?? 0;
    const cacheFresh = !!cached && now - cachedAt < CACHE_TTL_MS;

    if (cached && cached.length) {
      setCats(cached);
      setLoading(false);
      if (cacheFresh) return;
    } else {
      setLoading(true);
    }

    const controller = new AbortController();

    async function load() {
      try {
        const res = await fetch(`/api/categories?lang=${l}`, {
          signal: controller.signal,
        });

        const json = await res.json().catch(() => null);

        const raw = Array.isArray(json)
          ? json
          : isRecord(json)
            ? ((json as any).data ?? (json as any).categories ?? (json as any).items ?? null)
            : null;

        const next: CategoryDTO[] = Array.isArray(raw)
          ? raw
              .filter(isRecord)
              .map((c: any) => ({
                id: Number(c.id),
                name: String(c.name ?? c.namePt ?? c.nameEn ?? '').trim(),
                namePt: c.namePt ?? null,
                nameEn: c.nameEn ?? null,
                order: typeof c.order === 'number' ? c.order : null,
              }))
              .filter((c) => Number.isFinite(c.id) && !!c.name)
          : [];

        CAT_CACHE[l] = next;
        CAT_CACHE_AT[l] = Date.now();

        setCats(next);
        setLoading(false);
      } catch (err: any) {
        if (err?.name === 'AbortError') return;
        console.error('[FiltersMenu] erro ao carregar categorias', err);
        setLoading(false);
      }
    }

    load();
    return () => controller.abort();
  }, [lang]);

  const ordered = useMemo(() => {
    return [...cats].sort((a, b) => {
      const ao = typeof a.order === 'number' ? a.order : 9999;
      const bo = typeof b.order === 'number' ? b.order : 9999;
      if (ao !== bo) return ao - bo;
      return a.id - b.id;
    });
  }, [cats]);

  const col1 = ordered.slice(0, 7);
  const col2 = ordered.slice(7, 14);
  const col3 = ordered.slice(14);

  function applyCategoryToggle(id: number) {
    const params = new URLSearchParams(sp.toString());

    if (lang) params.set('lang', lang);

    const macro = sp.get('macro');
    if (macro) params.set('macro', macro);

    const top10 = sp.get('top10');
    if (top10) params.set('top10', top10);

    const current = parseCsvIntList(sp.get('cats'));
    const next = toggleIntInList(current, id);

    if (next.length) params.set('cats', next.join(','));
    else params.delete('cats');

    const q = params.toString();
    const nextUrl = q ? `/?${q}` : '/';

    if (pathname === '/') router.replace(nextUrl, { scroll: false });
    else router.push(nextUrl, { scroll: false });
  }

  function renderColumn(list: CategoryDTO[]) {
    return (
      <div className="min-w-[180px]">
        {list.map((c, idx) => {
          const raw = (c.name ?? '').toString().trim() || `Categoria ${c.id}`;
          const isActive = activeCats.has(c.id);

          return (
            <button
              key={c.id}
              type="button"
              onClick={() => applyCategoryToggle(c.id)}
              className={[
                'w-full text-left px-4 py-3 text-sm',
                'transition-colors',
                idx === list.length - 1 ? 'border-b-0' : 'border-b border-white/10',
                'whitespace-nowrap',
                isActive
                  ? 'bg-white/15 text-white'
                  : 'text-white/85 hover:bg-white/10 hover:text-white',
              ].join(' ')}
              title={raw}
            >
              <span className="block truncate max-w-[220px]">{raw}</span>
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div
      onMouseEnter={() =>
        window.dispatchEvent(new CustomEvent(DROPDOWN_EVT, { detail: 'filters' }))
      }
      className="
  w-max max-w-[640px]
  rounded-2xl border border-white/10
  bg-black/90 supports-[backdrop-filter]:bg-black/70
  backdrop-blur-xl
  shadow-lg shadow-black/40
  overflow-hidden
"
    >
      {loading && ordered.length === 0 ? (
        <div className="px-4 py-3 text-sm text-white/45">
          {ui(lang, 'loadingCategories') as string}
        </div>
      ) : (
        <div className="grid grid-cols-3">
          {renderColumn(col1)}
          {renderColumn(col2)}
          {renderColumn(col3)}
        </div>
      )}
    </div>
  );
}
