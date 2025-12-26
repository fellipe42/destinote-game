'use client';

import Image from 'next/image';
import { type ReactNode, useMemo } from 'react';
import { SlidersHorizontal, Sparkles, Sunrise, PartyPopper, CircleDot, Globe2 } from 'lucide-react';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { BACKGROUNDS, GLOBES } from '@/lib/personalization/catalog';

import type {
  AppearancePreset,
  ExportAppearance,
  ExportDensity,
  ExportFormat,
  ExportLayout,
} from './ExportPreview';

// ✅ FIX (25/12): compat com ExportPreview + MyListClient.

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function Segmented<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T;
  onChange: (v: T) => void;
  options: Array<{ value: T; label: string }>;
}) {
  return (
    <div className="inline-flex rounded-2xl border border-white/10 bg-white/5 overflow-hidden">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          className={cn(
            'px-3 py-2 text-sm transition',
            value === o.value ? 'bg-white/10 text-white' : 'text-white/70 hover:text-white',
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

function Section({ title, children, hint }: { title: string; hint?: string; children: ReactNode }) {
  return (
    <Card className="border-white/10 bg-black/20">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-white font-semibold">{title}</div>
            {hint && <div className="text-xs text-white/55 mt-1">{hint}</div>}
          </div>
        </div>
        <div className="mt-4">{children}</div>
      </CardContent>
    </Card>
  );
}

function presetMeta(p: AppearancePreset) {
  switch (p) {
    case 'neon':
      return { label: 'Neon', icon: Sparkles };
    case 'minimal':
      return { label: 'Minimal', icon: CircleDot };
    case 'morning':
      return { label: 'Manhã', icon: Sunrise };
    case 'newyear':
      return { label: 'Ano Novo', icon: PartyPopper };
    default:
      return { label: String(p), icon: Sparkles };
  }
}

type Props = {
  open: boolean;
  onClose: () => void;
  appearance: ExportAppearance;
  onChange: (next: ExportAppearance) => void;
};

export default function PersonalizeDrawer({ open, onClose, appearance, onChange }: Props) {
  const presetOptions = useMemo(
    () =>
      (['neon', 'minimal', 'morning', 'newyear'] as AppearancePreset[]).map((p) => {
        const meta = presetMeta(p);
        return { value: p, label: meta.label, Icon: meta.icon };
      }),
    [],
  );

  const handleOpenChange = (v: boolean) => {
    if (!v) onClose();
  };

  const set = (patch: Partial<ExportAppearance>) => {
    onChange({ ...appearance, ...patch });
  };

  const bgMode: 'image' | 'solid' = appearance.backgroundId ? 'image' : 'solid';

  const setBgMode = (m: 'image' | 'solid') => {
    if (m === 'image') {
      set({ backgroundId: appearance.backgroundId ?? BACKGROUNDS[0]?.id ?? null, solidBg: null });
    } else {
      set({ backgroundId: null, solidBg: appearance.solidBg ?? '#0b0b10' });
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className={cn('max-w-none w-[min(980px,calc(100vw-24px))] p-0 border-white/10 bg-black/70 backdrop-blur-xl', 'sm:rounded-2xl')}>
        <div className="p-5 border-b border-white/10">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <SlidersHorizontal className="h-5 w-5" />
              Personalizar
            </DialogTitle>
          </DialogHeader>
        </div>

        <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
          <Section title="Preset" hint="A vibe geral do export (cards, brilho, etc.)">
            <div className="grid grid-cols-2 gap-3">
              {presetOptions.map((p) => {
                const active = appearance.preset === p.value;
                return (
                  <button
                    key={p.value}
                    type="button"
                    onClick={() => set({ preset: p.value })}
                    className={cn(
                      'rounded-2xl border border-white/10 bg-white/5 px-3 py-3',
                      'flex items-center gap-3 text-left transition',
                      active ? 'ring-2 ring-white/20 bg-white/10' : 'hover:bg-white/10',
                    )}
                  >
                    <div className="h-10 w-10 rounded-2xl bg-white/10 flex items-center justify-center">
                      <p.Icon className="h-5 w-5 text-white/90" />
                    </div>
                    <div>
                      <div className="text-white font-semibold">{p.label}</div>
                      <div className="text-xs text-white/55">Aplicar</div>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="mt-4 flex items-center justify-between gap-3">
              <div className="text-sm text-white/80">Fundo transparente</div>
              <button
                type="button"
                onClick={() => set({ transparent: !appearance.transparent })}
                className={cn('h-9 w-14 rounded-full border border-white/10 bg-white/5 p-1 transition', appearance.transparent ? 'bg-white/10' : '')}
              >
                <div className={cn('h-7 w-7 rounded-full bg-white/80 transition translate-x-0', appearance.transparent ? 'translate-x-5' : '')} />
              </button>
            </div>
          </Section>

          <Section title="Fundo" hint="Imagem do catálogo ou cor sólida">
            <div className="flex items-center justify-between gap-3">
              <div className="text-sm text-white/80">Modo</div>
              <Segmented value={bgMode} onChange={(v) => setBgMode(v)} options={[{ value: 'image', label: 'Imagem' }, { value: 'solid', label: 'Cor' }]} />
            </div>

            {bgMode === 'image' ? (
              <div className="mt-3 grid grid-cols-3 gap-2">
                {BACKGROUNDS.slice(0, 9).map((bg) => {
                  const active = appearance.backgroundId === bg.id;
                  return (
                    <button
                      key={bg.id}
                      type="button"
                      onClick={() => set({ backgroundId: bg.id })}
                      className={cn('relative rounded-2xl overflow-hidden border border-white/10', active ? 'ring-2 ring-white/20' : 'hover:ring-2 hover:ring-white/10')}
                      title={bg.label}
                    >
                      <div className="relative h-20 w-full">
                        <Image src={bg.src} alt={bg.label} fill className="object-cover" />
                        <div className="absolute inset-0 bg-gradient-to-b from-black/0 via-black/0 to-black/55" />
                        <div className="absolute bottom-2 left-2 right-2 text-[11px] text-white/85 truncate">{bg.label}</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="mt-3 flex items-center justify-between gap-3">
                <div className="text-sm text-white/80">Cor</div>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={appearance.solidBg ?? '#0b0b10'}
                    onChange={(e) => set({ solidBg: e.target.value })}
                    className="h-10 w-14 rounded-xl border border-white/10 bg-black/30"
                    aria-label="Selecionar cor do fundo"
                  />
                  <div className="text-xs text-white/55 w-[72px] text-right">{(appearance.solidBg ?? '#0b0b10').toUpperCase()}</div>
                </div>
              </div>
            )}
          </Section>

          <Section title="Globo" hint="Só no export (não mexe no site principal)">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-sm text-white/80">
                <Globe2 className="h-4 w-4 text-white/70" />
                Ativar globo
              </div>
              <button
                type="button"
                onClick={() => set({ globeEnabled: !appearance.globeEnabled })}
                className={cn('h-9 w-14 rounded-full border border-white/10 bg-white/5 p-1 transition', appearance.globeEnabled ? 'bg-white/10' : '')}
              >
                <div className={cn('h-7 w-7 rounded-full bg-white/80 transition translate-x-0', appearance.globeEnabled ? 'translate-x-5' : '')} />
              </button>
            </div>

            {appearance.globeEnabled && (
              <>
                <div className="mt-3 grid grid-cols-3 gap-2">
                  {GLOBES.slice(0, 9).map((g) => {
                    const active = appearance.globeId === g.id;
                    return (
                      <button
                        key={g.id}
                        type="button"
                        onClick={() => set({ globeId: g.id })}
                        className={cn('relative rounded-2xl overflow-hidden border border-white/10 bg-black/30', active ? 'ring-2 ring-white/20' : 'hover:ring-2 hover:ring-white/10')}
                        title={g.label}
                      >
                        <div className="relative h-20 w-full">
                          <Image src={g.src} alt={g.label} fill className="object-cover" />
                          <div className="absolute inset-0 bg-gradient-to-b from-black/0 via-black/0 to-black/55" />
                          <div className="absolute bottom-2 left-2 right-2 text-[11px] text-white/85 truncate">{g.label}</div>
                        </div>
                      </button>
                    );
                  })}
                </div>

                <div className="mt-4 space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-xs text-white/60">Rotação</div>
                    <div className="text-xs text-white/60">{Math.round(appearance.globeRotationDeg ?? 0)}°</div>
                  </div>
                  <input type="range" min={0} max={360} value={appearance.globeRotationDeg ?? 0} onChange={(e) => set({ globeRotationDeg: Number(e.target.value) })} className="w-full" />

                  <div className="flex items-center justify-between gap-3">
                    <div className="text-xs text-white/60">Brilho</div>
                    <div className="text-xs text-white/60">{(appearance.globeBrightness ?? 1).toFixed(2)}</div>
                  </div>
                  <input type="range" min={0.4} max={1.4} step={0.01} value={appearance.globeBrightness ?? 1} onChange={(e) => set({ globeBrightness: clamp(Number(e.target.value), 0.4, 1.4) })} className="w-full" />

                  <div className="flex items-center justify-between gap-3">
                    <div className="text-xs text-white/60">Escala</div>
                    <div className="text-xs text-white/60">{(appearance.globeScale ?? 1).toFixed(2)}x</div>
                  </div>
                  <input type="range" min={0.7} max={1.4} step={0.01} value={appearance.globeScale ?? 1} onChange={(e) => set({ globeScale: clamp(Number(e.target.value), 0.7, 1.4) })} className="w-full" />
                </div>
              </>
            )}
          </Section>

          <Section title="Export" hint="Formato e densidade dos cards">
            <div className="flex items-center justify-between gap-3">
              <div className="text-sm text-white/80">Formato</div>
              <Segmented<ExportFormat>
                value={(appearance.format ?? 'story') as ExportFormat}
                onChange={(v) => set({ format: v })}
                options={[{ value: 'story', label: 'Story' }, { value: 'square', label: 'Quadrado' }]}
              />
            </div>

            <div className="mt-3 flex items-center justify-between gap-3">
              <div className="text-sm text-white/80">Layout</div>
              <Segmented<ExportLayout>
                value={(appearance.layout ?? 'cards') as ExportLayout}
                onChange={(v) => set({ layout: v })}
                options={[{ value: 'cards', label: 'Cards' }, { value: 'squares', label: 'Tiles' }, { value: 'list', label: 'Lista' }]}
              />
            </div>

            <div className="mt-3 flex items-center justify-between gap-3">
              <div className="text-sm text-white/80">Densidade</div>
              <Segmented<ExportDensity>
                value={(appearance.density ?? 'compact') as ExportDensity}
                onChange={(v) => set({ density: v })}
                options={[{ value: 'comfortable', label: 'Conforto' }, { value: 'compact', label: 'Compacto' }, { value: 'ultra', label: 'Ultra' }]}
              />
            </div>

            <div className="mt-4 flex items-center justify-between gap-3">
              <div className="text-sm text-white/80">Máx. itens</div>
              <div className="flex items-center gap-3">
                <input type="range" min={6} max={28} value={appearance.maxItems ?? 16} onChange={(e) => set({ maxItems: Number(e.target.value) })} className="w-44" />
                <div className="text-xs text-white/60 w-10 text-right">{appearance.maxItems ?? 16}</div>
              </div>
            </div>
          </Section>

          <Section title="Estilo" hint="Arredondamento e opacidade dos cards">
            <div className="flex items-center justify-between gap-3">
              <div className="text-sm text-white/80">Mostrar checks</div>
              <button
                type="button"
                onClick={() => set({ showChecks: !appearance.showChecks })}
                className={cn('h-9 w-14 rounded-full border border-white/10 bg-white/5 p-1 transition', appearance.showChecks ? 'bg-white/10' : '')}
              >
                <div className={cn('h-7 w-7 rounded-full bg-white/80 transition translate-x-0', appearance.showChecks ? 'translate-x-5' : '')} />
              </button>
            </div>

            <div className="mt-4">
              <div className="flex items-center justify-between gap-3">
                <div className="text-xs text-white/60">Opacidade</div>
                <div className="text-xs text-white/60">{(appearance.cardOpacity ?? 0.95).toFixed(2)}</div>
              </div>
              <input type="range" min={0.6} max={1} step={0.01} value={appearance.cardOpacity ?? 0.95} onChange={(e) => set({ cardOpacity: clamp(Number(e.target.value), 0.6, 1) })} className="w-full" />
            </div>

            <div className="mt-4">
              <div className="flex items-center justify-between gap-3">
                <div className="text-xs text-white/60">Raio (px)</div>
                <div className="text-xs text-white/60">{Math.round(appearance.cardRadius ?? 18)}</div>
              </div>
              <input type="range" min={10} max={32} step={1} value={appearance.cardRadius ?? 18} onChange={(e) => set({ cardRadius: Number(e.target.value) })} className="w-full" />
            </div>
          </Section>
        </div>

        <div className="p-5 border-t border-white/10 flex items-center justify-between">
          <div className="text-xs text-white/55">Essas mudanças só afetam o export/preview da lista.</div>
          <Button variant="secondary" onClick={onClose}>
            Fechar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
