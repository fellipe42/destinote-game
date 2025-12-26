// lib/game/v2/scoring.ts
// Funções de pontuação/consulta (V2). Mantido simples por enquanto.
// Hoje o Board precisa só de `getActiveVotingSessionKey`, mas deixei
// alguns helpers úteis (opcionais) pra futuras telas/reveal.

import type { GameState, Vote, Reaction } from './types';
import { REACTIONS } from './types';

/** Retorna a key da sessão de votação ativa (ex: "round:2" ou "final"). */
export function getActiveVotingSessionKey(state: GameState): string | null {
  return state.p1.voting?.key ?? null;
}

/** Conta votos por cardId (opcionalmente filtrando por sessionKey). */
export function countVotesByCard(votes: Vote[], sessionKey?: string): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const v of votes) {
    if (sessionKey && v.sessionKey !== sessionKey) continue;
    counts[v.cardId] = (counts[v.cardId] ?? 0) + 1;
  }
  return counts;
}

/** Encontra, para cada reação, o card que mais recebeu aquela reação. */
export function reactionWinners(
  votes: Vote[],
  sessionKey?: string
): Partial<Record<Reaction, { cardId: string; count: number }>> {
  const best: Partial<Record<Reaction, { cardId: string; count: number }>> = {};

  for (const r of REACTIONS) {
    const counts: Record<string, number> = {};
    for (const v of votes) {
      if (sessionKey && v.sessionKey !== sessionKey) continue;
      if (v.reaction !== r) continue;
      counts[v.cardId] = (counts[v.cardId] ?? 0) + 1;
    }

    let win: { cardId: string; count: number } | null = null;
    for (const [cardId, count] of Object.entries(counts)) {
      if (!win || count > win.count) win = { cardId, count };
    }
    if (win) best[r] = win;
  }

  return best;
}

/** Top N cards por contagem (com desempate estável por cardId). */
export function topNByScore(counts: Record<string, number>, n: number): { cardId: string; score: number }[] {
  return Object.entries(counts)
    .map(([cardId, score]) => ({ cardId, score }))
    .sort((a, b) => {
      const d = b.score - a.score;
      if (d !== 0) return d;
      // desempate estável
      return a.cardId.localeCompare(b.cardId);
    })
    .slice(0, n);
}
