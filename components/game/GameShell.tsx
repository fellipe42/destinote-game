// components/game/GameShell.tsx
'use client';

import { useEffect, useMemo, useState } from 'react';
import type { GameUiPrefs } from '@/lib/game/v2/gameUiPrefs';

function bgImageStyle(id: number) {
  // tenta .jpg primeiro, depois .png (se algum existir)
  const jpg = `/images/bg-${id}.jpg`;
  const png = `/images/bg-${id}.png`;
  return `url(${jpg}), url(${png})`;
}

function isValidHex(hex: string) {
  return /^#[0-9a-fA-F]{6}$/.test(hex);
}

type Props = {
  children: React.ReactNode;
  prefs: GameUiPrefs;
  variant?: 'game' | 'board';
};

export default function GameShell({ children, prefs, variant = 'game' }: Props) {
  const [visible, setVisible] = useState(true);
  const [idle, setIdle] = useState(false);

  useEffect(() => {
    const onVis = () => setVisible(!document.hidden);
    onVis();
    document.addEventListener('visibilitychange', onVis);
    return () => document.removeEventListener('visibilitychange', onVis);
  }, []);

  useEffect(() => {
    let t: any;
    let last = Date.now();
    const bump = () => {
      last = Date.now();
      setIdle(false);
    };
    const tick = () => {
      const ms = Date.now() - last;
      if (ms > 12_000) setIdle(true);
      t = setTimeout(tick, 1000);
    };
    window.addEventListener('pointerdown', bump, { passive: true });
    window.addEventListener('keydown', bump);
    window.addEventListener('touchstart', bump, { passive: true });
    t = setTimeout(tick, 1000);
    return () => {
      clearTimeout(t);
      window.removeEventListener('pointerdown', bump);
      window.removeEventListener('keydown', bump);
      window.removeEventListener('touchstart', bump);
    };
  }, []);

  const solid = isValidHex(prefs.solid?.hex ?? '') ? (prefs.solid!.hex as string) : '#0b1020';
  const bgMode = prefs.bgMode ?? 'destinote';
  const bgId = prefs.bgImageId ?? 16;

  const rootStyle = useMemo(() => {
    if (bgMode === 'bgImage') {
      return {
        backgroundImage: bgImageStyle(bgId),
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed',
      } as React.CSSProperties;
    }
    if (bgMode === 'solid') {
      return {
        backgroundColor: solid,
      } as React.CSSProperties;
    }
    // destinote (default): deixa o overlay fazer o trabalho
    return {
      backgroundColor: '#070a14',
    } as React.CSSProperties;
  }, [bgMode, bgId, solid]);

  const vignette =
    'absolute inset-0 pointer-events-none ' +
    'bg-[radial-gradient(circle_at_30%_20%,rgba(168,85,247,0.18),transparent_55%),radial-gradient(circle_at_70%_75%,rgba(59,130,246,0.14),transparent_55%),linear-gradient(to_bottom,rgba(0,0,0,0.35),rgba(0,0,0,0.85))]';

  const grain =
    'absolute inset-0 pointer-events-none opacity-[0.07] ' +
    'bg-[repeating-linear-gradient(0deg,rgba(255,255,255,0.12)_0px,rgba(255,255,255,0.12)_1px,transparent_1px,transparent_3px)] mix-blend-overlay';

  const wrap = variant === 'board' ? 'min-h-[100svh]' : 'min-h-[100svh]';
  const pad = variant === 'board' ? 'px-4 py-4' : 'px-4 py-6';
  const max = variant === 'board' ? 'max-w-6xl' : 'max-w-3xl';

  return (
    <div className={`${wrap} relative overflow-hidden text-white`} style={rootStyle}>
      <div className={vignette} />
      <div className={grain} />

      {/* Globo idle (leve) */}
      {prefs.globeIdle && (
        <div className="absolute inset-0 pointer-events-none">
          <div
            className={
              'absolute right-[-120px] top-1/2 -translate-y-1/2 w-[520px] h-[520px] opacity-40 blur-[0.3px] ' +
              (visible ? 'animate-[spin_140s_linear_infinite]' : '')
            }
            style={{ opacity: idle ? 0.55 : 0.28 }}
          >
            {/* use imagem já existente no projeto */}
            <img
              src="/images/globe-earth.png"
              alt=""
              className="w-full h-full object-contain drop-shadow-[0_0_20px_rgba(168,85,247,0.25)]"
              loading="eager"
            />
          </div>
        </div>
      )}

      <div className={`${pad} relative z-10`}>
        <div className={`mx-auto ${max}`}>{children}</div>
      </div>
    </div>
  );
}
