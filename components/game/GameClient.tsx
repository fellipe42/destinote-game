// components/game/GameClient.tsx
'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

import GameNavbar from './GameNavbar';
import GameShell from './GameShell';
import GameToast from './GameToast';

import type { GameEvent, GameState, Reaction, ThemeSlot, VoteMode } from '@/lib/game/v2/types';
import { REACTIONS } from '@/lib/game/v2/types';


import { createEmpty, reduce } from '@/lib/game/v2/engine';
import { uid, clamp } from '@/lib/game/v2/utils';
import { loadRoom, saveRoom } from '@/lib/game/v2/storage';
import { gameChannelName, normalizeIncoming, type GameBroadcastMessage } from '@/lib/game/v2/bus';
import { computeRoundWinner, computeSessionReactions, fmtPhaseLabel, getCardById, isSetupComplete } from '@/lib/game/v2/selectors';
import { exportRoomJson } from '@/lib/game/v2/exporter';
import { saveSetupDraft, loadSetupDraft } from '@/lib/game/v2/setupDraft';
import { loadThemeBank } from '@/lib/game/v2/themeBank';
import { useGameUiPrefs } from './useGameUiPrefs';

const REACTION_LABEL: Record<Reaction, string> = {
  '👍': 'Like',
  '❤️': 'Coração',
  '😂': 'Haha',
  '🔥': 'Foguinho',
  '💀': 'Caveira',
};

type ThemeFocus = { phase: 'p1'; index: number } | { phase: 'p2' } | null;

type GameToastState = {
  open: boolean;
  title: string;
  description?: string;
};

function toThemeSlot(s: string): ThemeSlot {
  const t = (s ?? '').trim();
  return t ? { kind: 'custom', text: t } : { kind: 'random' };
}


