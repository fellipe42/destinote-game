'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useMemo } from 'react';
import { Undo2, X } from 'lucide-react';

import { cn } from '@/lib/utils';

// ✅ FIX (25/12):
// - MyListClient usa <UndoToast undo={UndoPayload|null} onUndo onDismiss />
// - Mantém a MESMA UI (motion + barra) e corrige props.

export type UndoGoalDTO = {
  id: number;
  title: string;
  local?: string | null;
  done: boolean;
  category?: { id: number; name: string; color?: string | null } | null;
};

export type UndoListItemDTO = {
  id: string | number;
  text: string;
  done: boolean;
  order: number;
};

export type UndoPayload =
  | { label: string; payload: { kind: 'goals'; items: UndoGoalDTO[] } }
  | { label: string; payload: { kind: 'items'; listId: string | number; items: UndoListItemDTO[] } };

type Props = {
  undo: UndoPayload | null;
  onUndo: () => void;
  onDismiss: () => void;
  ttlMs?: number;
};

export default function UndoToast({ undo, onUndo, onDismiss, ttlMs = 6500 }: Props) {
  const open = !!undo;
  const message = useMemo(() => undo?.label ?? '', [undo]);

  useEffect(() => {
    if (!open) return;
    const t = window.setTimeout(() => onDismiss(), ttlMs);
    return () => window.clearTimeout(t);
  }, [open, ttlMs, onDismiss]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0, y: 14, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 14, scale: 0.98 }}
          transition={{ duration: 0.18 }}
          className="fixed left-0 right-0 bottom-4 z-[70] px-3"
        >
          <div className={cn('mx-auto max-w-3xl rounded-2xl border border-white/10', 'bg-black/70 backdrop-blur-xl shadow-2xl overflow-hidden')}>
            <div className="px-4 py-3 flex items-center justify-between gap-3">
              <div className="text-sm text-white/90 truncate">{message}</div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onUndo}
                  className={cn(
                    'inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold',
                    'bg-white/10 text-white hover:bg-white/15 transition',
                    'focus:outline-none focus-visible:ring-2 focus-visible:ring-white/20',
                  )}
                >
                  <Undo2 className="h-4 w-4" />
                  Desfazer
                </button>

                <button
                  type="button"
                  onClick={onDismiss}
                  className={cn(
                    'inline-flex items-center justify-center rounded-xl px-3 py-2',
                    'bg-white/5 text-white/80 hover:bg-white/10 transition',
                    'focus:outline-none focus-visible:ring-2 focus-visible:ring-white/20',
                  )}
                  aria-label="Fechar"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            <motion.div
              initial={{ width: '100%' }}
              animate={{ width: '0%' }}
              transition={{ duration: ttlMs / 1000, ease: 'linear' }}
              className="h-1 bg-white/20"
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
