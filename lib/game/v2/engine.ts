// lib/game/v2/engine.ts
//
// Pure-ish reducer for Destinote Game V2.
// It is designed to be event-driven so it can later be plugged into a real-time server.
// For this beta, it runs client-side with localStorage persistence.
//
// Important: we do NOT import app UI contexts here. Keep this module stable.

import type {
  ActionCard,
  GameConfig,
  GameEvent,
  GameState,
  Player,
  PlayerRanking,
  Reaction,
  RevealSummary,
  ThemeSlot,
  Vote,
  VotingSession,
} from './types';
import { REACTIONS } from './types';
import { PHASE1_THEMES, PHASE2_THEMES } from './defaultThemes';
import { loadThemeBank } from './themeBank';
import { clamp, now, pickOne, shuffle, uid } from './utils';

function makeSeed(seed?: number) {
  if (typeof seed === 'number' && Number.isFinite(seed)) return Math.floor(seed);
  // deterministic-ish seed per room per boot
  return Math.floor(Math.random() * 2 ** 31);
}

function hashString(s: string): number {
  // Simple deterministic hash (djb2-ish) for stable-ish per-room seed mixing.
  let h = 5381;
  for (let i = 0; i < s.length; i++) {
    h = ((h << 5) + h) ^ s.charCodeAt(i);
  }
  return Math.abs(h) % (2 ** 31);
}

function normalizeVoteMode(mode: any): GameConfig['voteMode'] {
  // UI compat: "end_only" => engine "final_only"
  if (mode === 'end_only') return 'final_only';
  if (mode === 'final_only' || mode === 'per_round' || mode === 'per_round_and_final') return mode;
  return 'per_round';
}

function defaultConfig(roomId: string): GameConfig {
  // deterministic-ish seed per room per boot
  const seed = (makeSeed() + hashString(roomId)) % (2 ** 31);
  return {
    voteMode: 'per_round', // default alinhado ao jogo
    p1Rounds: 2,
    secondsPerTurn: 45,
    maxReactionsPerVoter: 2,
    deckDesired: 10,
    deckMax: 20,
    allowSelfVote: false,
    showThemeInVoting: true,
    p1ThemeSlots: [{ kind: 'random' }, { kind: 'random' }],
    p2Theme: { kind: 'random' },
    seed,
  };
}

function makePlayers(names: string[]): Player[] {
  return names
    .map((n) => (n ?? '').trim())
    .filter(Boolean)
    .map((name, i) => ({
      id: `p${i + 1}_${Math.random().toString(36).slice(2, 6)}`,
      name,
    }));
}

function resolveTheme(slot: ThemeSlot | undefined, pool: string[], seed: number) {
  if (!slot || slot.kind === 'random') return pickOne(pool, seed);
  const txt = (slot.text ?? '').trim();
  return txt || pickOne(pool, seed);
}

function getP1Theme(config: GameConfig, round: number) {
  const slot = config.p1ThemeSlots?.[round - 1];
  const bank = loadThemeBank();
  const pool = bank.p1?.length ? bank.p1 : PHASE1_THEMES;
  return resolveTheme(slot, pool, config.seed + round * 101);
}

function getP2Theme(config: GameConfig) {
  const bank = loadThemeBank();
  const pool = bank.p2?.length ? bank.p2 : PHASE2_THEMES;
  return resolveTheme(config.p2Theme, pool, config.seed + 777);
}

function emptyReveal(): RevealSummary {
  return {
    phase1: {
      top3: [],
      reactionWinners: {},
      phase1WinnerCardId: null,
      phase1WinnerAuthorId: null,
    },
    phase2: {
      averages: {},
      correctOrder: [],
      winningCardId: null,
      winningAuthorId: null,
      collectiveWin: false,
    },
  };
}

export function createEmpty(roomId: string): GameState {
  const startedAt = now();
  return {
    version: 'v2',
    roomId,
    phase: 'setup',
    config: defaultConfig(roomId),
    players: [],
    p1: {
      round: 1,
      playerIndex: 0,
      currentTheme: '',
      cards: [],
      votes: [],
      voting: null,
    },
    p2: {
      theme: '',
      deckCardIds: [],
      raterIndex: 0,
      rankings: [],
      ordering: [],
      finalized: false,
    },
    reveal: null,
    seq: { nextCard: 1, nextVote: 1 },
    startedAt,
    updatedAt: startedAt,
  };
}

