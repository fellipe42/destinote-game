// components/game/BoardClient.tsx
'use client';

import { useEffect, useMemo, useState } from 'react';
import type { GameState } from '@/lib/game/v2/types';
import { createEmpty } from '@/lib/game/v2/engine';
import { loadRoom } from '@/lib/game/v2/storage';
import { gameChannelName, normalizeIncoming, type GameBroadcastMessage } from '@/lib/game/v2/bus';
import { Button } from '@/components/ui/button';

function phaseAction(state: GameState): string {
  switch (state.phase) {
    case 'setup':
      return 'Aguardando setup…';
    case 'p1_write': {
      const p = state.players[state.p1.playerIndex];
      return `AGORA: ${p?.name ?? 'alguém'} escrevendo`;
    }
    case 'p1_review':
      return 'AGORA: revisando / esperando confirmações';
    case 'p1_vote':
      return 'AGORA: votação da Fase 1';
    case 'p1_results':
      return 'Fase 1 finalizada — preparando Fase 2';
    case 'p2_intro':
      return 'AGORA: iniciando a Fase 2';
    case 'p2_rank': {
      const r = state.players[state.p2.raterIndex];
      return `AGORA: ${r?.name ?? 'alguém'} ranqueando`;
    }
    case 'p2_discuss':
      return 'AGORA: discussão + ordem final';
    case 'reveal':
      return 'AGORA: revelação final';
    default:
      return 'Aguardando…';
  }
}

