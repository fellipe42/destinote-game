// components/gamev1/Phase2RankFinal.tsx
'use client';

import { useMemo } from 'react';
import type { GameState } from '@/lib/game/v1/types';

export default function Phase2RankFinal({
  game,
  ordering,
  onSetRanker,
  onMove,
  onSubmit,
  renderCard,
}: {
  game: GameState;
  ordering: string[];
  onSetRanker: (playerId: string) => void;
  onMove: (from: number, to: number) => void;
  onSubmit: (playerId: string, ordering: string[]) => void;
  renderCard?: (card: GameState['p1']['cards'][number]) => React.ReactNode;
}) {
  const p2 = game.p2;
  if (!p2) return null;

  const theme = p2.theme ?? '(tema fase 2)';
  const ranker = game.players[p2.currentRankerIndex];

  const cardsById = useMemo(() => {
    const m: Record<string, GameState['p1']['cards'][number]> = {};
    for (const c of game.p1.cards) m[c.id] = c;
    return m;
  }, [game.p1.cards]);

  const submittedCount = useMemo(() => Object.keys(p2.finalRankings ?? {}).length, [p2.finalRankings]);

  const orderingCards = useMemo(() => {
    const deckSet = new Set(p2.deckCardIds);
    const cleaned = ordering.filter((id) => deckSet.has(id));
    return cleaned.map((id) => cardsById[id]).filter(Boolean);
  }, [ordering, p2.deckCardIds, cardsById]);

  const topCard = orderingCards[0] ?? null;

  return (
    <div className="space-y-4">
      <div className="game-panel p-4">
        <div className="text-white/60 text-xs">Fase 2 — Ordenação final (secreta)</div>
        <div className="mt-2 text-white text-2xl md:text-3xl font-semibold leading-tight">{theme}</div>

        <div className="mt-4 text-white/80 leading-relaxed space-y-2">
          <p>
            <b>Regra de ouro:</b> você <b>não pode revelar</b> qual carta é sua.
          </p>
          <p className="text-white/70">
            Ordene as cartas como você acha que melhor combina com o tema. A carta em <b>#1</b> é seu voto pro vencedor.
          </p>
          <p className="text-white/70">
            <b>Vitória:</b> maioria no topo vence (autor da carta).
            <br />
            <b>Plot twist:</b> se todo mundo (exceto o autor) colocar a mesma carta no topo, o autor perde por ser óbvio
            demais e todo mundo exceto ele vence.
          </p>
        </div>

        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="block text-white/70 text-xs mb-1">Quem está ordenando agora?</label>
            <select
              className="w-full rounded-xl border border-white/10 bg-black/40 backdrop-blur-md px-3 py-2 text-white outline-none focus:ring-2 focus:ring-white/20"
              value={ranker?.id ?? ''}
              onChange={(e) => onSetRanker(e.target.value)}
            >
              {game.players.map((p) => (
                <option key={p.id} value={p.id} className="bg-zinc-900 text-white">
                  {p.name}
                </option>
              ))}
            </select>

            <div className="text-white/40 text-xs mt-2 leading-snug">
              Progresso: <span className="text-white/70">{submittedCount}</span> / {game.players.length} enviaram.
            </div>
          </div>

          <div className="game-card p-3">
            <div className="text-white/60 text-xs">Seu topo atual (#1)</div>
            <div className="mt-2 text-white/90 font-semibold">{topCard ? `Card #${topCard.number}` : '—'}</div>
            <div className="text-white/70 mt-1 leading-snug">{topCard ? topCard.text : 'Sem cartas.'}</div>
          </div>
        </div>

        <div className="mt-4">
          <button
            type="button"
            className="w-full md:w-auto px-5 py-3 rounded-2xl border border-white/10 bg-white/10 hover:bg-white/15 text-white font-semibold"
            onClick={() => {
              if (!ranker) return;
              onSubmit(ranker.id, ordering);
            }}
          >
            Enviar minha ordem (e revelar quando todos enviarem)
          </button>
          <div className="text-white/45 text-xs mt-2 leading-snug">
            O último a enviar automaticamente dispara a revelação final.
          </div>
        </div>
      </div>

      <div className="game-panel p-4">
        <div className="text-white/70 text-sm font-medium">Sua ordem</div>
        <div className="text-white/45 text-xs mt-1 leading-snug">
          Use ▲▼. (Drag só quando a gente quiser implementar bonito com DnD depois.)
        </div>

        {orderingCards.length === 0 ? (
          <div className="mt-3 text-white/60">Sem deck para ordenar.</div>
        ) : (
          <div className="mt-3 space-y-3">
            {orderingCards.map((c, idx) => (
              <div key={c.id} className="game-card p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-white/60 text-xs">Posição</div>
                    <div className="text-white text-lg font-semibold">#{idx + 1}</div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      className="px-3 py-2 rounded-xl border border-white/10 bg-white/10 hover:bg-white/15 text-white disabled:opacity-40"
                      onClick={() => onMove(idx, Math.max(0, idx - 1))}
                      disabled={idx === 0}
                      title="Subir"
                    >
                      ▲
                    </button>
                    <button
                      type="button"
                      className="px-3 py-2 rounded-xl border border-white/10 bg-white/10 hover:bg-white/15 text-white disabled:opacity-40"
                      onClick={() => onMove(idx, Math.min(orderingCards.length - 1, idx + 1))}
                      disabled={idx === orderingCards.length - 1}
                      title="Descer"
                    >
                      ▼
                    </button>
                  </div>
                </div>

                <div className="mt-3">
                  {renderCard ? (
                    renderCard(c)
                  ) : (
                    <div className="text-white/85 leading-relaxed">
                      <div className="text-white/45 text-xs mb-2">Card #{c.number}</div>
                      {c.text}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
