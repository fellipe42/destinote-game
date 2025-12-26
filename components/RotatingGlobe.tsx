'use client';

import { motion, useScroll, useTransform } from 'framer-motion';
import Image from 'next/image';
import { useEffect, useMemo, useState } from 'react';

import { usePersonalization } from '@/contexts/PersonalizationContext';
import { getGlobeById } from '@/lib/personalization/catalog';
import { isVisibleAt } from '@/lib/personalization/segments';

export default function RotatingGlobe() {
  const { scrollYProgress } = useScroll();
  const { state } = usePersonalization();

  const globeCfg = state.globe;
  const isDark = state.theme === 'dark';

  const globe = useMemo(() => {
    const g = getGlobeById(globeCfg.globeId);
    if (!g || (g as any).comingSoon) return getGlobeById('earth');
    return g;
  }, [globeCfg.globeId]);

  // base "breathing" scale + user scale
  const baseScale = useTransform(scrollYProgress, [0, 0.15, 0.6, 1], [0.9, 1.0, 1.05, 1.03]);
  const scale = useTransform(baseScale, (v) => v * globeCfg.scale);

  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const unsub = scrollYProgress.on('change', (v) => {
      const ok = globeCfg.enabled && isVisibleAt(v, globeCfg.visibilitySegments);
      setVisible(ok);
    });
    return () => unsub();
  }, [scrollYProgress, globeCfg.enabled, globeCfg.visibilitySegments]);

  return (
    <motion.div
      className="fixed inset-0 -z-10 flex items-center justify-center pointer-events-none"
      animate={{ opacity: visible ? 1 : 0 }}
      transition={{ duration: 0.35, ease: 'easeInOut' }}
    >
      <motion.div
        style={{ scale }}
        animate={{ rotate: 360 }}
        transition={{ duration: globeCfg.rotationSeconds, repeat: Infinity, ease: 'linear' }}
        className="relative w-[52vw] h-[52vw] max-w-[640px] max-h-[640px]"
      >
        <Image
          src={globe?.src ?? '/images/globe-earth.png'}
          alt={globe?.label ?? 'Globo'}
          fill
          priority
          className="object-contain opacity-85"
          style={{
            filter: `brightness(${globeCfg.brightness})`,
          }}
        />
      </motion.div>
    </motion.div>
  );
}
