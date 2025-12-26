//app/my-list/components/BulkActionBar.tsx
'use client';

import { Trash2, X, CheckCircle2 } from 'lucide-react';

export default function BulkActionsBar({
  count,
  label,
  onClear,
  onRemove,
  onMarkDone,
}: {
  count: number;
  label: string;
  onClear: () => void;
  onRemove: () => void;
  onMarkDone?: () => void;
}) {
  if (count <= 0) return null;

  return (
    <div className="fixed left-0 right-0 bottom-4 z-[60] px-3">
      <div className="mx-auto max-w-3xl rounded-2xl border border-white/10 bg-black/70 backdrop-blur-xl shadow-2xl px-4 py-3 flex items-center justify-between gap-3">
        <div className="text-sm text-white/90">
          <span className="font-semibold">{count}</span> selecionado(s) — {label}
        </div>

        <div className="flex items-center gap-2">
          {onMarkDone ? (
            <button
              onClick={onMarkDone}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-emerald-500/20 border border-emerald-300/25 text-emerald-100 hover:bg-emerald-500/25 transition"
            >
              <CheckCircle2 size={16} />
              Marcar feito
            </button>
          ) : null}

          <button
            onClick={onRemove}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-red-500/15 border border-red-300/20 text-red-100 hover:bg-red-500/20 transition"
          >
            <Trash2 size={16} />
            Remover
          </button>

          <button
            onClick={onClear}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-white/10 border border-white/10 text-white/90 hover:bg-white/15 transition"
          >
            <X size={16} />
            Sair
          </button>
        </div>
      </div>
    </div>
  );
}
