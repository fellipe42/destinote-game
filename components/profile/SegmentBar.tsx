// components/profile/SegmentBar.tsx
'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { paintSegments } from '@/lib/personalization/segments';

type Props = {
  segments: boolean[];
  onChange: (next: boolean[]) => void;
  labelOn?: string;
  labelOff?: string;
};

export default function SegmentBar({
  segments,
  onChange,
  labelOn = 'Aparece',
  labelOff = 'Some',
}: Props) {
  const [drag, setDrag] = useState<{ active: boolean; start: number; value: boolean } | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const count = segments.length;

  const handleDown = useCallback(
    (idx: number) => {
      const value = !segments[idx];
      setDrag({ active: true, start: idx, value });
      onChange(paintSegments(segments, idx, idx, value));
    },
    [segments, onChange]
  );

  const handleEnter = useCallback(
    (idx: number) => {
      if (!drag?.active) return;
      onChange(paintSegments(segments, drag.start, idx, drag.value));
    },
    [drag, segments, onChange]
  );

  useEffect(() => {
    const onUp = () => setDrag(null);
    window.addEventListener('mouseup', onUp);
    return () => window.removeEventListener('mouseup', onUp);
  }, []);

  const onCount = useMemo(() => segments.filter(Boolean).length, [segments]);
  const pct = useMemo(() => Math.round((onCount / Math.max(1, count)) * 100), [onCount, count]);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs text-white/70">
        <span>
          {labelOn}: <span className="text-white/90 font-semibold">{pct}%</span>
        </span>
        <span className="text-white/50">{labelOff}: {100 - pct}%</span>
      </div>

      <div
        ref={containerRef}
        className="grid gap-[3px]"
        style={{ gridTemplateColumns: `repeat(${count}, minmax(0, 1fr))` }}
      >
        {segments.map((on, idx) => (
          <div
            key={idx}
            onMouseDown={() => handleDown(idx)}
            onMouseEnter={() => handleEnter(idx)}
            className={[
              'h-3 rounded-[4px] border',
              'cursor-pointer select-none',
              on
                ? 'bg-white/80 border-white/30'
                : 'bg-black/30 border-white/10 hover:bg-black/45',
            ].join(' ')}
            title={`${idx + 1}/${count}`}
          />
        ))}
      </div>

      <p className="text-[11px] text-white/45 leading-snug">
        Clique e arraste para “pintar” onde o globo aparece ao rolar a página.
      </p>
    </div>
  );
}
