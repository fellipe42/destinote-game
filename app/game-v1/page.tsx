// app/game-v1/page.tsx
'use client';

import { useEffect, useMemo, useState } from 'react';

import GameShell from '@/components/gamev1/GameShell';
import Setup from '@/components/gamev1/Setup';
import Phase1Writing from '@/components/gamev1/Phase1Writing';
import Phase1Review from '@/components/gamev1/Phase1Review';
import Phase1Voting from '@/components/gamev1/Phase1Voting';
import Phase2Ordering from '@/components/gamev1/Phase2Ordering';
import Results from '@/components/gamev1/Results';
import Phase2Discuss from '@/components/gamev1/Phase2Discuss';

import type { GameState, SetupConfig } from '@/lib/game/v1/types';
import {
  currentPhase1Theme,
  endPhase1Voting,
  finalizePhase2,
  goToFinalRank,
  startGame,
  startPhase1Voting,
  submitAction,
  submitFinalRanking,
  continueAfterPhase1Results,
  goToDiscuss,
} from '@/lib/game/v1/engine';


import { clearSavedGame, hasSavedGame, loadSavedGame, saveGame } from '@/lib/game/v1/storage';
import { loadThemeBank } from '@/lib/game/v1/bank';

function downloadJson(filename: string, json: unknown) {
  const blob = new Blob([JSON.stringify(json, null, 2)], { type: 'application/json;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 500);
}

export default function GameV1Page() {
  const [game, setGame] = useState<GameState | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  // TODO: quando tiver multiplayer real, isso vira algo tipo: game.masterId === myPlayerId
  const isMaster = true;

  const savedExists = useMemo(() => (game?.roomId ? hasSavedGame(game.roomId) : false), [game?.roomId]);

  useEffect(() => {
    if (!game?.roomId) return;
    saveGame(game.roomId, game);
  }, [game]);

  const headerTitle = useMemo(() => {
    if (!game) return 'Destinote — Jogo';

    const map: Record<string, string> = {
      setup: 'Setup',
      p1_writing: 'Fase 1 — Escrita',
      p1_review: 'Fase 1 — Revisão',
      p1_voting: 'Fase 1 — Votação',
      p1_results: 'Fase 1 — Resultados',
      p2_intro: 'Fase 2 — Intro',
      p2_rank_secret: 'Fase 2 — Ordenação (secreta)',
      p2_discuss: 'Fase 2 — Discussão',
      p2_rank_final: 'Fase 2 — Ordenação (final)',
      reveal: 'Revelação',
    };

    const base = map[game.phase] ?? 'Jogo';
    const sub: string[] = [];
    if (game.phase.startsWith('p1_')) sub.push(`Rodada ${game.p1.round}/${game.config.p1Rounds}`);
    return sub.length ? `${base} • ${sub.join(' • ')}` : base;
  }, [game]);

  const topActions = (
    <div className="flex flex-wrap gap-2 items-center">
      {/* Abrir Board */}
      {game?.roomId ? (
        <a
          className="px-3 py-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-white/70 text-sm"
          href={`/game/board?room=${encodeURIComponent(game.roomId)}`}
          target="_blank"
          rel="noreferrer"
        >
          Abrir Board
        </a>
      ) : null}

      {/* Exportar (só mestre; e só dev/prod condition se você quiser) */}
      {isMaster && process.env.NODE_ENV !== 'production' && game ? (
        <button
          type="button"
          className="px-3 py-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-white/70 text-sm"
          onClick={() => downloadJson('destinote-game.json', game)}
          title="Debug (apenas dev)"
        >
          Exportar
        </button>
      ) : null}

      {/* Reset (só mestre) */}
      {isMaster ? (
        <button
          type="button"
          className="px-3 py-2 rounded-xl border border-rose-500/20 bg-rose-500/10 hover:bg-rose-500/15 text-rose-100 text-sm"
          onClick={() => {
            if (!game?.roomId) {
              setGame(null);
              setMessage('Resetado.');
              return;
            }
            clearSavedGame(game.roomId);
            setGame(null);
            setMessage('Resetado (save apagado).');
          }}
        >
          Reset
        </button>
      ) : null}

      {/* Novo jogo (só mestre) */}
      {isMaster ? (
        <button
          type="button"
          className="px-3 py-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-white/70 text-sm"
          onClick={() => {
            setGame(null);
            setMessage('Novo jogo: configure novamente e clique em “Começar”.');
          }}
        >
          Novo jogo
        </button>
      ) : null}
    </div>
  );

  return (
    <GameShell
      title="Destinote — Jogo (V1)"
      headerTitle={headerTitle}
      headerSub={game?.roomId ? `Sala: ${game.roomId}` : undefined}
      message={message}
      onDismissMessage={() => setMessage(null)}
      topActions={topActions}
      isMaster={isMaster}
      onOpenMenu={() => {
        // aqui você pluga o painel ☰ (por jogador)
        setMessage('Menu ☰: plugar painel de personalização aqui.');
      }}
    >
      {!game ? (
        <Setup
          savedExists={savedExists}
          onCreateGame={() => {
            setMessage('Configure e clique em “Começar”.');
          }}
          onApplySetup={(setupOld: any) => {
            const bank = loadThemeBank();

            const cfg: SetupConfig = {
              playerNames: (setupOld.players ?? setupOld.playerNames ?? []).filter(Boolean),
              p1Rounds: setupOld.p1Rounds ?? 2,
              secondsPerTurn: setupOld.secondsPerTurn ?? 45,

              voteMode: setupOld.voteMode ?? 'per_round',
              maxReactionsPerVoter: setupOld.maxReactionsPerVoter ?? 2,
              allowSelfVote: setupOld.allowSelfVote ?? false,
              showThemeInVoting: setupOld.showThemeInVoting ?? true,

              deckDesired: setupOld.deckDesired ?? 10,
              deckMax: setupOld.deckMax ?? 20,

              p1ThemeSlots:
                setupOld.p1ThemeSlots ??
                Array.from({ length: setupOld.p1Rounds ?? 2 }).map(() => ({ kind: 'random' as const })),
              p2Theme: setupOld.p2Theme ?? { kind: 'random' as const },
            };

            const g = startGame(cfg, bank, setupOld.roomId);
            setGame(g);
          }}
          onLoadSaved={() => {
            if (!game?.roomId) return;
            const loaded = loadSavedGame(game.roomId);
            if (!loaded) {
              setMessage('Nenhum save encontrado para essa sala.');
              return;
            }
            setGame(loaded);
            setMessage('Save carregado.');
          }}
          onClearSaved={() => {
            if (!game?.roomId) return;
            clearSavedGame(game.roomId);
            setMessage('Save apagado.');
          }}
        />
      ) : null}

      {game?.phase === 'p1_writing' ? (
        <Phase1Writing
          game={game}
          onSubmit={(text) => setGame((g) => submitAction(g!, text))}
          onSkip={() => setGame((g) => submitAction(g!, ''))}
          onResetRound={() => setGame((g) => ({ ...g!, phase: 'p1_writing', updatedAt: Date.now() }))}
        />
      ) : null}

      {game?.phase === 'p1_review' ? (
        <Phase1Review
          game={game}
          onContinue={() => setGame((g) => startPhase1Voting(g!, { scope: 'round', round: g!.p1.round }))}
          onBack={() => setGame((g) => ({ ...g!, phase: 'p1_writing', updatedAt: Date.now() }))}
        />
      ) : null}

      {game?.phase === 'p1_voting' ? (
        <Phase1Voting
          game={game}
          theme={game.config.showThemeInVoting ? currentPhase1Theme(game) : undefined}
          onEndVoting={() => setGame((g) => endPhase1Voting(g!))}
          onGoBack={() => setGame((g) => ({ ...g!, phase: 'p1_review', updatedAt: Date.now() }))}
        />
      ) : null}

      {game?.phase === 'p1_results' ? (
        <div className="space-y-4">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="text-white/60 text-sm">Fase 1 — Resultados</div>
            <div className="text-white text-lg font-semibold mt-1">
              Deck para Fase 2: {game.p1Results?.deckCardIds.length ?? 0} cartas
            </div>
            <div className="text-white/70 mt-2">
              {game.config.voteMode === 'per_round' && game.p1.round < game.config.p1Rounds
                ? 'Próxima: mais uma rodada de escrita.'
                : 'Próxima: Fase 2.'}
            </div>
          </div>

          <button
            type="button"
            className="px-4 py-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-white"
            onClick={() => setGame((g) => continueAfterPhase1Results(g!))}
          >
            Continuar
          </button>
        </div>
      ) : null}

      {game?.phase === 'p2_intro' ? (
        <div className="space-y-4">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="text-white/60 text-sm">Fase 2 — Intro</div>
            <div className="text-white text-xl font-semibold mt-1">{game.p2?.theme ?? '(tema fase 2)'}</div>
            <p className="text-white/70 mt-3 leading-relaxed">
              Discussão primeiro, depois cada um manda sua ordenação final (uma vez).
              <br />
              Vitória: maioria no topo vence; unanimidade (ignorando o autor) vira vitória coletiva.
            </p>
          </div>

          <button
            type="button"
            className="px-4 py-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-white"
            onClick={() => setGame((g) => goToSecretRank(g!))}
          >
            Continuar
          </button>
        </div>
      ) : null}

      {game?.phase === 'p2_rank_secret' ? (
        <Phase2Ordering
          game={game}
          title="Fase 2 — Ordene (final)"
          onConfirm={(ordering) => {
            // usando submitSecretRanking como “final” (você já fez essa simplificação)
            const ranker = game.players[game.p2?.currentRankerIndex ?? 0];
            setGame((g) => submitSecretRanking(g!, ranker.id, ordering));
          }}
          onFinish={() => setGame((g) => finalizePhase2(g!))}
        />
      ) : null}

      {game?.phase === 'p2_discuss' ? (
        <Phase2Discuss game={game} onGoToFinalRank={() => setGame((g) => goToFinalRank(g!))} onReveal={() => setGame((g) => finalizePhase2(g!))} />
      ) : null}

      {game?.phase === 'p2_rank_final' ? (
        <Phase2Ordering
          game={game}
          title="Fase 2 — Ordene (final)"
          onConfirm ={(ordering) => {
            const ranker = game.players[game.p2?.currentRankerIndex ?? 0];
            setGame((g) => submitFinalRanking(g!, ranker.id, ordering));
          }}

          onFinish={() => setGame((g) => finalizePhase2(g!))}
        />
      ) : null}

      {game?.phase === 'reveal' ? <Results game={game} /> : null}
    </GameShell>
  );
}