function touch(state: GameState): GameState {
  return { ...state, updatedAt: now() };
}

function dedupeIds(ids: string[]) {
  return Array.from(new Set(ids));
}

function cardsByRound(cards: ActionCard[], round: number) {
  return cards.filter((c) => c.round === round).map((c) => c.id);
}

function scoreCounts(votes: Vote[]) {
  const counts: Record<string, number> = {};
  for (const v of votes) {
    counts[v.cardId] = (counts[v.cardId] ?? 0) + 1;
  }
  return counts;
}

function reactionWinners(votes: Vote[]) {
  const best: Partial<Record<Reaction, { cardId: string; count: number }>> = {};
  for (const r of REACTIONS) {
    const counts: Record<string, number> = {};
    for (const v of votes) {
      if (v.reaction !== r) continue;
      counts[v.cardId] = (counts[v.cardId] ?? 0) + 1;
    }
    let winId: string | null = null;
    let winCount = 0;
    for (const [cid, c] of Object.entries(counts)) {
      if (c > winCount) {
        winCount = c;
        winId = cid;
      }
    }
    if (winId) best[r] = { cardId: winId, count: winCount };
  }
  return best;
}

function topNByScore(counts: Record<string, number>, n: number) {
  return Object.entries(counts)
    .map(([cardId, score]) => ({ cardId, score }))
    .sort((a, b) => b.score - a.score)
    .slice(0, n);
}

function ensureRepresented(deck: string[], cards: ActionCard[], counts: Record<string, number>) {
  const represented = new Set(deck.map((id) => cards.find((c) => c.id === id)?.authorId).filter(Boolean) as string[]);
  const byAuthor: Record<string, ActionCard[]> = {};
  for (const c of cards) {
    byAuthor[c.authorId] = byAuthor[c.authorId] ?? [];
    byAuthor[c.authorId].push(c);
  }
  for (const [authorId, list] of Object.entries(byAuthor)) {
    if (represented.has(authorId)) continue;
    // pick best scoring card from this author
    const best = [...list].sort((a, b) => (counts[b.id] ?? 0) - (counts[a.id] ?? 0))[0];
    if (best) {
      deck.push(best.id);
      represented.add(authorId);
    }
  }
  return deck;
}

function buildDeck(state: GameState): { deck: string[]; p1Top3: { cardId: string; score: number }[]; rw: any } {
  const counts = scoreCounts(state.p1.votes);
  const top3 = topNByScore(counts, 3);
  const rw = reactionWinners(state.p1.votes);

  const deck: string[] = [];

  // (1) top3
  for (const t of top3) deck.push(t.cardId);

  // (2) reaction winners (max 5)
  for (const r of REACTIONS) {
    const w = rw[r];
    if (!w) continue;
    if (!deck.includes(w.cardId)) deck.push(w.cardId);
  }

  // (3) ensure each player has a representative card
  ensureRepresented(deck, state.p1.cards, counts);

  // (4) fill with next most scored
  const allSorted = Object.entries(counts)
    .map(([cardId, score]) => ({ cardId, score }))
    .sort((a, b) => b.score - a.score);

  const minDeck = Math.max(8, state.players.length + 1);
  const desired = clamp(Math.max(minDeck, state.config.deckDesired), state.players.length, state.config.deckMax);

  for (const item of allSorted) {
    if (deck.length >= desired) break;
    if (!deck.includes(item.cardId)) deck.push(item.cardId);
  }

  // if still short (e.g., no votes), just add remaining cards in creation order
  if (deck.length < desired) {
    for (const c of state.p1.cards) {
      if (deck.length >= desired) break;
      if (!deck.includes(c.id)) deck.push(c.id);
    }
  }

  // cap
  const finalDeck = dedupeIds(deck).slice(0, Math.min(desired, state.config.deckMax));

  return { deck: finalDeck, p1Top3: top3, rw };
}

