// lib/game/v2/setupDraft.ts
//
// ✅ FIX (25/12): GameClient importava este módulo, mas ele não existia.
// O storage já persiste drafts como string. Aqui só tipamos + serializamos.

import { loadSetupDraft as loadRaw, saveSetupDraft as saveRaw } from './storage';

export type SetupDraft = {
  players: string[];
  updatedAt: number;
};

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

function looksLikeDraft(v: unknown): v is SetupDraft {
  if (!isObj(v)) return false;
  const o: any = v;
  return Array.isArray(o.players) && typeof o.updatedAt === 'number';
}

export function loadSetupDraft(roomId: string): SetupDraft | null {
  const raw = loadRaw(roomId);
  if (!raw) return null;
  const parsed = safeParse(raw);
  if (!looksLikeDraft(parsed)) return null;
  return parsed;
}

export function saveSetupDraft(roomId: string, draft: SetupDraft) {
  const normalized: SetupDraft = {
    players: Array.isArray(draft.players) ? draft.players : [],
    updatedAt: typeof draft.updatedAt === 'number' ? draft.updatedAt : Date.now(),
  };
  saveRaw(roomId, JSON.stringify(normalized));
}
