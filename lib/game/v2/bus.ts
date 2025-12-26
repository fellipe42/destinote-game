// lib/game/v2/bus.ts
// Lightweight BroadcastChannel helpers for game sync (local tabs).

import type { GameState } from './types';

export type GameBroadcastMessage =
  | { type: 'state'; state: GameState }
  | { type: 'hard_reset'; roomId: string; at: number };

export function gameChannelName(roomId: string) {
  return `destinote:game:v2:bc:${roomId}`;
}

function isObj(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null;
}

function looksLikeState(v: unknown): v is GameState {
  if (!isObj(v)) return false;
  const o = v as any;
  return o.version === 'v2' && typeof o.roomId === 'string' && typeof o.phase === 'string' && Array.isArray(o.players);
}

export function normalizeIncoming(msg: unknown): GameBroadcastMessage | null {
  if (!isObj(msg)) return null;
  const t = (msg as any).type;

  if (t === 'hard_reset') {
    const roomId = typeof (msg as any).roomId === 'string' ? (msg as any).roomId : '';
    const at = typeof (msg as any).at === 'number' ? (msg as any).at : Date.now();
    if (!roomId) return null;
    return { type: 'hard_reset', roomId, at };
  }

  if (t === 'state') {
    const st = (msg as any).state;
    if (!looksLikeState(st)) return null;
    return { type: 'state', state: st };
  }

  return null;
}
