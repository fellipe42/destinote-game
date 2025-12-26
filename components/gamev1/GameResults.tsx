// components/gamev1/GameResults.tsx
'use client';

import type { GameState } from '@/lib/game/v1/types';
import GoalCard from '@/components/GoalCard';

const fakeCategory = { id: 0, name: 'Jogo', color: 'rgba(255,255,255,0.35)' };

export default function GameResults(props: {
  game: GameState;
  onExport: () => void;
  onSaveLocal: () => void;
  onNewGame: () => void;
  onStartPhase2: () => void;
}) {
  const { game } = props;
  const ranking = game.results?.ranking ?? [];

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-white/10 bg-black/40 backdrop-blur-xl shadow-lg shadow-black/30 p-5 md:p-6">
        <h2 className="text-2xl font-semibold">Resultados — Fase 1</h2>
        <p className="text-white/70 mt-1">
          Cada reação vale 1 ponto. Agora você pode exportar tudo ou seguir para a Fase 2 (escala maluca).
        </p>

        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={props.onExport}
            className="rounded-xl px-4 py-2 bg-white/15 hover:bg-white/20 border border-white/10 font-semibold"
          >
            Exportar JSON
          </button>

          <button
            type="button"
            onClick={props.onSaveLocal}
            className="rounded-xl px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10"
          >
            Salvar local
          </button>

          <button
            type="button"
            onClick={props.onStartPhase2}
            disabled={ranking.length < game.players.length}
            className="rounded-xl px-4 py-2 bg-emerald-500/15 hover:bg-emerald-500/20 border border-emerald-500/20 text-emerald-100 disabled:opacity-40"
            title={ranking.length < game.players.length ? 'Precisa de pelo menos 1 carta por jogador para a Fase 2' : ''}
          >
            Ir para Fase 2
          </button>

          <div className="flex-1" />

          <button
            type="button"
            onClick={props.onNewGame}
            className="rounded-xl px-4 py-2 bg-red-500/15 hover:bg-red-500/20 border border-red-500/20 text-red-100"
          >
            Novo jogo
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {ranking.map((r, idx) => {
          const card = game.cards.find((c) => c.id === r.cardId);
          if (!card) return null;
          return (
            <div key={r.cardId} className="relative rounded-2xl border border-white/10 bg-black/20 p-3">
              <div className="absolute right-3 top-3 rounded-full bg-black/50 border border-white/10 px-3 py-1 text-xs text-white/80">
                #{idx + 1} • {r.score} pts
              </div>
              <GoalCard id={1} title={card.text} category={fakeCategory} variant="regular" />
              <div className="text-xs text-white/60 mt-1 pl-2">
                <span className="text-white/50">Tema:</span> {card.promptText}
              </div>
            </div>
          );
        })}
      </div>

      {ranking.length === 0 && (
        <div className="rounded-xl border border-white/10 bg-black/30 p-4 text-white/70">
          Sem ranking (nenhum voto / nenhum card).
        </div>
      )}
    </div>
  );
}
