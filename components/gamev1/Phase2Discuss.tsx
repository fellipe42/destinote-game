// components/gamev1/Phase2Discuss.tsx
'use client';

import type { GameState } from '@/lib/game/v1/types';

export default function Phase2Discuss({
  game,
  renderCard,
  onGoToFinalRank,
  onReveal,
}: {
  game: GameState;
  renderCard?: (card: GameState['p1']['cards'][number]) => React.ReactNode;
  onGoToFinalRank: () => void;
  onReveal: () => void;
}) {
  const theme = game.p2?.theme ?? '(tema fase 2)';
  const deckIds = game.p2?.deckCardIds ?? [];

  const cardsById: Record<string, GameState['p1']['cards'][number]> = {};
  for (const c of game.p1.cards) cardsById[c.id] = c;
  const deckCards = deckIds.map((id) => cardsById[id]).filter(Boolean);

  return (
    <div className="space-y-4">
      <div className="game-panel p-4">
        <div className="text-white/60 text-xs">Fase 2 — Discussão</div>

        <div className="mt-2 text-white text-2xl md:text-3xl font-semibold leading-tight">
          {theme}
        </div>

        <div className="mt-4 text-white/80 leading-relaxed space-y-2">
          <p>
            <b>Objetivo:</b> convencer a maioria que <b>a sua carta merece estar no topo</b>.
          </p>
          <p className="text-white/70">
            O voto é secreto e <b>você não pode dizer qual carta é sua</b> — mas pode argumentar, comparar e “advogar”
            por ideias. Todo mundo é livre pra opinar.
          </p>
          <p className="text-white/70">
            <b>Vitória:</b> ganha o autor da carta que ficar em <b>#1</b> para a <b>maioria</b>.
            <br />
            <b>Plot twist:</b> se a mesma carta ficar em <b>#1</b> por <b>unanimidade entre os não-autores</b> (o voto do
            autor não conta pra unanimidade), o autor “perde por ser óbvio demais” e <b>todo mundo exceto ele vence</b>.
          </p>
        </div>

        <div className="mt-5">
          <button
            type="button"
            className="w-full md:w-auto px-5 py-3 rounded-2xl border border-white/10 bg-white/10 hover:bg-white/15 text-white font-semibold"
            onClick={onGoToFinalRank}
          >
            Finalizar discussão → Ordenar e Revelar vencedor
          </button>

          <div className="mt-2 text-white/45 text-xs leading-snug">
            Dica: “Para você vencer, diga por que sua carta deveria estar no topo.”
          </div>
        </div>
      </div>

      <div className="game-panel p-4">
        <div className="flex items-end justify-between gap-3">
          <div>
            <div className="text-white/70 text-sm font-medium">Deck da Fase 2</div>
            <div className="text-white/45 text-xs leading-snug">Sem revelar autores. Usem isso pra comparar ideias.</div>
          </div>
          <div className="text-white/35 text-xs">{deckCards.length} cartas</div>
        </div>

        {deckCards.length === 0 ? (
          <div className="mt-3 text-white/60">Sem deck.</div>
        ) : (
          <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
            {deckCards.map((c) => (
              <div key={c.id} className="game-card p-3">
                <div className="text-white/45 text-xs mb-2">Card #{c.number}</div>
                {renderCard ? (
                  renderCard(c)
                ) : (
                  <div className="text-white/85 leading-relaxed">{c.text}</div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          className="px-4 py-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-white/80"
          onClick={onReveal}
          title="Atalho de debug: revela direto (não recomendado para produção)"
        >
          Revelar (debug)
        </button>
      </div>
    </div>
  );
}
