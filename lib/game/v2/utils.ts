// lib/game/v2/utils.ts

// Novo: gera um ID curto para sala (room) do jogo.
// Motivo do bug: app/game/page.tsx importa makeRoomId, mas ela não existia aqui,
// então vinha como undefined e quebrava em runtime.
export function makeRoomId(length = 6) {
  const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // sem I/1/O/0
  let out = '';
  for (let i = 0; i < length; i++) {
    out += ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
  }
  return out;
}

export function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

export function uid(prefix: string) {
  const rnd = Math.random().toString(36).slice(2, 8);
  const ts = Date.now().toString(36).slice(-5);
  return `${prefix}_${ts}_${rnd}`;
}

export function shuffle<T>(arr: T[], seed?: number): T[] {
  // Fisher-Yates with optional deterministic seed
  const a = [...arr];
  let r = seed ?? Math.floor(Math.random() * 2 ** 31);
  const rand = () => {
    // LCG
    r = (1103515245 * r + 12345) % 2 ** 31;
    return r / 2 ** 31;
  };
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function pickOne<T>(arr: T[], seed?: number): T {
  if (!arr.length) throw new Error('pickOne on empty array');
  const i = seed == null ? Math.floor(Math.random() * arr.length) : Math.abs(seed) % arr.length;
  return arr[i];
}

export function now() {
  return Date.now();
}
