'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Share2, FileText, Image as ImageIcon, FileImage } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { exportToImage } from '@/lib/export/exportToImage';
import { exportElementToPDF } from '@/lib/export/exportElementToPDF';

type ExportFormat = 'png' | 'jpg' | 'pdf';

type Props = {
  captureElementId: string;
  fileBaseName: string;
  onBeforeExport?: () => void;
  onAfterExport?: (result: { success: boolean; fileName?: string; error?: string }) => void;
};

export default function PostarButton({
  captureElementId,
  fileBaseName,
  onBeforeExport,
  onAfterExport,
}: Props) {
  const [open, setOpen] = useState(false);
  const [hovering, setHovering] = useState(false);
  const [busy, setBusy] = useState(false);

  const closeTimer = useRef<number | null>(null);
  const rootRef = useRef<HTMLDivElement | null>(null);

  const autoCloseMs = 6500;

  const options = useMemo(
    () =>
      [
        { id: 'png' as const, label: 'PNG', icon: FileImage },
        { id: 'jpg' as const, label: 'JPG', icon: ImageIcon },
        { id: 'pdf' as const, label: 'PDF', icon: FileText },
      ],
    [],
  );

  const scheduleAutoClose = () => {
    if (closeTimer.current) window.clearTimeout(closeTimer.current);
    closeTimer.current = window.setTimeout(() => setOpen(false), autoCloseMs);
  };

  useEffect(() => {
    if (!open) return;
    scheduleAutoClose();
    return () => {
      if (closeTimer.current) window.clearTimeout(closeTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (!open) return;
      const el = rootRef.current;
      if (!el) return;
      if (el.contains(e.target as Node)) return;
      setOpen(false);
    };
    window.addEventListener('mousedown', onDown);
    return () => window.removeEventListener('mousedown', onDown);
  }, [open]);

  const handleExport = async (format: ExportFormat) => {
    if (busy) return;

    try {
      setBusy(true);
      onBeforeExport?.();
      scheduleAutoClose();

      if (format === 'png' || format === 'jpg') {
        const result = await exportToImage(captureElementId, format, fileBaseName);
        onAfterExport?.(result);
      } else {
        const result = await exportElementToPDF(captureElementId, fileBaseName, {
          scale: 2,
          backgroundColor: '#ffffff',
        });
        onAfterExport?.(result);
      }

      window.setTimeout(() => setOpen(false), 250);
    } catch (e) {
      onAfterExport?.({ success: false, error: String(e) });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      ref={rootRef}
      className="relative"
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
    >
      <Button
        variant="secondary"
        className={cn(
          'w-full justify-start rounded-2xl border border-white/10 bg-black/25 text-white/85',
          'hover:bg-white/10 hover:text-white',
        )}
        onClick={() => setOpen((v) => !v)}
      >
        <Share2 className="h-4 w-4 mr-2" />
        Postar
      </Button>

      {/* Hover preview (não clicado) */}
      <AnimatePresence>
        {hovering && !open && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 6 }}
            transition={{ duration: 0.12 }}
            className="pointer-events-none absolute left-1/2 -translate-x-1/2 top-full mt-2 z-30"
          >
            <div className="rounded-2xl border border-white/10 bg-black/60 backdrop-blur-xl px-3 py-2 shadow-lg shadow-black/40">
              <div className="flex items-center gap-3 text-xs text-white/80">
                <span className="inline-flex items-center gap-1">
                  <FileImage className="h-4 w-4" /> PNG
                </span>
                <span className="inline-flex items-center gap-1">
                  <ImageIcon className="h-4 w-4" /> JPG
                </span>
                <span className="inline-flex items-center gap-1">
                  <FileText className="h-4 w-4" /> PDF
                </span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Drawer lateral ao clicar */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 12 }}
            transition={{ duration: 0.16 }}
            className={cn(
              'absolute left-full top-0 ml-2 z-40',
              'rounded-2xl border border-white/10 bg-black/70 backdrop-blur-xl',
              'shadow-lg shadow-black/40 p-2',
            )}
            onMouseEnter={() => scheduleAutoClose()}
          >
            <div className="flex items-center gap-2">
              {options.map((o) => {
                const Icon = o.icon;
                return (
                  <button
                    key={o.id}
                    type="button"
                    disabled={busy}
                    onClick={() => handleExport(o.id)}
                    className={cn(
                      'inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold',
                      'border border-white/10 bg-white/5 text-white/85',
                      'hover:bg-white/10 hover:text-white transition-all',
                      'disabled:opacity-60 disabled:pointer-events-none',
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {o.label}
                  </button>
                );
              })}
            </div>

            <div className="mt-2 text-[11px] text-white/50">Fecha sozinho em alguns segundos.</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
