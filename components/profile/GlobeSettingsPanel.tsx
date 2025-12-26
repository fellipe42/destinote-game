// components/profile/GlobeSettingsPanel.tsx
'use client';

import Image from 'next/image';
import { useMemo } from 'react';

import { GLOBES } from '@/lib/personalization/catalog';
import { usePersonalization } from '@/contexts/PersonalizationContext';
import SegmentBar from './SegmentBar';

function formatSeconds(n: number) {
  const s = Math.round(n);
  return `${s}s`;
}

function RangeRow({
  label,
  value,
  min,
  max,
  step,
  onChange,
  suffix,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
  suffix?: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 p-4 space-y-2">
      <div className="flex items-center justify-between gap-3">
        <p className="text-white/85 text-sm font-semibold">{label}</p>
        <p className="text-xs text-white/55">
          {Math.round(value * 100) / 100}
          {suffix ?? ''}
        </p>
      </div>
      <input
        type="range"
        value={value}
        min={min}
        max={max}
        step={step}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-white"
      />
    </div>
  );
}

export default function GlobeSettingsPanel() {
  const {
    state,
    setGlobeEnabled,
    setGlobeId,
    setGlobeBrightness,
    setGlobeScale,
    setGlobeRotationSeconds,
    setGlobeSegments,
  } = usePersonalization();

  const selected = state.globe.globeId;

  const selectedGlobe = useMemo(
    () => GLOBES.find((g) => g.id === selected) ?? GLOBES[0],
    [selected]
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-white font-semibold">Mostrar globo</p>
          <p className="text-white/55 text-xs">Pode aparecer/sumir por altura da página.</p>
        </div>

        <label className="inline-flex items-center gap-2 text-sm text-white/80 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={state.globe.enabled}
            onChange={(e) => setGlobeEnabled(e.target.checked)}
            className="accent-white"
          />
          {state.globe.enabled ? 'On' : 'Off'}
        </label>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between gap-4">
          <p className="text-white/80 text-sm font-semibold">Escolha o globo</p>
          <div className="flex items-center gap-3 text-xs text-white/55">
            <span className="inline-flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-white/70" /> disponível
            </span>
            <span className="inline-flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-white/25" /> em breve
            </span>
          </div>
        </div>

        <div className="grid sm:grid-cols-3 gap-3">
          {GLOBES.map((g) => {
            const active = g.id === selected;
            const disabled = !!g.comingSoon;
            return (
              <button
                key={g.id}
                type="button"
                disabled={disabled}
                onClick={() => setGlobeId(g.id)}
                className={[
                  'rounded-2xl border p-3 text-left transition-all',
                  active
                    ? 'border-white/30 bg-white/10'
                    : 'border-white/10 bg-black/20 hover:bg-black/25',
                  disabled ? 'opacity-50 cursor-not-allowed' : '',
                ].join(' ')}
              >
                <div className="flex items-center gap-3">
                  <div className="relative w-12 h-12 rounded-xl overflow-hidden border border-white/10 bg-black/30">
                    {!disabled ? (
                      <Image src={g.src} alt={g.label} fill className="object-contain opacity-90" />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center text-[10px] text-white/60">
                        em breve
                      </div>
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-white font-semibold text-sm">{g.label}</p>
                    <p className="text-white/50 text-xs truncate">{g.id}</p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
          <p className="text-white/70 text-sm">
            Selecionado: <span className="text-white/90 font-semibold">{selectedGlobe.label}</span>
          </p>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <RangeRow
          label="Brilho"
          value={state.globe.brightness}
          min={0.25}
          max={1.2}
          step={0.01}
          onChange={setGlobeBrightness}
          suffix=""
        />
        <RangeRow
          label="Tamanho"
          value={state.globe.scale}
          min={0.65}
          max={1.1}
          step={0.01}
          onChange={setGlobeScale}
          suffix=""
        />
        <div className="rounded-2xl border border-white/10 bg-black/20 p-4 space-y-2">
          <div className="flex items-center justify-between gap-3">
            <p className="text-white/85 text-sm font-semibold">Velocidade</p>
            <p className="text-xs text-white/55">{formatSeconds(state.globe.rotationSeconds)}</p>
          </div>
          <input
            type="range"
            value={state.globe.rotationSeconds}
            min={40}
            max={180}
            step={1}
            onChange={(e) => setGlobeRotationSeconds(Number(e.target.value))}
            className="w-full accent-white"
          />
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
        <p className="text-white/80 text-sm font-semibold mb-3">Onde o globo aparece</p>
        <SegmentBar segments={state.globe.visibilitySegments} onChange={setGlobeSegments} />
      </div>

      <div className="text-xs text-white/45">
        Novos globos: coloque os arquivos em <code>/public/images</code> e adicione no catálogo em{' '}
        <code>lib/personalization/catalog.ts</code>.
      </div>
    </div>
  );
}
