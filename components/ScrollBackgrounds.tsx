'use client';

import { useEffect, useMemo, useState } from 'react';
import { motion, useScroll } from 'framer-motion';
import Image from 'next/image';

import { BACKGROUNDS } from '@/lib/personalization/catalog';
import { usePersonalization } from '@/contexts/PersonalizationContext';
import { weightsToThresholds } from '@/lib/personalization/weights';

export default function ScrollBackgrounds() {
  const { scrollYProgress } = useScroll();
  const { state } = usePersonalization();

  const selectedBackgrounds = useMemo(() => {
    const ids = state.background.selectedIds.length
      ? state.background.selectedIds
      : BACKGROUNDS.slice(0, 6).map((b) => b.id);

    const list = ids
      .map((id) => BACKGROUNDS.find((b) => b.id === id))
      .filter(Boolean);

    // fallback if someone cleared everything and catalog is empty (paranoia)
    return list.length ? (list as typeof BACKGROUNDS) : BACKGROUNDS.slice(0, 6);
  }, [state.background.selectedIds]);

  const thresholds = useMemo(() => {
    const ids = selectedBackgrounds.map((b) => b.id);
    const w = state.background.weights;
    // if no weights yet for these ids, fallback to equal thresholds
    const any = ids.some((id) => typeof w[id] === 'number');
    if (!any) {
      return ids.map((_, i) => i / Math.max(1, ids.length));
    }
    return weightsToThresholds(ids, w);
  }, [selectedBackgrounds, state.background.weights]);

  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const unsub = scrollYProgress.on('change', (v) => {
      let idx = 0;
      for (let i = thresholds.length - 1; i >= 0; i--) {
        if (v >= thresholds[i]) {
          idx = i;
          break;
        }
      }
      setCurrentIndex((prev) => (prev === idx ? prev : idx));
    });

    return () => unsub();
  }, [scrollYProgress, thresholds]);

  return (
    <div className="fixed inset-0 -z-30">
      {selectedBackgrounds.map((bg, index) => {
        const isActive = index === currentIndex;

        return (
          <motion.div
            key={bg.id}
            className="absolute inset-0"
            initial={{ opacity: index === 0 ? 1 : 0 }}
            animate={{
              opacity: isActive ? 1 : 0,
              zIndex: isActive ? 2 : 0,
            }}
            transition={{ duration: 0.7, ease: 'easeInOut' }}
          >
            <Image
              src={bg.src}
              alt={bg.alt ?? bg.label}
              fill
              priority={index === 0}
              className="object-cover brightness-[0.9]"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black/5 via-black/20 to-black/40" />
          </motion.div>
        );
      })}

      {/* Overlay global (controlado por tema) */}
      <div className="absolute inset-0 dn-bg-overlay pointer-events-none" />
    </div>
  );
}
