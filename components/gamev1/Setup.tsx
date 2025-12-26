// components/gameV1/Setup.tsx
'use client';

import { useEffect, useMemo, useState } from 'react';
import { loadThemeBank as loadThemeBankV2 } from '@/lib/game/v2/themeBank';

type VoteMode = 'per_round' | 'end_only';

type ThemeSlot =
  | { kind: 'random' }
  | { kind: 'fixed'; text: string };

type SetupPayload = {
  players: string[];

  p1Rounds: number;
  secondsPerTurn: number;

  voteMode: VoteMode;
  maxReactionsPerVoter: number;
  allowSelfVote: boolean;
  showThemeInVoting: boolean;

  deckDesired: number;
  deckMax: number;

  p1ThemeSlots: ThemeSlot[];
  p2Theme: ThemeSlot;
};

function parseLines(text: string) {
  return (text ?? '')
    .split('\n')
    .map((s) => s.trim())
    .filter(Boolean);
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function Stepper({
  label,
  value,
  min,
  max,
  step = 1,
  onChange,
  hint,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (v: number) => void;
  hint?: string;
}) {
  const dec = () => onChange(clamp(value - step, min, max));
  const inc = () => onChange(clamp(value + step, min, max));

  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 p-3">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div>
          <div className="text-white/80 text-sm font-medium">{label}</div>
          {hint ? <div className="text-white/50 text-xs mt-1 leading-snug whitespace-normal">{hint}</div> : null}
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            className="px-3 py-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-white disabled:opacity-40"
            onClick={dec}
            disabled={value <= min}
            aria-label="Diminuir"
          >
            ◀
          </button>

          <div className="min-w-[56px] text-center text-white text-xl font-semibold tabular-nums">
            {value}
          </div>

          <button
            type="button"
            className="px-3 py-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-white disabled:opacity-40"
            onClick={inc}
            disabled={value >= max}
            aria-label="Aumentar"
          >
            ▶
          </button>
        </div>
      </div>
    </div>
  );
}

