// lib/game/v1/types.ts

export const REACTIONS = ['👍', '❤️', '😂', '🔥', '💀'] as const;
export type Reaction = (typeof REACTIONS)[number];

export type ThemeSlot =
  | { kind: 'random' }
  | { kind: 'fixed'; text: string };

export type VoteMode = 'per_round' | 'end_only';

export type Player = {
  id: string;
  name: string;
  createdAt: number;
};

export type ActionCard = {
  id: string;
  number: number; // display number
  authorId: string;
  round: number;
  text: string;
  createdAt: number;
};

export type Vote = {
  id: string;
  number: number;
  sessionKey: string; // "round:1" | "final"
  voterId: string;
  cardId: string;
  reaction: Reaction;
  createdAt: number;
};

export type SetupConfig = {
  playerNames: string[];

  // Configs do pasted.txt
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
};

export type GameConfig = {
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

export type Phase1State = {
  round: number;
  playerIndex: number;
  themesByRound: string[];
  cards: ActionCard[];
};

export type Phase1VotingState = {
  sessionKey: string;
  scope: 'round' | 'final';
  round: number | null;

  currentVoterIndex: number;
  votesUsedByVoter: Record<string, number>;
  voterDone: Record<string, boolean>;
};

export type Phase1ResultsState = {
  pointsByCardId: Record<string, number>;
  reactionCountsByCardId: Record<string, Partial<Record<Reaction, number>>>;
  top3: { cardId: string; points: number }[];
  reactionWinners: Partial<Record<Reaction, { cardId: string; count: number }>>;
  deckCardIds: string[];
};

export type Phase2State = {
  theme: string;
  deckCardIds: string[];

  // ✅ NOVO: uma única rodada final (cada jogador envia ordenação completa uma vez)
  finalRankings: Record<string, string[]>; // playerId -> ordering (full deck)
  currentRankerIndex: number; // qual jogador está “respondendo” agora (UI pode usar)
};

export type RevealState = {
  // qual carta foi escolhida como TOP 1 por quantas pessoas
  topCounts: Record<string, number>;

  // carta vencedora (maioria), se houver (pode ser null em empate)
  winningCardId: string | null;
  winningAuthorId: string | null;

  // “venceu demais”: unanimidade entre não-autores do topo
  collectiveWin: boolean;
  collectiveWinningCardId: string | null;

  // Tie info
  isTie: boolean;
  tiedTopCardIds: string[];

  // Snapshot para UI
  deckCardIds: string[];
};

export type GamePhase =
  | 'p1_writing'
  | 'p1_voting'
  | 'p1_results'
  | 'p2_intro'
  | 'p2_discuss'
  | 'p2_rank_final'
  | 'reveal';

export type GameState = {
  version: 'v1';
  phase: GamePhase;
  roomId?: string;

  config: GameConfig;
  players: Player[];

  p1: Phase1State;
  p1Voting: Phase1VotingState | null;
  p1Results: Phase1ResultsState | null;

  votes: Vote[];

  p2: Phase2State | null;
  reveal: RevealState | null;

  seq: { nextCardNumber: number; nextVoteNumber: number };

  startedAt: number;
  updatedAt: number;
};