function startVoting(state: GameState, scope: 'round' | 'final'): GameState {
  const round = scope === 'round' ? state.p1.round : null;
  const key = scope === 'round' ? `round:${state.p1.round}` : 'final';
  const cardIds = dedupeIds(
    scope === 'round' ? cardsByRound(state.p1.cards, state.p1.round) : state.p1.cards.map((c) => c.id)
  );
  const hideThemeContext = scope === 'final' && state.config.voteMode === 'final_only'; // only final-only hides context

  const voterOrder = state.players.map((p) => p.id);
  const voting: VotingSession = {
    key,
    scope,
    round,
    cardIds,
    voterOrder,
    voterIndex: 0,
    currentVoterId: voterOrder[0] ?? null,
    votesUsedByVoter: {},
    voterDone: {},
    locked: false,
    hideThemeContext,
  };

  return touch({
    ...state,
    phase: 'p1_vote',
    p1: { ...state.p1, voting },
  });
}

function hasFinalVotingDone(state: GameState) {
  return state.p1.votes.some((v) => v.sessionKey === 'final');
}

function finishVotingAndAdvance(state: GameState): GameState {
  if (state.phase !== 'p1_vote' || !state.p1.voting) return state;
  const scope = state.p1.voting.scope;
  const s = touch({
    ...state,
    p1: {
      ...state.p1,
      voting: { ...state.p1.voting, locked: true, currentVoterId: null },
    },
  });

  // Avança automaticamente (sem tela "encerrada aguardando").
  if (scope === 'round') {
    return touch({ ...s, phase: 'p1_review', p1: { ...s.p1, voting: null } });
  }
  const base = { ...s, phase: 'p1_results' as const, p1: { ...s.p1, voting: null } };
  return touch(withPhase1Summary(base));
function withPhase1Summary(state: GameState): GameState {
  const { p1Top3, rw } = buildDeck(state);

  const winnerCardId = p1Top3[0]?.cardId ?? null;
  const winnerAuthorId = winnerCardId
    ? state.p1.cards.find((c) => c.id === winnerCardId)?.authorId ?? null
    : null;

  const reveal = state.reveal ?? emptyReveal();
  const nextReveal: RevealSummary = {
    ...reveal,
    phase1: {
      ...reveal.phase1,
      top3: p1Top3,
      reactionWinners: rw,
      phase1WinnerCardId: winnerCardId,
      phase1WinnerAuthorId: winnerAuthorId,
    },
  };

  return { ...state, reveal: nextReveal };
}

}

function makeCard(state: GameState, author: Player, text: string): ActionCard {
  return {
    id: uid('card'),
    displayId: state.seq.nextCard,
    round: state.p1.round,
    theme: state.p1.currentTheme,
    authorId: author.id,
    authorName: author.name,
    text: text.trim(),
    createdAt: now(),
  };
}

// Converte rankings (ordem) em um score 0..100 por carta e calcula a média.
// Regras:
// - index 0 = melhor/"mais 100" => score 100
// - index final = pior/"mais 0" => score 0
// - Se não houver rankings (alguém skipou tudo), assume ordem neutra (score ~50).
function computeAveragesFromRankings(deck: string[], rankings: PlayerRanking[]) {
  const N = Math.max(1, deck.length);
  const denom = Math.max(1, N - 1);

  const scoresByCard: Record<string, number[]> = {};
  for (const id of deck) scoresByCard[id] = [];

  for (const r of rankings) {
    const pos: Record<string, number> = {};
    r.ordering.forEach((id, idx) => {
      if (!deck.includes(id)) return;
      pos[id] = idx;
    });

    for (const id of deck) {
      const idx = typeof pos[id] === 'number' ? pos[id] : Math.floor(denom / 2);
      const score = Math.round(((denom - idx) / denom) * 1000) / 10; // 1 casa decimal
      scoresByCard[id].push(score);
    }
  }

  const avg: Record<string, number> = {};
  for (const id of deck) {
    const arr = scoresByCard[id];
    if (!arr.length) {
      avg[id] = 50;
      continue;
    }
    const m = arr.reduce((a, b) => a + b, 0) / arr.length;
    avg[id] = Math.round(m * 10) / 10;
  }

  return avg;
}

