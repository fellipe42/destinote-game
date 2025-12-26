'use client';

import { useMemo, useState } from 'react';
import { FileText, Image as ImageIcon, Loader2 } from 'lucide-react';
import { exportToPDF } from '@/lib/export/exportToPDF';
import { exportToImage } from '@/lib/export/exportToImage';


type Goal = {
  id: number;
  title: string;
  local?: string | null;
  category?: { name: string } | null;
};

type ExportStoryResult =
  | { success: true; count: number }
  | { success: false; error: string };

type Props = {
  goals: Goal[];
  customTitle: string;
  compact?: boolean;
  onExportStory?: (format: 'png' | 'jpg') => Promise<ExportStoryResult>;
};

function safeBaseName(input: string) {
  const raw = (input || 'Minha Lista')
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

  const cleaned = raw
    .replace(/[^a-zA-Z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 60);

  return cleaned || 'Minha_Lista';
}

export default function ExportControls({ goals, customTitle }: Props) {
  const [isExporting, setIsExporting] = useState<null | 'pdf' | 'png' | 'jpg'>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const baseName = useMemo(() => safeBaseName(customTitle), [customTitle]);

  const handlePDF = async () => {
    if (!goals.length) {
      setFeedback({ type: 'error', message: 'Adicione pelo menos 1 objetivo antes de exportar.' });
      return;
    }

    setIsExporting('pdf');
    setFeedback(null);

    try {
      const result = await exportToPDF(goals, customTitle);
      if (result.success) setFeedback({ type: 'success', message: `PDF "${result.fileName}" baixado!` });
      else setFeedback({ type: 'error', message: 'Erro ao gerar PDF. Tente novamente.' });
    } catch {
      setFeedback({ type: 'error', message: 'Erro inesperado ao exportar PDF.' });
    } finally {
      setIsExporting(null);
    }
  };

  const handleImage = async (format: 'png' | 'jpg') => {
    if (!goals.length) {
      setFeedback({ type: 'error', message: 'Adicione pelo menos 1 objetivo antes de exportar.' });
      return;
    }

    setIsExporting(format);
    setFeedback(null);

    try {
      const fileBase = `${baseName}_${Date.now()}`;
      const result = await exportToImage('export-preview', format, fileBase);

      if (result.success) setFeedback({ type: 'success', message: `Imagem "${result.fileName}" baixada!` });
      else setFeedback({ type: 'error', message: 'Erro ao gerar imagem. Tente novamente.' });
    } catch {
      setFeedback({ type: 'error', message: 'Erro inesperado ao exportar imagem.' });
    } finally {
      setIsExporting(null);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        <button
          onClick={handlePDF}
          disabled={isExporting !== null}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/10 hover:bg-white/15 border border-white/10 text-white text-sm disabled:opacity-60 disabled:cursor-wait"
        >
          {isExporting === 'pdf' ? <Loader2 className="animate-spin" size={16} /> : <FileText size={16} />}
          PDF
        </button>

        <button
          onClick={() => handleImage('png')}
          disabled={isExporting !== null}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/10 hover:bg-white/15 border border-white/10 text-white text-sm disabled:opacity-60 disabled:cursor-wait"
        >
          {isExporting === 'png' ? <Loader2 className="animate-spin" size={16} /> : <ImageIcon size={16} />}
          PNG (Story)
        </button>

        <button
          onClick={() => handleImage('jpg')}
          disabled={isExporting !== null}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/10 hover:bg-white/15 border border-white/10 text-white text-sm disabled:opacity-60 disabled:cursor-wait"
        >
          {isExporting === 'jpg' ? <Loader2 className="animate-spin" size={16} /> : <ImageIcon size={16} />}
          JPG (Story)
        </button>
      </div>

      {feedback && (
        <p className={feedback.type === 'success' ? 'text-emerald-300 text-sm' : 'text-red-300 text-sm'}>
          {feedback.message}
        </p>
      )}

      <p className="text-xs text-white/50">
        A imagem sai no formato Story (9:16) usando o preview invisível (sem botões/ações).
      </p>
    </div>
  );
}
