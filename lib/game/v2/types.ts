// lib/game/v2/types.ts
// Types for Destinote Game (V2)
// (Este arquivo precisa existir e exportar REACTIONS em runtime, não só em type-land.)

export const REACTIONS = ['👍', '❤️', '😂', '🔥', '💀'] as const;
export type Reaction = (typeof REACTIONS)[number];

// UI compat: "end_only" existed in some UI drafts; engine normalizes it to "final_only"
export type VoteMode = 'per_round' | 'per_round_and_final' | 'final_only' | 'end_only';

export type ThemeSlot =
  | { kind: 'random' }
  | { kind: 'custom'; text: string };

export type SetupPayload = {
  roomId: string;
  players: string[];

  voteMode?: VoteMode;
  p1Rounds?: number;
  secondsPerTurn?: number;

  maxReactionsPerVoter?: number;
  deckDesired?: number;
  deckMax?: number;

  allowSelfVote?: boolean;
  showThemeInVoting?: boolean;

  p1ThemeSlots?: ThemeSlot[];
  p2Theme?: ThemeSlot;

  seed?: number;
};

export type Player = {
  id: string;
  name: string;
  createdAt: number;
};

export type GameConfig = {
  voteMode: 'per_round' | 'per_round_and_final' | 'final_only';

  p1Rounds: number;
  secondsPerTurn: number;

  maxReactionsPerVoter: number;

  deckDesired: number;
  deckMax: number;

  allowSelfVote: boolean;
  showThemeInVoting: boolean;

  p1ThemeSlots: ThemeSlot[];
  p2Theme: ThemeSlot;

  seed: number;
};

export type ActionCard = {
  id: string;
  displayId: number;
  authorId: string;
  round: number;
  text: string;
  createdAt: number;
};

export type Vote = {
  id: string;
  sessionKey: string; // "round:1", "round:2", "final"
  voterId: string;
  voterName: string;
  cardId: string;
  reaction: Reaction;
  createdAt: number;
};

export type VotingSession = {
  key: string;
  scope: 'round' | 'final';
  round: number | null;

  cardIds: string[];

  voterOrder: string[];
  voterIndex: number;
  currentVoterId: string | null;

  votesUsedByVoter: Record<string, number>;
  voterDone: Record<string, boolean>;

  locked: boolean;

  // when true, UI should hide theme even if config.showThemeInVoting is on
  hideThemeContext: boolean;
};

export type PlayerRanking = {
  playerId: string;
  ordering: string[]; // array of cardIds
  createdAt: number;
};

export type Phase =
  | 'setup'
  | 'p1_write'
  | 'p1_vote'
  | 'p1_review'
  | 'p1_results'
  | 'p2_rank'
  | 'p2_discuss'
  | 'reveal';

export type RevealSummary = {
  phase1: {
    top3: { cardId: string; points: number }[];
    reactionWinners: Partial<Record<Reaction, { cardId: string; count: number }>>;
    phase1WinnerCardId: string | null;
    phase1WinnerAuthorId: string | null;
  };
  phase2: {
    averages: Record<string, number>;
    correctOrder: string[];
    winningCardId: string | null;
    winningAuthorId: string | null;
    collectiveWin: boolean;
  };
};

export type GameState = {
  version: 'v2';
  roomId: string;

  phase: Phase;
  config: GameConfig;

  players: Player[];

  p1: {
    round: number;
    playerIndex: number;
    currentTheme: string;

    cards: ActionCard[];
    votes: Vote[];

    voting: VotingSession | null;
  };

  p2: {
    theme: string;

    deckCardIds: string[];

    raterIndex: number;
    rankings: PlayerRanking[];

    ordering: string[];
    finalized: boolean;
  };

  reveal: RevealSummary | null;

  seq: { nextCard: number; nextVote: number };
  startedAt: number;
  updatedAt: number;
};

export type GameEvent =
  | { type: 'RESET_ALL'; roomId: string }
  | { type: 'SETUP_START'; payload: SetupPayload }
  | { type: 'NEXT' }
  | { type: 'SET_ACTIVE_VOTER'; voterId: string | null }
  | { type: 'P1_SUBMIT'; playerId: string; text: string }
  | { type: 'P1_SKIP'; playerId: string }
  | { type: 'P1_START_VOTING'; scope?: 'round' | 'final' }
  | { type: 'P1_CAST_REACTION'; voterId: string; cardId: string; reaction: Reaction }
  | { type: 'P1_SKIP_VOTER'; voterId: string }
  | { type: 'P1_NEXT_VOTER' }
  | { type: 'P1_END_VOTING' }
  | { type: 'P2_START' }
  | { type: 'P2_SET_ORDERING'; ordering: string[] }
  | { type: 'P2_MOVE'; from: number; to: number }
  | { type: 'P2_SUBMIT_RANKING'; playerId: string; ordering: string[] }
  | { type: 'P2_SKIP_RANKING'; playerId: string }
  | { type: 'P2_FINALIZE' };

/*
Changes Summary (2025-12-26)
- REACTIONS virou const runtime (`as const`) + Reaction derivado do array.
- Isso impede o bug “REACTIONS is not iterable” quando o TS tenta apagar import type em build.
- Mantém a estrutura esperada por engine.ts / selectors.ts / scoring.ts / GameClient.
*/
