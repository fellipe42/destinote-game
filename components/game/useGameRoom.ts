// components/game/useGameRoom.ts
'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createEmpty, reduce } from '@/lib/game/v2/engine';
import { clearRoom, clearSetupDraft, hardResetRoom, loadRoom, saveRoom } from '@/lib/game/v2/storage';
import { gameChannelName, type GameBroadcastMessage } from '@/lib/game/v2/broadcast';
import type { GameState, GameEvent } from '@/lib/game/v2/types';

function isObj(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null;
}

function looksLikeState(v: unknown): v is GameState {
  if (!isObj(v)) return false;
  const o = v as any;
  return o.version === 'v2' && typeof o.roomId === 'string' && typeof o.phase === 'string' && Array.isArray(o.players);
}

function normalizeIncoming(msg: unknown): GameBroadcastMessage | null {
  if (!isObj(msg)) return null;
  const t = (msg as any).type;
  if (t === 'hard_reset') {
    const roomId = typeof (msg as any).roomId === 'string' ? (msg as any).roomId : '';
    const at = typeof (msg as any).at === 'number' ? (msg as any).at : Date.now();
    if (!roomId) return null;
    return { type: 'hard_reset', roomId, at };
  }
  if (t === 'state') {
    const st = (msg as any).state;
    if (!looksLikeState(st)) return null;
    return { type: 'state', state: st };
  }
  // backward-compat: some older code posted raw GameState
  if (looksLikeState(msg)) return { type: 'state', state: msg };
  return null;
}

export function useGameRoom(roomId: string) {
  const initial = useMemo(() => loadRoom(roomId) ?? createEmpty(roomId), [roomId]);
  const [state, setState] = useState<GameState>(initial);

  const bcRef = useRef<BroadcastChannel | null>(null);

  // roomId change
  useEffect(() => {
    setState(loadRoom(roomId) ?? createEmpty(roomId));
  }, [roomId]);

  useEffect(() => {
    const bc = new BroadcastChannel(gameChannelName(roomId));
    bcRef.current = bc;
    bc.onmessage = (e) => {
      const msg = normalizeIncoming(e.data);
      if (!msg) return;
      if (msg.type === 'hard_reset') {
        if (msg.roomId !== roomId) return;
        // IMPORTANTE: aqui NÃO re-broadcasta.
        clearRoom(roomId);
        clearSetupDraft(roomId);
        setState(createEmpty(roomId));
        return;
      }
      if (msg.type === 'state') {
        const next = msg.state;
        if (next.roomId !== roomId) return;
        setState(next);
        saveRoom(roomId, next);
      }
    };
    return () => {
      bc.close();
      bcRef.current = null;
    };
  }, [roomId]);

  const dispatch = useCallback(
    (event: GameEvent) => {
      setState((prev) => {
        const base = prev ?? createEmpty(roomId);
        const next = reduce(base, event);

        saveRoom(roomId, next);
        try {
          bcRef.current?.postMessage({ type: 'state', state: next } satisfies GameBroadcastMessage);
        } catch {
          // ignore
        }
        return next;
      });
    },
    [roomId]
  );

  const hardReset = useCallback(() => {
    hardResetRoom(roomId, { clearSetupDraft: true });
    const next = createEmpty(roomId);
    setState(next);
    saveRoom(roomId, next);
    // note: hardResetRoom already broadcasts
  }, [roomId]);

  return { state, dispatch, hardReset };
}
