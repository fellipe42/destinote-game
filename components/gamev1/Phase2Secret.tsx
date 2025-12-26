// components/gamev1/Phase2Secret.tsx
'use client';

import { useEffect, useMemo, useState } from 'react';
import type { GameState } from '@/lib/game/v1/types';
import GoalCard from '@/components/GoalCard';

const fakeCategory = { id: 0, name: 'Jogo', color: 'rgba(255,255,255,0.35)' };

export default function Phase2Secret(props: {
  game: GameState;
  onSetScore: (playerId: string, score: number) => void;
  onBackToSetup: () => void;
}) {
  const { game } = props;
  const p2 = game.phase2;
  if (!p2) return null;

  const unscoredPlayers = useMemo(() => {
    return game.players.filter((p) => typeof p2.secretScores[p.id] !== 'number');
  }, [game.players, p2.secretScores]);

  const [activePlayerId, setActivePlayerId] = useState<string>(() => unscoredPlayers[0]?.id ?? game.players[0]?.id ?? '');

  useEffect(() => {
    if (unscoredPlayers.length > 0) setActivePlayerId(unscoredPlayers[0].id);
  }, [unscoredPlayers]);

  const activePlayer = game.players.find((p) => p.id === activePlayerId) ?? null;
  const cardId = activePlayer ? p2.assignments[activePlayer.id] : null;
  const card = cardId ? game.cards.find((c) => c.id === cardId) ?? null : null;

  const [score, setScore] = useState(50);

  useEffect(() => setScore(50), [activePlayerId]);

  const doneCount = game.players.length - unscoredPlayers.length;

  return (
    <div className="rounded-2xl border border-white/10 bg-black/40 backdrop-blur-xl shadow-lg shadow-black/30 p-5 md:p-6">
      <h2 className="text-2xl font-semibold">Fase 2 — Avaliação secreta</h2>
      <p className="text-white/70 mt-1">
        Sem discussão agora. Cada jogador vê <b>apenas sua carta</b> e atribui um valor de 0 a 100, secretamente.
      </p>

      <div className="mt-4 flex flex-wrap items-center gap-2 text-sm text-white/70">
        Progresso: <span className="text-white">{doneCount}</span> / {game.players.length}
      </div>

      <div className="mt-4 flex flex-wrap gap-3 items-center">
        <label className="text-sm text-white/80">Jogador avaliando:</label>
        <select
          value={activePlayerId}
          onChange={(e) => setActivePlayerId(e.target.value)}
          className="rounded-xl bg-black/30 border border-white/10 px-3 py-2 text-white outline-none"
        >
          {game.players.map((p) => {
            const done = typeof p2.secretScores[p.id] === 'number';
            return (
              <option key={p.id} value={p.id}>
                {p.name}{done ? ' ✅' : ''}
              </option>
            );
          })}
        </select>

        <button
          type="button"
          className="rounded-xl px-3 py-2 bg-white/10 hover:bg-white/15 border border-white/10"
          onClick={() => {
            const next = unscoredPlayers[0]?.id;
            if (next) setActivePlayerId(next);
          }}
        >
          Próximo pendente
        </button>

        <div className="flex-1" />

        <button
          type="button"
          onClick={props.onBackToSetup}
          className="rounded-xl px-3 py-2 bg-white/5 hover:bg-white/10 border border-white/10"
        >
          Voltar
        </button>
      </div>

      <div className="mt-5 rounded-2xl border border-white/10 bg-black/20 p-4">
        <div className="text-sm text-white/70">
          Tema Fase 2: <span className="text-white">{p2.prompt.text}</span>
        </div>

        <div className="mt-3">
          {card ? (
            <GoalCard id={1} title={card.text} category={fakeCategory} variant="regular" />
          ) : (
            <div className="text-white/70">Carta não encontrada.</div>
          )}
        </div>

        <div className="mt-4">
          <label className="block text-sm text-white/80">Valor secreto (0–100)</label>
          <div className="mt-2 flex items-center gap-3">
            <input
              type="range"
              min={0}
              max={100}
              value={score}
              onChange={(e) => setScore(Number(e.target.value))}
              className="flex-1"
            />
            <div className="w-16 text-right tabular-nums text-xl font-semibold">{score}</div>
          </div>
          <p className="text-xs text-white/60 mt-2">
            0 = “encaixa muito / ótimo” e 100 = “terrível / pior possível”. (Ou o inverso… desde que todo mundo siga o mesmo.)
          </p>
        </div>

        <div className="mt-4 flex gap-2">
          <button
            type="button"
            disabled={!activePlayer}
            className="rounded-xl px-4 py-2 bg-emerald-500/15 hover:bg-emerald-500/20 border border-emerald-500/20 text-emerald-100 font-semibold disabled:opacity-40"
            onClick={() => {
              if (!activePlayer) return;
              props.onSetScore(activePlayer.id, score);
            }}
          >
            Confirmar (secreto)
          </button>
        </div>
      </div>
    </div>
  );
}
