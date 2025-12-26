// components/gamev1/Results.tsx
'use client';

import { useMemo } from 'react';
import type { GameState } from '@/lib/game/v1/types';
import { REACTIONS } from '@/lib/game/v1/types';

export default function Results({ game }: { game: GameState }) {
  const cardsById = useMemo(() => {
    const m: Record<string, GameState['p1']['cards'][number]> = {};
    for (const c of game.p1.cards) m[c.id] = c;
    return m;
  }, [game.p1.cards]);

  const reveal = game.reveal;

  const p1 = useMemo(() => {
    const key = game.p1Voting?.sessionKey ?? 'final';
    const votes = (game.votes ?? []).filter((v) => v.sessionKey === key);

    const scoreByCard: Record<string, number> = {};
    const reactionsByCard: Record<string, Record<string, number>> = {};

    for (const c of game.p1.cards) {
      scoreByCard[c.id] = 0;
      reactionsByCard[c.id] = { '👍': 0, '❤️': 0, '😂': 0, '🔥': 0, '💀': 0 };
    }

    for (const v of votes) {
      scoreByCard[v.cardId] = (scoreByCard[v.cardId] ?? 0) + 1;
      const map =
        reactionsByCard[v.cardId] ??
        (reactionsByCard[v.cardId] = { '👍': 0, '❤️': 0, '😂': 0, '🔥': 0, '💀': 0 });
      map[v.reaction] = (map[v.reaction] ?? 0) + 1;
    }

    const scored = Object.entries(scoreByCard)
      .map(([cardId, points]) => ({ cardId, points }))
      .sort((a, b) => b.points - a.points);

    return { votes, scoreByCard, reactionsByCard, top: scored.slice(0, 10) };
  }, [game.votes, game.p1.cards, game.p1Voting?.sessionKey]);

  const deckCards = useMemo(() => {
    const ids = reveal?.deckCardIds ?? game.p2?.deckCardIds ?? [];
    return ids.map((id) => cardsById[id]).filter(Boolean);
  }, [reveal?.deckCardIds, game.p2?.deckCardIds, cardsById]);

  const collective = useMemo(() => {
    if (!reveal?.collectiveWin || !reveal.collectiveWinningCardId) return null;
    const card = cardsById[reveal.collectiveWinningCardId];
    if (!card) return null;
    const author = game.players.find((p) => p.id === card.authorId) ?? null;
    return { card, author };
  }, [reveal, cardsById, game.players]);

  const winner = useMemo(() => {
    if (!reveal?.winningCardId) return null;
    const card = cardsById[reveal.winningCardId];
    if (!card) return null;
    const author = game.players.find((p) => p.id === card.authorId) ?? null;
    return { card, author };
  }, [reveal, cardsById, game.players]);

  const tieCards = useMemo(() => {
    if (!reveal?.isTie) return [];
    return (reveal.tiedTopCardIds ?? []).map((id) => cardsById[id]).filter(Boolean);
  }, [reveal, cardsById]);

  const topCountsSorted = useMemo(() => {
    const counts = reveal?.topCounts ?? {};
    const entries = Object.entries(counts).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
    return entries.map(([cardId, count]) => ({ card: cardsById[cardId], count })).filter((x) => !!x.card);
  }, [reveal?.topCounts, cardsById]);

  return (
    <div className="space-y-4">
      <div className="game-panel p-4">
        <div className="text-white/60 text-xs">Resultados</div>
        <h2 className="text-white text-xl md:text-2xl font-semibold mt-1">
          REVELAÇÃO DO RESULTADO FINAL
        </h2>
        <div className="text-white/50 text-xs mt-1 leading-snug">
          O universo decidiu. E ele adora um plot twist.
        </div>
      </div>

      {/* Reveal (Fase 2) */}
      {reveal ? (
        <div className="game-panel p-4 space-y-4">
          {/* Header cinema */}
          {reveal.collectiveWin && collective ? (
            <div className="game-card p-5">
              <div className="text-white/60 text-xs">Fase 2 — Resultado</div>
              <div className="mt-2 text-3xl md:text-4xl font-extrabold text-emerald-200">
                TODO MUNDO VENCEU!
              </div>
              <div className="text-white/70 mt-2 leading-relaxed">
                Vocês foram <b>unânimes</b> (sem contar o voto do autor) na carta do topo.
                <br />
                O autor <b>não vence</b> — porque ficou óbvio demais. A vida é cruel, e isso é engraçado.
              </div>

              <div className="mt-4 game-card p-4">
                <div className="text-white/60 text-xs">Carta escolhida pela unanimidade</div>
                <div className="text-white font-semibold mt-1">
                  Card #{collective.card.number} — autor: {collective.author?.name ?? '—'} (não vence)
                </div>
                <div className="text-white/85 mt-2">{collective.card.text}</div>
              </div>
            </div>
          ) : reveal.isTie ? (
            <div className="game-card p-5">
              <div className="text-white/60 text-xs">Fase 2 — Resultado</div>
              <div className="mt-2 text-3xl md:text-4xl font-extrabold text-amber-200">
                EMPATE
              </div>
              <div className="text-white/70 mt-2 leading-relaxed">
                A maioria não existiu hoje. O caos venceu. (Ele sempre vence.)
              </div>

              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                {tieCards.map((c) => {
                  const author = game.players.find((p) => p.id === c.authorId);
                  return (
                    <div key={c.id} className="game-card p-4">
                      <div className="text-white/60 text-xs">Empatou no topo</div>
                      <div className="text-white font-semibold mt-1">
                        Card #{c.number} — {author?.name ?? '—'}
                      </div>
                      <div className="text-white/85 mt-2">{c.text}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : winner ? (
            <div className="game-card p-5">
              <div className="text-white/60 text-xs">Fase 2 — Resultado</div>
              <div className="mt-2 text-3xl md:text-4xl font-extrabold text-white">
                {winner.author?.name ?? 'ALGUÉM'} VENCEU!
              </div>
              <div className="text-white/70 mt-2 leading-relaxed">
                A maioria colocou esta carta no topo. Democracia funcionando, por incrível que pareça.
              </div>

              <div className="mt-4 game-card p-4">
                <div className="text-white/60 text-xs">Carta vencedora</div>
                <div className="text-white font-semibold mt-1">
                  Card #{winner.card.number} — {winner.author?.name ?? '—'}
                </div>
                <div className="text-white/85 mt-2">{winner.card.text}</div>
              </div>
            </div>
          ) : (
            <div className="game-card p-5">
              <div className="text-white/60 text-xs">Fase 2 — Resultado</div>
              <div className="mt-2 text-2xl font-bold text-white">Sem vencedor</div>
              <div className="text-white/70 mt-2">Não deu pra determinar topo. (Isso é raro. E preocupante.)</div>
            </div>
          )}

          {/* Transparência / drama */}
          <div className="game-panel p-4">
            <div className="text-white/70 text-sm font-medium">Votos de Topo (#1)</div>
            <div className="text-white/45 text-xs mt-1 leading-snug">
              Quantas pessoas colocaram cada carta em #1.
            </div>

            {topCountsSorted.length === 0 ? (
              <div className="text-white/60 mt-3">Sem dados de voto.</div>
            ) : (
              <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
                {topCountsSorted.slice(0, 10).map(({ card, count }) => {
                  const author = game.players.find((p) => p.id === card!.authorId);
                  return (
                    <div key={card!.id} className="game-card p-4">
                      <div className="flex items-center justify-between gap-3">
                        <div className="text-white/85 font-semibold">
                          Card #{card!.number}
                        </div>
                        <div className="text-white/70 tabular-nums">
                          <span className="text-white/40 text-xs mr-1">#1</span>
                          <span className="font-semibold">{count}</span>
                        </div>
                      </div>
                      <div className="text-white/60 text-xs mt-1">Autor: {author?.name ?? '—'}</div>
                      <div className="text-white/85 mt-2">{card!.text}</div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Deck recap */}
          <div className="game-panel p-4">
            <div className="text-white/70 text-sm font-medium">Deck da Fase 2 (recap)</div>
            <div className="text-white/45 text-xs mt-1 leading-snug">Aqui sim pode mostrar autores, porque acabou.</div>

            <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
              {deckCards.map((c) => {
                const author = game.players.find((p) => p.id === c.authorId);
                return (
                  <div key={c.id} className="game-card p-4">
                    <div className="text-white/60 text-xs">Card #{c.number}</div>
                    <div className="text-white/85 mt-2">{c.text}</div>
                    <div className="text-white/50 text-xs mt-2">Autor: {author?.name ?? '—'}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : null}

      {/* Phase 1 scoreboard */}
      <div className="game-panel p-4 space-y-3">
        <div className="text-white/60 text-xs">Fase 1 — Placar (reactions)</div>

        {p1.top.length === 0 ? (
          <div className="text-white/60">Sem votos registrados.</div>
        ) : (
          <div className="space-y-2">
            {p1.top.slice(0, 8).map(({ cardId, points }, idx) => {
              const c = cardsById[cardId];
              if (!c) return null;
              const author = game.players.find((p) => p.id === c.authorId);
              const reactions = p1.reactionsByCard[cardId] ?? ({} as any);

              return (
                <div key={cardId} className="game-card p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-white/80 min-w-0">
                      <span className="text-white/40 text-xs mr-2">#{idx + 1}</span>
                      <span className="text-white/90 font-semibold">Card #{c.number}</span>{' '}
                      <span className="text-white/50">—</span>{' '}
                      <span className="text-white/70">{author?.name ?? '—'}</span>
                    </div>
                    <div className="text-white/70">
                      <span className="text-white/40 text-xs mr-1">pontos</span>
                      <span className="text-white font-semibold tabular-nums">{points}</span>
                    </div>
                  </div>

                  <div className="text-white/85 mt-2">{c.text}</div>

                  <div className="flex flex-wrap gap-2 mt-3 text-white/70 text-sm">
                    {REACTIONS.map((r) => (
                      <span key={r} className="px-2 py-1 rounded-xl border border-white/10 bg-white/5">
                        {r} <span className="tabular-nums">{reactions[r] ?? 0}</span>
                      </span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="text-white/40 text-xs leading-snug">
          Nota: este placar é robusto e funciona só com <code>game.votes</code>.
        </div>
      </div>
    </div>
  );
}
