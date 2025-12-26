// lib/game/v1/engine.ts
import type {
  ActionCard,
  GameState,
  Phase1ResultsState,
  Player,
  Reaction,
  RevealState,
  SetupConfig,
  ThemeSlot,
  Vote,
} from './types';
import { REACTIONS } from './types';

function now() {
  return Date.now();
}

function uid(prefix: string) {
  const rnd = Math.random().toString(36).slice(2, 8);
  const ts = Date.now().toString(36).slice(-5);
  return `${prefix}_${ts}_${rnd}`;
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function normalizeText(s: string) {
  return s.trim().slice(0, 200);
}

function resolveSlot(slot: ThemeSlot, bank: string[], rng: () => number): string {
  if (slot.kind === 'fixed') return slot.text.trim() || '(tema vazio)';
  if (!bank.length) return '(sem temas no banco)';
  const i = Math.floor(rng() * bank.length);
  return bank[i] ?? '(tema inválido)';
}

function mulberry32(seed: number) {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function startGame(setup: SetupConfig, themeBank: string[], roomId?: string): GameState {
  const seed = Math.floor(Math.random() * 2 ** 31);
  const rng = mulberry32(seed);

  const playerNames = setup.playerNames.map((x) => x.trim()).filter(Boolean);
  if (playerNames.length < 2) throw new Error('Precisa de pelo menos 2 jogadores.');

  const players: Player[] = playerNames.map((name) => ({
    id: uid('p'),
    name,
    createdAt: now(),
  }));

  const p1Rounds = clamp(setup.p1Rounds ?? 2, 1, 12);
  const secondsPerTurn = clamp(setup.secondsPerTurn ?? 45, 10, 180);

  const maxReactionsPerVoter = clamp(setup.maxReactionsPerVoter ?? 2, 1, 5);
  const deckMax = clamp(setup.deckMax ?? 20, 5, 50);
  const deckDesired = clamp(setup.deckDesired ?? Math.max(players.length + 1, 8), 5, deckMax);

  // resolve themes upfront
  const themesByRound: string[] = [];
  for (let i = 0; i < p1Rounds; i++) {
    const slot = setup.p1ThemeSlots?.[i] ?? { kind: 'random' as const };
    themesByRound.push(resolveSlot(slot, themeBank, rng));
  }

  const p2ThemeText = resolveSlot(setup.p2Theme ?? { kind: 'random' }, themeBank, rng);

  const g: GameState = {
    version: 'v1',
    phase: 'p1_writing',
    roomId,

    config: {
      p1Rounds,
      secondsPerTurn,
      voteMode: setup.voteMode ?? 'per_round',
      maxReactionsPerVoter,
      allowSelfVote: !!setup.allowSelfVote,
      showThemeInVoting: setup.showThemeInVoting ?? true,
      deckDesired,
      deckMax,
      p1ThemeSlots: setup.p1ThemeSlots ?? [],
      p2Theme: setup.p2Theme ?? { kind: 'random' },
    },

    players,

    p1: {
      round: 1,
      playerIndex: 0,
      themesByRound,
      cards: [],
    },

    p1Voting: null,
    p1Results: null,

    votes: [],

    p2: null,
    reveal: null,

    seq: { nextCardNumber: 1, nextVoteNumber: 1 },

    startedAt: now(),
    updatedAt: now(),
  };

  (g as any).__p2ThemeResolved = p2ThemeText;

  return g;
}

export function currentPhase1Theme(game: GameState) {
  const idx = clamp(game.p1.round - 1, 0, game.p1.themesByRound.length - 1);
  return game.p1.themesByRound[idx] ?? '(tema)';
}

function advanceTurn(game: GameState): GameState {
  const nextIndex = game.p1.playerIndex + 1;
  if (nextIndex < game.players.length) {
    return { ...game, p1: { ...game.p1, playerIndex: nextIndex }, updatedAt: now() };
  }

  const roundDone = game.p1.round;
  const hasMoreRounds = game.p1.round < game.config.p1Rounds;

  if (game.config.voteMode === 'per_round') {
    return startPhase1Voting(game, { scope: 'round', round: roundDone });
  }

  if (hasMoreRounds) {
    return { ...game, p1: { ...game.p1, round: game.p1.round + 1, playerIndex: 0 }, updatedAt: now() };
  }

  return startPhase1Voting(game, { scope: 'final', round: null });
}

export function submitAction(game: GameState, text: string): GameState {
  if (game.phase !== 'p1_writing') return game;
  const t = normalizeText(text);
  if (!t) return game;

  const player = game.players[game.p1.playerIndex];
  const card: ActionCard = {
    id: uid('c'),
    number: game.seq.nextCardNumber,
    authorId: player.id,
    round: game.p1.round,
    text: t,
    createdAt: now(),
  };

  const next: GameState = {
    ...game,
    p1: { ...game.p1, cards: [...game.p1.cards, card] },
    seq: { ...game.seq, nextCardNumber: game.seq.nextCardNumber + 1 },
    updatedAt: now(),
  };

  return advanceTurn(next);
}

export function nextTurn(game: GameState): GameState {
  if (game.phase !== 'p1_writing') return game;
  return advanceTurn(game);
}

export function startPhase1Voting(
  game: GameState,
  opt: { scope: 'round' | 'final'; round: number | null }
): GameState {
  const sessionKey = opt.scope === 'round' ? `round:${opt.round}` : 'final';

  return {
    ...game,
    phase: 'p1_voting',
    p1Voting: {
      sessionKey,
      scope: opt.scope,
      round: opt.round,
      currentVoterIndex: 0,
      votesUsedByVoter: {},
      voterDone: {},
    },
    updatedAt: now(),
  };
}

export function setCurrentVoter(game: GameState, voterId: string | null): GameState {
  if (game.phase !== 'p1_voting' || !game.p1Voting) return game;
  if (!voterId) return game;

  const idx = game.players.findIndex((p) => p.id === voterId);
  if (idx < 0) return game;

  return { ...game, p1Voting: { ...game.p1Voting, currentVoterIndex: idx }, updatedAt: now() };
}

function eligibleCardsForVoting(game: GameState): ActionCard[] {
  if (game.phase !== 'p1_voting' || !game.p1Voting) return [];
  if (game.p1Voting.scope === 'final') return game.p1.cards;
  return game.p1.cards.filter((c) => c.round === game.p1Voting!.round);
}

export function addVote(game: GameState, voterId: string, cardId: string, reaction: Reaction): GameState {
  if (game.phase !== 'p1_voting' || !game.p1Voting) return game;

  const voter = game.players.find((p) => p.id === voterId);
  if (!voter) return game;

  const cards = eligibleCardsForVoting(game);
  const card = cards.find((c) => c.id === cardId);
  if (!card) return game;

  if (!game.config.allowSelfVote && card.authorId === voterId) return game;

  const used = game.p1Voting.votesUsedByVoter[voterId] ?? 0;
  if (used >= game.config.maxReactionsPerVoter) return game;

  const v: Vote = {
    id: uid('v'),
    number: game.seq.nextVoteNumber,
    sessionKey: game.p1Voting.sessionKey,
    voterId,
    cardId,
    reaction,
    createdAt: now(),
  };

  return {
    ...game,
    votes: [...game.votes, v],
    seq: { ...game.seq, nextVoteNumber: game.seq.nextVoteNumber + 1 },
    p1Voting: {
      ...game.p1Voting,
      votesUsedByVoter: { ...game.p1Voting.votesUsedByVoter, [voterId]: used + 1 },
    },
    updatedAt: now(),
  };
}

function buildPhase1Results(game: GameState): Phase1ResultsState {
  const key = game.p1Voting?.sessionKey ?? 'final';
  const cards = key === 'final' ? game.p1.cards : game.p1.cards.filter((c) => c.round === game.p1Voting?.round);

  const pointsByCardId: Record<string, number> = {};
  const reactionCountsByCardId: Record<string, Partial<Record<Reaction, number>>> = {};

  for (const c of cards) {
    pointsByCardId[c.id] = 0;
    reactionCountsByCardId[c.id] = {};
  }

  for (const v of game.votes.filter((x) => x.sessionKey === key)) {
    if (!reactionCountsByCardId[v.cardId]) reactionCountsByCardId[v.cardId] = {};
    reactionCountsByCardId[v.cardId][v.reaction] = (reactionCountsByCardId[v.cardId][v.reaction] ?? 0) + 1;
    pointsByCardId[v.cardId] = (pointsByCardId[v.cardId] ?? 0) + 1;
  }

  const scored = cards.map((c) => ({ cardId: c.id, points: pointsByCardId[c.id] ?? 0 }));
  scored.sort((a, b) => b.points - a.points);

  const top3 = scored.slice(0, 3);

  const reactionWinners: Partial<Record<Reaction, { cardId: string; count: number }>> = {};
  for (const r of REACTIONS) {
    let best: { cardId: string; count: number } | null = null;
    for (const c of cards) {
      const ct = reactionCountsByCardId[c.id]?.[r] ?? 0;
      if (!best || ct > best.count) best = { cardId: c.id, count: ct };
    }
    if (best && best.count > 0) reactionWinners[r] = best;
  }

  const deckSet = new Set<string>();
  for (const t of top3) deckSet.add(t.cardId);
  for (const r of REACTIONS) {
    const w = reactionWinners[r];
    if (w) deckSet.add(w.cardId);
  }

  // represent each player (garante presença)
  for (const p of game.players) {
    const alreadyRepresented = Array.from(deckSet).some(
      (cid) => game.p1.cards.find((c) => c.id === cid)?.authorId === p.id
    );
    if (alreadyRepresented) continue;

    const mine = game.p1.cards.filter((c) => c.authorId === p.id);
    mine.sort((a, b) => (pointsByCardId[b.id] ?? 0) - (pointsByCardId[a.id] ?? 0));
    if (mine[0]) deckSet.add(mine[0].id);
  }

  const desired = clamp(game.config.deckDesired, Math.max(game.players.length, 5), game.config.deckMax);
  for (const s of scored) {
    if (deckSet.size >= desired) break;
    deckSet.add(s.cardId);
  }

  const deckCardIds = Array.from(deckSet).slice(0, game.config.deckMax);

  return { pointsByCardId, reactionCountsByCardId, top3, reactionWinners, deckCardIds };
}

export function endPhase1Voting(game: GameState): GameState {
  if (game.phase !== 'p1_voting') return game;

  const results = buildPhase1Results(game);

  return {
    ...game,
    phase: 'p1_results',
    p1Results: results,
    updatedAt: now(),
  };
}

export function continueAfterPhase1Results(game: GameState): GameState {
  if (game.phase !== 'p1_results') return game;

  const hasMoreRounds = game.p1.round < game.config.p1Rounds;

  if (game.config.voteMode === 'per_round' && hasMoreRounds) {
    return {
      ...game,
      phase: 'p1_writing',
      p1: { ...game.p1, round: game.p1.round + 1, playerIndex: 0 },
      p1Voting: null,
      p1Results: null,
      updatedAt: now(),
    };
  }

  return startPhase2FromWinners(game);
}

export function startPhase2FromWinners(game: GameState): GameState {
  const deck = game.p1Results?.deckCardIds ?? buildPhase1Results(game).deckCardIds;
  const themeResolved = (game as any).__p2ThemeResolved as string | undefined;

  return {
    ...game,
    phase: 'p2_intro',
    p2: {
      theme: themeResolved ?? '(tema fase 2)',
      deckCardIds: deck,
      finalRankings: {},
      currentRankerIndex: 0,
    },
    updatedAt: now(),
  };
}

export function goToDiscuss(game: GameState): GameState {
  if (game.phase !== 'p2_intro') return game;
  return { ...game, phase: 'p2_discuss', updatedAt: now() };
}

export function goToFinalRank(game: GameState): GameState {
  if (game.phase !== 'p2_discuss') return game;
  return { ...game, phase: 'p2_rank_final', updatedAt: now() };
}

export function setCurrentRanker(game: GameState, playerId: string): GameState {
  if (game.phase !== 'p2_rank_final' || !game.p2) return game;
  const idx = game.players.findIndex((p) => p.id === playerId);
  if (idx < 0) return game;
  return { ...game, p2: { ...game.p2, currentRankerIndex: idx }, updatedAt: now() };
}

function cardAuthorId(game: GameState, cardId: string | null) {
  if (!cardId) return null;
  return game.p1.cards.find((c) => c.id === cardId)?.authorId ?? null;
}

function computeTopCounts(game: GameState): Record<string, number> {
  const counts: Record<string, number> = {};
  const rankings = game.p2?.finalRankings ?? {};
  for (const pid of Object.keys(rankings)) {
    const top = rankings[pid]?.[0];
    if (!top) continue;
    counts[top] = (counts[top] ?? 0) + 1;
  }
  return counts;
}

function pickTopWinner(counts: Record<string, number>) {
  const entries = Object.entries(counts);
  entries.sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
  if (!entries.length) return { isTie: false, tied: [] as string[], winnerCardId: null as string | null };
  const best = entries[0][1];
  const tied = entries.filter(([, c]) => c === best).map(([cid]) => cid);
  if (tied.length > 1) return { isTie: true, tied, winnerCardId: null as string | null };
  return { isTie: false, tied: [], winnerCardId: entries[0][0] };
}

function collectiveUnanimityExcludingAuthor(game: GameState, winningCardId: string): boolean {
  const authorId = cardAuthorId(game, winningCardId);
  if (!authorId) return false;

  const nonAuthors = game.players.filter((p) => p.id !== authorId);
  if (nonAuthors.length === 0) return false;

  for (const p of nonAuthors) {
    const ord = game.p2?.finalRankings?.[p.id];
    const top = ord?.[0];
    if (top !== winningCardId) return false;
  }
  return true;
}

export function finalizePhase2(game: GameState): GameState {
  if (!game.p2) return game;

  const topCounts = computeTopCounts(game);
  const { isTie, tied, winnerCardId } = pickTopWinner(topCounts);

  if (isTie) {
    const reveal: RevealState = {
      topCounts,
      winningCardId: null,
      winningAuthorId: null,
      collectiveWin: false,
      collectiveWinningCardId: null,
      isTie: true,
      tiedTopCardIds: tied,
      deckCardIds: game.p2.deckCardIds,
    };
    return { ...game, phase: 'reveal', reveal, updatedAt: now() };
  }

  if (!winnerCardId) {
    const reveal: RevealState = {
      topCounts,
      winningCardId: null,
      winningAuthorId: null,
      collectiveWin: false,
      collectiveWinningCardId: null,
      isTie: false,
      tiedTopCardIds: [],
      deckCardIds: game.p2.deckCardIds,
    };
    return { ...game, phase: 'reveal', reveal, updatedAt: now() };
  }

  const collectiveWin = collectiveUnanimityExcludingAuthor(game, winnerCardId);
  const winningAuthorId = cardAuthorId(game, winnerCardId);

  const reveal: RevealState = {
    topCounts,
    winningCardId: collectiveWin ? null : winnerCardId,
    winningAuthorId: collectiveWin ? null : winningAuthorId,
    collectiveWin,
    collectiveWinningCardId: collectiveWin ? winnerCardId : null,
    isTie: false,
    tiedTopCardIds: [],
    deckCardIds: game.p2.deckCardIds,
  };

  return { ...game, phase: 'reveal', reveal, updatedAt: now() };
}

export function submitFinalRanking(game: GameState, playerId: string, ordering: string[]): GameState {
  if (game.phase !== 'p2_rank_final' || !game.p2) return game;

  const expected = game.players[game.p2.currentRankerIndex];
  if (!expected || expected.id !== playerId) return game;

  const deckSet = new Set(game.p2.deckCardIds);
  const cleaned = ordering.filter((id) => deckSet.has(id));
  if (cleaned.length !== game.p2.deckCardIds.length) return game;

  const nextRankings = { ...game.p2.finalRankings, [playerId]: cleaned };

  const nextIndex = game.p2.currentRankerIndex + 1;
  const allDone = nextIndex >= game.players.length;

  const nextGame: GameState = {
    ...game,
    p2: {
      ...game.p2,
      finalRankings: nextRankings,
      currentRankerIndex: allDone ? game.p2.currentRankerIndex : nextIndex,
    },
    updatedAt: now(),
  };

  // ✅ fecha automático quando o último enviar
  return allDone ? finalizePhase2(nextGame) : nextGame;
}

export function exportJson(game: GameState) {
  return game;
}
