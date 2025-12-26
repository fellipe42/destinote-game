'use client';

import { useMemo, useState } from 'react';
import type { GameState } from '@/lib/game/v1/types';

export default function Phase2SecretScore({
  game,
  onSetScore,
  onNext,
}: {
  game: GameState;
  onSetScore: (playerId: string, value: number) => void;
  onNext: () => void;
}) {
  const raterId = game.p2.currentRaterId;
  const rater = game.players.find((p) => p.id === raterId) ?? null;

  const assignment = game.p2.assignments.find((a) => a.playerId === raterId) ?? null;

  const card = useMemo(() => {
    if (!assignment) return null;
    return game.p1.cards.find((c) => c.id === assignment.cardId) ?? null;
  }, [assignment, game.p1.cards]);

  const already = useMemo(() => {
    if (!raterId) return null;
    return game.p2.secretScores.find((s) => s.playerId === raterId) ?? null;
  }, [game.p2.secretScores, raterId]);

  const doneCount = game.p2.secretScores.length;
  const totalNeeded = game.p2.assignments.length;

  const [val, setVal] = useState<number>(already?.value ?? 50);

  if (!raterId || !rater) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-white/70">
        Nenhum avaliador ativo.
      </div>
    );
  }

  if (!assignment || !card) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-white/70">
        Este jogador não recebeu carta (deck menor que jogadores).
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
        <div className="text-white/60 text-xs">Fase 2 — Avaliação secreta</div>
        <h2 className="text-white text-lg font-semibold">Passe o notebook para: {rater.name}</h2>
        <p className="text-white/70 text-sm">
          Tema: <span className="text-white/90">{game.p2.config.theme}</span>
        </p>
        <p className="text-white/60 text-sm mt-2">
          Dê um valor de <span className="text-white/85">0 a 100</span> para sua carta (isso define a ordem correta).
          <br />
          Regra de mesa: <span className="text-white/80">na discussão ninguém cita números</span>.
        </p>

        <div className="mt-3 rounded-2xl border border-white/10 bg-black/30 p-4">
          <div className="text-white/60 text-xs">Sua carta</div>
          <div className="text-white/90 mt-1">{card.text}</div>
        </div>

        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3 items-end">
          <div>
            <label className="block text-white/70 text-xs mb-1">Seu valor (0–100)</label>
            <input
              type="number"
              min={0}
              max={100}
              className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-white/85"
              value={val}
              onChange={(e) => setVal(Number(e.target.value))}
            />
          </div>

          <button
            type="button"
            className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 text-white"
            onClick={() => {
              onSetScore(raterId, val);
              onNext();
            }}
          >
            Confirmar e passar
          </button>
        </div>

        <div className="mt-3 text-white/50 text-xs">
          Progresso: {doneCount}/{totalNeeded} avaliadores concluíram.
        </div>
      </div>
    </div>
  );
}
