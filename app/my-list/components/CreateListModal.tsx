'use client';

import Image from 'next/image';
import { useEffect, useMemo, useState } from 'react';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

import { LIST_TEMPLATES } from '../listTemplates';

// ✅ FIX (25/12):
// - MyListClient chama <CreateListModal open onClose onCreate(name, templateId?) />.
// - A versão anterior exigia onOpenChange e onCreate({title, templateId}),
//   causando erro de TypeScript e impedindo o modal de funcionar.

type Props = {
  open: boolean;
  onClose?: () => void;
  onOpenChange?: (open: boolean) => void;
  onCreate: (name: string, templateId?: string | null) => Promise<void> | void;
};

export default function CreateListModal({ open, onClose, onOpenChange, onCreate }: Props) {
  const templates = useMemo(() => LIST_TEMPLATES, []);
  const [templateId, setTemplateId] = useState<string>(templates[0]?.id ?? 'weekly');

  const selected = useMemo(
    () => templates.find((t) => t.id === templateId) ?? templates[0],
    [templateId, templates],
  );

  const [title, setTitle] = useState<string>(selected?.defaultTitle ?? 'Minha lista');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;

    setTitle((prev) => {
      const p = prev.trim();
      const anyTemplateTitle = templates.some((t) => t.defaultTitle === p);
      if (p.length === 0 || anyTemplateTitle) return selected?.defaultTitle ?? 'Minha lista';
      return prev;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, templateId]);

  const close = () => {
    if (onOpenChange) onOpenChange(false);
    if (onClose) onClose();
  };

  const handleCreate = async () => {
    if (submitting) return;
    const name = title.trim();
    if (!name) return;

    setSubmitting(true);
    try {
      await onCreate(name, templateId ?? null);
      close();
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenChange = (v: boolean) => {
    if (onOpenChange) onOpenChange(v);
    if (!v && onClose) onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-none w-[min(980px,calc(100vw-24px))] p-0 overflow-hidden border-white/10 bg-black/70 backdrop-blur-xl">
        <div className="p-6">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <span>Criar lista</span>
              <span className="text-xs text-white/50 font-normal">— templates + reset automático</span>
            </DialogTitle>
            <DialogDescription className="text-white/60">
              Escolha um template e personalize o nome. Você pode editar depois.
            </DialogDescription>
          </DialogHeader>

          <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div className="text-sm text-white/70 mb-2">Template</div>

              <div className="grid grid-cols-2 gap-3">
                {templates.map((t) => {
                  const active = t.id === templateId;
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setTemplateId(t.id)}
                      className={cn(
                        'rounded-3xl border overflow-hidden text-left transition',
                        active ? 'border-purple-300/35 bg-white/10' : 'border-white/10 bg-white/5 hover:bg-white/10',
                      )}
                    >
                      <div className="relative h-20 w-full">
                        <Image
                          src={t.previewSrc}
                          alt={t.label}
                          fill
                          className="object-cover opacity-90"
                          draggable={false}
                        />
                        <div className="absolute inset-0 bg-gradient-to-b from-black/0 via-black/20 to-black/65" />
                        <div className="absolute bottom-2 left-3 right-3">
                          <div className="text-white text-sm font-semibold">{t.label}</div>
                          <div className="text-white/70 text-xs line-clamp-1">{t.description}</div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>

              <Card className="mt-3 border-white/10 bg-black/20">
                <CardContent className="p-4">
                  <div className="text-white font-semibold">{selected?.label}</div>
                  <div className="text-white/60 text-sm mt-1">{selected?.description}</div>
                  <div className="mt-3 text-xs text-white/55">
                    Dica: você pode definir “limpeza de checks” depois (semanal, diária, etc.).
                  </div>
                </CardContent>
              </Card>
            </div>

            <div>
              <div className="text-sm text-white/70 mb-2">Nome da lista</div>

              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex: Minha lista semanal"
                className={cn(
                  'w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none',
                  'focus:ring-2 focus:ring-white/20',
                )}
              />

              <div className="mt-4 text-xs text-white/55">
                Essa lista é sua. Ela não precisa ser perfeita. Só precisa existir.
              </div>

              <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-4 text-white/70 text-sm">
                <div className="font-semibold text-white/90 mb-1">Preview</div>
                <div className="text-white/65">
                  <span className="text-white font-semibold">{title.trim() || 'Minha lista'}</span>
                  <span className="text-white/40"> — </span>
                  <span className="text-white/60">{selected?.label ?? 'Template'}</span>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="mt-6">
            <Button variant="secondary" onClick={close} disabled={submitting}>
              Cancelar
            </Button>
            <Button onClick={handleCreate} disabled={submitting || !title.trim()}>
              {submitting ? 'Criando…' : 'Criar lista'}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