function chooseWinnerByRankings(state: GameState, averages: Record<string, number>): string | null {
  if (!state.p2.deckCardIds.length) return null;

  // tie-breaker: maior média, depois menor displayId
  const byDisplay: Record<string, number> = {};
  for (const c of state.p1.cards) byDisplay[c.id] = c.displayId;

  const sorted = [...state.p2.deckCardIds].sort((a, b) => {
    const d = (averages[b] ?? 0) - (averages[a] ?? 0);
    if (d !== 0) return d;
    return (byDisplay[a] ?? 1e9) - (byDisplay[b] ?? 1e9);
  });

  return sorted[0] ?? null;
}

function cardAuthorId(state: GameState, cardId: string | null) {
  if (!cardId) return null;
  return state.p1.cards.find((c) => c.id === cardId)?.authorId ?? null;
}

function collectiveWinByRankings(state: GameState, winningCardId: string | null): boolean {
  if (!winningCardId) return false;
  const authorId = cardAuthorId(state, winningCardId);
  if (!authorId) return false;

  // Vitória coletiva se TODOS os não-autores colocarem a carta vencedora em 1º.
  for (const p of state.players) {
    if (p.id === authorId) continue;
    const r = state.p2.rankings.find((x) => x.playerId === p.id);
    if (!r) return false;
    if (r.ordering[0] !== winningCardId) return false;
  }
  return true;
}

