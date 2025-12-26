// lib/filters.ts
// Utilitários de filtros via URL (query params) usados na Home e em /categorias.
//
// [SPRINT-A]
// - Implementa filtros V1 (categoria/macro) com query params estáveis
// - Ajuda a manter comportamento determinístico ao alternar filtros


export function parseIntSafe(v: string | null): number | null {
  if (v == null) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

export function parseCsvIntList(v: string | null): number[] {
  if (!v) return [];
  return v
    .split(',')
    .map((x) => Number(x.trim()))
    .filter((n) => Number.isFinite(n));
}

export function serializeCsvIntList(list: number[]): string {
  return list.join(',');
}

export function toggleIntInList(list: number[], value: number): number[] {
  const s = new Set(list);
  if (s.has(value)) s.delete(value);
  else s.add(value);
  return Array.from(s.values()).sort((a, b) => a - b);
}
