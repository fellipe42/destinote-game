// lib/personalization/segments.ts
export const SEGMENT_COUNT = 50;

export function makeSegments(count: number, fn: (index: number) => boolean): boolean[] {
  return Array.from({ length: count }, (_, i) => !!fn(i));
}

export function clamp01(x: number) {
  if (Number.isNaN(x)) return 0;
  if (x < 0) return 0;
  if (x > 1) return 1;
  return x;
}

export function segmentIndex(progress01: number, count = SEGMENT_COUNT) {
  const v = clamp01(progress01);
  const idx = Math.floor(v * count);
  return Math.min(count - 1, Math.max(0, idx));
}

export function isVisibleAt(progress01: number, segments: boolean[], count = SEGMENT_COUNT) {
  if (!segments || segments.length === 0) return true;
  const c = segments.length;
  const idx = segmentIndex(progress01, c);
  return !!segments[idx];
}

export function toggleSegment(segments: boolean[], index: number, next?: boolean) {
  const out = segments.slice();
  if (index < 0 || index >= out.length) return out;
  out[index] = typeof next === 'boolean' ? next : !out[index];
  return out;
}

export function paintSegments(
  segments: boolean[],
  startIndex: number,
  endIndex: number,
  value: boolean
) {
  const out = segments.slice();
  const a = Math.min(startIndex, endIndex);
  const b = Math.max(startIndex, endIndex);
  for (let i = a; i <= b; i++) out[i] = value;
  return out;
}