export function reduceGame(prev: GameState, event: GameEvent): GameState {
  let state = prev;

  // Compat: versões antigas gravavam voteMode="end_only" (UI). Normaliza aqui.
  if ((state.config as any)?.voteMode === 'end_only') {
    state = touch({ ...state, config: { ...state.config, voteMode: 'final_only' } as any });
  }

  // global reset
  if (event.type === 'RESET_ALL') {
    return createEmpty(event.roomId);
  }

  switch (event.type) {
    case 'SETUP_START': {
      const p = event.payload;
      const players = makePlayers(p.players);
      const seed = makeSeed(p.seed);
      const config: GameConfig = {
        voteMode: normalizeVoteMode(p.voteMode),
        p1Rounds: clamp(p.p1Rounds, 1, 20),
        secondsPerTurn: clamp(p.secondsPerTurn, 10, 600),
        maxReactionsPerVoter: clamp(p.maxReactionsPerVoter, 1, 10),
        deckDesired: clamp(p.deckDesired, 4, 40),
        deckMax: clamp(p.deckMax, 8, 60),
        allowSelfVote: !!p.allowSelfVote,
        showThemeInVoting: !!p.showThemeInVoting,
        p1ThemeSlots: p.p1ThemeSlots?.length ? p.p1ThemeSlots : [{ kind: 'random' }],
        p2Theme: p.p2Theme ?? { kind: 'random' },
        seed,
      };

      const next: GameState = {
        ...createEmpty(p.roomId),
        roomId: p.roomId,
        players,
        config,
        phase: 'p1_write',
        p1: {
          round: 1,
          playerIndex: 0,
          currentTheme: getP1Theme(config, 1),
          cards: [],
          votes: [],
          voting: null,
        },
      };

      return touch(next);
    }

    case 'SET_ACTIVE_VOTER': {
      if (state.phase !== 'p1_vote' || !state.p1.voting) return state;
      const idx = event.voterId ? Math.max(0, state.p1.voting.voterOrder.indexOf(event.voterId)) : state.p1.voting.voterIndex;
      return touch({
        ...state,
        p1: {
          ...state.p1,
          voting: {
            ...state.p1.voting,
            voterIndex: idx,
            currentVoterId: event.voterId,
          },
        },
      });
    }

    case 'P1_SUBMIT': {
      if (state.phase !== 'p1_write') return state;
      const text = (event.text ?? '').trim();
      if (!text) return state;
      const safeIndex = clamp(state.p1.playerIndex, 0, Math.max(0, state.players.length - 1));
      const currentPlayer = state.players[safeIndex];
      if (!currentPlayer || currentPlayer.id !== event.playerId) return state;

      const card = makeCard(state, currentPlayer, text);

      const cards = [...state.p1.cards, card];
      const nextSeq = { ...state.seq, nextCard: state.seq.nextCard + 1 };

      const nextIndex = safeIndex + 1;

      // round finished?
      if (nextIndex >= state.players.length) {
        const isLastRound = state.p1.round >= state.config.p1Rounds;

        // decide next step
        if (state.config.voteMode === 'final_only') {
          if (isLastRound) {
            // go straight to final voting
            const s = touch({
              ...state,
              seq: nextSeq,
              p1: { ...state.p1, cards, playerIndex: nextIndex },
            });
            return startVoting(s, 'final');
          }

          // next round without voting
          const nextRound = state.p1.round + 1;
          return touch({
            ...state,
            seq: nextSeq,
            phase: 'p1_write',
            p1: {
              ...state.p1,
              cards,
              round: nextRound,
              playerIndex: 0,
              currentTheme: getP1Theme(state.config, nextRound),
              voting: null,
            },
          });
        }

        // per_round or per_round_and_final => vote at end of each round
        const s = touch({
          ...state,
          seq: nextSeq,
          p1: { ...state.p1, cards, playerIndex: nextIndex },
        });
        return startVoting(s, 'round');
      }

      // still within this round
      return touch({
        ...state,
        seq: nextSeq,
        p1: { ...state.p1, cards, playerIndex: nextIndex },
      });
    }

    case 'P1_SKIP': {
      if (state.phase !== 'p1_write') return state;
      const safeIndex = clamp(state.p1.playerIndex, 0, Math.max(0, state.players.length - 1));
      const currentPlayer = state.players[safeIndex];
      if (!currentPlayer || currentPlayer.id !== event.playerId) return state;

      const nextIndex = safeIndex + 1;

      if (nextIndex >= state.players.length) {
        const isLastRound = state.p1.round >= state.config.p1Rounds;

        if (state.config.voteMode === 'final_only') {
          if (isLastRound) return startVoting(touch({ ...state, p1: { ...state.p1, playerIndex: nextIndex } }), 'final');
          const nextRound = state.p1.round + 1;
          return touch({
            ...state,
            phase: 'p1_write',
            p1: {
              ...state.p1,
              round: nextRound,
              playerIndex: 0,
              currentTheme: getP1Theme(state.config, nextRound),
            },
          });
        }

        return startVoting(touch({ ...state, p1: { ...state.p1, playerIndex: nextIndex } }), 'round');
      }

      return touch({
        ...state,
        p1: { ...state.p1, playerIndex: nextIndex },
      });
    }

    case 'P1_START_VOTING': {
      // Manual/dev start. Default: round.
      const scope = (event as any).scope === 'final' ? 'final' : 'round';
      return startVoting(state, scope);
    }

    case 'P1_CAST_REACTION': {
      if (state.phase !== 'p1_vote' || !state.p1.voting) return state;
      const voting = state.p1.voting;
      if (voting.locked) return state;

      const voterId = event.voterId;
      if (!voterId) return state;

      // must match selected voter (pass-the-notebook safety)
      if (voting.currentVoterId && voting.currentVoterId !== voterId) return state;

      // card must be in this session
      if (!voting.cardIds.includes(event.cardId)) return state;

      const voter = state.players.find((p) => p.id === voterId);
      const card = state.p1.cards.find((c) => c.id === event.cardId);
      if (!voter || !card) return state;

      if (!state.config.allowSelfVote && card.authorId === voterId) return state;

      const used = voting.votesUsedByVoter[voterId] ?? 0;
      if (used >= state.config.maxReactionsPerVoter) return state;

      const vote: Vote = {
        id: `v${state.seq.nextVote}`,
        sessionKey: voting.key,
        voterId,
        voterName: voter.name,
        cardId: event.cardId,
        reaction: event.reaction,
        createdAt: now(),
      };

      const nextVoting: VotingSession = {
        ...voting,
        votesUsedByVoter: { ...voting.votesUsedByVoter, [voterId]: used + 1 },
      };

      // se esgotou as reações, marca como "done" e avança automaticamente
      if (used + 1 >= state.config.maxReactionsPerVoter) {
        nextVoting.voterDone = { ...nextVoting.voterDone, [voterId]: true };
        // avança para o próximo votante não concluído
        let ni = nextVoting.voterIndex;
        while (ni < nextVoting.voterOrder.length && nextVoting.voterDone[nextVoting.voterOrder[ni]]) ni += 1;
        nextVoting.voterIndex = ni;
        nextVoting.currentVoterId = nextVoting.voterOrder[ni] ?? null;
      }

      const nextState = touch({
        ...state,
        seq: { ...state.seq, nextVote: state.seq.nextVote + 1 },
        p1: {
          ...state.p1,
          votes: [...state.p1.votes, vote],
          voting: nextVoting,
        },
      });

      // se todo mundo concluiu, encerra e avança automaticamente
      const allDone = nextVoting.voterOrder.every((id) => nextVoting.voterDone[id]);
      if (allDone) return finishVotingAndAdvance(nextState);
      return nextState;
    }

    case 'P1_SKIP_VOTER': {
      if (state.phase !== 'p1_vote' || !state.p1.voting) return state;
      const voting = state.p1.voting;
      if (voting.locked) return state;
      const voterId = event.voterId;
      if (!voterId) return state;
      if (voting.currentVoterId !== voterId) return state;

      const nextVoting: VotingSession = {
        ...voting,
        voterDone: { ...voting.voterDone, [voterId]: true },
      };

      // move to next
      let ni = nextVoting.voterIndex + 1;
      while (ni < nextVoting.voterOrder.length && nextVoting.voterDone[nextVoting.voterOrder[ni]]) ni += 1;
      nextVoting.voterIndex = ni;
      nextVoting.currentVoterId = nextVoting.voterOrder[ni] ?? null;

      const nextState = touch({ ...state, p1: { ...state.p1, voting: nextVoting } });
      const allDone = nextVoting.voterOrder.every((id) => nextVoting.voterDone[id]);
      if (allDone) return finishVotingAndAdvance(nextState);
      return nextState;
    }

    case 'P1_NEXT_VOTER': {
      if (state.phase !== 'p1_vote' || !state.p1.voting) return state;
      const voting = state.p1.voting;
      if (voting.locked) return state;
      const voterId = voting.currentVoterId;
      if (!voterId) return state;

      const used = voting.votesUsedByVoter[voterId] ?? 0;
      const done = voting.voterDone[voterId] || used >= state.config.maxReactionsPerVoter;
      if (!done) return state;

      const nextVoting: VotingSession = { ...voting };
      nextVoting.voterDone = { ...voting.voterDone, [voterId]: true };

      let ni = nextVoting.voterIndex + 1;
      while (ni < nextVoting.voterOrder.length && nextVoting.voterDone[nextVoting.voterOrder[ni]]) ni += 1;
      nextVoting.voterIndex = ni;
      nextVoting.currentVoterId = nextVoting.voterOrder[ni] ?? null;

      const nextState = touch({ ...state, p1: { ...state.p1, voting: nextVoting } });
      const allDone = nextVoting.voterOrder.every((id) => nextVoting.voterDone[id]);
      if (allDone) return finishVotingAndAdvance(nextState);
      return nextState;
    }

    case 'P1_END_VOTING': {
      if (state.phase !== 'p1_vote' || !state.p1.voting) return state;
      if (state.p1.voting.locked) return state;
      // legado: encerra e avança
      return finishVotingAndAdvance(state);
    }

    case 'NEXT': {
      // phase transitions
      // (p1_vote agora auto-avança)

      if (state.phase === 'p1_review') {
        const isLastRound = state.p1.round >= state.config.p1Rounds;

        if (!isLastRound) {
          const nextRound = state.p1.round + 1;
          return touch({
            ...state,
            phase: 'p1_write',
            p1: {
              ...state.p1,
              round: nextRound,
              playerIndex: 0,
              currentTheme: getP1Theme(state.config, nextRound),
              voting: null,
            },
          });
        }

        // last round
        if (state.config.voteMode === 'per_round_and_final' && !hasFinalVotingDone(state)) {
          return startVoting(state, 'final');
        }

        return touch(withPhase1Summary({ ...state, phase: 'p1_results' }));
      }

      if (state.phase === 'p2_intro') {
        return touch({ ...state, phase: 'p2_rank' });
      }

      if (state.phase === 'p2_discuss') {
        // ✅ Compat: botão “Revelar” do UI dispara NEXT
        return reduceGame(state, { type: 'P2_FINALIZE' } as any);
      }

      // default: no-op
      return state;
    }

    case 'P2_START': {
      // only from p1_results
      if (state.phase !== 'p1_results') return state;

      const { deck: rawDeck, p1Top3, rw } = buildDeck(state);
      const deck = dedupeIds(rawDeck);

      const reveal: RevealSummary = emptyReveal();
      reveal.phase1.top3 = p1Top3;
      reveal.phase1.reactionWinners = rw;

      // optional phase1 winner: if final votes exist, pick that, else best overall
      const finalVotes = state.p1.votes.filter((v) => v.sessionKey === 'final');
      const winnerCounts = scoreCounts(finalVotes.length ? finalVotes : state.p1.votes);
      const top1 = topNByScore(winnerCounts, 1)[0];
      reveal.phase1.phase1WinnerCardId = top1?.cardId ?? null;
      reveal.phase1.phase1WinnerAuthorId = cardAuthorId(state, reveal.phase1.phase1WinnerCardId);

      const p2Theme = getP2Theme(state.config);
      const ordering = shuffle(deck, state.config.seed + 999);

      return touch({
        ...state,
        phase: 'p2_intro',
        reveal,
        p2: {
          theme: p2Theme,
          deckCardIds: deck,
          raterIndex: 0,
          rankings: [],
          ordering,
          finalized: false,
        },
      });
    }

    case 'P2_SUBMIT_RANKING': {
      if (state.phase !== 'p2_rank') return state;

      const rater = state.players[state.p2.raterIndex];
      if (!rater || rater.id !== event.playerId) return state;

      // sanitize ordering: must contain only deck ids and be a permutation
      const seen = new Set<string>();
      const sanitized: string[] = [];
      for (const id of event.ordering) {
        if (!state.p2.deckCardIds.includes(id)) continue;
        if (seen.has(id)) continue;
        seen.add(id);
        sanitized.push(id);
      }
      // if missing ids, append them deterministically
      for (const id of state.p2.deckCardIds) {
        if (!seen.has(id)) sanitized.push(id);
      }

      const nextRankings = state.p2.rankings.filter((x) => x.playerId !== rater.id);
      nextRankings.push({ playerId: rater.id, ordering: sanitized, createdAt: now() });

      const nextIndex = state.p2.raterIndex + 1;
      if (nextIndex >= state.players.length) {
        // everyone ranked => go to discuss screen with a shuffled deck (não mostrar ordem da média)
        const shuffled = shuffle(dedupeIds(state.p2.deckCardIds), state.config.seed + 2026 + state.p1.cards.length);
        return touch({
          ...state,
          phase: 'p2_discuss',
          p2: {
            ...state.p2,
            raterIndex: state.p2.raterIndex,
            rankings: nextRankings,
            ordering: shuffled,
          },
        });
      }

      return touch({
        ...state,
        p2: {
          ...state.p2,
          raterIndex: nextIndex,
          rankings: nextRankings,
        },
      });
    }

    case 'P2_SKIP_RANKING': {
      if (state.phase !== 'p2_rank') return state;
      const rater = state.players[state.p2.raterIndex];
      if (!rater || rater.id !== event.playerId) return state;

      const nextIndex = state.p2.raterIndex + 1;
      if (nextIndex >= state.players.length) {
        const shuffled = shuffle(dedupeIds(state.p2.deckCardIds), state.config.seed + 2026 + state.p1.cards.length);
        return touch({
          ...state,
          phase: 'p2_discuss',
          p2: { ...state.p2, ordering: shuffled },
        });
      }

      return touch({
        ...state,
        p2: { ...state.p2, raterIndex: nextIndex },
      });
    }

    case 'P2_SET_ORDERING': {
      if (state.phase !== 'p2_discuss' && state.phase !== 'p2_rank') return state;

      const incoming = (event as any).ordering as string[];
      const seen = new Set<string>();
      const sanitized: string[] = [];

      for (const id of incoming ?? []) {
        if (!state.p2.deckCardIds.includes(id)) continue;
        if (seen.has(id)) continue;
        seen.add(id);
        sanitized.push(id);
      }
      for (const id of state.p2.deckCardIds) {
        if (!seen.has(id)) sanitized.push(id);
      }

      return touch({ ...state, p2: { ...state.p2, ordering: sanitized } });
    }

    case 'P2_MOVE': {
      if (state.phase !== 'p2_discuss' && state.phase !== 'p2_rank') return state;

      const from =
        (event as any).fromIndex ??
        (event as any).from ??
        (event as any).fromIdx ??
        (event as any).source ??
        0;

      const to =
        (event as any).toIndex ??
        (event as any).to ??
        (event as any).toIdx ??
        (event as any).dest ??
        0;

      const ordering = [...state.p2.ordering];
      if (ordering.length <= 1) return state;

      const fromI = clamp(Number(from) || 0, 0, ordering.length - 1);
      const toI = clamp(Number(to) || 0, 0, ordering.length - 1);
      if (fromI === toI) return state;

      const [moved] = ordering.splice(fromI, 1);
      ordering.splice(toI, 0, moved);

      return touch({ ...state, p2: { ...state.p2, ordering } });
    }



    // case 'P2_SET_ORDERING': {
    //   if (state.phase !== 'p2_discuss') return state;
    //   const ord = dedupeIds(event.ordering.filter((id) => state.p2.deckCardIds.includes(id)));
    //   return touch({ ...state, p2: { ...state.p2, ordering: ord } });
    // }

    // case 'P2_MOVE': {
    //   if (state.phase !== 'p2_discuss') return state;
    //   const from = event.from;
    //   const to = event.to;
    //   const ord = [...state.p2.ordering];
    //   if (from < 0 || from >= ord.length || to < 0 || to >= ord.length) return state;
    //   const [item] = ord.splice(from, 1);
    //   ord.splice(to, 0, item);
    //   return touch({ ...state, p2: { ...state.p2, ordering: ord } });
    // }

    case 'P2_FINALIZE': {
      if (state.phase !== 'p2_discuss') return state;

      const averages = computeAveragesFromRankings(state.p2.deckCardIds, state.p2.rankings);
      const correctOrder = [...state.p2.deckCardIds].sort((a, b) => (averages[b] ?? 0) - (averages[a] ?? 0));

      // A ordem "correta" vem da média dos rankings secretos.
      // O vencedor, porém, é a carta que o grupo deixou no TOPO após o debate.
      const topFinal = state.p2.ordering[0] ?? null;
      const winningCardId = topFinal ?? chooseWinnerByRankings(state, averages);
      const winningAuthorId = cardAuthorId(state, winningCardId);

      const unanimous = collectiveWinByRankings(state, winningCardId);
      const topCorrect = correctOrder[0] ?? null;
      const isCollective = !!winningCardId && winningCardId === topCorrect && unanimous;

      const reveal = state.reveal ?? emptyReveal();
      const nextReveal: RevealSummary = {
        ...reveal,
        phase2: {
          averages,
          correctOrder,
          winningCardId,
          winningAuthorId,
          collectiveWin: isCollective,
        },
      };

      return touch({
        ...state,
        phase: 'reveal',
        reveal: nextReveal,
        p2: { ...state.p2, finalized: true },
      });
    }

    default:
      return state;
  }
}

// Alias exported for UI hooks.
// Some UI modules import { reduce } from this file.
// Keep this name stable.
export const reduce = reduceGame;

