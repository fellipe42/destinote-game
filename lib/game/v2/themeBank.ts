// lib/game/v2/themeBank.ts
import { PHASE1_THEMES, PHASE2_THEMES } from './defaultThemes';

const KEY = 'destinote:game:v2:themeBank';

export type ThemeBank = {
  p1: string[];
  p2: string[];
};

function safeParse(raw: string): unknown {
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function uniq(list: string[]) {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const t of list) {
    const s = (t ?? '').trim();
    if (!s) continue;
    if (seen.has(s)) continue;
    seen.add(s);
    out.push(s);
  }
  return out;
}

export function getDefaultBank(): ThemeBank {
  return {
    p1: [...PHASE1_THEMES],
    p2: [...PHASE2_THEMES],
  };
}

export function loadThemeBank(): ThemeBank {
  if (typeof window === 'undefined') return getDefaultBank();
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return getDefaultBank();
    const parsed = safeParse(raw) as any;
    const p1 = Array.isArray(parsed?.p1) ? parsed.p1 : [];
    const p2 = Array.isArray(parsed?.p2) ? parsed.p2 : [];
    // merge defaults + user, keep user additions
    return {
      p1: uniq([...PHASE1_THEMES, ...p1]),
      p2: uniq([...PHASE2_THEMES, ...p2]),
    };
  } catch {
    return getDefaultBank();
  }
}

export function saveThemeBank(bank: ThemeBank) {
  try {
    localStorage.setItem(KEY, JSON.stringify({ p1: uniq(bank.p1), p2: uniq(bank.p2) }));
  } catch {
    // ignore
  }
}

export function addTheme(phase: 'p1' | 'p2', theme: string) {
  const bank = loadThemeBank();
  bank[phase] = uniq([theme, ...bank[phase]]);
  saveThemeBank(bank);
  return bank;
}

export function removeTheme(phase: 'p1' | 'p2', theme: string) {
  const bank = loadThemeBank();
  bank[phase] = bank[phase].filter((t) => t !== theme);
  saveThemeBank(bank);
  return bank;
}

export function resetThemeBank() {
  const bank = getDefaultBank();
  saveThemeBank(bank);
  return bank;
}
