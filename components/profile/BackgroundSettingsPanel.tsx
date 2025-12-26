// components/profile/BackgroundSettingsPanel.tsx
'use client';

import Image from 'next/image';
import { ArrowUp, ArrowDown, Lock, Unlock } from 'lucide-react';
import { useMemo } from 'react';

import { BACKGROUNDS } from '@/lib/personalization/catalog';
import { usePersonalization } from '@/contexts/PersonalizationContext';

function round0(n: number) {
  return Math.round(n);
}

export default function BackgroundSettingsPanel() {
  const {
    state,
    toggleBackground,
    moveBackground,
    setBackgroundWeight,
    setBackgroundEqual,
    unlockBackgroundWeights,
  } = usePersonalization();

  const selectedSet = useMemo(() => new Set(state.background.selectedIds), [state.background.selectedIds]);
  const weights = state.background.weights;
  const manualSet = useMemo(() => new Set(state.background.manualIds), [state.background.manualIds]);

  return (
    <div className="space-y-6">
      <p className="text-white/70 text-sm">
        Selecione os fundos e escolha quanto tempo cada um fica na tela. A ordem é a ordem do clique (e você pode ajustar depois).
      </p>

      <div className="grid sm:grid-cols-3 gap-3">
        {BACKGROUNDS.map((bg) => {
          const on = selectedSet.has(bg.id);
          const order = on ? state.background.selectedIds.indexOf(bg.id) + 1 : null;

          return (
            <button
              key={bg.id}
              type="button"
              onClick={() => toggleBackground(bg.id)}
              className={[
                'relative overflow-hidden rounded-2xl border text-left transition-all',
                on ? 'border-white/30' : 'border-white/10 hover:border-white/20',
              ].join(' ')}
            >
              <div className="relative h-24">
                <Image src={bg.src} alt={bg.alt ?? bg.label} fill className="object-cover brightness-[0.9]" />
                <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-black/30 to-black/60" />
              </div>

              <div className="p-3">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-white font-semibold text-sm truncate">{bg.label}</p>
                  {order ? (
                    <span className="text-xs font-bold text-white/90 bg-white/10 border border-white/15 rounded-lg px-2 py-0.5">
                      #{order}
                    </span>
                  ) : (
                    <span className="text-xs text-white/40">off</span>
                  )}
                </div>
                <p className="text-white/45 text-xs mt-1">{bg.id}</p>
              </div>
            </button>
          );
        })}
      </div>

      <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <p className="text-white font-semibold">Distribuição de tempo</p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={setBackgroundEqual}
              className="rounded-xl border border-white/10 bg-black/30 hover:bg-black/40 px-3 py-2 text-xs text-white/80 transition-colors"
            >
              Igualar
            </button>
            <button
              type="button"
              onClick={unlockBackgroundWeights}
              className="rounded-xl border border-white/10 bg-black/30 hover:bg-black/40 px-3 py-2 text-xs text-white/80 transition-colors inline-flex items-center gap-2"
              title="Destravar tudo e recalcular"
            >
              <Unlock size={14} />
              Auto
            </button>
          </div>
        </div>

        {state.background.selectedIds.length === 0 ? (
          <p className="text-white/60 text-sm">Selecione pelo menos um fundo.</p>
        ) : (
          <div className="space-y-3">
            {state.background.selectedIds.map((id) => {
              const bg = BACKGROUNDS.find((b) => b.id === id);
              const w = weights[id] ?? 0;
              const manual = manualSet.has(id);

              return (
                <div key={id} className="flex items-center gap-3">
                  <div className="relative w-14 h-10 rounded-xl overflow-hidden border border-white/10 bg-black/30">
                    {bg ? <Image src={bg.src} alt={bg.label} fill className="object-cover" /> : null}
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="text-white/85 text-sm font-semibold truncate">
                      {bg?.label ?? id}{' '}
                      {manual ? (
                        <span className="inline-flex items-center gap-1 text-[11px] text-white/55 font-normal">
                          <Lock size={12} /> fixo
                        </span>
                      ) : null}
                    </p>
                    <p className="text-white/45 text-xs">{id}</p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => moveBackground(id, -1)}
                      className="rounded-lg border border-white/10 bg-black/30 hover:bg-black/40 p-2 text-white/80 transition-colors"
                      aria-label="Mover para cima"
                      title="Mover para cima"
                    >
                      <ArrowUp size={14} />
                    </button>
                    <button
                      type="button"
                      onClick={() => moveBackground(id, 1)}
                      className="rounded-lg border border-white/10 bg-black/30 hover:bg-black/40 p-2 text-white/80 transition-colors"
                      aria-label="Mover para baixo"
                      title="Mover para baixo"
                    >
                      <ArrowDown size={14} />
                    </button>

                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min={0}
                        max={100}
                        step={1}
                        value={round0(w)}
                        onChange={(e) => setBackgroundWeight(id, Number(e.target.value))}
                        className="w-16 rounded-lg border border-white/10 bg-black/30 px-2 py-2 text-sm text-white/85 outline-none focus:border-white/25"
                      />
                      <span className="text-white/60 text-xs">%</span>
                    </div>
                  </div>
                </div>
              );
            })}

            <p className="text-[11px] text-white/45 mt-3">
              Ajuste um cartão e ele fica “travado”. Os outros se redistribuem automaticamente para somar 100.
            </p>
          </div>
        )}
      </div>

      <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
        <p className="text-white/70 text-sm">
          <span className="font-semibold text-white/90">Escalabilidade:</span> essa lista de fundos é um catálogo local hoje,
          mas já foi pensada para virar CDN/serviço externo no futuro sem quebrar as preferências dos usuários.
        </p>
      </div>
    </div>
  );
}
