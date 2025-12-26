// contexts/PersonalizationContext.tsx
'use client';

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

import type {
  PersonalizationState,
  ThemeId,
  GlobeId,
  BackgroundId,
} from '@/lib/personalization/types';
import { getDefaultPersonalizationState } from '@/lib/personalization/defaults';
import {
  loadPersonalizationState,
  savePersonalizationState,
} from '@/lib/personalization/storage';
import {
  rebalanceWeights,
  setManualWeight,
  unlockAll,
} from '@/lib/personalization/weights';
import { SEGMENT_COUNT } from '@/lib/personalization/segments';
import { themeExists } from '@/lib/personalization/catalog';

type Mode = 'site' | 'custom';

type Ctx = {
  state: PersonalizationState;
  setTheme: (theme: ThemeId) => void;

  setGlobeEnabled: (enabled: boolean) => void;
  setGlobeId: (globeId: GlobeId) => void;
  setGlobeBrightness: (brightness: number) => void;
  setGlobeScale: (scale: number) => void;
  setGlobeRotationSeconds: (seconds: number) => void;
  setGlobeSegments: (segments: boolean[]) => void;

  toggleBackground: (id: BackgroundId) => void;
  moveBackground: (id: BackgroundId, dir: -1 | 1) => void;
  setBackgroundWeight: (id: BackgroundId, value: number) => void;
  setBackgroundEqual: () => void;
  unlockBackgroundWeights: () => void;

  resetAll: () => void;

  // Sprint 3.3
  mode: Mode;
  setMode: (mode: Mode) => void;

  // UI overrides (cor dos GoalCards) — usado em /perfil (admin block legado)
  cardColorMode: 'category' | 'override';
  cardColorOverride: string | null;
  setCardOverride: (mode: 'category' | 'override', color: string | null) => void;

  resetToSiteDefaults: () => void;
  siteDefaultsLoaded: boolean;
};

const MODE_KEY = 'destinote:personalization:mode:v1';
const SITE_CACHE_KEY = 'destinote:site-defaults-cache:v1';
const PERSONAL_KEY = 'destinote:personalization:v1';

const PersonalizationContext = createContext<Ctx | null>(null);

function applyThemeToDom(theme: string) {
  if (typeof document === 'undefined') return;
  document.documentElement.setAttribute('data-dn-theme', theme);
}

