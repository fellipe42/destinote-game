// components/gamev1/GamePersonalizePanel.tsx
'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

type GlobeMode = 'rotate' | 'idle';
type BgMode = 'image' | 'solid' | 'gradient';

export type GamePersonalizeState = {
  palette: 'neon' | 'dark' | 'mono' | 'candy';

  // Background
  bgMode: BgMode;
  backgroundSrc: string; // image preset or upload dataURL
  backgroundOpacity: number; // 0..1

  solidColor: string; // e.g. "#0b0f1a"
  gradientA: string; // e.g. "#0b0f1a"
  gradientB: string; // e.g. "#1a0b2e"
  gradientAngle: number; // 0..360

  // Panels & text
  panelOpacity: number; // 0..1
  textShadow: boolean;

  // Globe
  globeEnabled: boolean;
  globeMode: GlobeMode;
  globeSize: number; // 0.6..1.4
  globeOpacity: number; // 0..1
  globeSpeed: number; // 0.2..2.5 (multiplier)
};

const PRESET_BACKGROUNDS: { id: string; label: string; src: string }[] = [
  { id: 'bg-1-sunset', label: 'bg-1-sunset', src: '/images/bg-1-sunset.png' },
  { id: 'bg-8', label: 'bg-8', src: '/images/bg-8.jpg' },
  { id: 'bg-14', label: 'bg-14', src: '/images/bg-14.jpg' },
  { id: 'bg-16', label: 'bg-16', src: '/images/bg-16.jpg' },
  { id: 'bg-17', label: 'bg-17', src: '/images/bg-17.jpg' },
  { id: 'bg-18', label: 'bg-18', src: '/images/bg-18.jpg' },
  { id: 'bg-19', label: 'bg-19', src: '/images/bg-19.jpg' },
  { id: 'bg-20', label: 'bg-20', src: '/images/bg-20.jpg' },
  { id: 'bg-21', label: 'bg-21', src: '/images/bg-21.jpg' },
];

const DEFAULTS: GamePersonalizeState = {
  palette: 'neon',

  bgMode: 'image',
  backgroundSrc: '/images/bg-1-sunset.png',
  backgroundOpacity: 0.65,

  solidColor: '#070A12',
  gradientA: '#070A12',
  gradientB: '#1A1033',
  gradientAngle: 135,

  panelOpacity: 0.55,
  textShadow: false,

  globeEnabled: true,
  globeMode: 'rotate',
  globeSize: 1,
  globeOpacity: 0.35,
  globeSpeed: 1,
};

function key(roomId: string) {
  return `destinote:game:v1:ui:${roomId}`;
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function safeParse(s: string | null): any {
  try {
    return s ? JSON.parse(s) : null;
  } catch {
    return null;
  }
}

export function loadGameUI(roomId: string): GamePersonalizeState {
  if (typeof window === 'undefined') return DEFAULTS;
  const parsed = safeParse(localStorage.getItem(key(roomId)));
  if (!parsed) return DEFAULTS;

  const bgMode: BgMode = parsed.bgMode === 'solid' || parsed.bgMode === 'gradient' ? parsed.bgMode : 'image';

  return {
    palette: parsed.palette ?? DEFAULTS.palette,

    bgMode,
    backgroundSrc: typeof parsed.backgroundSrc === 'string' ? parsed.backgroundSrc : DEFAULTS.backgroundSrc,
    backgroundOpacity: clamp(Number(parsed.backgroundOpacity ?? DEFAULTS.backgroundOpacity), 0, 1),

    solidColor: typeof parsed.solidColor === 'string' ? parsed.solidColor : DEFAULTS.solidColor,
    gradientA: typeof parsed.gradientA === 'string' ? parsed.gradientA : DEFAULTS.gradientA,
    gradientB: typeof parsed.gradientB === 'string' ? parsed.gradientB : DEFAULTS.gradientB,
    gradientAngle: clamp(Number(parsed.gradientAngle ?? DEFAULTS.gradientAngle), 0, 360),

    panelOpacity: clamp(Number(parsed.panelOpacity ?? DEFAULTS.panelOpacity), 0.2, 0.9),
    textShadow: Boolean(parsed.textShadow ?? DEFAULTS.textShadow),

    globeEnabled: typeof parsed.globeEnabled === 'boolean' ? parsed.globeEnabled : DEFAULTS.globeEnabled,
    globeMode: parsed.globeMode === 'idle' ? 'idle' : 'rotate',
    globeSize: clamp(Number(parsed.globeSize ?? DEFAULTS.globeSize), 0.6, 1.4),
    globeOpacity: clamp(Number(parsed.globeOpacity ?? DEFAULTS.globeOpacity), 0, 1),
    globeSpeed: clamp(Number(parsed.globeSpeed ?? DEFAULTS.globeSpeed), 0.2, 2.5),
  };
}

export function saveGameUI(roomId: string, state: GamePersonalizeState) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(key(roomId), JSON.stringify(state));
}

