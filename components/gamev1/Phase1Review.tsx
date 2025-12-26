'use client';

import type { GameState } from '@/lib/game/v1/types';

export default function Phase1Review({
  game,
  renderCard,
  onGoVoting,
}: {
  game: GameState;
  renderCard: (card: GameState['p1']['cards'][number]) => React.ReactNode;
  onGoVoting: () => void;
}) {
  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-white/10 bg-white/5 p-4 flex items-start justify-between gap-4">
        <div>
          <div className="text-white/60 text-xs">Fase 1 — Review</div>
          <h2 className="text-white text-lg font-semibold">Cartas criadas</h2>
          <p className="text-white/70 text-sm">
            Total: <span className="text-white">{game.p1.cards.length}</span>
          </p>
        </div>
        <button
          type="button"
          className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 text-white"
          onClick={onGoVoting}
        >
          Ir para votação
        </button>
      </div>

      {game.p1.cards.length === 0 ? (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-white/70">
          Nenhuma carta foi criada. (Sim, isso é uma escolha artística…)
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {game.p1.cards.map((c) => (
            <div key={c.id} className="space-y-2">
              <div className="text-xs text-white/60 flex items-center justify-between">
                <span>Rodada {c.round}</span>
                <span>
                  Autor: <span className="text-white/85">{c.playerName}</span>
                </span>
              </div>
              {renderCard(c)}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
