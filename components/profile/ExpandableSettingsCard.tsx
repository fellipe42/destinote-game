// components/profile/ExpandableSettingsCard.tsx
'use client';

import { motion } from 'framer-motion';
import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { X } from 'lucide-react';

type Props = {
  id: string;
  title: string;
  subtitle?: string;
  Icon: LucideIcon;
  isOpen: boolean;
  onOpen: () => void;
  onClose: () => void;
  children: ReactNode;
};

export default function ExpandableSettingsCard({
  title,
  subtitle,
  Icon,
  isOpen,
  onOpen,
  onClose,
  children,
}: Props) {
  return (
    <motion.div
      layout
      transition={{ duration: 0.25, ease: 'easeInOut' }}
      className={[
        'rounded-2xl border border-white/10 backdrop-blur-sm',
        'shadow-lg shadow-black/25',
        isOpen ? 'bg-black/35 md:col-span-3' : 'bg-black/20',
      ].join(' ')}
    >
      <button
        type="button"
        onClick={() => (isOpen ? undefined : onOpen())}
        className={[
          'w-full text-left p-6',
          isOpen ? 'cursor-default' : 'hover:bg-white/5 transition-colors rounded-2xl',
        ].join(' ')}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Icon size={20} />
              {title}
            </h3>
            {subtitle ? <p className="text-white/60 text-sm mt-1">{subtitle}</p> : null}
          </div>

          {isOpen ? (
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onClose();
              }}
              className="shrink-0 rounded-xl border border-white/10 bg-black/20 hover:bg-black/30 text-white/80 p-2 transition-colors"
              aria-label="Fechar"
            >
              <X size={18} />
            </button>
          ) : (
            <span className="text-white/40 text-xs mt-1">Editar</span>
          )}
        </div>
      </button>

      {isOpen ? (
        <motion.div
          layout
          transition={{ duration: 0.25, ease: 'easeInOut' }}
          className="px-6 pb-6"
        >
          <div className="h-px bg-white/10 mb-5" />
          {children}
        </motion.div>
      ) : null}
    </motion.div>
  );
}
