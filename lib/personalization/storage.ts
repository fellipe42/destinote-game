// lib/personalization/storage.ts
'use client';

import type { PersonalizationState } from './types';
import { PERSONALIZATION_STORAGE_KEY, getDefaultPersonalizationState } from './defaults';

export function safeParseJSON<T>(raw: string | null): T | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export function loadPersonalizationState(): PersonalizationState {
  if (typeof window === 'undefined') return getDefaultPersonalizationState();
  const parsed = safeParseJSON<PersonalizationState>(
    window.localStorage.getItem(PERSONALIZATION_STORAGE_KEY)
  );
  if (!parsed || parsed.version !== 1) return getDefaultPersonalizationState();
  return parsed;
}

export function savePersonalizationState(state: PersonalizationState) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(PERSONALIZATION_STORAGE_KEY, JSON.stringify(state));
  } catch {
    // ignore quota / privacy mode
  }
}

/**
 * Small pre-hydration helper.
 * Read only theme quickly, for the layout inline script.
 */
export function readThemeFromStorage(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(PERSONALIZATION_STORAGE_KEY);
    const parsed = safeParseJSON<PersonalizationState>(raw);
    return parsed?.theme ?? null;
  } catch {
    return null;
  }
}
