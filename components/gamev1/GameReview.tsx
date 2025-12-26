// components/gamev1/GameReview.tsx
'use client';

import type { GameState } from '@/lib/game/v1/types';
import GoalCard from '@/components/GoalCard';

const fakeCategory = { id: 0, name: 'Jogo', color: 'rgba(255,255,255,0.35)' };

export default function GameReview(props: { game: GameState; onGoVoting: () => void; onResetToSetup: () => void }) {
  const { game } = props;

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-white/10 bg-black/40 backdrop-blur-xl shadow-lg shadow-black/30 p-5 md:p-6">
        <h2 className="text-2xl font-semibold">Review (checagem rápida)</h2>
        <p className="text-white/70 mt-1">
          Aqui os autores ainda aparecem. Se estiver tudo ok, vai pra votação anônima.
        </p>

        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={props.onGoVoting}
            className="rounded-xl px-4 py-2 bg-white/15 hover:bg-white/20 border border-white/10 font-semibold"
          >
            Ir para votação
          </button>

          <button
            type="button"
            onClick={props.onResetToSetup}
            className="rounded-xl px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10"
          >
            Novo jogo
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {game.cards.map((c) => {
          const author = game.players.find((p) => p.id === c.authorId)?.name ?? '—';
          return (
            <div key={c.id} className="relative">
              <div className="absolute right-3 top-3 z-20 rounded-full bg-black/50 border border-white/10 px-3 py-1 text-xs text-white/80">
                Autor: {author}
              </div>
              <GoalCard id={1} title={c.text} category={fakeCategory} variant="regular" />
              <div className="text-xs text-white/60 mt-1 pl-2">
                <span className="text-white/50">Tema:</span> {c.promptText}
              </div>
            </div>
          );
        })}
      </div>

      {game.cards.length === 0 && (
        <div className="rounded-xl border border-white/10 bg-black/30 p-4 text-white/70">
          Nenhum card foi criado (tudo vazio/pulado). Você pode voltar e tentar de novo.
        </div>
      )}
    </div>
  );
}
