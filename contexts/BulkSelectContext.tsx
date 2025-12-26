'use client';

import React, { createContext, useContext, useMemo, useState } from 'react';

type StartArgs = {
  limit: number | null;
  currentCount: number;
  accessLevel?: string;
};

type BulkContextType = {
  active: boolean;
  selectedIds: number[];
  limit: number | null;
  currentCount: number;
  accessLevel: string;

  isSubmitting: boolean;
  error: string | null;

  startBulkMode: (args: StartArgs) => void;
  stopBulkMode: () => void;

  toggleSelected: (goalId: number) => void;
  isSelected: (goalId: number) => boolean;
  wouldHitLimit: (goalId: number) => boolean;

  submitAddSelected: () => Promise<void>;
};

const BulkSelectContext = createContext<BulkContextType | null>(null);

export function BulkSelectProvider({ children }: { children: React.ReactNode }) {
  const [active, setActive] = useState(false);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [limit, setLimit] = useState<number | null>(null);
  const [currentCount, setCurrentCount] = useState(0);
  const [accessLevel, setAccessLevel] = useState('public');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const startBulkMode = (args: StartArgs) => {
    setError(null);
    setSelectedIds([]);
    setLimit(args.limit ?? null);
    setCurrentCount(args.currentCount ?? 0);
    setAccessLevel(args.accessLevel ?? 'public');
    setActive(true);
  };

  const stopBulkMode = () => {
    setActive(false);
    setSelectedIds([]);
    setError(null);
    setIsSubmitting(false);
  };

  const isSelected = (goalId: number) => selectedIds.includes(goalId);

  const wouldHitLimit = (goalId: number) => {
    if (!active) return false;
    if (limit === null) return false;
    if (isSelected(goalId)) return false;
    return currentCount + selectedIds.length >= limit;
  };

  const toggleSelected = (goalId: number) => {
    setError(null);
    setSelectedIds((prev) => {
      const on = prev.includes(goalId);
      if (on) return prev.filter((x) => x !== goalId);

      if (limit !== null && currentCount + prev.length >= limit) {
        return prev; // bloqueia
      }
      return [...prev, goalId];
    });
  };

  const submitAddSelected = async () => {
    if (!active) return;
    if (selectedIds.length === 0) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetch('/api/user/bulk-add-to-list', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ goalIds: selectedIds }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok || !data?.success) {
        if (data?.code === 'LIMIT_REACHED') {
          setError('Você atingiu o limite do seu plano. Faça upgrade para adicionar mais.');
          return;
        }
        if (data?.code === 'PLAN_NOT_ALLOWED') {
          setError('Seu plano não permite criar lista. Faça upgrade para começar.');
          return;
        }
        throw new Error(data?.error || 'Falha ao adicionar em lote');
      }

      const added = typeof data.added === 'number' ? data.added : 0;
      setCurrentCount((prev) => prev + added);

      window.dispatchEvent(new Event('destinote:list-changed'));

      // ✅ comportamento que você pediu: adicionou → some a barra
      stopBulkMode();
    } catch (e: any) {
      console.error(e);
      setError(e?.message || 'Erro interno ao adicionar em lote');
    } finally {
      setIsSubmitting(false);
    }
  };

  const value = useMemo<BulkContextType>(
    () => ({
      active,
      selectedIds,
      limit,
      currentCount,
      accessLevel,

      isSubmitting,
      error,

      startBulkMode,
      stopBulkMode,

      toggleSelected,
      isSelected,
      wouldHitLimit,

      submitAddSelected,
    }),
    [active, selectedIds, limit, currentCount, accessLevel, isSubmitting, error],
  );

  return <BulkSelectContext.Provider value={value}>{children}</BulkSelectContext.Provider>;
}

export function useBulkSelect() {
  const ctx = useContext(BulkSelectContext);
  if (!ctx) throw new Error('useBulkSelect must be used within BulkSelectProvider');
  return ctx;
}
