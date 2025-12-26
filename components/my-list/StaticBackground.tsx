//components/StaticBackground.tsx
'use client';

import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import RotatingGlobe from '@/components/RotatingGlobe';
import { useEffect, useMemo, useRef, useState } from 'react';

import { BACKGROUNDS } from '@/lib/personalization/catalog';
import { usePersonalization } from '@/contexts/PersonalizationContext';

type StaticBackgroundProps = {
  /** Intervalo base para troca de fundo (ms) */
  changeInterval?: number;
  /** Se deve mostrar o globo ocasionalmente */
  showGlobe?: boolean;
};

/**
 * Fundo “estático” (troca por tempo).
 * Usado em páginas como Perfil / Minha Lista.
 * Ele respeita os fundos selecionados pelo usuário; a lógica de tempo avançada (pesos)
 * fica para uma fase futura (quando você quiser).
 */
export default function StaticBackground({
  changeInterval = 15000,
  showGlobe = true,
}: StaticBackgroundProps) {
  const { state } = usePersonalization();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [globeVisible, setGlobeVisible] = useState(false);

  const selectedBackgrounds = useMemo(() => {
    const ids = state.background.selectedIds.length
      ? state.background.selectedIds
      : BACKGROUNDS.slice(0, 6).map((b) => b.id);
    const list = ids.map((id) => BACKGROUNDS.find((b) => b.id === id)).filter(Boolean);
    return list.length ? (list as typeof BACKGROUNDS) : BACKGROUNDS.slice(0, 6);
  }, [state.background.selectedIds]);

  // Rotacionar fundos de tempos em tempos
  useEffect(() => {
    if (selectedBackgrounds.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % selectedBackgrounds.length);
    }, changeInterval);

    return () => clearInterval(interval);
  }, [changeInterval, selectedBackgrounds.length]);

  // Mostrar globo ocasionalmente (mantém a vibe original)
  const hideTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!showGlobe) return;
    if (!state.globe.enabled) return;

    const showGlobeInterval = setInterval(() => {
      if (Math.random() < 0.3) {
        setGlobeVisible(true);

        const hideAfter = 8000 + Math.random() * 4000;
        if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);

        hideTimeoutRef.current = setTimeout(() => {
          setGlobeVisible(false);
        }, hideAfter);
      }
    }, 10000);

    return () => {
      clearInterval(showGlobeInterval);
      if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
    };
  }, [showGlobe, state.globe.enabled]);

  return (
    <>
      {/* Fundos rotativos */}
      <div className="fixed inset-0 -z-30">
        {selectedBackgrounds.map((bg, index) => {
          const isActive = index === currentIndex;

          return (
            <motion.div
              key={bg.id}
              className="absolute inset-0"
              initial={{ opacity: index === 0 ? 1 : 0 }}
              animate={{ opacity: isActive ? 1 : 0, zIndex: isActive ? 2 : 0 }}
              transition={{ duration: 0.7, ease: 'easeInOut' }}
            >
              <Image
                src={bg.src}
                alt={bg.alt ?? bg.label}
                fill
                priority={index === 0}
                className="object-cover brightness-[0.9]"
              />
              <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-black/25 to-black/50" />
            </motion.div>
          );
        })}

        {/* Overlay global (controlado por tema) */}
        <div className="absolute inset-0 dn-bg-overlay pointer-events-none" />
      </div>

      {/* Globo ocasional */}
      <AnimatePresence>
        {globeVisible ? (
          <motion.div
            key="globe"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6, ease: 'easeInOut' }}
            className="fixed inset-0 -z-20"
          >
            <RotatingGlobe />
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  );
}
