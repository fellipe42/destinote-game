// lib/personalization/weights.ts
import type { BackgroundId } from './types';

function round2(n: number) {
  return Math.round(n * 100) / 100;
}

export function clampPercent(v: number) {
  if (Number.isNaN(v)) return 0;
  return Math.max(0, Math.min(100, v));
}

export function equalWeights(ids: BackgroundId[]): Record<BackgroundId, number> {
  const out: Record<string, number> = {};
  if (ids.length === 0) return out;
  const base = 100 / ids.length;
  // keep sum ~100 with rounding
  let acc = 0;
  ids.forEach((id, idx) => {
    const val = idx === ids.length - 1 ? 100 - acc : base;
    const r = round2(val);
    out[id] = r;
    acc += r;
  });
  // fix drift
  const sum = ids.reduce((s, id) => s + (out[id] ?? 0), 0);
  if (ids.length > 0 && Math.abs(sum - 100) > 0.01) {
    out[ids[ids.length - 1]] = round2((out[ids[ids.length - 1]] ?? 0) + (100 - sum));
  }
  return out;
}

/**
 * Rebalance weights keeping manual (locked) ids untouched.
 * - manualIds: locked items, their weights are respected
 * - others receive the remaining percent equally
 * If manual sum exceeds 100, we scale manual values down proportionally.
 */
export function rebalanceWeights(
  selectedIds: BackgroundId[],
  weights: Record<BackgroundId, number>,
  manualIds: BackgroundId[]
) {
  const selectedSet = new Set(selectedIds);

  // clean manualIds and weights by selection
  const manual = manualIds.filter((id) => selectedSet.has(id));
  const outWeights: Record<string, number> = {};
  for (const id of selectedIds) {
    outWeights[id] = clampPercent(weights[id] ?? 0);
  }

  const manualSum = manual.reduce((s, id) => s + (outWeights[id] ?? 0), 0);

  if (selectedIds.length === 0) {
    return { weights: {}, manualIds: [] as BackgroundId[] };
  }

  if (manual.length === selectedIds.length) {
    // all locked -> normalize to 100
    const sum = manualSum || 1;
    for (const id of manual) outWeights[id] = round2((outWeights[id] ?? 0) * (100 / sum));
    // fix rounding drift
    const drift = 100 - manual.reduce((s, id) => s + (outWeights[id] ?? 0), 0);
    outWeights[manual[manual.length - 1]] = round2((outWeights[manual[manual.length - 1]] ?? 0) + drift);
    return { weights: outWeights, manualIds: manual };
  }

  if (manualSum > 100) {
    // scale manual values down
    const scale = 100 / manualSum;
    for (const id of manual) outWeights[id] = round2((outWeights[id] ?? 0) * scale);
  }

  const lockedSum = manual.reduce((s, id) => s + (outWeights[id] ?? 0), 0);
  const remaining = Math.max(0, 100 - lockedSum);

  const autoIds = selectedIds.filter((id) => !manual.includes(id));
  const base = autoIds.length > 0 ? remaining / autoIds.length : 0;

  let acc = 0;
  autoIds.forEach((id, idx) => {
    const val = idx === autoIds.length - 1 ? remaining - acc : base;
    const r = round2(val);
    outWeights[id] = r;
    acc += r;
  });

  // fix drift
  const sum2 = selectedIds.reduce((s, id) => s + (outWeights[id] ?? 0), 0);
  const drift = 100 - sum2;
  if (Math.abs(drift) > 0.01) {
    const fixId = autoIds.length ? autoIds[autoIds.length - 1] : manual[manual.length - 1];
    outWeights[fixId] = round2((outWeights[fixId] ?? 0) + drift);
  }

  return { weights: outWeights, manualIds: manual };
}

export function setManualWeight(
  selectedIds: BackgroundId[],
  weights: Record<BackgroundId, number>,
  manualIds: BackgroundId[],
  id: BackgroundId,
  value: number
) {
  const nextWeights = { ...weights, [id]: clampPercent(value) };
  const nextManual = manualIds.includes(id) ? manualIds : [...manualIds, id];
  return rebalanceWeights(selectedIds, nextWeights, nextManual);
}

export function unlockAll(selectedIds: BackgroundId[]) {
  return { weights: equalWeights(selectedIds), manualIds: [] as BackgroundId[] };
}

/**
 * Convert weights to cumulative thresholds (0..1).
 * Example: [20, 30, 50] -> [0.0, 0.2, 0.5] thresholds for index selection.
 */
export function weightsToThresholds(selectedIds: BackgroundId[], weights: Record<BackgroundId, number>) {
  const thresholds: number[] = [];
  let acc = 0;
  for (const id of selectedIds) {
    thresholds.push(acc / 100);
    acc += clampPercent(weights[id] ?? 0);
  }
  // ensure sorted and within 0..1
  return thresholds.map((t) => Math.max(0, Math.min(1, t)));
}
