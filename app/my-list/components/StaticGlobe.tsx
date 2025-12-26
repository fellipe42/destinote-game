'use client';

import { useMemo } from 'react';
import { getGlobeById } from '@/lib/personalization/catalog';

type Props = {
  globeId: string | null | undefined;
  rotationDeg?: number;
  brightness?: number;
  scale?: number;
  className?: string;
};

export default function StaticGlobe({
  globeId,
  rotationDeg = 0,
  brightness = 1,
  scale = 1,
  className,
}: Props) {
  const globe = useMemo(() => {
    const g = globeId ? getGlobeById(globeId as any) : null;
    // fallback seguro
    return g ?? getGlobeById('earth');
  }, [globeId]);

  if (!globe) return null;

  return (
    <div
      className={['pointer-events-none select-none', className ?? ''].join(' ')}
      style={{
        transform: `rotate(${rotationDeg}deg) scale(${scale})`,
        filter: `brightness(${brightness})`,
      }}
    >
      {/* img simples (melhor pro html2canvas do export) */}
      <img
        src={globe.src}
        alt={globe.label ?? 'Globo'}
        className="block w-full h-full object-contain opacity-90"
        draggable={false}
      />
    </div>
  );
}