function ThemePicker({
  label,
  value,
  bank,
  onPick,
  placeholder,
}: {
  label: string;
  value: string;
  bank: string[];
  onPick: (t: string) => void;
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');

  const filtered = useMemo(() => {
    const qq = q.trim().toLowerCase();
    if (!qq) return bank;
    return bank.filter((t) => t.toLowerCase().includes(qq));
  }, [q, bank]);

  return (
    <div className="relative">
      <div className="text-white/70 text-xs mb-1">{label}</div>

      <button
        type="button"
        className="w-full text-left rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-white/85 hover:bg-black/20"
        onClick={() => setOpen((s) => !s)}
      >
        <div className="flex items-center justify-between gap-3">
          <div className="truncate">
            {value ? value : <span className="text-white/40">{placeholder ?? 'Selecionar…'}</span>}
          </div>
          <div className="text-white/40">▾</div>
        </div>
      </button>

      {open ? (
        <div className="absolute z-50 mt-2 w-full rounded-2xl border border-white/10 bg-black/70 backdrop-blur-xl shadow-2xl overflow-hidden">
          <div className="p-3 border-b border-white/10">
            <input
              className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-white/85 placeholder:text-white/30"
              placeholder="Buscar tema…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              autoFocus
            />
            <div className="mt-2 text-xs text-white/45">
              {filtered.length} de {bank.length}
            </div>
          </div>

          <div className="max-h-[320px] overflow-auto">
            {filtered.map((t) => (
              <button
                key={t}
                type="button"
                className="w-full text-left px-4 py-3 hover:bg-white/10 text-white/85 border-b border-white/5"
                onClick={() => {
                  onPick(t);
                  setOpen(false);
                  setQ('');
                }}
              >
                {t}
              </button>
            ))}

            {filtered.length === 0 ? (
              <div className="px-4 py-4 text-white/50">Nada encontrado.</div>
            ) : null}
          </div>

          <div className="p-3 border-t border-white/10 flex justify-end">
            <button
              type="button"
              className="px-3 py-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-white/70"
              onClick={() => {
                setOpen(false);
                setQ('');
              }}
            >
              Fechar
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default function Setup({
  savedExists,
  onLoadSaved,
  onClearSaved,
  onStart,
}: {
  savedExists: boolean;
  onLoadSaved: () => void;
  onClearSaved: () => void;
  onStart: (payload: SetupPayload) => void;
}) {
  const [namesText, setNamesText] = useState('Fellipe\nBianca\nDavi\nMateus');

  const [p1Rounds, setP1Rounds] = useState(2);
  const [secondsPerTurn, setSecondsPerTurn] = useState(45);

  const [voteMode, setVoteMode] = useState<VoteMode>('per_round');
  const [maxReactionsPerVoter, setMaxReactionsPerVoter] = useState(2);
  const [allowSelfVote, setAllowSelfVote] = useState(false);
  const [showThemeInVoting, setShowThemeInVoting] = useState(true);

  const [deckMax, setDeckMax] = useState(20);
  const [deckDesired, setDeckDesired] = useState(10);

  // Theme slots per round
  type SlotUI =
    | { mode: 'random' }
    | { mode: 'bank'; theme: string }
    | { mode: 'custom'; text: string };

  const [p1Slots, setP1Slots] = useState<SlotUI[]>([{ mode: 'random' }, { mode: 'random' }]);
  const [p2Mode, setP2Mode] = useState<'random' | 'bank' | 'custom'>('random');
  const [p2BankTheme, setP2BankTheme] = useState('');
  const [p2CustomTheme, setP2CustomTheme] = useState('');

  const players = useMemo(() => parseLines(namesText), [namesText]);

  const themeBank = useMemo(() => {
    // usa o banco do V2 (mais completo)
    return loadThemeBankV2();
  }, []);

  useEffect(() => {
    // mantém p1Slots alinhado ao número de rodadas
    setP1Slots((prev) => {
      const next = [...prev];
      while (next.length < p1Rounds) next.push({ mode: 'random' });
      while (next.length > p1Rounds) next.pop();
      return next;
    });
  }, [p1Rounds]);

  useEffect(() => {
    // deckDesired deve respeitar deckMax
    setDeckDesired((d) => clamp(d, 5, deckMax));
  }, [deckMax]);

  useEffect(() => {
    // default deckDesired levemente acima do nº de jogadores
    const suggested = clamp(Math.max(players.length + 1, 8), 5, deckMax);
    setDeckDesired((d) => (d ? d : suggested));
  }, [players.length]); // eslint-disable-line react-hooks/exhaustive-deps

  const blocked = players.length === 0;

  function slotToPayload(slot: SlotUI): ThemeSlot {
    if (slot.mode === 'random') return { kind: 'random' };
    if (slot.mode === 'bank') return { kind: 'fixed', text: slot.theme };
    return { kind: 'fixed', text: slot.text };
  }

  function p2ToPayload(): ThemeSlot {
    if (p2Mode === 'random') return { kind: 'random' };
    if (p2Mode === 'bank') return { kind: 'fixed', text: p2BankTheme };
    return { kind: 'fixed', text: p2CustomTheme };
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2 items-center justify-between">
        <div className="text-white/70 text-sm">
          Temas: <span className="text-white">{themeBank.p1.length}</span> (F1) •{' '}
          <span className="text-white">{themeBank.p2.length}</span> (F2)
        </div>

        <div className="flex flex-wrap gap-2">
          {savedExists ? (
            <>
              <button
                type="button"
                className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 text-white"
                onClick={onLoadSaved}
              >
                Carregar salvo
              </button>
              <button
                type="button"
                className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white/70"
                onClick={onClearSaved}
              >
                Apagar salvo
              </button>
            </>
          ) : (
            <span className="text-white/50 text-sm">Sem save local.</span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Players */}
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <label className="block text-white/80 text-sm mb-2">Jogadores (1 por linha)</label>
          <textarea
            className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-white/85"
            rows={7}
            value={namesText}
            onChange={(e) => setNamesText(e.target.value)}
          />
          {players.length === 1 ? (
            <div className="mt-2 text-amber-200/80 text-sm">Modo solo permitido, mas… você vai discutir com quem?</div>
          ) : null}
          {blocked ? <div className="mt-2 text-rose-200/80 text-sm">Sem jogadores = sem jogo.</div> : null}

          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
            <Stepper
              label="Rodadas (Fase 1)"
              value={p1Rounds}
              min={1}
              max={12}
              onChange={setP1Rounds}
              hint="Mais rodadas = mais cartas = mais caos."
            />
            <Stepper
              label="Tempo por turno (s)"
              value={secondsPerTurn}
              min={10}
              max={180}
              step={5}
              onChange={setSecondsPerTurn}
              hint="45s costuma ser o sweet spot."
            />
          </div>
        </div>

        {/* Rules */}
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4 space-y-4">
          <div className="text-white font-semibold">Regras (pasted.txt)</div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Stepper
              label="Reações por votante"
              value={maxReactionsPerVoter}
              min={1}
              max={5}
              onChange={setMaxReactionsPerVoter}
              hint="Limite de reações por jogador (por sessão de votação)."
            />

            <div className="rounded-2xl border border-white/10 bg-black/20 p-3">
              <div className="text-white/80 text-sm font-medium">Modo de votação</div>
              <div className="mt-2 grid grid-cols-2 gap-2">
                <button
                  type="button"
                  className={`px-3 py-2 rounded-xl border border-white/10 ${voteMode === 'per_round' ? 'bg-white/10 text-white' : 'bg-white/5 text-white/70 hover:bg-white/10'
                    }`}
                  onClick={() => setVoteMode('per_round')}
                >
                  Por rodada
                </button>
                <button
                  type="button"
                  className={`px-3 py-2 rounded-xl border border-white/10 ${voteMode === 'end_only' ? 'bg-white/10 text-white' : 'bg-white/5 text-white/70 hover:bg-white/10'
                    }`}
                  onClick={() => setVoteMode('end_only')}
                >
                  Só no final
                </button>
              </div>

              <div className="mt-2 text-white/50 text-xs">
                “Por rodada” dá feedback e clima; “só no final” dá surpresa.
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Stepper
              label="Deck desejado (Fase 2)"
              value={deckDesired}
              min={5}
              max={deckMax}
              onChange={setDeckDesired}
              hint="Quantas cartas queremos na Fase 2."
            />
            <Stepper
              label="Deck máximo"
              value={deckMax}
              min={10}
              max={50}
              step={5}
              onChange={setDeckMax}
              hint="Hard cap (evita Fase 2 eterna)."
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="rounded-2xl border border-white/10 bg-black/20 p-3">
              <div className="text-white/80 text-sm font-medium">Auto-voto</div>
              <button
                type="button"
                className={`mt-2 w-full px-3 py-2 rounded-xl border border-white/10 ${allowSelfVote ? 'bg-white/10 text-white' : 'bg-white/5 text-white/70 hover:bg-white/10'
                  }`}
                onClick={() => setAllowSelfVote((s) => !s)}
              >
                {allowSelfVote ? 'Permitido' : 'Bloqueado'}
              </button>
              <div className="mt-2 text-white/50 text-xs">Recomendação: bloquear (fica mais justo e divertido).</div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-black/20 p-3">
              <div className="text-white/80 text-sm font-medium">Mostrar tema na votação</div>
              <button
                type="button"
                className={`mt-2 w-full px-3 py-2 rounded-xl border border-white/10 ${showThemeInVoting ? 'bg-white/10 text-white' : 'bg-white/5 text-white/70 hover:bg-white/10'
                  }`}
                onClick={() => setShowThemeInVoting((s) => !s)}
              >
                {showThemeInVoting ? 'Sim' : 'Não (oculto)'}
              </button>
              <div className="mt-2 text-white/50 text-xs">Quando oculto, o Board mostra “Tema oculto”.</div>
            </div>
          </div>
        </div>
      </div>

      {/* Themes */}
      <div className="rounded-2xl border border-white/10 bg-white/5 p-4 space-y-4">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <div className="text-white font-semibold">Temas</div>
            <div className="text-white/60 text-sm">Escolha tema por rodada (Fase 1) e tema da Fase 2.</div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Phase 1 slots */}
          <div className="space-y-3">
            <div className="text-white/80 text-sm font-medium">Fase 1 — por rodada</div>

            {p1Slots.map((slot, idx) => (
              <div key={idx} className="rounded-2xl border border-white/10 bg-black/20 p-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="text-white/70 text-sm">
                    Rodada <span className="text-white font-semibold">#{idx + 1}</span>
                  </div>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      className={`px-3 py-2 rounded-xl border border-white/10 ${slot.mode === 'random'
                          ? 'bg-white/10 text-white'
                          : 'bg-white/5 text-white/70 hover:bg-white/10'
                        }`}
                      onClick={() =>
                        setP1Slots((prev) => prev.map((s, i) => (i === idx ? { mode: 'random' } : s)))
                      }
                    >
                      Aleatório
                    </button>
                    <button
                      type="button"
                      className={`px-3 py-2 rounded-xl border border-white/10 ${slot.mode === 'bank'
                          ? 'bg-white/10 text-white'
                          : 'bg-white/5 text-white/70 hover:bg-white/10'
                        }`}
                      onClick={() =>
                        setP1Slots((prev) =>
                          prev.map((s, i) => (i === idx ? { mode: 'bank', theme: (s as any).theme ?? '' } : s))
                        )
                      }
                    >
                      Banco
                    </button>
                    <button
                      type="button"
                      className={`px-3 py-2 rounded-xl border border-white/10 ${slot.mode === 'custom'
                          ? 'bg-white/10 text-white'
                          : 'bg-white/5 text-white/70 hover:bg-white/10'
                        }`}
                      onClick={() =>
                        setP1Slots((prev) =>
                          prev.map((s, i) => (i === idx ? { mode: 'custom', text: (s as any).text ?? '' } : s))
                        )
                      }
                    >
                      Mestre
                    </button>
                  </div>
                </div>

                {slot.mode === 'bank' ? (
                  <div className="mt-3">
                    <ThemePicker
                      label="Escolher do banco (F1)"
                      value={slot.theme}
                      bank={themeBank.p1}
                      placeholder="Selecione um tema…"
                      onPick={(t) =>
                        setP1Slots((prev) => prev.map((s, i) => (i === idx ? { mode: 'bank', theme: t } : s)))
                      }
                    />
                  </div>
                ) : null}

                {slot.mode === 'custom' ? (
                  <div className="mt-3">
                    <div className="text-white/70 text-xs mb-1">Mestre digita</div>
                    <input
                      className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-white/85 placeholder:text-white/30"
                      placeholder='Ex: "num dia de chuva" (ou frase completa)'
                      value={slot.text}
                      onChange={(e) =>
                        setP1Slots((prev) =>
                          prev.map((s, i) => (i === idx ? { mode: 'custom', text: e.target.value } : s))
                        )
                      }
                    />
                  </div>
                ) : null}

                {slot.mode === 'random' ? (
                  <div className="mt-3 text-white/50 text-xs">Vai sortear do banco no início da rodada.</div>
                ) : null}
              </div>
            ))}
          </div>

          {/* Phase 2 theme */}
          <div className="space-y-3">
            <div className="text-white/80 text-sm font-medium">Fase 2 — tema</div>

            <div className="rounded-2xl border border-white/10 bg-black/20 p-3">
              <div className="flex gap-2 flex-wrap">
                <button
                  type="button"
                  className={`px-3 py-2 rounded-xl border border-white/10 ${p2Mode === 'random' ? 'bg-white/10 text-white' : 'bg-white/5 text-white/70 hover:bg-white/10'
                    }`}
                  onClick={() => setP2Mode('random')}
                >
                  Aleatório
                </button>
                <button
                  type="button"
                  className={`px-3 py-2 rounded-xl border border-white/10 ${p2Mode === 'bank' ? 'bg-white/10 text-white' : 'bg-white/5 text-white/70 hover:bg-white/10'
                    }`}
                  onClick={() => setP2Mode('bank')}
                >
                  Banco
                </button>
                <button
                  type="button"
                  className={`px-3 py-2 rounded-xl border border-white/10 ${p2Mode === 'custom' ? 'bg-white/10 text-white' : 'bg-white/5 text-white/70 hover:bg-white/10'
                    }`}
                  onClick={() => setP2Mode('custom')}
                >
                  Mestre
                </button>
              </div>

              {p2Mode === 'bank' ? (
                <div className="mt-3">
                  <ThemePicker
                    label="Escolher do banco (F2)"
                    value={p2BankTheme}
                    bank={themeBank.p2}
                    placeholder="Selecione um tema…"
                    onPick={setP2BankTheme}
                  />
                </div>
              ) : null}

              {p2Mode === 'custom' ? (
                <div className="mt-3">
                  <div className="text-white/70 text-xs mb-1">Mestre digita</div>
                  <input
                    className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-white/85 placeholder:text-white/30"
                    placeholder='Ex: "A pior coisa para se fazer quando…"'
                    value={p2CustomTheme}
                    onChange={(e) => setP2CustomTheme(e.target.value)}
                  />
                </div>
              ) : null}

              {p2Mode === 'random' ? (
                <div className="mt-3 text-white/50 text-xs">Vai sortear do banco ao iniciar a Fase 2.</div>
              ) : null}
            </div>

            <div className="rounded-2xl border border-white/10 bg-black/20 p-3 text-white/70 text-sm leading-relaxed">
              <div className="text-white/85 font-medium mb-1">Nota</div>
              Tema oculto na votação é ótimo pra criar “plot twist” quando o Board revela o contexto depois.
            </div>
          </div>
        </div>
      </div>

      {/* Start */}
      <div className="flex items-center justify-end gap-2">
        <button
          type="button"
          className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white/70"
          onClick={() => {
            setNamesText('Fellipe\nBianca\nDavi\nMateus');
            setP1Rounds(2);
            setSecondsPerTurn(45);
            setVoteMode('per_round');
            setMaxReactionsPerVoter(2);
            setAllowSelfVote(false);
            setShowThemeInVoting(true);
            setDeckMax(20);
            setDeckDesired(10);
            setP1Slots([{ mode: 'random' }, { mode: 'random' }]);
            setP2Mode('random');
            setP2BankTheme('');
            setP2CustomTheme('');
          }}
        >
          Resetar
        </button>

        <button
          type="button"
          className="px-5 py-2 rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 text-white disabled:opacity-40"
          disabled={blocked}
          onClick={() => {
            const payload: SetupPayload = {
              players,
              p1Rounds: clamp(p1Rounds, 1, 12),
              secondsPerTurn: clamp(secondsPerTurn, 10, 180),

              voteMode,
              maxReactionsPerVoter: clamp(maxReactionsPerVoter, 1, 5),
              allowSelfVote,
              showThemeInVoting,

              deckDesired: clamp(deckDesired, 5, deckMax),
              deckMax: clamp(deckMax, 10, 50),

              p1ThemeSlots: p1Slots.map(slotToPayload),
              p2Theme: p2ToPayload(),
            };

            onStart(payload);
          }}
        >
          Começar
        </button>
      </div>
    </div>
  );
}
