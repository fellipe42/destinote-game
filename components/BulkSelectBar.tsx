// components/BulkSelectBar.tsx
'use client';

import React, { useEffect, useMemo, useRef } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { CheckCircle2, X, Sparkles } from 'lucide-react';
import { useBulkSelect } from '@/contexts/BulkSelectContext';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

export default function BulkSelectBar() {
  const bulk = useBulkSelect();

  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();

  const constraintsRef = useRef<HTMLDivElement | null>(null);

  // ✅ não deixa o overlay “vazar” pra outras páginas
  useEffect(() => {
    if (pathname !== '/' && bulk.active) {
      bulk.stopBulkMode();
    }
  }, [pathname, bulk]);

  const close = () => {
    bulk.stopBulkMode();

    // remove ?bulk=1 da URL (evita reabrir e evita “2 cliques”)
    const params = new URLSearchParams(sp.toString());
    params.delete('bulk');
    const q = params.toString();
    router.replace(q ? `${pathname}?${q}` : pathname, { scroll: false });
  };

  const selectedCount = bulk.selectedIds.length;

  // ✅ regra antiga: só mostrar (x/limite) quando entrar nos últimos ~30% (>=70%)
  const showLimit = useMemo(() => {
    if (bulk.limit === null) return false;
    const ratio = (bulk.currentCount + selectedCount) / bulk.limit;
    return ratio >= 0.7;
  }, [bulk.limit, bulk.currentCount, selectedCount]);

  // ✅ lógica "nova" (layout SprintA): overLimit + allowedCount
  const { overLimit, allowedCount } = useMemo(() => {
    const allowed = typeof bulk.limit === 'number' ? Math.max(0, bulk.limit) : undefined;
    const totalAfterAdd = bulk.currentCount + selectedCount;
    const over = typeof allowed === 'number' ? totalAfterAdd > allowed : false;
    return { overLimit: over, allowedCount: allowed };
  }, [bulk.limit, bulk.currentCount, selectedCount]);

  if (!bulk.active) return null;

  const totalAfterAdd =
    typeof allowedCount === 'number' ? bulk.currentCount + selectedCount : undefined;

  return (
    <div ref={constraintsRef} className="fixed inset-0 z-[70] pointer-events-none">
      <motion.div
        drag
        dragConstraints={constraintsRef}
        dragMomentum={false}
        className="
          pointer-events-auto
          fixed right-3 top-1/2 -translate-y-1/2
          w-[244px]
          rounded-2xl border border-white/10
          bg-black/55 backdrop-blur-xl
          shadow-[0_12px_40px_rgba(0,0,0,0.45)]
          px-3 py-2
        "
      >
        <div className="flex items-start justify-between gap-2">
          {/* Left: status */}
          <div className="flex items-start gap-2">
            <div className="mt-0.5">
              <CheckCircle2 className="h-4 w-4 text-white/90" />
            </div>

            <div className="leading-tight">
              <div className="text-sm text-white/90 font-semibold">
                {selectedCount} selecionados
                {showLimit && typeof allowedCount === 'number' && (
                  <span className="text-white/60 font-normal">
                    {' '}
                    ({bulk.currentCount + selectedCount}/{allowedCount})
                  </span>
                )}
              </div>

              {typeof allowedCount === 'number' && overLimit && typeof totalAfterAdd === 'number' && (
                <div className="mt-1 text-xs text-amber-200/90">
                  Você excedeu{' '}
                  <span className="font-semibold">{totalAfterAdd - allowedCount}</span>.
                  Remova alguns ou faça upgrade.
                </div>
              )}
            </div>
          </div>

          {/* Drag handle */}
          <div className="text-white/30 cursor-grab select-none leading-none" title="Arrastar">
            ⋮⋮
          </div>
        </div>

        {/* Error (mantém o comportamento antigo) */}
        {bulk.error && (
          <div className="mt-2 text-xs text-red-200/90 bg-red-500/15 border border-red-400/20 rounded-lg p-2">
            {bulk.error}
          </div>
        )}

        {/* Actions */}
        <div className="mt-2 flex items-center gap-2">
          <button
            type="button"
            onClick={close}
            disabled={bulk.isSubmitting}
            className="
              inline-flex items-center justify-center gap-2
              rounded-xl border border-white/10 bg-white/5
              px-3 py-2 text-sm text-white/90
              hover:bg-white/10 active:scale-[0.99]
              disabled:opacity-50 disabled:hover:bg-white/5
            "
            title="Limpar seleção"
          >
            <X className="h-4 w-4" />
            Limpar
          </button>

          {overLimit ? (
            <Link
              href="/perfil"
              className="
                flex-1 inline-flex items-center justify-center gap-2
                rounded-xl border border-white/10 bg-white/10
                px-3 py-2 text-sm text-white/95
                hover:bg-white/15 active:scale-[0.99]
              "
              title="Ver planos"
            >
              <Sparkles className="h-4 w-4" />
              Upgrade
            </Link>
          ) : (
            <button
              type="button"
              onClick={() => bulk.submitAddSelected()}
              disabled={bulk.isSubmitting || selectedCount === 0}
              className="
                flex-1 inline-flex items-center justify-center gap-2
                rounded-xl border border-white/10 bg-white/10
                px-3 py-2 text-sm text-white/95
                hover:bg-white/15 active:scale-[0.99]
                disabled:opacity-50 disabled:hover:bg-white/10
              "
              title="Adicionar selecionados"
            >
              <CheckCircle2 className="h-4 w-4" />
              {bulk.isSubmitting ? 'Adicionando…' : 'Adicionar'}
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
}
