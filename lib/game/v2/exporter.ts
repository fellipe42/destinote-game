// lib/game/v2/exporter.ts
import type { GameState } from './types';

export function exportRoomJson(state: GameState) {
  return JSON.stringify(state, null, 2);
}