export default function GameClient() {
  const params = useSearchParams();
  const roomId = String(params.get('room') || 'default');

  const bcRef = useRef<BroadcastChannel | null>(null);
  const [state, setState] = useState<GameState>(() => createEmpty(roomId));
  const [prefs, setPrefs, resetPrefs] = useGameUiPrefs(roomId);

  // --- Theme suggestions (from local bank)
  const [themeBankTick, setThemeBankTick] = useState(0);
  const themeBank = useMemo(() => loadThemeBank(), [themeBankTick]);

  // Setup form state
  const [playersText, setPlayersText] = useState('Fellipe\nConvidado 2\nConvidado 3');
  const [voteMode, setVoteMode] = useState<VoteMode>('per_round');
  const [p1Rounds, setP1Rounds] = useState(1);
  const [secondsPerTurn, setSecondsPerTurn] = useState(60);
  const [maxReactionsPerVoter, setMaxReactionsPerVoter] = useState(3);
  const [deckDesired, setDeckDesired] = useState(10);
  const [allowSelfVote, setAllowSelfVote] = useState(false);
  const [showThemeInVoting, setShowThemeInVoting] = useState(true);

  // Theme slots
  const [p1ThemeSlots, setP1ThemeSlots] = useState<string[]>(['*']);
  const [p2Theme, setP2Theme] = useState<string>('*');
  const [themeFocus, setThemeFocus] = useState<ThemeFocus>({ phase: 'p1', index: 0 });

  // Phase 1 write
  const [writeText, setWriteText] = useState('');

  // Phase 2 ordering drag
  const dragIndexRef = useRef<number | null>(null);

  // Toast
  const [toast, setToast] = useState<GameToastState>({
    open: false,
    title: '',
    description: '',
  });

  function showToast(title: string, description?: string) {
    setToast({ open: true, title, description });
    window.setTimeout(() => {
      setToast((p) => ({ ...p, open: false }));
    }, 2200);
  }

  // Load room on mount / roomId change
  useEffect(() => {
    const loaded = loadRoom(roomId);
    setState(loaded ?? createEmpty(roomId));
  }, [roomId]);

  // BroadcastChannel sync
  useEffect(() => {
    bcRef.current?.close();
    const bc = new BroadcastChannel(gameChannelName(roomId));
    bcRef.current = bc;

    bc.onmessage = (e) => {
      const msg = normalizeIncoming(e.data) as GameBroadcastMessage | null;
      if (!msg) return;
      if (msg.type === 'hard_reset') {
        if (msg.roomId !== roomId) return;
        const next = createEmpty(roomId);
        setState(next);
        saveRoom(roomId, next);
        return;
      }
      if (msg.type === 'state') {
        if (msg.state.roomId !== roomId) return;
        setState(msg.state);
        saveRoom(roomId, msg.state);
      }
    };

    return () => {
      bc.close();
    };
  }, [roomId]);

  // Persist on any local dispatch
  const dispatch = useMemo(() => {
    return (event: GameEvent) => {
      setState((prev) => {
        const next = reduce(prev, event);
        saveRoom(roomId, next);
        try {
          bcRef.current?.postMessage({ type: 'state', state: next } satisfies GameBroadcastMessage);
        } catch { }
        return next;
      });
    };
  }, [roomId]);

  // Setup draft load (players only)
  useEffect(() => {
    const d = loadSetupDraft(roomId);
    if (!d) return;
    if (Array.isArray(d.players) && d.players.length) {
      setPlayersText(d.players.join('\n'));
    }
  }, [roomId]);

  const isDev = process.env.NODE_ENV !== 'production';

  const hardReset = () => {
    dispatch({ type: 'RESET_ALL', roomId } as any);
    try {
      bcRef.current?.postMessage({ type: 'hard_reset', roomId, at: Date.now() } satisfies GameBroadcastMessage);
    } catch { }
    showToast('Reset feito', 'A sala foi reiniciada.');
  };

  const devExport = () => {
    const json = exportRoomJson(state);
    navigator.clipboard.writeText(json).then(
      () => showToast('Exportado', 'JSON copiado para a área de transferência.'),
      () => showToast('Falhou', 'Não foi possível copiar o JSON.')
    );
  };

  // Theme picking from navbar dialog
  const onPickTheme = (phase: 'p1' | 'p2', theme: string) => {
    const t = theme.trim();
    if (!t) return;

    if (phase === 'p2') {
      setP2Theme(t);
      setThemeFocus({ phase: 'p2' });
      showToast('Tema selecionado', 'Aplicado na Fase 2.');
      return;
    }

    // phase === 'p1'
    // prefer focused slot; fallback to first
    const idx = themeFocus?.phase === 'p1' ? themeFocus.index : 0;
    setP1ThemeSlots((prev) => {
      const next = [...prev];
      if (!next.length) next.push('*');
      next[idx] = t;
      return next;
    });
    setThemeFocus({ phase: 'p1', index: idx });
    showToast('Tema selecionado', `Aplicado na Rodada ${idx + 1}.`);
  };

  // Setup: normalize slots count when rounds changes
  useEffect(() => {
    setP1ThemeSlots((prev) => {
      const next = [...prev];
      while (next.length < p1Rounds) next.push('*');
      while (next.length > p1Rounds) next.pop();
      return next;
    });
    setThemeFocus((prev) => {
      if (!prev) return { phase: 'p1', index: 0 };
      if (prev.phase === 'p1') return { phase: 'p1', index: clamp(prev.index, 0, Math.max(0, p1Rounds - 1)) };
      return prev;
    });
  }, [p1Rounds]);

  const startGame = () => {
    const cleaned = playersText
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean)
      .slice(0, 12);

    if (cleaned.length < 2) {
      showToast('Falta gente', 'Coloque pelo menos 2 jogadores.');
      return;
    }

    const payload = {
      roomId,
      players: cleaned,
      voteMode,
      p1Rounds,
      secondsPerTurn: clamp(secondsPerTurn, 10, 180),
      maxReactionsPerVoter: clamp(maxReactionsPerVoter, 1, 5),
      deckDesired: clamp(deckDesired, 6, 20),
      deckMax: 20,
      allowSelfVote,
      showThemeInVoting,
      p1ThemeSlots: p1ThemeSlots.map(toThemeSlot),
      p2Theme: toThemeSlot(p2Theme),
      seed: state.config.seed ?? 1337,
    };

    saveSetupDraft(roomId, { players: cleaned });
    dispatch({ type: 'SETUP_START', payload } as any);
  };

  const p1Theme = state.p1.currentTheme?.trim() || undefined;
  const p2ThemeText = state.p2.theme?.trim() || undefined;

  // Voting derived
  const voting = state.p1.voting;
  const currentVoterId = voting?.currentVoterId ?? null;
  const currentVoter = currentVoterId ? state.players.find((p) => p.id === currentVoterId) : null;

  const roundWinner = useMemo(() => {
    return computeRoundWinner(state) ?? null;
  }, [state]);

  const sessionReactions = useMemo(() => {
    // cardId -> { reaction -> count }
    const byCard: Record<string, Record<Reaction, number>> = {};
    for (const c of state.p1.cards) {
      byCard[c.id] = { '👍': 0, '❤️': 0, '😂': 0, '🔥': 0, '💀': 0 };
    }
    const stats = computeSessionReactions(state);
    for (const [cardId, map] of Object.entries(stats)) {
      if (!byCard[cardId]) byCard[cardId] = { '👍': 0, '❤️': 0, '😂': 0, '🔥': 0, '💀': 0 };
      for (const r of REACTIONS) {
        byCard[cardId][r] = map[r] ?? 0;
      }
    }
    return byCard;
  }, [state]);

  const canStart = state.phase === 'setup' && isSetupComplete(state) === true;

  const moveOrdering = (from: number, to: number) => {
    if (from === to) return;
    dispatch({ type: 'P2_MOVE', from, to } as any);
  };

  const setOrdering = (ordering: string[]) => {
    dispatch({ type: 'P2_SET_ORDERING', ordering } as any);
  };

  const onDragStart = (idx: number) => {
    dragIndexRef.current = idx;
  };

  const onDrop = (toIdx: number) => {
    const fromIdx = dragIndexRef.current;
    dragIndexRef.current = null;
    if (fromIdx == null) return;
    moveOrdering(fromIdx, toIdx);
  };

  return (
    <GameShell prefs={prefs}>
      <GameNavbar
        roomId={roomId}
        onHardReset={hardReset}
        prefs={prefs}
        onUiChange={setPrefs}
        onUiReset={resetPrefs}
        onDevExport={isDev ? devExport : undefined}
        showThemes={state.phase === 'setup'}
        onPickTheme={onPickTheme}
        onThemeBankChanged={() => setThemeBankTick((t) => t + 1)}
      />

      <div className="pt-20 pb-10 px-3">
        {/* Setup */}
        {state.phase === 'setup' ? (
          <div className="mx-auto w-full max-w-3xl space-y-4">
            <div className="text-center text-white/80 text-sm">{fmtPhaseLabel(state.phase)}</div>

            <Card className="border-white/10 bg-white/5 backdrop-blur-xl">
              <CardHeader>
                <CardTitle className="text-white">Criar sala</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="text-white/80 text-sm mb-2">Jogadores (1 por linha)</div>
                  <Textarea
                    value={playersText}
                    onChange={(e) => setPlayersText(e.target.value)}
                    className="bg-black/30 text-white placeholder:text-white/40"
                    rows={5}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <div className="text-white/80 text-sm mb-2">Rodadas da Fase 1</div>
                    <Input
                      value={String(p1Rounds)}
                      onChange={(e) => setP1Rounds(clamp(parseInt(e.target.value || '1', 10), 1, 6))}
                      className="bg-black/30 text-white"
                      inputMode="numeric"
                    />
                  </div>

                  <div>
                    <div className="text-white/80 text-sm mb-2">Modo de votação</div>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="secondary"
                        onClick={() => setVoteMode('per_round')}
                        className={voteMode === 'per_round' ? 'bg-white/20 text-white' : 'bg-white/10 text-white hover:bg-white/15'}
                      >
                        Por rodada
                      </Button>
                      <Button
                        type="button"
                        variant="secondary"
                        onClick={() => setVoteMode('end_only')}
                        className={voteMode === 'end_only' ? 'bg-white/20 text-white' : 'bg-white/10 text-white hover:bg-white/15'}
                      >
                        Só no final
                      </Button>
                    </div>
                  </div>

                  <div>
                    <div className="text-white/80 text-sm mb-2">Tempo por turno (seg)</div>
                    <Input
                      value={String(secondsPerTurn)}
                      onChange={(e) => setSecondsPerTurn(clamp(parseInt(e.target.value || '60', 10), 10, 180))}
                      className="bg-black/30 text-white"
                      inputMode="numeric"
                    />
                  </div>

                  <div>
                    <div className="text-white/80 text-sm mb-2">Reações por votante</div>
                    <Input
                      value={String(maxReactionsPerVoter)}
                      onChange={(e) => setMaxReactionsPerVoter(clamp(parseInt(e.target.value || '3', 10), 1, 5))}
                      className="bg-black/30 text-white"
                      inputMode="numeric"
                    />
                  </div>

                  <div>
                    <div className="text-white/80 text-sm mb-2">Tamanho do deck (Fase 2)</div>
                    <Input
                      value={String(deckDesired)}
                      onChange={(e) => setDeckDesired(clamp(parseInt(e.target.value || '10', 10), 6, 20))}
                      className="bg-black/30 text-white"
                      inputMode="numeric"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-white/80 text-sm">
                      <input type="checkbox" checked={allowSelfVote} onChange={(e) => setAllowSelfVote(e.target.checked)} />
                      Permitir votar na própria carta
                    </label>

                    <label className="flex items-center gap-2 text-white/80 text-sm">
                      <input type="checkbox" checked={showThemeInVoting} onChange={(e) => setShowThemeInVoting(e.target.checked)} />
                      Mostrar tema durante a votação
                    </label>
                  </div>
                </div>

                <Card className="border-white/10 bg-black/20">
                  <CardHeader>
                    <CardTitle className="text-white text-base">Temas</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="text-white/60 text-xs">
                      Clique no input que você quer preencher e depois use o botão <span className="text-white/80 font-semibold">Temas</span> na navbar para <span className="text-white/80 font-semibold">Selecionar</span>.
                    </div>

                    <div className="space-y-2">
                      {p1ThemeSlots.map((slot, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <div className="w-24 text-white/70 text-sm">Rodada {i + 1}</div>
                          <Input
                            value={slot}
                            onFocus={() => setThemeFocus({ phase: 'p1', index: i })}
                            onChange={(e) => {
                              const v = e.target.value;
                              setP1ThemeSlots((prev) => {
                                const next = [...prev];
                                next[i] = v;
                                return next;
                              });
                            }}
                            placeholder={`Rodada ${i + 1} (ex: *)`}
                            list="dn-game-themes-p1"
                            className="bg-black/30 text-white placeholder:text-white/40"
                          />
                        </div>
                      ))}
                    </div>

                    <div className="flex items-center gap-2 pt-2">
                      <div className="w-24 text-white/70 text-sm">Fase 2</div>
                      <Input
                        value={p2Theme}
                        onFocus={() => setThemeFocus({ phase: 'p2' })}
                        onChange={(e) => setP2Theme(e.target.value)}
                        placeholder="* (aleatório)"
                        list="dn-game-themes-p2"
                        className="bg-black/30 text-white placeholder:text-white/40"
                      />
                    </div>

                    {/* Autocomplete suggestions (from banco local) */}
                    <datalist id="dn-game-themes-p1">
                      {themeBank.p1.map((t) => (
                        <option key={t} value={t} />
                      ))}
                    </datalist>
                    <datalist id="dn-game-themes-p2">
                      {themeBank.p2.map((t) => (
                        <option key={t} value={t} />
                      ))}
                    </datalist>

                    <div className="text-xs text-white/50">
                      {isDev
                        ? 'Banco de temas (editor) fica no botão “Temas” da navbar.'
                        : 'Os temas são sugestões locais (não mexem no site).'}
                    </div>
                  </CardContent>
                </Card>

                <Button onClick={startGame} className="w-full bg-purple-600 hover:bg-purple-700 text-white">
                  Começar
                </Button>
              </CardContent>
            </Card>
          </div>
        ) : null}

        {/* Phase 1 Write */}
        {state.phase === 'p1_write' ? (
          <div className="mx-auto w-full max-w-3xl space-y-4">
            <div className="text-center text-white/80 text-sm">{fmtPhaseLabel(state.phase)}</div>

            <Card className="border-white/10 bg-white/5 backdrop-blur-xl">
              <CardHeader>
                <CardTitle className="text-white">
                  Fase 1 — Escreva {p1Theme ? `(${p1Theme})` : ''}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-white/70">
                  Jogador atual: <span className="text-white font-semibold">{state.players[state.p1.playerIndex]?.name ?? '—'}</span>
                </div>

                <Textarea
                  value={writeText}
                  onChange={(e) => setWriteText(e.target.value)}
                  placeholder="Escreva uma ação..."
                  className="bg-black/30 text-white placeholder:text-white/40"
                  rows={4}
                />

                <div className="flex gap-2">
                  <Button
                    onClick={() => {
                      const t = writeText.trim();
                      if (!t) return;
                      const current = state.players[state.p1.playerIndex];
                      if (!current) return;
                      dispatch({ type: 'P1_SUBMIT', playerId: current.id, text: t } as any);
                      setWriteText('');
                    }}
                    className="bg-purple-600 hover:bg-purple-700 text-white"
                  >
                    Enviar
                  </Button>

                  <Button
                    variant="secondary"
                    className="bg-white/10 text-white hover:bg-white/15"
                    onClick={() => {
                      const current = state.players[state.p1.playerIndex];
                      if (!current) return;
                      dispatch({ type: 'P1_SKIP', playerId: current.id } as any);
                      setWriteText('');
                    }}
                  >
                    Pular
                  </Button>
                </div>

                <div className="text-xs text-white/50">
                  Rodada {state.p1.round}/{state.config.p1Rounds}
                </div>
              </CardContent>
            </Card>
          </div>
        ) : null}

        {/* Phase 1 Vote */}
        {state.phase === 'p1_vote' && voting ? (
          <div className="mx-auto w-full max-w-4xl space-y-4">
            <div className="text-center text-white/80 text-sm">{fmtPhaseLabel(state.phase)}</div>

            <Card className="border-white/10 bg-white/5 backdrop-blur-xl">
              <CardHeader>
                <CardTitle className="text-white">Fase 1 — Votação</CardTitle>
              </CardHeader>

              <CardContent className="space-y-3">
                <div className="text-white/70">
                  Vez de votar:{' '}
                  <span className="text-white font-semibold">{currentVoter?.name ?? '—'}</span>
                  {!voting.hideThemeContext && state.p1.currentTheme ? (
                    <>
                      {' '}
                      • Tema: <span className="text-white font-semibold">{state.p1.currentTheme}</span>
                    </>
                  ) : null}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {state.p1.cards
                    .filter((c) => c.round === state.p1.round)
                    .map((c) => {
                      const author = state.players.find((p) => p.id === c.authorId);
                      const canVoteSelf = state.config.allowSelfVote;
                      const isSelf = currentVoterId && c.authorId === currentVoterId;
                      const disabled = isSelf && !canVoteSelf;
                      const used = currentVoterId ? (voting.votesUsedByVoter[currentVoterId] ?? 0) : 0;
                      const maxed = used >= state.config.maxReactionsPerVoter;


                      return (
                        <div key={c.id} className="rounded-2xl border border-white/10 bg-black/20 p-4">
                          <div className="text-white/90 leading-snug">{c.text}</div>
                          <div className="mt-2 text-xs text-white/50">Autor: {author?.name ?? '—'}</div>

                          <div className="mt-3 flex flex-wrap gap-2">
                            {REACTIONS.map((r) => (
                              <Button
                                key={r}
                                disabled={disabled || maxed}
                                variant="secondary"
                                className="bg-white/10 text-white hover:bg-white/15"
                                onClick={() => {
                                  if (!currentVoterId) return;
                                  dispatch({ type: 'P1_CAST_REACTION', voterId: currentVoterId, cardId: c.id, reaction: r } as any);
                                }}
                              >
                                {r} <span className="ml-1 text-xs text-white/60">{REACTION_LABEL[r]}</span>
                              </Button>
                            ))}
                          </div>

                          {disabled ? (
                            <div className="mt-2 text-xs text-white/40">Você não pode votar na própria carta.</div>
                          ) : null}
                        </div>
                      );
                    })}
                </div>

                <div className="flex gap-2 pt-2">
                  <Button
                    variant="secondary"
                    className="bg-white/10 text-white hover:bg-white/15"
                    onClick={() => {
                      if (!currentVoterId) return;
                      dispatch({ type: 'P1_SKIP_VOTER', voterId: currentVoterId } as any);
                    }}
                  >
                    Terminei (próximo votante)
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : null}

        {/* Phase 1 Review */}
        {state.phase === 'p1_review' ? (
          <div className="mx-auto w-full max-w-4xl space-y-4">
            <div className="text-center text-white/80 text-sm">{fmtPhaseLabel(state.phase)}</div>

            <Card className="border-white/10 bg-white/5 backdrop-blur-xl">
              <CardHeader>
                <CardTitle className="text-white">Revisão da rodada</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-white/70">
                  Tema: <span className="text-white font-semibold">{state.p1.currentTheme}</span>
                </div>

                <div className="space-y-2">
                  {state.p1.cards
                    .filter((c) => c.round === state.p1.round)
                    .map((c) => {
                      const author = state.players.find((p) => p.id === c.authorId);
                      const counts = sessionReactions[c.id] ?? { '👍': 0, '❤️': 0, '😂': 0, '🔥': 0, '💀': 0 };
                      return (
                        <div key={c.id} className="rounded-2xl border border-white/10 bg-black/20 p-4">
                          <div className="text-white/90 leading-snug">{c.text}</div>
                          <div className="mt-2 text-xs text-white/50">Autor: {author?.name ?? '—'}</div>
                          <div className="mt-3 flex gap-3 text-sm text-white/80">
                            {REACTIONS.map((r) => (
                              <div key={r} className="flex items-center gap-1">
                                <span>{r}</span>
                                <span className="text-white/60">{counts[r] ?? 0}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                </div>

                <Button className="bg-purple-600 hover:bg-purple-700 text-white" onClick={() => {
                  const current = state.players[state.p1.playerIndex];
                  if (!current) return;
                  dispatch({ type: 'P1_SKIP', playerId: current.id } as any);
                  setWriteText('');
                }}>
                  Continuar
                </Button>
              </CardContent>
            </Card>
          </div>
        ) : null}

        {/* Phase 1 Results */}
        {state.phase === 'p1_results' ? (
          <div className="mx-auto w-full max-w-4xl space-y-4">
            <div className="text-center text-white/80 text-sm">{fmtPhaseLabel(state.phase)}</div>

            <Card className="border-white/10 bg-white/5 backdrop-blur-xl">
              <CardHeader>
                <CardTitle className="text-white">Resultados da Fase 1</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {roundWinner ? (
                  <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                    <div className="text-white/70 text-sm">Vencedor da última rodada</div>
                    <div className="text-white text-xl font-bold">{roundWinner.winnerName}</div>
                    <div className="mt-2 text-white/90">{roundWinner.card.text}</div>
                  </div>
                ) : (
                  <div className="text-white/60">—</div>
                )}

                <Button className="bg-purple-600 hover:bg-purple-700 text-white" onClick={() => dispatch({ type: 'P2_START' } as any)}>
                  Começar Fase 2
                </Button>
              </CardContent>
            </Card>
          </div>
        ) : null}

        {/* Phase 2 Intro */}
        {state.phase === 'p2_intro' ? (
          <div className="mx-auto w-full max-w-3xl">
            <Card className="border-white/10 bg-white/5 backdrop-blur-xl">
              <CardHeader>
                <CardTitle className="text-white">Fase 2 — Ordenação secreta</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 p-6">
                <div className="text-white/70">
                  Prompt: <span className="text-white font-semibold">{p2ThemeText ?? '—'}</span>
                </div>
                <div className="text-white/70">
                  Cada jogador vai ordenar as cartas (sem ver o contexto). Depois vocês discutem e revelam o vencedor.
                </div>

                <Button className="bg-purple-600 hover:bg-purple-700 text-white" onClick={() => {
                  const current = state.players[state.p1.playerIndex];
                  if (!current) return;
                  dispatch({ type: 'P1_SKIP', playerId: current.id } as any);
                  setWriteText('');
                }}>
                  Continuar
                </Button>
              </CardContent>
            </Card>
          </div>
        ) : null}

        {/* Phase 2 Rank */}
        {state.phase === 'p2_rank' ? (
          <div className="mx-auto w-full max-w-3xl">
            <Card className="border-white/10 bg-white/5 backdrop-blur-xl">
              <CardHeader>
                <CardTitle className="text-white">Fase 2 — Ordene (secreto)</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 p-6">
                <div className="text-white/70">
                  Prompt: <span className="text-white font-semibold">{p2ThemeText ?? '—'}</span>
                </div>
                <div className="text-white/70">
                  Vez de: <span className="text-white font-semibold">{state.players[state.p2.raterIndex]?.name ?? '—'}</span>
                </div>

                <div className="space-y-2">
                  {state.p2.ordering.map((cardId, idx) => {
                    const card = getCardById(state.p1.cards, cardId);
                    if (!card) return null;

                    return (
                      <div
                        key={card.id}
                        className="flex items-start gap-3 rounded-2xl border border-white/10 bg-black/20 p-3"
                        draggable
                        onDragStart={() => onDragStart(idx)}
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={() => onDrop(idx)}
                      >
                        <div className="w-6 pt-[2px] text-center text-white/50">{idx + 1}</div>
                        <div className="flex-1 text-white/90 leading-snug">{card.text}</div>

                        <div className="flex gap-2">
                          <Button
                            variant="secondary"
                            className="bg-white/10 text-white hover:bg-white/15"
                            onClick={() => {
                              if (idx <= 0) return;
                              moveOrdering(idx, idx - 1);
                            }}
                          >
                            ↑
                          </Button>
                          <Button
                            variant="secondary"
                            className="bg-white/10 text-white hover:bg-white/15"
                            onClick={() => {
                              if (idx >= state.p2.ordering.length - 1) return;
                              moveOrdering(idx, idx + 1);
                            }}
                          >
                            ↓
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="flex gap-2 pt-2">
                  <Button
                    className="bg-purple-600 hover:bg-purple-700 text-white"
                    onClick={() => {
                      const current = state.players[state.p2.raterIndex];
                      if (!current) return;
                      dispatch({ type: 'P2_SUBMIT_RANKING', playerId: current.id, ordering: state.p2.ordering } as any);
                    }}
                  >
                    Confirmar ordem
                  </Button>

                  <Button
                    variant="secondary"
                    className="bg-white/10 text-white hover:bg-white/15"
                    onClick={() => {
                      // quick shuffle-ish: rotate by 1, just to have a “manual hack” button
                      const o = [...state.p2.ordering];
                      if (o.length > 1) o.push(o.shift()!);
                      setOrdering(o);
                      showToast('Ajuste feito', 'Ordem alterada.');
                    }}
                  >
                    Ajuste rápido
                  </Button>
                </div>

                <div className="text-xs text-white/50">
                  Dica: pode arrastar e soltar (drag) ou usar ↑ ↓.
                </div>
              </CardContent>
            </Card>
          </div>
        ) : null}

        {/* Phase 2 Discuss */}
        {state.phase === 'p2_discuss' ? (
          <div className="mx-auto w-full max-w-3xl">
            <Card className="border-white/10 bg-white/5 backdrop-blur-xl">
              <CardHeader>
                <CardTitle className="text-white">Fase 2 — Discussão</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 p-6">
                <div className="text-white/70">
                  Prompt: <span className="text-white font-semibold">{p2ThemeText ?? '—'}</span>
                </div>

                <div className="text-white/70">Quando estiverem prontos…</div>

                <div className="text-sm text-white/70">
                  Regra: a carta vencedora da Fase 2 é aquela que, em média, ficou mais alta nos rankings secretos.
                  Se a carta vencedora for sua, você ganha.
                </div>

                <div className="space-y-2">
                  {state.p2.ordering.map((cardId, i) => {
                    const card = getCardById(state.p1.cards, cardId);
                    if (!card) return null;
                    return (
                      <div key={card.id} className="flex items-start gap-3 rounded-2xl border border-white/10 bg-black/20 p-3">
                        <div className="w-6 pt-[2px] text-center text-white/50">{i + 1}</div>
                        <div className="flex-1 text-white/90 leading-snug">{card.text}</div>
                      </div>
                    );
                  })}
                </div>

                <Button className="bg-purple-600 hover:bg-purple-700 text-white" onClick={() => dispatch({ type: 'P2_FINALIZE' } as any)}>
                  Revelar
                </Button>
              </CardContent>
            </Card>
          </div>
        ) : null}

        {/* Reveal */}
        {state.phase === 'reveal' ? (
          <div className="mx-auto w-full max-w-3xl space-y-4">
            <Card className="border-white/10 bg-white/5 backdrop-blur-xl">
              <CardHeader>
                <CardTitle className="text-white">Revelação final</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 p-6">
                <div className="text-white/70">
                  Vencedor: <span className="text-white font-semibold">{String(winnerName(state) ?? '—')}</span>
                </div>

                <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                  <div className="text-white/70 text-sm">Carta vencedora</div>
                  <div className="text-white text-xl font-bold">
                    {(() => {
                      const id = state.reveal?.phase2?.winningCardId;
                      const c = id ? getCardById(state.p1.cards, id) : null;
                      return c?.text ?? '—';
                    })()}
                  </div>
                </div>

                <Button variant="secondary" className="bg-white/10 text-white hover:bg-white/15" onClick={hardReset}>
                  Jogar de novo (reset)
                </Button>
              </CardContent>
            </Card>
          </div>
        ) : null}
      </div>

      <GameToast open={toast.open} title={toast.title} description={toast.description} onClose={() => setToast((p) => ({ ...p, open: false }))} />
    </GameShell>
  );
}

/*
Changes Summary
- [FIX] Reações voltaram para 👍 ❤️ 😂 🔥 💀 (UI + tipos).
- [FIX] “Revelar” na Fase 2 agora dispara P2_FINALIZE (antes era NEXT e não fazia nada).
- [UX] Discussão da Fase 2 mostra as cartas sem contexto + regra clara.
- [UX] Setup agora tem datalist (autocomplete) com banco local de temas.
*/
