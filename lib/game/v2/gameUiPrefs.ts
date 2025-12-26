// lib/game/v2/gameUiPrefs.ts
// Preferências de UI do jogo (somente no /game) — persistência local.

export type GameUiPrefs = {
  bgMode: 'destinote' | 'bgImage' | 'solid';
  bgImageId?: number; // 2..30
  solid?: { hex: string };
  globeIdle?: boolean;
};

const KEY_PREFIX = 'destinote:game:ui:v1';

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

export function gameUiKey(roomId?: string) {
  return roomId ? `${KEY_PREFIX}:${roomId}` : KEY_PREFIX;
}

export function defaultGameUiPrefs(): GameUiPrefs {
  return {
    bgMode: 'destinote',
    bgImageId: 2,
    solid: { hex: '#0B1220' },
    globeIdle: true,
  };
}

export function normalizeGameUiPrefs(input: Partial<GameUiPrefs> | null | undefined): GameUiPrefs {
  const base = defaultGameUiPrefs();
  if (!input) return base;

  const bgMode = input.bgMode === 'bgImage' || input.bgMode === 'solid' || input.bgMode === 'destinote' ? input.bgMode : base.bgMode;
  const bgImageIdRaw = typeof input.bgImageId === 'number' ? Math.floor(input.bgImageId) : base.bgImageId;
  const bgImageId = Math.min(30, Math.max(2, bgImageIdRaw ?? 2));

  const hex = (input.solid?.hex ?? base.solid?.hex ?? '#0B1220').toString();
  const solid = { hex: /^#[0-9a-fA-F]{6}$/.test(hex) ? hex : '#0B1220' };

  return {
    bgMode,
    bgImageId,
    solid,
    globeIdle: typeof input.globeIdle === 'boolean' ? input.globeIdle : base.globeIdle,
  };
}

export function loadGameUiPrefs(roomId?: string): GameUiPrefs {
  if (typeof window === 'undefined') return defaultGameUiPrefs();
  try {
    const raw = localStorage.getItem(gameUiKey(roomId));
    if (!raw) return defaultGameUiPrefs();
    const parsed = safeParse(raw);
    if (!isObj(parsed)) return defaultGameUiPrefs();
    return normalizeGameUiPrefs(parsed as any);
  } catch {
    return defaultGameUiPrefs();
  }
}

export function saveGameUiPrefs(roomId: string | undefined, prefs: GameUiPrefs) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(gameUiKey(roomId), JSON.stringify(normalizeGameUiPrefs(prefs)));
  } catch {
    // ignore
  }
}

export function clearGameUiPrefs(roomId?: string) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(gameUiKey(roomId));
  } catch {
    // ignore
  }
}
