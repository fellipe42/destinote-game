// lib/game/v1/boardBridge.ts
'use client';

import type { GameState as V1GameState } from '@/lib/game/v1/types';
import type { GameState as V2GameState, Reaction } from '@/lib/game/v2/types';

import { createEmpty } from '@/lib/game/v2/engine';
import { saveRoom } from '@/lib/game/v2/storage';
import { gameChannelName, type GameBroadcastMessage } from '@/lib/game/v2/bus';
import { REACTIONS } from '@/lib/game/v2/types';

function mapPhase(v1: any): V2GameState['phase'] {
  switch (v1) {
    case 'setup':
      return 'setup';
    case 'p1_writing':
      return 'p1_write';
    case 'p1_review':
      return 'p1_review';
    case 'p1_voting':
      return 'p1_vote';
    case 'p1_results':
      return 'p1_results';
    case 'p2_intro':
      return 'p2_intro';
    case 'p2_discuss':
      return 'p2_discuss';
    case 'p2_rank_final':
      return 'p2_rank';
    case 'reveal':
      return 'reveal';
    default:
      return 'setup';
  }
}

function safeThemeFromV1Round(v1: any) {
  const round = v1?.p1?.round ?? 1;
  const arr: string[] = v1?.p1?.themesByRound ?? [];
  const idx = Math.max(0, Math.min(arr.length - 1, round - 1));
  return arr[idx] ?? '';
}

function broadcast(roomId: string, state: V2GameState) {
  try {
    if (typeof window === 'undefined' || typeof (globalThis as any).BroadcastChannel === 'undefined') return;
    const bc = new BroadcastChannel(gameChannelName(roomId));
    const msg: GameBroadcastMessage = { type: 'state', state };
    bc.postMessage(msg);
    bc.close();
  } catch {
    // ignore
  }
}

function tallyPhase1FromVotes(v1: any, cards: Array<{ id: string }>) {
  const votes = (v1?.votes ?? []) as Array<{ cardId: string; reaction: Reaction; sessionKey?: string }>;

  const pointsBy: Record<string, number> = {};
  const reactCounts: Record<string, Record<Reaction, number>> = {};

  for (const c of cards) {
    pointsBy[c.id] = 0;
    reactCounts[c.id] = { '👍': 0, '❤️': 0, '😂': 0, '🔥': 0, '💀': 0 };
  }

  for (const v of votes) {
    if (!v?.cardId || !v?.reaction) continue;
    pointsBy[v.cardId] = (pointsBy[v.cardId] ?? 0) + 1;
    const map = reactCounts[v.cardId] ?? (reactCounts[v.cardId] = { '👍': 0, '❤️': 0, '😂': 0, '🔥': 0, '💀': 0 });
    map[v.reaction] = (map[v.reaction] ?? 0) + 1;
  }

  const scored = Object.entries(pointsBy)
    .map(([cardId, points]) => ({ cardId, points }))
    .sort((a, b) => b.points - a.points);

  const top3 = scored.slice(0, 3);

  const reactionWinners: Partial<Record<Reaction, { cardId: string; count: number }>> = {};
  for (const r of REACTIONS) {
    let best: { cardId: string; count: number } | null = null;
    for (const [cardId, map] of Object.entries(reactCounts)) {
      const count = map[r] ?? 0;
      if (!best || count > best.count) best = { cardId, count };
    }
    if (best && best.count > 0) reactionWinners[r] = best;
  }

  const phase1WinnerCardId = top3[0]?.cardId ?? null;
  return { top3, reactionWinners, phase1WinnerCardId };
}

/**
 * Publica o estado do jogo V1 no “formato V2” para o Board (V2) ler.
 */
export function publishV1ToBoard(roomId: string, v1: V1GameState) {
  try {
    const base = createEmpty(roomId);
    const phase = mapPhase((v1 as any).phase);

    const players = (v1.players ?? []).map((p) => ({ id: p.id, name: p.name }));

    // cards com campos “ricos” (o Board usa texto; mas fica pronto pro final cinema)
    const p1Cards = (v1.p1?.cards ?? []).map((c: any) => ({
      id: c.id,
      displayId: c.displayId ?? c.number ?? 0,
      round: c.round ?? 1,
      theme: c.theme ?? '',
      authorId: c.authorId ?? c.playerId ?? '',
      authorName: c.authorName ?? c.playerName ?? '',
      text: c.text ?? '',
      createdAt: c.createdAt ?? Date.now(),
    }));

    const p1PlayerIndex = v1.p1?.playerIndex ?? 0;
    const p1Theme = safeThemeFromV1Round(v1);
    const p2Theme = (v1.p2 as any)?.theme ?? '';

    const p2Deck: string[] = ((v1.p2 as any)?.deckCardIds as string[] | undefined) ?? [];
    const p2Ordering: string[] = p2Deck; // telão: neutro, sem “ordem secreta”
    const p2RaterIndex = (v1.p2 as any)?.currentRankerIndex ?? 0;

    const mapped: V2GameState = {
      ...base,
      phase,
      players,

      config: {
        ...base.config,
        showThemeInVoting: (v1 as any)?.config?.showThemeInVoting ?? true,
      },

      p1: {
        ...base.p1,
        playerIndex: p1PlayerIndex,
        currentTheme: p1Theme || base.p1.currentTheme,
        cards: p1Cards as any,
      },

      p2: {
        ...base.p2,
        theme: p2Theme || base.p2.theme,
        deckCardIds: p2Deck,
        ordering: p2Ordering,
        raterIndex: p2RaterIndex,
      },

      reveal: null,
      updatedAt: Date.now(),
    };

    // --- REVEAL (do V1) -> REVEAL (no formato que o Board consegue mostrar) ---
    const v1Reveal = (v1 as any)?.reveal ?? null;
    if ((v1 as any).phase === 'reveal' && v1Reveal) {
      const p1Tallied = tallyPhase1FromVotes(v1 as any, p1Cards);

      const phase1WinnerAuthorId = (() => {
        const topId = p1Tallied.phase1WinnerCardId;
        const card = topId ? p1Cards.find((c: any) => c.id === topId) : null;
        return card?.authorId ?? null;
      })();

      mapped.reveal = {
        phase1: {
          top3: p1Tallied.top3,
          reactionWinners: p1Tallied.reactionWinners,
          phase1WinnerCardId: p1Tallied.phase1WinnerCardId,
          phase1WinnerAuthorId,
        },
        phase2: {
          // seu engine v1 não usa averages/correctOrder — então manda vazio.
          averages: {},
          correctOrder: [],
          collectiveWin: Boolean(v1Reveal.collectiveWin),
          // quando for coletivo, esse é o card do topo
          collectiveWinningCardId: v1Reveal.collectiveWinningCardId ?? null,
          // quando for individual, esse é o card do topo
          winningCardId: v1Reveal.winningCardId ?? null,
          winningAuthorId: v1Reveal.winningAuthorId ?? null,

          // extra: dá pra mostrar “topCounts” no board depois (opcional)
          topCounts: v1Reveal.topCounts ?? {},
          isTie: Boolean(v1Reveal.isTie),
          tiedTopCardIds: v1Reveal.tiedTopCardIds ?? [],
        },
      } as any;
    }

    saveRoom(roomId, mapped);
    broadcast(roomId, mapped);
  } catch {
    // ignore
  }
}

export function clearBoardMirror(roomId: string) {
  try {
    const empty = createEmpty(roomId);
    saveRoom(roomId, empty);
    broadcast(roomId, empty);
  } catch {
    // ignore
  }
}
