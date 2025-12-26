'use client';

import { useMemo, useState } from 'react';
import type { GameState } from '@/lib/game/v1/types';

export default function Phase2Setup({
  game,
  winnersPreview,
  onApplyPhase2Config,
  onStartPhase2,
}: {
  game: GameState;
  winnersPreview: { winnerCardIds: string[]; sorted: { cardId: string; score: number }[] };
  onApplyPhase2Config: (cfg: { theme: string; winnersCount: number }) => void;
  onStartPhase2: () => void;
}) {
  const [theme, setTheme] = useState(game.p2.config.theme);
  const [winnersCount, setWinnersCount] = useState(game.p2.config.winnersCount);

  const cardsById = useMemo(() => {
    const m: Record<string, GameState['p1']['cards'][number]> = {};
    for (const c of game.p1.cards) m[c.id] = c;
    return m;
  }, [game.p1.cards]);

  const ranked = winnersPreview.sorted.slice(0, Math.min(winnersCount, winnersPreview.sorted.length));

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-white/10 bg-white/5 p-4 space-y-3">
        <div>
          <div className="text-white/60 text-xs">Transição</div>
          <h2 className="text-white text-lg font-semibold">Fase 2 — Configuração</h2>
          <p className="text-white/70 text-sm">
            Agora as ações viram o baralho fixo. Ninguém escreve novas ações na Fase 2.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="block text-white/70 text-xs mb-1">Tema Fase 2 (escala)</label>
            <input
              className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-white/85"
              value={theme}
              onChange={(e) => setTheme(e.target.value)}
              placeholder="Ex: Pior coisa para se fazer num velório"
            />
          </div>

          <div>
            <label className="block text-white/70 text-xs mb-1">Quantas cartas entram no deck?</label>
            <input
              type="number"
              min={1}
              max={50}
              className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-white/85"
              value={winnersCount}
              onChange={(e) => setWinnersCount(Number(e.target.value))}
            />
            <div className="text-white/50 text-xs mt-1">
              Ideal: pelo menos {game.players.length} (1 por jogador), se houver cartas suficientes.
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 text-white"
            onClick={() => onApplyPhase2Config({ theme, winnersCount })}
          >
            Aplicar config
          </button>

          <button
            type="button"
            className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 text-white"
            onClick={() => {
              onApplyPhase2Config({ theme, winnersCount });
              onStartPhase2();
            }}
          >
            Iniciar Fase 2
          </button>
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
        <h3 className="text-white font-semibold">Top cartas (por votos)</h3>
        <p className="text-white/60 text-sm">Prévia do deck (top {winnersCount}).</p>

        <div className="mt-3 space-y-2">
          {ranked.length === 0 ? (
            <div className="text-white/60">Sem cartas ranqueadas.</div>
          ) : (
            ranked.map((row, i) => {
              const c = cardsById[row.cardId];
              return (
                <div key={row.cardId} className="flex items-start justify-between gap-3 rounded-xl border border-white/10 bg-black/20 p-3">
                  <div>
                    <div className="text-white/70 text-xs">#{i + 1} • {row.score} voto(s)</div>
                    <div className="text-white/90">{c?.text ?? row.cardId}</div>
                  </div>
                  <div className="text-white/40 text-xs">card</div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
