// components/AboutSection.tsx
'use client';

import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ui } from '@/lib/lang';
import { useLang } from '@/lib/useLang';

export default function AboutSection() {
  const { lang } = useLang();

  return (
    <section id="sobre" className="relative py-20 px-4">
      <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-[1.2fr_1fr] gap-10 items-center">
        <div>
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">{ui(lang, 'aboutTitle') as string}</h2>
          <p className="text-white/80 leading-relaxed mb-4">{ui(lang, 'aboutP1') as string}</p>
          <p className="text-white/70 leading-relaxed mb-4">{ui(lang, 'aboutP2') as string}</p>
          <p className="text-white/60 text-sm">{ui(lang, 'aboutP3') as string}</p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.9 }}
          whileInView={{ opacity: 1, y: 0, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="flex flex-col items-center gap-4"
        >
          {/* FOTO ÚNICA (clicável) */}
          <Link href="https://instagram.com/fellipe" target="_blank" rel="noreferrer" className="block">
            <div className="relative w-40 h-40 rounded-full overflow-hidden border-4 border-purple-500/70 shadow-xl">
              <Image
                src="/images/fellipe.jpg"
                alt={ui(lang, 'creatorAlt') as string}
                fill
                className="object-cover"
                sizes="160px"
              />
            </div>
          </Link>

          {/* TEXTO ABAIXO */}
          <div className="text-center">
            <p className="text-white font-semibold text-lg">Fellipe</p>
            <p className="text-white/60 text-sm">{ui(lang, 'creatorBio') as string}</p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

/*
Changes Summary
- [FIX] Remove duplicação (duas fotos) e mantém apenas a foto clicável.
- [UX] Texto permanece abaixo da foto (layout original).
*/
