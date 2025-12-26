'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import type { GameState } from '@/lib/game/v1/types';
import { currentPhase1Theme } from '@/lib/game/v1/engine';

export default function Phase1Writing({
  game,
  onSubmit,
  onSkip,
  onResetRound,
}: {
  game: GameState;
  onSubmit: (text: string) => void;
  onSkip: () => void;
  onResetRound: () => void;
}) {
  const player = game.players[game.p1.playerIndex];
  const theme = currentPhase1Theme(game);

  const turnKey = `${game.p1.round}-${game.p1.playerIndex}`;
  const total = game.config.secondsPerTurn;

  const [text, setText] = useState('');
  const textRef = useRef('');
  const [remaining, setRemaining] = useState(total);
  const firedRef = useRef(false);
  const [error, setError] = useState<string | null>(null);

  const progress = useMemo(() => {
    const r = Math.max(0, Math.min(total, remaining));
    return total <= 0 ? 0 : Math.round((r / total) * 100);
  }, [remaining, total]);

  useEffect(() => {
    textRef.current = text;
  }, [text]);

  useEffect(() => {
    setText('');
    textRef.current = '';
    setRemaining(total);
    firedRef.current = false;
    setError(null);

    const startedAt = Date.now();

    const id = window.setInterval(() => {
      setRemaining(() => {
        const elapsed = Math.floor((Date.now() - startedAt) / 1000);
        const next = Math.max(0, total - elapsed);
        if (next <= 0 && !firedRef.current) {
          firedRef.current = true;
          const t = textRef.current.trim();
          if (t) onSubmit(t);
          else onSkip(); // regra: vazio não cria card
        }
        return next;
      });
    }, 250);

    return () => window.clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [turnKey]);

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
          <div className="space-y-1">
            <div className="text-white/60 text-xs">Fase 1 — Criação</div>
            <h2 className="text-white text-xl font-semibold">
              Rodada {game.p1.round}/{game.config.p1Rounds}
            </h2>
            <p className="text-white/70 text-sm">
              Vez de: <span className="text-white">{player?.name ?? '—'}</span>
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className="text-white text-2xl font-semibold tabular-nums">{remaining}s</div>
              <div className="text-white/50 text-xs">timer</div>
            </div>
            <div className="w-32">
              <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                <div className="h-full bg-white/40" style={{ width: `${progress}%` }} />
              </div>
              <div className="mt-1 text-white/50 text-xs text-right">{progress}%</div>
            </div>
          </div>
        </div>

        <div className="mt-4 rounded-2xl border border-white/10 bg-black/30 p-4">
          <div className="text-white/60 text-sm">Tema</div>
          <div className="text-white text-xl font-semibold mt-1">{theme}</div>
          <div className="mt-3 text-white/60 text-sm">
            Regra: escreva uma <span className="text-white/80">ação concreta</span> (sem ranking, sem explicação).
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/5 p-4 space-y-3">
        <label className="block text-white/80 text-sm">Sua ação</label>
        <textarea
          rows={5}
          className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-white/85"
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            if (error) setError(null);
          }}
          placeholder='Ex: "Fazer um chocolate quente e assistir algo."'
        />

        {error ? <div className="text-rose-200/80 text-sm">{error}</div> : null}

        <div className="flex flex-wrap gap-2 items-center justify-between">
          <div className="flex gap-2">
            <button
              type="button"
              className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 text-white"
              onClick={() => {
                const t = text.trim();
                if (!t) {
                  setError('Sem texto = sem carta (V1).');
                  return;
                }
                onSubmit(t);
              }}
            >
              Salvar
            </button>
            <button
              type="button"
              className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white/80"
              onClick={onSkip}
            >
              Pular
            </button>
          </div>

          <button
            type="button"
            className="px-4 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/15 border border-rose-400/20 text-rose-100/80"
            onClick={onResetRound}
            title="Apaga as cartas da rodada atual em diante e volta pro 1º jogador"
          >
            Resetar rodada
          </button>
        </div>
      </div>
    </div>
  );
}
