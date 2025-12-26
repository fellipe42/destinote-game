// lib/game/v2/selectors.ts
import type { ActionCard, GameState, Reaction } from './types';
import { REACTIONS } from './types';

export { REACTIONS };

/** Util: achar carta pelo id (usado no GameClient e BoardClient) */
export function getCardById(cards: ActionCard[], cardId: string): ActionCard | null {
  return cards.find((c) => c.id === cardId) ?? null;
}

/** Setup “completo” aqui significa: já tem jogadores suficientes. */
export function isSetupComplete(state: GameState) {
  return state.players.length >= 2;
}

export function fmtPhaseLabel(phase: GameState['phase']): string {
  switch (phase) {
    case 'setup':
      return 'Setup';
    case 'p1_write':
      return 'Fase 1 — Escrever';
    case 'p1_vote':
      return 'Fase 1 — Votação';
    case 'p1_review':
      return 'Fase 1 — Revisão';
    case 'p1_results':
      return 'Fase 1 — Resultados';
    case 'p2_intro':
      return 'Fase 2 — Instruções';
    case 'p2_rank':
      return 'Fase 2 — Ranking secreto';
    case 'p2_discuss':
      return 'Fase 2 — Debate';
    case 'reveal':
      return 'Revelação';
    default:
      return String(phase);
  }
}

/**
 * Conta reações por carta dentro de um "sessionKey".
 * Padrão: rodada atual (round:<n>) ou a key da votação ativa (quando existe).
 */
export function computeSessionReactions(state: GameState, sessionKey?: string) {
  const key =
    sessionKey ??
    state.p1.voting?.key ??
    (state.p1.round ? `round:${state.p1.round}` : 'round:1');

  const map: Record<string, Record<Reaction, number>> = {};
  for (const c of state.p1.cards) {
    map[c.id] = { '👍': 0, '❤️': 0, '😂': 0, '🔥': 0, '💀': 0 };
  }

  for (const v of state.p1.votes) {
    if (v.sessionKey !== key) continue;
    map[v.cardId] ??= { '👍': 0, '❤️': 0, '😂': 0, '🔥': 0, '💀': 0 };
    map[v.cardId][v.reaction] = (map[v.cardId][v.reaction] ?? 0) + 1;
  }

  return map;
}

/** Vencedor da rodada atual (pela soma total de reações na rodada). */
export function computeRoundWinner(state: GameState) {
  const key = `round:${state.p1.round}`;

  const pointsByCard: Record<string, number> = {};
  for (const v of state.p1.votes) {
    if (v.sessionKey !== key) continue;
    pointsByCard[v.cardId] = (pointsByCard[v.cardId] ?? 0) + 1;
  }

  let bestId: string | null = null;
  let bestPts = -1;
  for (const [cardId, pts] of Object.entries(pointsByCard)) {
    if (pts > bestPts) {
      bestPts = pts;
      bestId = cardId;
    }
  }

  if (!bestId) return null;

  const card = getCardById(state.p1.cards, bestId);
  const author = card ? state.players.find((p) => p.id === card.authorId) : null;

  return {
    cardId: bestId,
    points: bestPts,
    card,
    winnerName: author?.name ?? '—',
  };
}

/** Nome do vencedor final (fase 2) */
export function winnerName(state: GameState) {
  const winId = state.reveal?.phase2?.winningAuthorId ?? null;
  if (!winId) return null;
  const p = state.players.find((x) => x.id === winId);
  return p?.name ?? null;
}
