// components/gamev1/GameShell.tsx
'use client';

import { useEffect, useMemo, useState } from 'react';
import GamePersonalizePanel, { loadGameUI, type GamePersonalizeState } from '@/components/gamev1/GamePersonalizePanel';
import GameBackground from '@/components/gamev1/GameBackground';

export default function GameShell({
  title,
  headerTitle,
  headerSub,
  message,
  onDismissMessage,
  topActions,
  children,
}: {
  title: string;
  headerTitle: string;
  headerSub?: string;
  message?: string | null;
  onDismissMessage?: () => void;
  topActions?: React.ReactNode;
  children: React.ReactNode;
}) {
  const [menuOpen, setMenuOpen] = useState(false);

  const roomId = useMemo(() => {
    const s = headerSub ?? '';
    const m = s.match(/Sala:\s*(.+)$/i);
    return m?.[1]?.trim() || 'local';
  }, [headerSub]);

  const [ui, setUi] = useState<GamePersonalizeState>(() => loadGameUI(roomId));

  useEffect(() => {
    setUi(loadGameUI(roomId));
  }, [roomId]);

  return (
    <div
      className="min-h-screen w-full"
      data-game-palette={ui.palette}
      data-game-textshadow={ui.textShadow ? 'on' : 'off'}
      style={
        {
          // CSS variables for panels/cards/text
          // @ts-ignore
          '--game-panel-alpha': ui.panelOpacity,
        } as any
      }
    >
      <GameBackground ui={ui} />

      {/* Global styles just for the game shell */}
      <style jsx global>{`
        [data-game-palette] .game-panel,
        [data-game-palette] .game-card {
          border: 1px solid rgba(255, 255, 255, 0.10);
          border-radius: 16px;
          background: rgba(0, 0, 0, var(--game-panel-alpha, 0.55));
          backdrop-filter: blur(14px);
        }

        [data-game-textshadow='on'] * {
          text-shadow: 0 1px 2px rgba(0,0,0,0.55);
        }

        /* Palette tuning */
        [data-game-palette='neon'] .game-panel,
        [data-game-palette='neon'] .game-card {
          box-shadow: 0 12px 40px rgba(0,0,0,0.25);
        }

        [data-game-palette='dark'] .game-panel,
        [data-game-palette='dark'] .game-card {
          background: rgba(0, 0, 0, calc(var(--game-panel-alpha, 0.55) + 0.10));
          border-color: rgba(255,255,255,0.08);
        }

        [data-game-palette='mono'] .game-panel,
        [data-game-palette='mono'] .game-card {
          background: rgba(0,0,0, calc(var(--game-panel-alpha, 0.55) + 0.12));
          border-color: rgba(255,255,255,0.14);
          filter: saturate(0.05);
        }

        [data-game-palette='candy'] .game-panel,
        [data-game-palette='candy'] .game-card {
          border-color: rgba(255,255,255,0.12);
          box-shadow: 0 18px 60px rgba(0,0,0,0.25);
        }

        /* Optional neon-ish outline on hover for cards */
        [data-game-palette='neon'] .game-card:hover {
          box-shadow: 0 0 0 1px rgba(255,255,255,0.10), 0 0 22px rgba(180, 255, 255, 0.10);
        }
        [data-game-palette='candy'] .game-card:hover {
          box-shadow: 0 0 0 1px rgba(255,255,255,0.12), 0 0 26px rgba(255, 180, 255, 0.10);
        }
      `}</style>

      <div className="relative">
        <header className="sticky top-0 z-40 border-b border-white/10 bg-black/40 backdrop-blur-xl">
          <div className="max-w-6xl mx-auto px-4 py-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-white text-lg font-semibold">{headerTitle}</div>
                {headerSub ? <div className="text-white/50 text-xs mt-1">{headerSub}</div> : null}
              </div>

              <div className="flex items-center gap-2">
                {topActions}

                <button
                  type="button"
                  className="px-3 py-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-white/80"
                  onClick={() => setMenuOpen((s) => !s)}
                  aria-label="Personalização"
                  title="Personalização"
                >
                  ☰
                </button>
              </div>
            </div>

            {message ? (
              <div className="mt-3 game-panel p-3 text-white/85 flex items-start justify-between gap-3">
                <div>{message}</div>
                {onDismissMessage ? (
                  <button
                    type="button"
                    className="px-2 py-1 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 text-white/70"
                    onClick={onDismissMessage}
                  >
                    ✕
                  </button>
                ) : null}
              </div>
            ) : null}
          </div>
        </header>

        <main className="max-w-6xl mx-auto px-4 py-6">{children}</main>

        {menuOpen ? (
          <div className="fixed inset-0 z-50">
            <div className="absolute inset-0 bg-black/60" onClick={() => setMenuOpen(false)} aria-hidden="true" />

            <div className="absolute top-3 right-3 w-[92vw] sm:w-[460px]">
              <GamePersonalizePanel
                roomId={roomId}
                onChange={(next) => {
                  setUi(next);
                }}
              />
              <div className="flex justify-end mt-2">
                <button
                  type="button"
                  className="px-3 py-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-white/70"
                  onClick={() => setMenuOpen(false)}
                >
                  Fechar
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </div>

      <div className="py-6 text-center text-white/20 text-xs">{title}</div>
    </div>
  );
}
