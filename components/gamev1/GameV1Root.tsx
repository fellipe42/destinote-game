// components/gamev1/GameV1Root.tsx
'use client';

import { useEffect, useMemo, useState } from 'react';

import GameShell from '@/components/gamev1/GameShell';
import Setup from '@/components/gamev1/Setup';
import Phase1Writing from '@/components/gamev1/Phase1Writing';
import Phase1Review from '@/components/gamev1/Phase1Review';
import Phase1Voting from '@/components/gamev1/Phase1Voting';
import Phase2Discuss from '@/components/gamev1/Phase2Discuss';
import Phase2RankFinal from '@/components/gamev1/Phase2RankFinal';
import Results from '@/components/gamev1/Results';

import type { GameState } from '@/lib/game/v1/types';
import {
  startGame,
  submitAction,
  nextTurn,
  startPhase1Voting,
  setCurrentVoter,
  addVote,
  endPhase1Voting,
  continueAfterPhase1Results,
  goToDiscuss,
  goToFinalRank,
  setCurrentRanker,
  submitFinalRanking,
} from '@/lib/game/v1/engine';

import { loadThemeBank as loadThemeBankV2 } from '@/lib/game/v2/themeBank';
import { publishV1ToBoard, clearBoardMirror } from '@/lib/game/v1/boardBridge';

import { clearSavedGame, hasSavedGame, loadSavedGame, saveGame } from '@/lib/game/v1/storage';

function move<T>(arr: T[], from: number, to: number) {
  const a = [...arr];
  const [item] = a.splice(from, 1);
  a.splice(to, 0, item);
  return a;
}

