// components/gameV1/Phase1Voting.tsx
'use client';

import { useMemo } from 'react';
import type { GameState, Reaction } from '@/lib/game/v1/types';
import { REACTIONS } from '@/lib/game/v1/types';

export default function Phase1Voting({
  game,
  renderCard,
  onSetVoter,
  onVote,
  onFinishVoting,
}: {
  game: GameState;
  renderCard: (card: GameState['p1']['cards'][number]) => React.ReactNode;
  onSetVoter: (voterId: string) => void;
  onVote: (voterId: string, cardId: string, reaction: Reaction) => void;
  onFinishVoting: () => void;
}) {
  const voting = game.p1Voting;
  if (!voting) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-white/70">
        Sessão de votação não inicializada.
      </div>
    );
  }

  const voter = game.players[voting.currentVoterIndex] ?? null;
  const voterId = voter?.id ?? '';

  const used = voterId ? (voting.votesUsedByVoter[voterId] ?? 0) : 0;
  const remaining = Math.max(0, game.config.maxReactionsPerVoter - used);

  const cardsForVoting = useMemo(() => {
    const all = [...game.p1.cards];

    // Embaralha visualmente de forma determinística (por id)
    all.sort((a, b) => a.id.localeCompare(b.id));

    // Se for votação por rodada, filtra pelas cartas daquela rodada
    if (voting.scope === 'round' && voting.round != null) {
      return all.filter((c) => c.round === voting.round);
    }

    // final = todas
    return all;
  }, [game.p1.cards, voting.scope, voting.round]);

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-white/10 bg-white/5 p-4 space-y-3">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
          <div>
            <div className="text-white/60 text-xs">Fase 1 — Votação</div>
            <h2 className="text-white text-lg font-semibold">Reaja nas melhores ações</h2>
            <p className="text-white/70 text-sm">
              Regra: {game.config.allowSelfVote ? 'pode votar no próprio card' : 'não votar no próprio card'} • limite
              por votante: {game.config.maxReactionsPerVoter}
            </p>
          </div>

          <button
            type="button"
            className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 text-white"
            onClick={onFinishVoting}
          >
            Finalizar votação
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 items-end">
          <div>
            <label className="block text-white/70 text-xs mb-1">Quem está votando agora?</label>
            <select
              className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-white"
              value={voterId}
              onChange={(e) => onSetVoter(e.target.value)}
            >
              {game.players.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          <div className="rounded-xl border border-white/10 bg-black/20 p-3">
            <div className="text-white/60 text-xs">Restantes para {voter?.name ?? '—'}</div>
            <div className="text-white text-2xl font-semibold">{remaining}</div>
          </div>
        </div>
      </div>

      {cardsForVoting.length === 0 ? (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-white/70">Sem cartas para votar.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {cardsForVoting.map((c) => {
            const isOwn = voterId ? c.authorId === voterId : false;
            const blocked = (!game.config.allowSelfVote && isOwn) || remaining <= 0;

            return (
              <div key={c.id} className="space-y-2">
                <div className="text-xs text-white/50 flex items-center justify-between">
                  <span>Card #{c.number}</span>
                  {!game.config.allowSelfVote && isOwn ? (
                    <span className="text-amber-200/80">seu card (bloqueado)</span>
                  ) : (
                    <span className="text-white/30">anônimo</span>
                  )}
                </div>

                {renderCard(c)}

                <div className="flex flex-wrap gap-2">
                  {REACTIONS.map((r) => (
                    <button
                      key={r}
                      type="button"
                      className={`px-3 py-2 rounded-xl border border-white/10 ${
                        blocked ? 'bg-white/5 text-white/30 cursor-not-allowed' : 'bg-white/10 hover:bg-white/15 text-white'
                      }`}
                      disabled={!voterId || blocked}
                      onClick={() => {
                        if (!voterId) return;
                        if (!game.config.allowSelfVote && isOwn) return;
                        if (remaining <= 0) return;
                        onVote(voterId, c.id, r);
                      }}
                      title={remaining <= 0 ? 'Limite atingido' : 'Votar'}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
