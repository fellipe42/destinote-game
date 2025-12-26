'use client';

import React from 'react';
import { ui } from '@/lib/lang';
import { useLang } from '@/lib/useLang';

export type ActiveFilterChip = {
  key: string;
  label: string;
  onRemove?: () => void;
};

export type ActiveFiltersBarProps = {
  title?: string;
  chips: ActiveFilterChip[];
  onClearAll?: () => void;
  leftSlot?: React.ReactNode;

  /**
   * Slot opcional à direita (ex.: botão "Top ▲▼" para abrir/fechar Top10).
   * Retrocompatível: quem já usa o componente não precisa mudar nada.
   */
  rightSlot?: React.ReactNode;

  /**
   * Classes extras aplicadas no wrapper externo (fixed bottom).
   * Use para ajustar margem, z-index, etc.
   */
  className?: string;
};

export default function ActiveFiltersBar({
  title,
  chips,
  onClearAll,
  leftSlot,
  rightSlot,
  className,
}: ActiveFiltersBarProps) {
  const { lang } = useLang();
  const resolvedTitle = title ?? (ui(lang, 'activeFilters') as string);
  if (!chips?.length) return null;

  return (
    <div
      className={[
        // "Navbar" inferior
        'fixed bottom-0 inset-x-0 z-[55]',
        // mesmo padding do container da Navbar
        'px-3 md:px-6 py-3',
        // evita capturar cliques fora da barra
        'pointer-events-none',
        className ?? '',
      ].join(' ')}
      role="region"
      aria-label={resolvedTitle}
    >
      <div className="max-w-6xl mx-auto pointer-events-auto isolate">
        <div
          className="
            rounded-2xl border border-white/10
            bg-black/40 backdrop-blur-xl
            shadow-lg shadow-black/30
          "
        >
          <div className="flex flex-wrap items-center gap-2 px-4 md:px-6 py-3">
            <div className="text-xs text-white/65 mr-1">{resolvedTitle}</div>

            {leftSlot}

            {chips.map((c) => (
              <span
                key={c.key}
                className="
                  inline-flex items-center gap-2
                  px-3 py-1.5 rounded-full
                  border border-white/15 bg-white/5
                  text-white/85 text-xs
                "
              >
                {c.label}
                {c.onRemove && (
                  <button
                    type="button"
                    onClick={c.onRemove}
                    className="text-white/60 hover:text-white transition-colors"
                    aria-label={ui(lang, 'removeFilter') as string}
                    title={ui(lang, 'removeFilter') as string}
                  >
                    ✕
                  </button>
                )}
              </span>
            ))}

            <div className="flex-1" />

            {rightSlot}

            {onClearAll && (
              <button
                type="button"
                onClick={onClearAll}
                className="text-xs text-white/70 hover:text-white underline underline-offset-4"
              >
                {ui(lang, 'clearFilters') as string}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
