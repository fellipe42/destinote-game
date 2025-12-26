// components/gamev1/GameBackground.tsx
'use client';

import Image from 'next/image';
import type { GamePersonalizeState } from '@/components/gamev1/GamePersonalizePanel';

export default function GameBackground({ ui }: { ui: GamePersonalizeState }) {
  const bgStyle =
    ui.bgMode === 'solid'
      ? { background: ui.solidColor }
      : ui.bgMode === 'gradient'
        ? { background: `linear-gradient(${ui.gradientAngle}deg, ${ui.gradientA}, ${ui.gradientB})` }
        : { background: 'black' };

  // base rotation: 28s. speed 2x => 14s, speed 0.5x => 56s.
  const rotationSeconds = Math.max(6, 28 / (ui.globeSpeed || 1));

  return (
    <div className="fixed inset-0 -z-20 pointer-events-none">
      {/* Background fill */}
      <div className="absolute inset-0" style={bgStyle} />

      {/* Background image */}
      {ui.bgMode === 'image' ? (
        <div className="absolute inset-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={ui.backgroundSrc}
            alt="Background"
            className="w-full h-full object-cover"
            style={{ opacity: ui.backgroundOpacity }}
          />
        </div>
      ) : null}

      {/* Overlay darkening & depth */}
      <div className="absolute inset-0 bg-black/35" />
      <div className="absolute inset-0 bg-gradient-to-b from-black/35 via-transparent to-black/45" />

      {/* Globe */}
      {ui.globeEnabled ? (
        <div
          className="absolute inset-0 flex items-center justify-center"
          style={{
            transform: `scale(${ui.globeSize})`,
            opacity: ui.globeOpacity,
          }}
        >
          <div
            className={`relative w-[52vw] h-[52vw] max-w-[720px] max-h-[720px] ${
              ui.globeMode === 'idle' ? 'animate-[pulse_5.5s_ease-in-out_infinite]' : ''
            }`}
          >
            <div
              className={ui.globeMode === 'rotate' ? 'will-change-transform' : ''}
              style={{
                width: '100%',
                height: '100%',
                animation:
                  ui.globeMode === 'rotate' ? `spin ${rotationSeconds}s linear infinite` : undefined,
              }}
            >
              <Image src="/images/globe-earth.png" alt="Globo" fill priority className="object-contain" />
            </div>

            <div className="absolute -inset-6 rounded-full bg-white/10 blur-2xl" />
          </div>
        </div>
      ) : null}
    </div>
  );
}
