'use client';

import { useMemo } from 'react';
import { BACKGROUNDS } from '@/lib/personalization/catalog';
import StaticGlobe from './StaticGlobe';

export type ExportFormat = 'story' | 'square';
export type ExportDensity = 'comfortable' | 'compact' | 'ultra';
export type ExportLayout = 'cards' | 'squares' | 'list';
export type AppearancePreset = 'neon' | 'minimal' | 'morning' | 'newyear';

export type ExportAppearance = {
  preset: AppearancePreset;

  // fundo
  backgroundId?: string | null; // usa catálogo do Destinote se quiser
  solidBg?: string | null; // fallback simples
  transparent?: boolean;

  // globo
  globeEnabled?: boolean;
  globeId?: string | null;
  globeRotationDeg?: number;
  globeBrightness?: number;
  globeScale?: number;

  // export
  format?: ExportFormat;
  layout?: ExportLayout;
  density?: ExportDensity;
  maxItems?: number;

  // estilo da lista
  showChecks?: boolean;
  cardOpacity?: number; // 0..1
  cardRadius?: number; // px
};

export type PreviewItem = {
  id: string | number;
  text: string;
  done?: boolean;
};

function clamp(n: number, a: number, b: number) {
  return Math.max(a, Math.min(b, n));
}

function safeBgFromCatalog(backgroundId?: string | null) {
  if (!backgroundId) return null;
  const bg = BACKGROUNDS.find((b) => b.id === backgroundId);
  return bg?.src ?? null;
}

function presetDefaults(preset: AppearancePreset) {
  if (preset === 'minimal') {
    return {
      bg: '#ffffff',
      fg: 'rgba(10,10,12,0.92)',
      sub: 'rgba(10,10,12,0.56)',
      card: 'rgba(10,10,12,0.06)',
      border: 'rgba(10,10,12,0.10)',
    };
  }
  if (preset === 'morning') {
    return {
      bg: 'linear-gradient(180deg, rgba(255,199,146,0.95) 0%, rgba(255,120,120,0.88) 45%, rgba(40,45,90,0.92) 100%)',
      fg: 'rgba(255,255,255,0.92)',
      sub: 'rgba(255,255,255,0.68)',
      card: 'rgba(255,255,255,0.10)',
      border: 'rgba(255,255,255,0.18)',
    };
  }
  if (preset === 'newyear') {
    return {
      bg: 'radial-gradient(circle at 40% 20%, rgba(255,210,140,0.14), transparent 55%), radial-gradient(circle at 70% 35%, rgba(170,120,255,0.16), transparent 56%), linear-gradient(180deg, rgba(6,8,18,1) 0%, rgba(8,10,26,1) 100%)',
      fg: 'rgba(255,255,255,0.92)',
      sub: 'rgba(255,255,255,0.64)',
      card: 'rgba(255,255,255,0.08)',
      border: 'rgba(255,255,255,0.14)',
    };
  }
  // neon (default)
  return {
    bg: 'radial-gradient(circle at 20% 15%, rgba(120,170,255,0.18), transparent 60%), radial-gradient(circle at 80% 30%, rgba(210,120,255,0.18), transparent 55%), linear-gradient(180deg, rgba(8,10,22,1) 0%, rgba(10,12,28,1) 100%)',
    fg: 'rgba(255,255,255,0.92)',
    sub: 'rgba(255,255,255,0.62)',
    card: 'rgba(255,255,255,0.08)',
    border: 'rgba(255,255,255,0.14)',
  };
}

