'use client';

import { motion, useMotionValue, useTransform, type MotionStyle } from 'framer-motion';
import { X } from 'lucide-react';
import { useMemo, useState } from 'react';

type Category = {
  id: number;
  name: string;
  color?: string | null;
};

type Props = {
  id: number;
  title: string;
  local?: string | null;
  done: boolean;
  category?: Category | null;

  // MERGE: modo export não precisa de ações (a gente vai passar no-op no preview)
  onRemove: (goalId: number) => Promise<void>;
  onRemoved: (goalId: number) => void;
  onToggleDone: (goalId: number, nextDone: boolean) => Promise<void>;

  // MERGE: novo
  variant?: 'interactive' | 'export';
};

function normalizeHex(hex?: string | null) {
  if (!hex) return null;

  const cleaned = hex
    .trim()
    .replace(/^#/, '')
    .replace(/[^0-9a-fA-F]/g, '');

  if (cleaned.length === 3) return cleaned.split('').map((c) => c + c).join('');
  if (cleaned.length >= 6) return cleaned.slice(0, 6);
  return null;
}

export default function MyListCard({
  id,
  title,
  local,
  done,
  category,
  onRemove,
  onRemoved,
  onToggleDone,
  variant = 'interactive',
}: Props) {
  const isExport = variant === 'export';

  const [feedback, setFeedback] = useState<'idle' | 'success' | 'error'>('idle');
  const [busyRemove, setBusyRemove] = useState(false);
  const [busyDone, setBusyDone] = useState(false);

  // levitação fora de sincronia (MERGE: desativada no export)
  const floatDelay = useMemo(() => `${(Math.random() * 1.4).toFixed(2)}s`, []);

  // mouse holo (MERGE: export fica “estático” pq ninguém tá passando mouse lá na esquerda do universo)
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const holoX = useTransform(mouseX, [-120, 120], [-10, 10]);
  const holoY = useTransform(mouseY, [-120, 120], [-10, 10]);

  const clean = normalizeHex(category?.color);

  const rr = clean ? parseInt(clean.slice(0, 2), 16) : NaN;
  const gg = clean ? parseInt(clean.slice(2, 4), 16) : NaN;
  const bb = clean ? parseInt(clean.slice(4, 6), 16) : NaN;

  const r = Number.isFinite(rr) ? rr : 120;
  const g = Number.isFinite(gg) ? gg : 120;
  const b = Number.isFinite(bb) ? bb : 255;

  const neon = useTransform(mouseX, [-120, 0, 120], [0.35, 1, 0.35]);
  const neonBoxShadow = useTransform(neon, (v) => `
    0 0 ${14 + v * 12}px rgba(${r},${g},${b},0.55),
    0 0 ${26 + v * 18}px rgba(${r},${g},${b},0.30)
  `);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isExport) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    mouseX.set(e.clientX - cx);
    mouseY.set(e.clientY - cy);
  };

  const handleMouseLeave = () => {
    if (isExport) return;
    mouseX.set(0);
    mouseY.set(0);
  };

  const handleRemove = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (busyRemove || isExport) return;

    setBusyRemove(true);
    setFeedback('idle');

    try {
      await onRemove(id);
      setFeedback('success');
      setTimeout(() => onRemoved(id), 280);
    } catch {
      setFeedback('error');
      setBusyRemove(false);
    }
  };

  const handleToggleDone = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (busyDone || isExport) return;

    setBusyDone(true);
    try {
      await onToggleDone(id, !done);
    } finally {
      setBusyDone(false);
    }
  };

  return (
    <motion.div
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={[
        'relative group rounded-2xl overflow-hidden border',
        !isExport ? 'destinote-idle-float' : '', // MERGE
      ].join(' ')}
      style={
        {
          animationDelay: !isExport ? floatDelay : undefined,
          borderColor: `rgba(${r},${g},${b},0.30)`,
          backgroundImage: `
            linear-gradient(
              115deg,
              rgba(${r},${g},${b},0.07) 0%,
              rgba(${r},${g},${b},0.14) 55%,
              rgba(${r},${g},${b},0.26) 100%
            )
          `,
          backgroundColor: 'rgba(255,255,255,0.02)',
        } as any
      }
      initial={isExport ? false : { opacity: 0, y: 8 }}
      animate={isExport ? undefined : { opacity: 1, y: 0 }}
      whileHover={isExport ? undefined : { scale: 1.01 }}
      transition={{ duration: 0.2 }}
    >
      {/* neon */}
      <motion.span
        className="absolute inset-0 rounded-[inherit] pointer-events-none"
        style={{ boxShadow: neonBoxShadow } as MotionStyle}
      />

      {/* sheen */}
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
            opacity: isExport ? 0.03 : 0.05,
          } as unknown as MotionStyle
        }
      />

      {/* conteúdo */}
      <div className="relative flex items-center gap-3 px-4 py-3">
        {/* MERGE: no export, some checkbox */}
        {!isExport && (
          <button
            onClick={handleToggleDone}
            disabled={busyDone}
            className={[
              'w-6 h-6 rounded-md border flex items-center justify-center transition-all shrink-0',
              done
                ? 'border-emerald-300 bg-emerald-300/20 text-emerald-200'
                : 'border-white/25 text-white/40 hover:border-white/40 hover:text-white/70',
              busyDone ? 'opacity-60 cursor-wait' : '',
            ].join(' ')}
            aria-label={done ? 'Desmarcar como completo' : 'Marcar como completo'}
            title={done ? 'Desmarcar como completo' : 'Marcar como completo'}
          >
            {done ? '✓' : ''}
          </button>
        )}

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 min-w-0">
            <p
              className={[
                'text-white font-semibold truncate',
                done ? 'opacity-70' : '',
              ].join(' ')}
              title={title}
            >
              {title}
            </p>
            <span className="text-white/40 text-xs">#{id}</span>

            {/* MERGE: badge simples no export */}
            {isExport && done && (
              <span className="ml-1 text-xs text-emerald-200/80">✓</span>
            )}
          </div>

          {local && (
            <p className={['text-white/60 text-sm truncate', done ? 'opacity-60' : ''].join(' ')}>
              📍 {local}
            </p>
          )}

          {!isExport && feedback === 'success' && (
            <p className="text-xs text-emerald-300 mt-1">✓ Removido</p>
          )}
          {!isExport && feedback === 'error' && (
            <p className="text-xs text-red-400 mt-1">✗ Falha ao remover. Tente novamente.</p>
          )}
        </div>

        {/* MERGE: no export, some o botão de remover */}
        {!isExport && (
          <button
            onClick={handleRemove}
            disabled={busyRemove}
            className="w-9 h-9 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-white/70 hover:text-white transition-all disabled:opacity-50 disabled:cursor-wait"
            aria-label="Remover da lista"
            title="Remover da lista"
          >
            <X size={18} />
          </button>
        )}
      </div>

      {/* tracejado no meio quando done */}
      {done && (
        <div className="absolute left-14 right-4 top-1/2 border-t border-dashed border-emerald-300/35 pointer-events-none" />
      )}
    </motion.div>
  );
}
