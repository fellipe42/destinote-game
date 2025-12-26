// components/gamev1/Phase2Reveal.tsx
'use client';

import { useMemo, useState } from 'react';
import type { GameState } from '@/lib/game/v1/types';
import GoalCard from '@/components/GoalCard';

const fakeCategory = { id: 0, name: 'Jogo', color: 'rgba(255,255,255,0.35)' };

export default function Phase2Reveal(props: {
  game: GameState;
  onPlace: (position: number) => void;
}) {
  const { game } = props;
  const p2 = game.phase2;
  if (!p2) return null;

  const currentId = p2.reveal.currentCardId;
  const currentCard = currentId ? game.cards.find((c) => c.id === currentId) ?? null : null;

  // cardId -> playerId (avaliador)
  const raterByCard = useMemo(() => {
    const inv: Record<string, string> = {};
    for (const [playerId, cardId] of Object.entries(p2.assignments)) inv[cardId] = playerId;
    return inv;
  }, [p2.assignments]);

  const evaluatorName = useMemo(() => {
    if (!currentId) return '—';
    const playerId = raterByCard[currentId];
    return game.players.find((p) => p.id === playerId)?.name ?? '—';
  }, [currentId, raterByCard, game.players]);

  const [pos, setPos] = useState(0);

  const posOptions = useMemo(() => {
    const len = p2.ordering.length;
    const opts = [];
    for (let i = 0; i <= len; i++) {
      const label = i === 0 ? 'Topo' : i === len ? 'Fim' : `Posição ${i + 1}`;
      opts.push({ value: i, label });
    }
    return opts;
  }, [p2.ordering.length]);

  const progress = useMemo(() => {
    const total = p2.reveal.queue.length;
    const done = p2.reveal.cursor;
    return { done, total };
  }, [p2.reveal.cursor, p2.reveal.queue.length]);

  if (!currentId) {
    return (
      <div className="rounded-2xl border border-white/10 bg-black/40 backdrop-blur-xl shadow-lg shadow-black/30 p-5 md:p-6">
        <h2 className="text-2xl font-semibold">Fase 2 — Revelação</h2>
        <p className="text-white/70 mt-2">Nenhuma carta para revelar. (Isso não deveria acontecer.)</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-white/10 bg-black/40 backdrop-blur-xl shadow-lg shadow-black/30 p-5 md:p-6">
        <h2 className="text-2xl font-semibold">Fase 2 — Revelação carta a carta</h2>
        <p className="text-white/70 mt-1">
          Agora pode discutir — <b>sem falar números</b>. O avaliador aparece só quando a carta entra em pauta.
        </p>

        <div className="mt-3 text-sm text-white/70">
          Progresso: <span className="text-white">{progress.done}</span> / {progress.total} colocadas
        </div>

        <div className="mt-4 rounded-xl border border-white/10 bg-black/20 p-4">
          <div className="text-sm text-white/70">
            Tema: <span className="text-white">{p2.prompt.text}</span>
          </div>

          <div className="mt-2 flex flex-wrap items-center gap-2 text-sm">
            <span className="text-white/60">Avaliador:</span>
            <span className="rounded-full bg-white/10 border border-white/10 px-3 py-1 text-white/90">{evaluatorName}</span>
            <span className="text-white/50">(não participa da decisão desta carta)</span>
          </div>

          <div className="mt-3">
            {currentCard ? (
              <GoalCard id={1} title={currentCard.text} category={fakeCategory} variant="regular" />
            ) : (
              <div className="text-white/70">Carta não encontrada.</div>
            )}
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <label className="text-sm text-white/80">Inserir na ordem:</label>
            <select
              value={pos}
              onChange={(e) => setPos(Number(e.target.value))}
              className="rounded-xl bg-black/30 border border-white/10 px-3 py-2 text-white outline-none"
            >
              {posOptions.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>

            <button
              type="button"
              className="rounded-xl px-4 py-2 bg-emerald-500/15 hover:bg-emerald-500/20 border border-emerald-500/20 text-emerald-100 font-semibold"
              onClick={() => props.onPlace(pos)}
            >
              Colocar carta
            </button>

            <div className="flex-1" />

            <button
              type="button"
              className="rounded-xl px-3 py-2 bg-white/10 hover:bg-white/15 border border-white/10"
              onClick={() => setPos(0)}
            >
              Topo
            </button>
            <button
              type="button"
              className="rounded-xl px-3 py-2 bg-white/10 hover:bg-white/15 border border-white/10"
              onClick={() => setPos(p2.ordering.length)}
            >
              Fim
            </button>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
        <h3 className="font-semibold">Ordem atual (provisória)</h3>
        <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-2">
          {p2.ordering.map((cid, idx) => {
            const c = game.cards.find((x) => x.id === cid);
            if (!c) return null;
            return (
              <div key={cid} className="rounded-xl border border-white/10 bg-black/20 p-3">
                <div className="text-xs text-white/60 mb-1">#{idx + 1}</div>
                <div className="text-white/90">{c.text}</div>
              </div>
            );
          })}
        </div>

        {p2.ordering.length === 0 && <p className="text-sm text-white/60 mt-2">Ainda vazio. Comece colocando a primeira carta.</p>}
      </div>
    </div>
  );
}
