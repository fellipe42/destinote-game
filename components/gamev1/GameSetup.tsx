'use client';

import { useMemo, useState } from 'react';

import type { GameConfig, Player } from '@/lib/game/v0/types';

type Props = {
  savedExists: boolean;
  onLoadSaved: () => void;
  onClearSaved: () => void;
  onStart: (payload: { players: Player[]; config: GameConfig }) => void;
};

function makeId(n: number) {
  return `p_${n}`;
}

function parsePlayers(text: string): Player[] {
  const lines = (text ?? '')
    .split('\n')
    .map((s) => s.trim())
    .filter(Boolean);

  return lines.map((name, idx) => ({ id: makeId(idx + 1), name }));
}

export default function GameSetup({ savedExists, onLoadSaved, onClearSaved, onStart }: Props) {
  const [namesText, setNamesText] = useState('Fellipe\nBianca\nDavi\nMateus');
  const [rounds, setRounds] = useState(5);
  const [secondsPerTurn, setSecondsPerTurn] = useState(45);

  const playersPreview = useMemo(() => parsePlayers(namesText), [namesText]);

  const warnSolo = playersPreview.length === 1;
  const blockStart = playersPreview.length === 0;

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div className="space-y-1">
            <h2 className="text-white text-lg font-semibold">Setup</h2>
            <p className="text-white/70 text-sm">
              Single-device. Passa o notebook. Escreve. Vota. Exporta. Sem servidor. Sem drama.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {savedExists ? (
              <>
                <button
                  type="button"
                  onClick={onLoadSaved}
                  className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 text-white"
                >
                  Carregar salvo
                </button>
                <button
                  type="button"
                  onClick={onClearSaved}
                  className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white/70"
                >
                  Apagar salvo
                </button>
              </>
            ) : (
              <span className="text-white/50 text-sm">Nenhum save local encontrado.</span>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <label className="block text-white/80 text-sm mb-2">Nomes dos jogadores (1 por linha)</label>
          <textarea
            value={namesText}
            onChange={(e) => setNamesText(e.target.value)}
            rows={7}
            className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-white/85 focus:outline-none focus:ring-2 focus:ring-white/15"
            placeholder="Ex:\nFellipe\nBianca\nDavi"
          />

          <div className="mt-3 flex flex-wrap gap-2">
            {playersPreview.map((p) => (
              <span
                key={p.id}
                className="px-3 py-1 rounded-full border border-white/10 bg-black/30 text-white/80 text-xs"
              >
                {p.name}
              </span>
            ))}
          </div>

          {warnSolo ? (
            <p className="mt-3 text-amber-200/80 text-sm">
              1 jogador detectado. Modo solo é permitido, mas… não recomendo discutir com você mesmo em voz alta.
            </p>
          ) : null}

          {blockStart ? (
            <p className="mt-3 text-rose-200/80 text-sm">
              Sem jogadores, sem jogo. A entropia vence de WO.
            </p>
          ) : null}
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-4 space-y-4">
          <div>
            <label className="block text-white/80 text-sm mb-2">Rodadas</label>
            <input
              type="number"
              value={rounds}
              min={1}
              max={20}
              onChange={(e) => setRounds(Number(e.target.value))}
              className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-white/85 focus:outline-none focus:ring-2 focus:ring-white/15"
            />
          </div>

          <div>
            <label className="block text-white/80 text-sm mb-2">Tempo por turno (segundos)</label>
            <input
              type="number"
              value={secondsPerTurn}
              min={5}
              max={300}
              onChange={(e) => setSecondsPerTurn(Number(e.target.value))}
              className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-white/85 focus:outline-none focus:ring-2 focus:ring-white/15"
            />
          </div>

          <div className="rounded-xl border border-white/10 bg-black/20 p-3 text-white/70 text-sm">
            <div className="flex items-center justify-between">
              <span>Limite de reações por votante</span>
              <span className="text-white/90 font-semibold">3</span>
            </div>
            <p className="mt-1 text-white/50 text-xs">
              V0 simplificado: 3 reações no total por pessoa na votação inteira.
            </p>
          </div>

          <button
            type="button"
            onClick={() =>
              onStart({
                players: playersPreview,
                config: { rounds, secondsPerTurn, maxReactionsPerVoter: 3 },
              })
            }
            disabled={blockStart}
            className="w-full px-4 py-3 rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 text-white disabled:opacity-40 disabled:pointer-events-none"
          >
            Começar
          </button>
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
        <h3 className="text-white font-semibold">Regras V0 (rápidas)</h3>
        <ul className="mt-2 space-y-1 text-white/70 text-sm list-disc pl-5">
          <li>Turno por jogador, por rodada: escreve uma ação/frase antes do timer zerar.</li>
          <li>Se o tempo acabar e estiver vazio: não cria card.</li>
          <li>Depois da última rodada: Review (autores visíveis), depois Votação (anonimizado).</li>
          <li>Na votação: cada reação vale 1 ponto. Não pode votar no próprio card. 3 reações por pessoa.</li>
          <li>No fim: Ranking + Export JSON.</li>
        </ul>
      </div>
    </div>
  );
}
