// components/game/useGameUiPrefs.ts
'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  clearGameUiPrefs,
  defaultGameUiPrefs,
  loadGameUiPrefs,
  saveGameUiPrefs,
  type GameUiPrefs,
} from '@/lib/game/v2/gameUiPrefs';

/**
 * Hook de preferências visuais do jogo.
 *
 * IMPORTANTE: retorna uma tupla (array) para suportar destruturação
 * `const [prefs, setPrefs, resetPrefs] = useGameUiPrefs(roomId)`.
 *
 * Também expõe propriedades por nome (prefs/update/reset) por conveniência.
 */
export function useGameUiPrefs(roomId?: string) {
  const key = useMemo(() => roomId ?? '', [roomId]);
  // SSR-safe: inicia sempre com default, e carrega do localStorage após mount.
  const [prefs, setPrefs] = useState<GameUiPrefs>(() => defaultGameUiPrefs());

  // Recarrega quando mudar o roomId
  useEffect(() => {
    setPrefs(loadGameUiPrefs(roomId));
  }, [key, roomId]);

  const update = useCallback(
    (patch: Partial<GameUiPrefs>) => {
      setPrefs((prev) => {
        const next = { ...prev, ...patch } as GameUiPrefs;
        saveGameUiPrefs(roomId, next);
        return next;
      });
    },
    [roomId]
  );

  const reset = useCallback(() => {
    clearGameUiPrefs(roomId);
    const next = loadGameUiPrefs(roomId);
    setPrefs(next);
  }, [roomId]);

  // Tuple-style return
  const tuple = [prefs, update, reset] as const;

  // Also attach named props (useful if you prefer object access)
  return Object.assign(tuple, {
    prefs,
    update,
    reset,
  });
}
