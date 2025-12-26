// lib/game/v2/storage.ts
import type { GameState } from './types';
import { gameChannelName } from './broadcast';

const PREFIX = 'destinote:game:v2:room:';
const SETUP_DRAFT_PREFIX = 'destinote:game:v2:setupDraft:';

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
  return o.version === 'v2' && typeof o.roomId === 'string' && typeof o.phase === 'string' && Array.isArray(o.players);
}

export function roomKey(roomId: string) {
  return `${PREFIX}${roomId}`;
}

export function setupDraftKey(roomId: string) {
  return `${SETUP_DRAFT_PREFIX}${roomId}`;
}

export function loadRoom(roomId: string): GameState | null {
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

export function saveRoom(roomId: string, state: GameState) {
  try {
    localStorage.setItem(roomKey(roomId), JSON.stringify(state));
  } catch {
    // ignore
  }
}

export function clearRoom(roomId: string) {
  try {
    localStorage.removeItem(roomKey(roomId));
  } catch {
    // ignore
  }
}

export function loadSetupDraft(roomId: string): string {
  try {
    return localStorage.getItem(setupDraftKey(roomId)) ?? '';
  } catch {
    return '';
  }
}

export function saveSetupDraft(roomId: string, value: string) {
  try {
    localStorage.setItem(setupDraftKey(roomId), value);
  } catch {
    // ignore
  }
}

export function clearSetupDraft(roomId: string) {
  try {
    localStorage.removeItem(setupDraftKey(roomId));
  } catch {
    // ignore
  }
}

/**
 * Hard reset real: limpa localStorage e avisa todas as abas/boards via BroadcastChannel.
 * - Não mexe em preferências visuais do jogo (GameUiPrefs), por serem uma key separada.
 */
export function hardResetRoom(roomId: string, opts?: { clearSetupDraft?: boolean }) {
  try {
    clearRoom(roomId);
    if (opts?.clearSetupDraft !== false) clearSetupDraft(roomId);

    // broadcast para todas as abas (client-only)
    if (typeof window !== 'undefined' && typeof (globalThis as any).BroadcastChannel !== 'undefined') {
      const bc = new BroadcastChannel(gameChannelName(roomId));
      bc.postMessage({ type: 'hard_reset', roomId, at: Date.now() });
      bc.close();
    }
  } catch {
    // ignore
  }
}

export function makeRoomId(prefix = 'room') {
  const rnd = Math.random().toString(36).slice(2, 7);
  const ts = Date.now().toString(36).slice(-4);
  return `${prefix}-${ts}${rnd}`;
}