export function PersonalizationProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  // SSR-safe initial
  const [state, setState] = useState<PersonalizationState>(() =>
    getDefaultPersonalizationState()
  );

  // Sprint 3.3: site defaults support
  const [mode, setModeState] = useState<Mode>('site');
  const [siteDefaults, setSiteDefaults] = useState<PersonalizationState | null>(
    null
  );
  const [siteDefaultsLoaded, setSiteDefaultsLoaded] = useState(false);

  // UI overrides (GoalCard color)
  const [cardColorMode, setCardColorMode] = useState<'category' | 'override'>('category');
  const [cardColorOverride, setCardColorOverride] = useState<string | null>(null);


  const setMode = useCallback((m: Mode) => {
    setModeState(m);

    // UI overrides: carrega preferências de cor (se houver)
    try {
      const rawCC = localStorage.getItem('destinote:cardColor:v1');
      if (rawCC) {
        const parsed = JSON.parse(rawCC) as { mode?: 'category' | 'override'; color?: string | null };
        if (parsed?.mode === 'category' || parsed?.mode === 'override') setCardColorMode(parsed.mode);
        if (typeof parsed?.color === 'string' || parsed?.color === null) setCardColorOverride(parsed.color ?? null);
      }
    } catch { }

    try {
      localStorage.setItem(MODE_KEY, m);
    } catch { }
  }, []);

  const setCardOverride = useCallback(
    (mode: 'category' | 'override', color: string | null) => {
      setCardColorMode(mode);
      setCardColorOverride(color);
      try {
        localStorage.setItem('destinote:cardColor:v1', JSON.stringify({ mode, color }));
      } catch { }
    },
    []
  );


  const resetToSiteDefaults = useCallback(() => {
    setMode('site');
    try {
      localStorage.removeItem(PERSONAL_KEY);
    } catch { }
    const next = siteDefaults ?? getDefaultPersonalizationState();
    setState(next);
    applyThemeToDom(next.theme);
  }, [setMode, siteDefaults]);

  // load on mount: mode + local custom + fetch site defaults
  useEffect(() => {
    // 1) mode
    let m: Mode = 'site';
    try {
      const rawMode = localStorage.getItem(MODE_KEY);
      if (rawMode === 'custom') m = 'custom';
    } catch { }
    setModeState(m);

    // 2) load local personalization ONLY if custom
    if (m === 'custom') {
      const loaded = loadPersonalizationState();
      setState(loaded);
      applyThemeToDom(loaded.theme);
    } else {
      // site mode: keep SSR default for now (no persist)
      const d = getDefaultPersonalizationState();
      setState(d);
      applyThemeToDom(d.theme);
    }

    // 3) fetch site defaults (API)
    (async () => {
      try {
        const res = await fetch('/api/site-settings', { cache: 'no-store' });
        const json = await res.json();
        const defaults = json?.data?.personalizationDefaults as
          | PersonalizationState
          | undefined;

        if (defaults) {
          setSiteDefaults(defaults);
          setSiteDefaultsLoaded(true);

          // cache for early layout script next load
          try {
            localStorage.setItem(SITE_CACHE_KEY, JSON.stringify(defaults));
          } catch { }

          // if we're in site-mode, apply immediately
          if (m === 'site') {
            setState(defaults);
            applyThemeToDom(defaults.theme);
          }
        } else {
          setSiteDefaultsLoaded(true);
        }
      } catch {
        setSiteDefaultsLoaded(true);
      }
    })();
  }, []);

  // persist on change ONLY in custom mode
  useEffect(() => {
    if (mode !== 'custom') return;
    savePersonalizationState(state);
  }, [state, mode]);

  // theme setter
  const setTheme = useCallback((theme: ThemeId) => {
    setMode('custom');

    const safeTheme = themeExists(theme) ? theme : 'default';

    setState((prev) => {
      // preset do dark: bg-16, bg-8, bg-14, bg-17..bg-21 (nessa ordem)
      if (safeTheme === 'dark') {
        const ids: BackgroundId[] = [
          'bg-16',
          'bg-8',
          'bg-14',
          'bg-17',
          'bg-18',
          'bg-19',
          'bg-20',
          'bg-16',
        ];

        const res = unlockAll(ids);

        return {
          ...prev,
          theme: safeTheme,
          background: {
            selectedIds: ids,
            weights: res.weights,
            manualIds: res.manualIds,
          },
        };
      }

      if (safeTheme === 'sky') {
        const ids: BackgroundId[] = [
          'bg-11',
          'bg-16',
          'bg-19',
          'bg-18',
          'bg-21',
          'bg-13',
          'bg-22',
          'bg-7',
        ];

        const res = unlockAll(ids);

        return {
          ...prev,
          theme: safeTheme,
          background: {
            selectedIds: ids,
            weights: res.weights,
            manualIds: res.manualIds,
          },
        };
      }

      if (safeTheme === 'holiday') {
        const ids: BackgroundId[] = [
          'bg-7',
          'bg-9',
          'bg-10',
          'bg-11',
          'bg-12',
          'bg-15',
          'bg-13',
          'bg-19',
        ];

        const res = unlockAll(ids);

        return {
          ...prev,
          theme: safeTheme,
          background: {
            selectedIds: ids,
            weights: res.weights,
            manualIds: res.manualIds,
          },
        };
      }


      return { ...prev, theme: safeTheme };
    });

    applyThemeToDom(safeTheme);
  }, [setMode]);


  // globe setters
  const setGlobeEnabled = useCallback(
    (enabled: boolean) => {
      setMode('custom');
      setState((prev) => ({ ...prev, globe: { ...prev.globe, enabled } }));
    },
    [setMode]
  );

  const setGlobeId = useCallback(
    (globeId: GlobeId) => {
      setMode('custom');
      setState((prev) => ({ ...prev, globe: { ...prev.globe, globeId } }));
    },
    [setMode]
  );

  const setGlobeBrightness = useCallback(
    (brightness: number) => {
      setMode('custom');
      setState((prev) => ({ ...prev, globe: { ...prev.globe, brightness } }));
    },
    [setMode]
  );

  const setGlobeScale = useCallback(
    (scale: number) => {
      setMode('custom');
      setState((prev) => ({ ...prev, globe: { ...prev.globe, scale } }));
    },
    [setMode]
  );

  const setGlobeRotationSeconds = useCallback(
    (seconds: number) => {
      setMode('custom');
      setState((prev) => ({
        ...prev,
        globe: { ...prev.globe, rotationSeconds: seconds },
      }));
    },
    [setMode]
  );

  const setGlobeSegments = useCallback(
    (segments: boolean[]) => {
      setMode('custom');
      setState((prev) => ({
        ...prev,
        globe: {
          ...prev.globe,
          visibilitySegments: segments.slice(0, SEGMENT_COUNT),
        },
      }));
    },
    [setMode]
  );

  // background logic
  const toggleBackground = useCallback((id: BackgroundId) => {
    setState((prev) => {
      const selected = prev.background.selectedIds.slice();
      const isSelected = selected.includes(id);
      const nextSelected = isSelected
        ? selected.filter((x) => x !== id)
        : [...selected, id];

      const { weights, manualIds } = isSelected
        ? rebalanceWeights(
          nextSelected,
          prev.background.weights,
          prev.background.manualIds.filter((x) => x !== id)
        )
        : rebalanceWeights(
          nextSelected,
          prev.background.weights,
          prev.background.manualIds
        );

      return {
        ...prev,
        background: {
          ...prev.background,
          selectedIds: nextSelected,
          weights,
          manualIds,
        },
      };
    });
  }, []);

  const moveBackground = useCallback((id: BackgroundId, dir: -1 | 1) => {
    setState((prev) => {
      const selected = prev.background.selectedIds.slice();
      const idx = selected.indexOf(id);
      if (idx < 0) return prev;

      const nextIdx = idx + dir;
      if (nextIdx < 0 || nextIdx >= selected.length) return prev;

      const tmp = selected[idx];
      selected[idx] = selected[nextIdx];
      selected[nextIdx] = tmp;

      return { ...prev, background: { ...prev.background, selectedIds: selected } };
    });
  }, []);

  const setBackgroundWeight = useCallback(
    (id: BackgroundId, value: number) => {
      setMode('custom');
      setState((prev) => {
        const res = setManualWeight(
          prev.background.selectedIds,
          prev.background.weights,
          prev.background.manualIds,
          id,
          value
        );
        return {
          ...prev,
          background: {
            ...prev.background,
            weights: res.weights,
            manualIds: res.manualIds,
          },
        };
      });
    },
    [setMode]
  );

  const setBackgroundEqual = useCallback(() => {
    setMode('custom');
    setState((prev) => {
      const res = unlockAll(prev.background.selectedIds);
      return {
        ...prev,
        background: { ...prev.background, weights: res.weights, manualIds: res.manualIds },
      };
    });
  }, [setMode]);

  const unlockBackgroundWeights = useCallback(() => {
    setBackgroundEqual();
  }, [setBackgroundEqual]);

  const resetAll = useCallback(() => {
    setMode('custom');
    const d = getDefaultPersonalizationState();
    setState(d);
    applyThemeToDom(d.theme);
  }, [setMode]);

  const value = useMemo<Ctx>(
    () => ({
      state,
      setTheme,
      setGlobeEnabled,
      setGlobeId,
      setGlobeBrightness,
      setGlobeScale,
      setGlobeRotationSeconds,
      setGlobeSegments,
      toggleBackground,
      moveBackground,
      setBackgroundWeight,
      setBackgroundEqual,
      unlockBackgroundWeights,
      resetAll,
      cardColorMode,
      cardColorOverride,
      setCardOverride,

      mode,
      setMode,
      resetToSiteDefaults,
      siteDefaultsLoaded,
    }),
    [
      state,
      setTheme,
      setGlobeEnabled,
      setGlobeId,
      setGlobeBrightness,
      setGlobeScale,
      setGlobeRotationSeconds,
      setGlobeSegments,
      toggleBackground,
      moveBackground,
      setBackgroundWeight,
      setBackgroundEqual,
      unlockBackgroundWeights,
      cardColorMode,
      cardColorOverride,
      setCardOverride,
      resetAll,
      mode,
      setMode,
      resetToSiteDefaults,
      siteDefaultsLoaded,
    ]
  );

  return (
    <PersonalizationContext.Provider value={value}>
      {children}
    </PersonalizationContext.Provider>
  );
}

export function usePersonalization() {
  const ctx = useContext(PersonalizationContext);
  if (!ctx) throw new Error('usePersonalization must be used within PersonalizationProvider');
  return ctx;
}