function RangeRow({
  label,
  value,
  min,
  max,
  step,
  format,
  onChange,
  disabled,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  format: (v: number) => string;
  onChange: (v: number) => void;
  disabled?: boolean;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-white/70 text-xs">
        <span>{label}</span>
        <span className="tabular-nums">{format(value)}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full"
      />
    </div>
  );
}

export default function GamePersonalizePanel({
  roomId,
  onChange,
}: {
  roomId: string;
  onChange?: (s: GamePersonalizeState) => void;
}) {
  const [s, setS] = useState<GamePersonalizeState>(() => loadGameUI(roomId));
  const fileRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    saveGameUI(roomId, s);
    onChange?.(s);
  }, [roomId, s, onChange]);

  const currentPresetId = useMemo(() => {
    const hit = PRESET_BACKGROUNDS.find((b) => b.src === s.backgroundSrc);
    return hit?.id ?? PRESET_BACKGROUNDS[0]?.id ?? 'bg-1-sunset';
  }, [s.backgroundSrc]);

  return (
    <div className="rounded-2xl border border-white/10 bg-black/60 backdrop-blur-xl shadow-2xl overflow-hidden">
      <div className="p-4 border-b border-white/10">
        <div className="text-white/85 text-sm font-semibold">Personalização do Jogo</div>
        <div className="text-white/50 text-xs mt-1">Sala: {roomId}</div>
      </div>

      <div className="max-h-[70vh] overflow-auto p-4 space-y-4">
        {/* Palette */}
        <div className="game-panel p-3 space-y-2">
          <div className="text-white/85 text-sm font-medium">Paleta</div>
          <div className="grid grid-cols-2 gap-2">
            {(['neon', 'dark', 'mono', 'candy'] as const).map((p) => (
              <button
                key={p}
                type="button"
                className={`px-3 py-2 rounded-xl border border-white/10 ${
                  s.palette === p ? 'bg-white/15 text-white' : 'bg-white/5 text-white/70 hover:bg-white/10'
                }`}
                onClick={() => setS((x) => ({ ...x, palette: p }))}
              >
                {p}
              </button>
            ))}
          </div>
          <div className="text-white/45 text-xs leading-snug">
            neon = vidro + borda neon • mono = PB com neon mínimo • dark = contraste • candy = saturado
          </div>
        </div>

        {/* Panels */}
        <div className="game-panel p-3 space-y-3">
          <div className="text-white/85 text-sm font-medium">Painéis</div>
          <RangeRow
            label="Opacidade dos painéis"
            value={s.panelOpacity}
            min={0.2}
            max={0.9}
            step={0.01}
            format={(v) => `${Math.round(v * 100)}%`}
            onChange={(v) => setS((x) => ({ ...x, panelOpacity: v }))}
          />
          <button
            type="button"
            className={`w-full px-3 py-2 rounded-xl border border-white/10 ${
              s.textShadow ? 'bg-white/15 text-white' : 'bg-white/5 text-white/70 hover:bg-white/10'
            }`}
            onClick={() => setS((x) => ({ ...x, textShadow: !x.textShadow }))}
            title="Ajuda leitura quando o fundo é muito vivo"
          >
            {s.textShadow ? 'Sombra no texto: ON' : 'Sombra no texto: OFF'}
          </button>
        </div>

        {/* Background */}
        <div className="game-panel p-3 space-y-3">
          <div className="text-white/85 text-sm font-medium">Background</div>

          <div className="grid grid-cols-3 gap-2">
            {(['image', 'solid', 'gradient'] as const).map((m) => (
              <button
                key={m}
                type="button"
                className={`px-3 py-2 rounded-xl border border-white/10 ${
                  s.bgMode === m ? 'bg-white/15 text-white' : 'bg-white/5 text-white/70 hover:bg-white/10'
                }`}
                onClick={() => setS((x) => ({ ...x, bgMode: m }))}
              >
                {m === 'image' ? 'Imagem' : m === 'solid' ? 'Sólido' : 'Gradiente'}
              </button>
            ))}
          </div>

          {s.bgMode === 'image' ? (
            <div className="space-y-2">
              <div className="text-white/60 text-xs">Presets / Upload</div>

              <select
                className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-white/85"
                value={currentPresetId}
                onChange={(e) => {
                  const src = PRESET_BACKGROUNDS.find((b) => b.id === e.target.value)?.src ?? PRESET_BACKGROUNDS[0].src;
                  setS((x) => ({ ...x, backgroundSrc: src }));
                }}
              >
                {PRESET_BACKGROUNDS.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.label}
                  </option>
                ))}
              </select>

              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (!f) return;
                  const reader = new FileReader();
                  reader.onload = () => {
                    const dataUrl = String(reader.result || '');
                    if (!dataUrl.startsWith('data:image/')) return;
                    setS((x) => ({ ...x, backgroundSrc: dataUrl }));
                  };
                  reader.readAsDataURL(f);
                }}
              />

              <div className="flex gap-2 flex-wrap">
                <button
                  type="button"
                  className="px-3 py-2 rounded-xl border border-white/10 bg-white/10 hover:bg-white/15 text-white"
                  onClick={() => fileRef.current?.click()}
                >
                  Upload
                </button>
                <button
                  type="button"
                  className="px-3 py-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-white/70"
                  onClick={() => setS((x) => ({ ...x, backgroundSrc: PRESET_BACKGROUNDS[0].src }))}
                >
                  Reset bg
                </button>
              </div>

              <div className="rounded-2xl border border-white/10 bg-black/20 overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={s.backgroundSrc} alt="Preview background" className="w-full h-28 object-cover opacity-90" />
              </div>

              <RangeRow
                label="Opacidade da imagem"
                value={s.backgroundOpacity}
                min={0}
                max={1}
                step={0.01}
                format={(v) => `${Math.round(v * 100)}%`}
                onChange={(v) => setS((x) => ({ ...x, backgroundOpacity: v }))}
              />
            </div>
          ) : null}

          {s.bgMode === 'solid' ? (
            <div className="space-y-2">
              <div className="text-white/60 text-xs">Cor sólida</div>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={s.solidColor}
                  onChange={(e) => setS((x) => ({ ...x, solidColor: e.target.value }))}
                  className="h-10 w-14 bg-transparent"
                />
                <input
                  className="flex-1 rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-white/85"
                  value={s.solidColor}
                  onChange={(e) => setS((x) => ({ ...x, solidColor: e.target.value }))}
                />
              </div>
            </div>
          ) : null}

          {s.bgMode === 'gradient' ? (
            <div className="space-y-3">
              <div className="text-white/60 text-xs">Gradiente</div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <div className="text-white/50 text-xs">Cor A</div>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={s.gradientA}
                      onChange={(e) => setS((x) => ({ ...x, gradientA: e.target.value }))}
                      className="h-10 w-14 bg-transparent"
                    />
                    <input
                      className="flex-1 rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-white/85"
                      value={s.gradientA}
                      onChange={(e) => setS((x) => ({ ...x, gradientA: e.target.value }))}
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="text-white/50 text-xs">Cor B</div>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={s.gradientB}
                      onChange={(e) => setS((x) => ({ ...x, gradientB: e.target.value }))}
                      className="h-10 w-14 bg-transparent"
                    />
                    <input
                      className="flex-1 rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-white/85"
                      value={s.gradientB}
                      onChange={(e) => setS((x) => ({ ...x, gradientB: e.target.value }))}
                    />
                  </div>
                </div>
              </div>

              <RangeRow
                label="Ângulo"
                value={s.gradientAngle}
                min={0}
                max={360}
                step={1}
                format={(v) => `${Math.round(v)}°`}
                onChange={(v) => setS((x) => ({ ...x, gradientAngle: v }))}
              />

              <div
                className="rounded-2xl border border-white/10 h-16"
                style={{
                  background: `linear-gradient(${s.gradientAngle}deg, ${s.gradientA}, ${s.gradientB})`,
                }}
              />
            </div>
          ) : null}
        </div>

        {/* Globe */}
        <div className="game-panel p-3 space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-white/85 text-sm font-medium">Globo</div>
              <div className="text-white/45 text-xs leading-snug">Rotate ou Idle + tamanho/opacity + velocidade.</div>
            </div>

            <button
              type="button"
              className={`px-3 py-2 rounded-xl border border-white/10 ${
                s.globeEnabled ? 'bg-white/15 text-white' : 'bg-white/5 text-white/70 hover:bg-white/10'
              }`}
              onClick={() => setS((x) => ({ ...x, globeEnabled: !x.globeEnabled }))}
            >
              {s.globeEnabled ? 'Ligado' : 'Desligado'}
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              className={`px-3 py-2 rounded-xl border border-white/10 ${
                s.globeMode === 'rotate' ? 'bg-white/15 text-white' : 'bg-white/5 text-white/70 hover:bg-white/10'
              }`}
              onClick={() => setS((x) => ({ ...x, globeMode: 'rotate' }))}
              disabled={!s.globeEnabled}
            >
              Girando
            </button>
            <button
              type="button"
              className={`px-3 py-2 rounded-xl border border-white/10 ${
                s.globeMode === 'idle' ? 'bg-white/15 text-white' : 'bg-white/5 text-white/70 hover:bg-white/10'
              }`}
              onClick={() => setS((x) => ({ ...x, globeMode: 'idle' }))}
              disabled={!s.globeEnabled}
            >
              Idle
            </button>
          </div>

          <RangeRow
            label="Velocidade"
            value={s.globeSpeed}
            min={0.2}
            max={2.5}
            step={0.05}
            format={(v) => `${v.toFixed(2)}x`}
            disabled={!s.globeEnabled || s.globeMode !== 'rotate'}
            onChange={(v) => setS((x) => ({ ...x, globeSpeed: v }))}
          />

          <RangeRow
            label="Tamanho"
            value={s.globeSize}
            min={0.6}
            max={1.4}
            step={0.01}
            format={(v) => v.toFixed(2)}
            disabled={!s.globeEnabled}
            onChange={(v) => setS((x) => ({ ...x, globeSize: v }))}
          />

          <RangeRow
            label="Opacidade"
            value={s.globeOpacity}
            min={0}
            max={1}
            step={0.01}
            format={(v) => `${Math.round(v * 100)}%`}
            disabled={!s.globeEnabled}
            onChange={(v) => setS((x) => ({ ...x, globeOpacity: v }))}
          />
        </div>
      </div>

      <div className="p-3 border-t border-white/10 flex justify-end">
        <button
          type="button"
          className="px-3 py-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-white/70"
          onClick={() => setS(DEFAULTS)}
        >
          Resetar
        </button>
      </div>
    </div>
  );
}
