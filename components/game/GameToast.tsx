// components/game/GameToast.tsx
'use client';

import { motion, AnimatePresence } from 'framer-motion';

export type ToastKind = 'info' | 'warn' | 'success';

export default function GameToast({
  open,
  title,
  description,
  kind = 'info',
  onClose,
}: {
  open: boolean;
  title: string;
  description?: string;
  kind?: ToastKind;
  onClose: () => void;
}) {
  const ring =
    kind === 'warn'
      ? 'ring-2 ring-amber-500/35'
      : kind === 'success'
        ? 'ring-2 ring-emerald-500/30'
        : 'ring-2 ring-purple-500/30';

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          initial={{ opacity: 0, y: 14, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 10, scale: 0.98 }}
          transition={{ duration: 0.18 }}
          className="fixed bottom-4 left-1/2 z-[70] -translate-x-1/2 px-4 w-full max-w-lg"
          role="status"
          aria-live="polite"
          onPointerDown={onClose}
        >
          <div
            className={
              'rounded-2xl border border-white/10 bg-black/50 backdrop-blur-xl px-4 py-3 ' +
              'shadow-[0_10px_30px_rgba(0,0,0,0.45)] ' +
              ring
            }
          >
            <div className="text-sm md:text-base font-semibold text-white">{title}</div>
            {description ? (
              <div className="mt-0.5 text-xs md:text-sm text-white/80">{description}</div>
            ) : null}
            <div className="mt-2 text-[11px] text-white/50">Toque/click para fechar</div>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
