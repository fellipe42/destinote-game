// lib/game/v2/broadcast.ts
// Back-compat shim.
// The project has two helpers (bus.ts and this file). To avoid channel/type drift,
// we re-export the canonical helpers from bus.ts.

export { gameChannelName, normalizeIncoming, type GameBroadcastMessage } from './bus';