export default function BoardClient({ roomId }: { roomId: string }) {
  const [state, setState] = useState<GameState>(() => createEmpty(roomId));

  useEffect(() => {
    const initial = loadRoom(roomId);
    if (initial) setState(initial);

    const bc = new BroadcastChannel(gameChannelName(roomId));
    const onMsg = (ev: MessageEvent) => {
      const msg = normalizeIncoming(ev.data) as GameBroadcastMessage | null;
      if (msg?.type === 'state' && msg.state?.roomId === roomId) setState(msg.state);
    };
    bc.addEventListener('message', onMsg);

    return () => {
      bc.removeEventListener('message', onMsg);
      bc.close();
    };
  }, [roomId]);

  const action = phaseAction(state);

  const theme =
    state.phase === 'p1_vote' && !state.config.showThemeInVoting
      ? null
      : state.phase.startsWith('p1')
        ? state.p1.currentTheme
        : state.p2.theme;

  const cardsById = useMemo(() => {
    const m = new Map<string, any>();
    for (const c of state.p1.cards) m.set(c.id, c);
    return m;
  }, [state.p1.cards]);

  const p2Cards = useMemo(() => {
    const byId = new Map(state.p1.cards.map((c) => [c.id, c]));
    return state.p2.ordering.map((id) => byId.get(id)).filter(Boolean) as Array<any>;
  }, [state]);

  const reveal = (state as any).reveal as any;

  const revealResolved = useMemo(() => {
    const p2 = reveal?.phase2;
    if (!p2) return null;

    const collectiveWin = Boolean(p2.collectiveWin);
    const cardId = collectiveWin ? p2.collectiveWinningCardId : p2.winningCardId;
    if (!cardId) return { collectiveWin, card: null, author: null };

    const card = cardsById.get(cardId) ?? null;
    const author = card ? state.players.find((p) => p.id === card.authorId) ?? null : null;

    return { collectiveWin, card, author };
  }, [reveal, cardsById, state.players]);

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="mx-auto max-w-6xl px-6 py-10">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-white/60 text-sm">DESTINOTE • BOARD</div>
            <div className="mt-2 text-3xl md:text-5xl font-bold">{action}</div>
            {theme ? (
              <div className="mt-4 text-xl md:text-2xl text-white/85">
                <span className="text-white/60">Tema:</span> {theme}
              </div>
            ) : (
              <div className="mt-4 text-xl md:text-2xl text-white/40">Tema oculto</div>
            )}
          </div>

          <Button asChild variant="secondary" className="bg-white/10 text-white hover:bg-white/15" title="Abrir jogo no celular">
            <a href={`/game?room=${encodeURIComponent(roomId)}`}>Abrir no celular</a>
          </Button>
        </div>

        <div className="mt-10 rounded-2xl border border-white/10 bg-white/5 p-6">
          {state.phase === 'p2_discuss' && (
            <div className="text-white/80">
              <div className="text-lg font-semibold text-white">Fase 2 — Discussão</div>
              <div className="mt-2 text-white/70">
                Convença a galera: <b>“por que minha carta deveria estar no topo?”</b>
              </div>

              <div className="mt-5 grid gap-2">
                {p2Cards.map((c, idx) => (
                  <div key={c.id} className="rounded-xl border border-white/10 bg-black/30 px-4 py-3">
                    <div className="text-xs text-white/50 mb-1">#{idx + 1}</div>
                    <div className="text-base md:text-lg">{c.text}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {state.phase === 'reveal' && reveal?.phase2 ? (
            <div className="text-white/90">
              <div className="text-white/60 text-sm">REVELAÇÃO DO RESULTADO FINAL</div>

              <div className="mt-3 rounded-3xl border border-white/10 bg-black/40 p-6 md:p-8">
                {revealResolved?.collectiveWin ? (
                  <div>
                    <div className="text-3xl md:text-6xl font-black tracking-tight text-emerald-200">
                      TODO MUNDO VENCEU
                    </div>
                    <div className="mt-2 text-white/70 text-lg md:text-2xl">
                      Unanimidade (ignorando o voto do autor). O grupo escolheu o mesmo topo.
                    </div>

                    {revealResolved.card ? (
                      <div className="mt-6 rounded-2xl border border-white/10 bg-black/30 p-5">
                        <div className="text-white/60 text-sm">Carta escolhida</div>
                        <div className="mt-2 text-2xl md:text-3xl font-bold">{revealResolved.card.text}</div>
                        <div className="mt-3 text-white/60">
                          Autor: <span className="text-white/85">{revealResolved.author?.name ?? '—'}</span>
                          <span className="text-white/40"> (o voto dele não conta pra unanimidade)</span>
                        </div>
                      </div>
                    ) : (
                      <div className="mt-6 text-white/70">Sem dados do card coletivo (bridge não trouxe).</div>
                    )}
                  </div>
                ) : (
                  <div>
                    <div className="text-3xl md:text-6xl font-black tracking-tight text-white">
                      {revealResolved?.author?.name ?? 'ALGUÉM'} VENCEU
                    </div>
                    <div className="mt-2 text-white/70 text-lg md:text-2xl">
                      A maioria colocou a mesma carta no topo. Manipulação social aprovada.
                    </div>

                    {revealResolved?.card ? (
                      <div className="mt-6 rounded-2xl border border-white/10 bg-black/30 p-5">
                        <div className="text-white/60 text-sm">Carta vencedora</div>
                        <div className="mt-2 text-2xl md:text-3xl font-bold">{revealResolved.card.text}</div>
                        <div className="mt-3 text-white/60">
                          Autor: <span className="text-white/85">{revealResolved.author?.name ?? '—'}</span>
                        </div>
                      </div>
                    ) : (
                      <div className="mt-6 text-white/70">Sem dados do vencedor.</div>
                    )}
                  </div>
                )}
              </div>

              {/* Transparência: topCounts (legal pra “drama”) */}
              <div className="mt-6 rounded-2xl border border-white/10 bg-black/25 p-5">
                <div className="text-white/70 font-semibold">Votos de topo (quantas pessoas colocaram cada carta em #1)</div>
                <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-2">
                  {Object.entries(reveal.phase2.topCounts ?? {})
                    .sort((a, b) => (b[1] as number) - (a[1] as number))
                    .slice(0, 10)
                    .map(([cardId, n]) => {
                      const c = cardsById.get(cardId);
                      return (
                        <div key={cardId} className="rounded-xl border border-white/10 bg-black/20 p-3 flex items-start justify-between gap-3">
                          <div className="text-white/85">{c?.text ?? '—'}</div>
                          <div className="text-white/60 tabular-nums">{Number(n)}</div>
                        </div>
                      );
                    })}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-white/70">Aguardando…</div>
          )}
        </div>
      </div>
    </div>
  );
}
