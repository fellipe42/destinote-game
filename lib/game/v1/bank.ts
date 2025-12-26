import type { ThemeBank } from './types';
import { DEFAULT_THEME_BANK } from './themes';

const BANK_KEY = 'destinote:game:v1:theme-bank';

function safeParse(json: string): unknown {
  try { return JSON.parse(json); } catch { return null; }
}
function isObj(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null;
}
function looksLikeBank(v: unknown): v is ThemeBank {
  if (!isObj(v)) return false;
  const o = v as any;
  return o.version === 'v1' && Array.isArray(o.phase1Themes) && Array.isArray(o.phase2Themes);
}

export function loadThemeBank(): ThemeBank {
  try {
    const raw = localStorage.getItem(BANK_KEY);
    if (!raw) {
      saveThemeBank(DEFAULT_THEME_BANK);
      return { ...DEFAULT_THEME_BANK };
    }
    const parsed = safeParse(raw);
    if (!looksLikeBank(parsed)) {
      saveThemeBank(DEFAULT_THEME_BANK);
      return { ...DEFAULT_THEME_BANK };
    }
    const bank = parsed as ThemeBank;
    return {
      version: 'v1',
      updatedAt: typeof bank.updatedAt === 'number' ? bank.updatedAt : Date.now(),
      phase1Themes: bank.phase1Themes,
      phase2Themes: bank.phase2Themes,
    };
  } catch {
    return { ...DEFAULT_THEME_BANK };
  }
}

export function saveThemeBank(bank: ThemeBank) {
  try {
    localStorage.setItem(BANK_KEY, JSON.stringify(bank));
  } catch {
    // V1: silencioso
  }
}

function normalizeLine(s: string) {
  return (s ?? '').trim().replace(/\s+/g, ' ');
}

export function addPhase1Themes(bank: ThemeBank, lines: string[]): ThemeBank {
  const nextLines = lines.map(normalizeLine).filter(Boolean).map((t) => {
    // força semântica: começa com "Coisas para fazer"
    return t.toLowerCase().startsWith('coisas para fazer') ? t : `Coisas para fazer ${t}`;
  });

  const merged = [...bank.phase1Themes, ...nextLines]
    .map(normalizeLine)
    .filter(Boolean);

  // dedupe
  const seen = new Set<string>();
  const uniq: string[] = [];
  for (const t of merged) {
    const key = t.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    uniq.push(t);
  }

  const next: ThemeBank = { ...bank, phase1Themes: uniq, updatedAt: Date.now() };
  saveThemeBank(next);
  return next;
}

export function addPhase2Themes(bank: ThemeBank, lines: string[]): ThemeBank {
  const nextLines = lines.map(normalizeLine).filter(Boolean);

  const merged = [...bank.phase2Themes, ...nextLines]
    .map(normalizeLine)
    .filter(Boolean);

  const seen = new Set<string>();
  const uniq: string[] = [];
  for (const t of merged) {
    const key = t.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    uniq.push(t);
  }

  const next: ThemeBank = { ...bank, phase2Themes: uniq, updatedAt: Date.now() };
  saveThemeBank(next);
  return next;
}

export function resetThemeBank(): ThemeBank {
  const fresh: ThemeBank = { ...DEFAULT_THEME_BANK, updatedAt: Date.now() };
  saveThemeBank(fresh);
  return fresh;
}

export function exportThemeBankJson(bank: ThemeBank) {
  return { ...bank, exportedAt: new Date().toISOString() };
}
