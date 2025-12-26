'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Share2, FileText, Image as ImageIcon, FileImage } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { exportToImage } from '@/lib/export/exportToImage';

type ExportFormat = 'png' | 'jpg' | 'pdf';

type Props = {
  /** DOM element id used for capture (html2canvas) */
  captureElementId: string;
  /** Base filename without extension */
  fileBaseName: string;

  /** Optional callback before export starts (useful to force preview re-render) */
  onBeforeExport?: () => void;
};

export default function ExportControlsV2({
  captureElementId,
  fileBaseName,
  onBeforeExport,
}: Props) {
  const [open, setOpen] = useState(false);
  const [hover, setHover] = useState(false);
  const [busy, setBusy] = useState<ExportFormat | null>(null);
  const timerRef = useRef<number | null>(null);

  const formats = useMemo(
    () =>
      [
        { id: 'png' as const, label: 'PNG', icon: ImageIcon },
        { id: 'jpg' as const, label: 'JPG', icon: FileImage },
        { id: 'pdf' as const, label: 'PDF', icon: FileText },
      ] as const,
    [],
  );

  function clearTimer() {
    if (timerRef.current) window.clearTimeout(timerRef.current);
    timerRef.current = null;
  }

  function armAutoClose(ms = 5500) {
    clearTimer();
    timerRef.current = window.setTimeout(() => setOpen(false), ms);
  }

  useEffect(() => {
    if (open) armAutoClose();
    return clearTimer;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    function onDocDown(ev: MouseEvent) {
      const target = ev.target as HTMLElement | null;
      if (!target) return;
      if (target.closest('[data-export-controls-v2]')) return;
      setOpen(false);
    }
    document.addEventListener('mousedown', onDocDown);
    return () => document.removeEventListener('mousedown', onDocDown);
  }, []);

  async function exportPdfFromElement() {
    const el = document.getElementById(captureElementId);
    if (!el) throw new Error(`Elemento não encontrado: #${captureElementId}`);

    // html2canvas already used by exportToImage; we import it dynamically here
    const [{ default: html2canvas }, jspdfMod] = await Promise.all([
      import('html2canvas'),
      import('jspdf'),
    ]);

    const canvas = await html2canvas(el as HTMLElement, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#ffffff',
    });

    const imgData = canvas.toDataURL('image/png');
    const { jsPDF } = jspdfMod as any;

    const w = canvas.width;
    const h = canvas.height;
    const orientation = w >= h ? 'landscape' : 'portrait';

    // Use pixel units to preserve the capture faithfully
    const pdf = new jsPDF({
      orientation,
      unit: 'px',
      format: [w, h],
    });

    pdf.addImage(imgData, 'PNG', 0, 0, w, h, undefined, 'FAST');
    pdf.save(`${fileBaseName}.pdf`);
  }

  async function handleExport(fmt: ExportFormat) {
    if (busy) return;
    setBusy(fmt);
    try {
      onBeforeExport?.();

      if (fmt === 'pdf') {
        await exportPdfFromElement();
      } else {
        await exportToImage(captureElementId, fmt, fileBaseName);
      }

      // Close quickly after success (feels snappy)
      setOpen(false);
      setHover(false);
    } catch (e) {
      console.error(e);
      // Keep open so user can try again
    } finally {
      setBusy(null);
    }
  }

  return (
    <div
      data-export-controls-v2
      className="relative"
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      <Button
        onClick={() => setOpen((v) => !v)}
        className={cn(
          'w-full justify-between rounded-xl',
          'bg-white/10 hover:bg-white/15 text-white border border-white/10',
          'shadow-lg shadow-black/30',
        )}
      >
        <span className="inline-flex items-center gap-2">
          <Share2 className="h-4 w-4" />
          Postar
        </span>
        <span className="text-xs text-white/60">
          {busy ? 'Exportando…' : hover ? 'PNG / JPG / PDF' : ''}
        </span>
      </Button>

      {/* hover hint row (tiny) */}
      <AnimatePresence>
        {!open && hover && (
          <motion.div
            initial={{ opacity: 0, y: -2 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -2 }}
            className="absolute left-0 right-0 mt-2 grid grid-cols-3 gap-2"
          >
            {formats.map((f) => (
              <div
                key={f.id}
                className="rounded-xl border border-white/10 bg-black/40 px-2 py-1 text-center text-[11px] text-white/70"
              >
                {f.label}
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* side drawer */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, x: -6 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -6 }}
            transition={{ duration: 0.16 }}
            className={cn(
              'absolute top-0 left-[calc(100%+10px)] z-50',
              'rounded-2xl border border-white/10 bg-black/70 backdrop-blur-xl shadow-xl shadow-black/40',
              'p-2 w-[220px]',
            )}
            onMouseEnter={() => armAutoClose(8000)}
            onMouseMove={() => armAutoClose(8000)}
          >
            <div className="px-2 pt-1 pb-2 text-xs text-white/60">
              Export rápido (auto-fecha em alguns segundos)
            </div>

            <div className="grid gap-2">
              {formats.map((f) => {
                const Icon = f.icon;
                const isBusy = busy === f.id;
                return (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => handleExport(f.id)}
                    disabled={!!busy}
                    className={cn(
                      'flex items-center justify-between rounded-xl border px-3 py-2 text-sm font-semibold transition-all',
                      'border-white/10 bg-white/5 hover:bg-white/10 text-white',
                      busy && !isBusy && 'opacity-50 cursor-not-allowed',
                    )}
                  >
                    <span className="inline-flex items-center gap-2">
                      <Icon className="h-4 w-4" />
                      {f.label}
                    </span>
                    <span className="text-xs text-white/60">
                      {isBusy ? '…' : '→'}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="mt-2 px-2 pb-1 text-[11px] text-white/45">
              Dica: pra PNG transparente, liga “Transparente” em Personalizar.
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
