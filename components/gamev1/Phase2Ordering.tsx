// components/gameV1/Phase2Ordering.tsx
'use client';

import type { GameState } from '@/lib/game/v1/types';

export default function Phase2Ordering({
  game,
  title,
  theme,
  orderingIds,
  renderCard,
  onMove,
  onConfirm,
  confirmLabel,
}: {
  game: GameState;
  title: string;
  theme: string;
  orderingIds: string[];
  renderCard: (card: GameState['p1']['cards'][number]) => React.ReactNode;
  onMove: (from: number, to: number) => void;
  onConfirm: () => void;
  confirmLabel?: string;
}) {
  const cardsById: Record<string, GameState['p1']['cards'][number]> = {};
  for (const c of game.p1.cards) cardsById[c.id] = c;

  const orderingCards = orderingIds.map((id) => cardsById[id]).filter(Boolean);

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
        <div className="text-white/60 text-xs">{title}</div>
        <h2 className="text-white text-lg font-semibold">Ordene as cartas</h2>
        <p className="text-white/70 text-sm">
          Tema: <span className="text-white/90">{theme}</span>
        </p>
        <p className="text-white/60 text-sm mt-2">
          Dica: use as setas pra ajustar a posição. Quando estiver ok, confirme.
        </p>

        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 text-white"
            onClick={onConfirm}
          >
            {confirmLabel ?? 'Confirmar ordem'}
          </button>
        </div>
      </div>

      {orderingCards.length === 0 ? (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-white/70">Sem deck para ordenar.</div>
      ) : (
        <div className="space-y-4">
          {orderingCards.map((c, idx) => (
            <div key={c.id} className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <div className="flex items-center justify-between gap-3">
                <div className="text-white/70 text-sm">
                  Posição <span className="text-white font-semibold">#{idx + 1}</span>
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    className="px-3 py-2 rounded-xl border border-white/10 bg-white/10 hover:bg-white/15 text-white"
                    onClick={() => onMove(idx, Math.max(0, idx - 1))}
                    disabled={idx === 0}
                  >
                    ▲
                  </button>
                  <button
                    type="button"
                    className="px-3 py-2 rounded-xl border border-white/10 bg-white/10 hover:bg-white/15 text-white"
                    onClick={() => onMove(idx, Math.min(orderingCards.length - 1, idx + 1))}
                    disabled={idx === orderingCards.length - 1}
                  >
                    ▼
                  </button>
                </div>
              </div>

              <div className="mt-3">{renderCard(c)}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