export default function GameV1Root({ roomId }: { roomId: string }) {
  const [game, setGame] = useState<GameState | null>(null);
  const [uiMsg, setUiMsg] = useState<string | null>(null);
  const [savedExists, setSavedExists] = useState(false);

  const [p2LocalOrdering, setP2LocalOrdering] = useState<string[] | null>(null);

  useEffect(() => {
    setSavedExists(hasSavedGame(roomId));
  }, [roomId]);

  useEffect(() => {
    if (!game) return;
    saveGame(roomId, game);
    setSavedExists(true);
  }, [game, roomId]);

  useEffect(() => {
    if (!game) return;
    publishV1ToBoard(roomId, game);
  }, [roomId, game]);

  // sempre que entrar em p2_rank_final ou trocar ranker, inicializa ordering local
  useEffect(() => {
    if (!game) return;

    if (game.phase !== 'p2_rank_final') {
      setP2LocalOrdering(null);
      return;
    }

    const p2 = game.p2;
    if (!p2) {
      setP2LocalOrdering(null);
      return;
    }

    const ranker = game.players[p2.currentRankerIndex];
    const existing = ranker ? p2.finalRankings?.[ranker.id] : null;
    const base = existing && existing.length === p2.deckCardIds.length ? existing : p2.deckCardIds;

    setP2LocalOrdering(base);
  }, [game?.phase, game?.p2?.currentRankerIndex]); // eslint-disable-line react-hooks/exhaustive-deps

  const headerTitle = useMemo(() => {
    if (!game) return 'Destinote — Jogo (V1)';
    return String(game.phase);
  }, [game]);

  const topActions = (
    <div className="flex flex-wrap gap-2 items-center">
      <a
        className="px-3 py-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-white/70 text-sm"
        href={`/game/board?room=${encodeURIComponent(roomId)}`}
        target="_blank"
        rel="noreferrer"
        title="Abre o telão/board em outra aba"
      >
        Abrir Board
      </a>

      <button
        type="button"
        className="px-3 py-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-white/70 text-sm"
        onClick={() => {
          const loaded = loadSavedGame(roomId);
          if (!loaded) {
            setUiMsg('Nenhum save encontrado para esta sala.');
            return;
          }
          setGame(loaded);
          setUiMsg('Save carregado.');
        }}
      >
        Carregar save
      </button>

      <button
        type="button"
        className="px-3 py-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-white/70 text-sm"
        onClick={() => {
          clearSavedGame(roomId);
          clearBoardMirror(roomId);
          setSavedExists(false);
          setUiMsg('Save apagado e board limpo.');
        }}
      >
        Limpar save
      </button>

      <button
        type="button"
        className="px-3 py-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-white/70 text-sm"
        onClick={() => {
          setGame(null);
          clearBoardMirror(roomId);
          setUiMsg(null);
          setP2LocalOrdering(null);
        }}
      >
        Novo jogo
      </button>
    </div>
  );

  const bank = useMemo(() => loadThemeBankV2(), []);

  return (
    <GameShell
      title="Destinote — Jogo"
      headerTitle={headerTitle}
      headerSub={`Sala: ${roomId}`}
      message={uiMsg}
      onDismissMessage={() => setUiMsg(null)}
      topActions={topActions}
    >
      {!game ? (
        <Setup
          savedExists={savedExists}
          onLoadSaved={() => {
            const loaded = loadSavedGame(roomId);
            if (!loaded) {
              setUiMsg('Nenhum save encontrado para esta sala.');
              return;
            }
            setGame(loaded);
            setUiMsg('Save carregado.');
          }}
          onClearSaved={() => {
            clearSavedGame(roomId);
            clearBoardMirror(roomId);
            setSavedExists(false);
            setUiMsg('Save apagado e board limpo.');
          }}
          onStart={(payload: any) => {
            const cfg = {
              playerNames: payload.players,
              p1Rounds: payload.p1Rounds,
              secondsPerTurn: payload.secondsPerTurn,
              voteMode: payload.voteMode,
              maxReactionsPerVoter: payload.maxReactionsPerVoter,
              allowSelfVote: payload.allowSelfVote,
              showThemeInVoting: payload.showThemeInVoting,
              deckDesired: payload.deckDesired,
              deckMax: payload.deckMax,
              p1ThemeSlots: payload.p1ThemeSlots,
              p2Theme: payload.p2Theme,
            };

            const allThemes = [...bank.p1, ...bank.p2];
            const g = startGame(cfg as any, allThemes as any, roomId);
            setGame(g);
          }}
        />
      ) : null}

      {game?.phase === 'p1_writing' ? (
        <Phase1Writing
          game={game as any}
          onSubmit={(text: string) => setGame((g) => submitAction(g as any, text) as any)}
          onSkip={() => setGame((g) => nextTurn(g as any) as any)}
        />
      ) : null}

      {game?.phase === 'p1_review' ? (
        <Phase1Review
          game={game as any}
          onBack={() => setGame((g) => ({ ...(g as any), phase: 'p1_writing', updatedAt: Date.now() }))}
          onContinue={() =>
            setGame((g) => startPhase1Voting(g as any, { scope: 'round', round: (g as any).p1.round }) as any)
          }
        />
      ) : null}

      {game?.phase === 'p1_voting' ? (
        <Phase1Voting
          game={game as any}
          renderCard={(c: any) => (
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-white/85">{c.text}</div>
          )}
          onSetVoter={(voterId: string) => setGame((g) => setCurrentVoter(g as any, voterId) as any)}
          onVote={(voterId: string, cardId: string, reaction: any) =>
            setGame((g) => addVote(g as any, voterId, cardId, reaction) as any)
          }
          onFinishVoting={() => setGame((g) => endPhase1Voting(g as any) as any)}
        />
      ) : null}

      {game?.phase === 'p1_results' ? (
        <div className="space-y-4">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-white/80">
            Fase 1 encerrada. Preparando Fase 2…
          </div>
          <button
            type="button"
            className="px-4 py-2 rounded-xl border border-white/10 bg-white/10 hover:bg-white/15 text-white"
            onClick={() => setGame((g) => continueAfterPhase1Results(g as any) as any)}
          >
            Continuar
          </button>
        </div>
      ) : null}

      {game?.phase === 'p2_intro' ? (
        <div className="space-y-4">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-white/80">
            Fase 2 iniciando…
          </div>
          <button
            type="button"
            className="px-4 py-2 rounded-xl border border-white/10 bg-white/10 hover:bg-white/15 text-white"
            onClick={() => setGame((g) => goToDiscuss(g as any) as any)}
          >
            Ir para discussão
          </button>
        </div>
      ) : null}

      {game?.phase === 'p2_discuss' ? (
        <Phase2Discuss
          game={game as any}
          renderCard={(c: any) => (
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-white/85">{c.text}</div>
          )}
          onGoToFinalRank={() => setGame((g) => goToFinalRank(g as any) as any)}
          onReveal={() => setUiMsg('Debug: faça a ordenação final para revelar.')}
        />
      ) : null}

      {game?.phase === 'p2_rank_final' ? (
        <Phase2RankFinal
          game={game as any}
          ordering={
            p2LocalOrdering ??
            (game.p2?.deckCardIds ? [...game.p2.deckCardIds] : [])
          }
          onSetRanker={(playerId: string) => {
            // troca ranker no engine + ajusta ordering local pro ranker escolhido
            setGame((g: any) => {
              const ng = setCurrentRanker(g as any, playerId) as any;
              const p2 = ng?.p2;
              const existing = p2?.finalRankings?.[playerId];
              const base =
                existing && existing.length === (p2?.deckCardIds?.length ?? 0)
                  ? existing
                  : p2?.deckCardIds ?? null;

              setP2LocalOrdering(base ? [...base] : null);
              return ng;
            });
          }}
          onMove={(from: number, to: number) => {
            setP2LocalOrdering((ord) => {
              const base =
                ord ??
                (game.p2?.deckCardIds ? [...game.p2.deckCardIds] : []);
              if (!base.length) return base;
              return move(base, from, to);
            });
          }}
          onSubmit={(playerId: string, ordering: string[]) => {
            setGame((g: any) => submitFinalRanking(g as any, playerId, ordering) as any);
          }}
          renderCard={(c: any) => (
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-white/85">{c.text}</div>
          )}
        />
      ) : null}

      {game?.phase === 'reveal' ? <Results game={game as any} /> : null}
    </GameShell>
  );
}
