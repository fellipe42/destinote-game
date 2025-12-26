// lib/game/v1/storage.ts
import type { GameState } from './types';

const PREFIX = 'destinote:game:v1:room:';

function roomKey(roomId: string) {
  return `${PREFIX}${roomId}`;
}

function safeParse(json: string): unknown {
  try {
    return JSON.parse(json);
  } catch {
    return null;
  }
}

function isObj(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null;
}

function looksLikeGame(v: unknown): v is GameState {
  if (!isObj(v)) return false;
  const o = v as any;
  return typeof o.phase === 'string' && Array.isArray(o.players) && typeof o.updatedAt === 'number';
}

export function hasSavedGame(roomId: string): boolean {
  try {
    return !!localStorage.getItem(roomKey(roomId));
  } catch {
    return false;
  }
}

export function clearSavedGame(roomId: string) {
  try {
    localStorage.removeItem(roomKey(roomId));
  } catch {}
}

export function loadSavedGame(roomId: string): GameState | null {
  try {
    const raw = localStorage.getItem(roomKey(roomId));
    if (!raw) return null;
    const parsed = safeParse(raw);
    if (!looksLikeGame(parsed)) return null;
    return parsed as GameState;
  } catch {
    return null;
  }
}

export function saveGame(roomId: string, game: GameState) {
  try {
    localStorage.setItem(roomKey(roomId), JSON.stringify(game));
  } catch {}
}