export default function ExportPreview({
  id,
  title,
  subtitle,
  items,
  appearance,
  className,
  style,
}: {
  id: string;
  title: string;
  subtitle?: string | null;
  items: PreviewItem[];
  appearance: ExportAppearance;
  className?: string;
  style?: React.CSSProperties;
}) {
  const preset = appearance.preset ?? 'neon';
  const defs = presetDefaults(preset);

  const format = appearance.format ?? 'story';
  const layout = appearance.layout ?? 'cards';
  const density = appearance.density ?? 'compact';
  const maxItems = clamp(appearance.maxItems ?? 16, 1, 200);

  const showChecks = appearance.showChecks ?? true;

  const cardOpacity = clamp(appearance.cardOpacity ?? 0.95, 0.15, 1);
  const cardRadius = clamp(appearance.cardRadius ?? 18, 8, 36);

  const dims = useMemo(() => {
    // tamanho “bom” pro html2canvas (depois ele escala 2x)
    if (format === 'square') return { w: 900, h: 900 };
    return { w: 720, h: 1280 }; // story
  }, [format]);

  const bgImg = safeBgFromCatalog(appearance.backgroundId ?? null);

  const effectiveBg = useMemo(() => {
    if (appearance.transparent) return 'transparent';
    if (bgImg) return `url(${bgImg})`;
    if (appearance.solidBg) return appearance.solidBg;
    return defs.bg;
  }, [appearance.transparent, bgImg, appearance.solidBg, defs.bg]);

  const densityCfg = useMemo(() => {
    if (density === 'ultra') return { pad: 12, gap: 8, font: 20, sub: 13, item: 16, line: 44 };
    if (density === 'comfortable') return { pad: 18, gap: 12, font: 26, sub: 14, item: 18, line: 54 };
    return { pad: 14, gap: 10, font: 24, sub: 14, item: 17, line: 48 }; // compact
  }, [density]);

  const slice = useMemo(() => items.slice(0, maxItems), [items, maxItems]);

  return (
    <div
      id={id}
      className={[
        'relative overflow-hidden',
        className ?? '',
      ].join(' ')}
      style={{
        width: dims.w,
        height: dims.h,
        ...(style ?? {}),
      }}
    >
      {/* BG */}
      <div
        className="absolute inset-0"
        style={{
          background:
            bgImg && !appearance.transparent
              ? undefined
              : (typeof effectiveBg === 'string' ? effectiveBg : defs.bg),
          backgroundImage: bgImg && !appearance.transparent ? effectiveBg : undefined,
          backgroundSize: bgImg ? 'cover' : undefined,
          backgroundPosition: bgImg ? 'center' : undefined,
        }}
      />
      {!appearance.transparent && (
        <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-black/20 to-black/40" />
      )}

      {/* Globo (estático) */}
      {(appearance.globeEnabled ?? true) && (
        <div className="absolute inset-0 flex items-center justify-center opacity-60">
          <div className="w-[70%] h-[70%]">
            <StaticGlobe
              globeId={appearance.globeId ?? 'earth'}
              rotationDeg={appearance.globeRotationDeg ?? 0}
              brightness={appearance.globeBrightness ?? 1}
              scale={appearance.globeScale ?? 1}
              className="w-full h-full"
            />
          </div>
        </div>
      )}

      {/* Conteúdo */}
      <div
        className="absolute inset-0"
        style={{
          padding: densityCfg.pad,
          color: defs.fg,
        }}
      >
        <div className="flex flex-col">
          <div className="flex items-end justify-between gap-3">
            <div className="min-w-0">
              <div
                className="font-extrabold tracking-tight"
                style={{ fontSize: densityCfg.font, lineHeight: 1.05 }}
                title={title}
              >
                {title}
              </div>
              {subtitle ? (
                <div
                  className="mt-1"
                  style={{ fontSize: densityCfg.sub, color: defs.sub }}
                >
                  {subtitle}
                </div>
              ) : null}
            </div>

            <div
              className="text-xs font-semibold px-3 py-1 rounded-full border"
              style={{
                borderColor: defs.border,
                background: 'rgba(255,255,255,0.06)',
                color: defs.sub,
              }}
            >
              {slice.length} item{slice.length === 1 ? '' : 's'}
            </div>
          </div>

          <div className="mt-4" style={{ display: 'grid', gap: densityCfg.gap }}>
            {layout === 'squares' ? (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
                  gap: densityCfg.gap,
                }}
              >
                {slice.map((it, idx) => (
                  <div
                    key={`${it.id}_${idx}`}
                    style={{
                      borderRadius: cardRadius,
                      border: `1px solid ${defs.border}`,
                      background: `rgba(255,255,255,${0.10 * cardOpacity})`,
                      padding: 14,
                      minHeight: 92,
                      display: 'flex',
                      gap: 10,
                      alignItems: 'flex-start',
                    }}
                  >
                    {showChecks ? (
                      <div
                        style={{
                          width: 20,
                          height: 20,
                          borderRadius: 6,
                          border: `1px solid ${defs.border}`,
                          background: it.done ? 'rgba(52, 211, 153, 0.25)' : 'transparent',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: 14,
                        }}
                      >
                        {it.done ? '✓' : ''}
                      </div>
                    ) : null}

                    <div style={{ fontSize: densityCfg.item, lineHeight: 1.2 }}>
                      {it.text}
                    </div>
                  </div>
                ))}
              </div>
            ) : layout === 'list' ? (
              <div
                style={{
                  borderRadius: cardRadius,
                  border: `1px solid ${defs.border}`,
                  background: `rgba(255,255,255,${0.08 * cardOpacity})`,
                  overflow: 'hidden',
                }}
              >
                {slice.map((it, idx) => (
                  <div
                    key={`${it.id}_${idx}`}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      padding: '12px 14px',
                      borderTop: idx === 0 ? 'none' : `1px solid ${defs.border}`,
                    }}
                  >
                    {showChecks ? (
                      <div
                        style={{
                          width: 18,
                          height: 18,
                          borderRadius: 6,
                          border: `1px solid ${defs.border}`,
                          background: it.done ? 'rgba(52, 211, 153, 0.25)' : 'transparent',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: 13,
                        }}
                      >
                        {it.done ? '✓' : ''}
                      </div>
                    ) : null}

                    <div style={{ fontSize: densityCfg.item, lineHeight: 1.25 }}>
                      {it.text}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              // cards (default)
              slice.map((it, idx) => (
                <div
                  key={`${it.id}_${idx}`}
                  style={{
                    borderRadius: cardRadius,
                    border: `1px solid ${defs.border}`,
                    background: `rgba(255,255,255,${0.08 * cardOpacity})`,
                    padding: '12px 14px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    minHeight: densityCfg.line,
                    backdropFilter: 'blur(10px)',
                  }}
                >
                  {showChecks ? (
                    <div
                      style={{
                        width: 20,
                        height: 20,
                        borderRadius: 6,
                        border: `1px solid ${defs.border}`,
                        background: it.done ? 'rgba(52, 211, 153, 0.25)' : 'transparent',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 14,
                      }}
                    >
                      {it.done ? '✓' : ''}
                    </div>
                  ) : null}

                  <div style={{ fontSize: densityCfg.item, lineHeight: 1.2 }}>
                    {it.text}
                  </div>
                </div>
              ))
            )}
          </div>

          <div
            className="absolute bottom-0 left-0 right-0"
            style={{
              padding: densityCfg.pad,
              color: defs.sub,
              fontSize: 11,
            }}
          >
            Destinote • export
          </div>
        </div>
      </div>
    </div>
  );
}
