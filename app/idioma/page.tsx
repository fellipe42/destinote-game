'use client';

// app/idioma/page.tsx
// [SPRINT-I18N] Preferência de idioma (PT/EN)
// - Salva no navegador
// - Reflete na URL via ?lang=
// - Aciona endpoints e UI localizados

import Link from 'next/link';

import Navbar from '@/components/Navbar';
import ScrollBackgrounds from '@/components/ScrollBackgrounds';
import RotatingGlobe from '@/components/RotatingGlobe';

import { addLangToHref, ui } from '@/lib/lang';
import { useLang } from '@/lib/useLang';

export default function IdiomaPage() {
  const { lang, setLang } = useLang();

  return (
    <div className="min-h-screen relative">
      <ScrollBackgrounds />
      <RotatingGlobe />
      <Navbar />

      <main className="relative pt-28 pb-20 px-4">
        <div className="max-w-2xl mx-auto">
          <header className="mb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-white">
              {ui(lang, 'languagePageTitle') as string}
            </h1>
            <p className="text-white/70 mt-2">
              {ui(lang, 'languagePageSubtitle') as string}
            </p>
          </header>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              className={`px-4 py-2 rounded-2xl border transition-colors backdrop-blur-md ${
                lang === 'pt'
                  ? 'border-white/25 bg-white/10 text-white'
                  : 'border-white/10 bg-black/25 text-white/70 hover:text-white hover:bg-white/10'
              }`}
              onClick={() => setLang('pt')}
            >
              {ui(lang, 'portuguese') as string}
            </button>

            <button
              type="button"
              className={`px-4 py-2 rounded-2xl border transition-colors backdrop-blur-md ${
                lang === 'en'
                  ? 'border-white/25 bg-white/10 text-white'
                  : 'border-white/10 bg-black/25 text-white/70 hover:text-white hover:bg-white/10'
              }`}
              onClick={() => setLang('en')}
            >
              {ui(lang, 'english') as string}
            </button>

            <Link
              href={addLangToHref('/', lang)}
              className="ml-auto px-4 py-2 rounded-2xl border border-white/10 bg-black/25 text-white/70 hover:text-white hover:bg-white/10 transition-colors backdrop-blur-md"
            >
              {ui(lang, 'backHome') as string}
            </Link>
          </div>

          <div className="mt-8 rounded-2xl border border-white/10 bg-black/25 backdrop-blur-md p-5 text-white/80">
            <div className="text-sm leading-relaxed space-y-2">
              <p>
                <span className="text-white font-semibold">TIP:</span>{' '}
                {lang === 'en'
                  ? 'You can also toggle language from the Navbar.'
                  : 'Você também pode alternar o idioma direto pela Navbar.'}
              </p>
              <p>
                {lang === 'en'
                  ? 'This setting affects UI text and API data (goal titles, categories, locations, etc.).'
                  : 'Essa configuração afeta textos da UI e dados da API (títulos, categorias, locais etc.).'}
              </p>
              <p className="text-white/60">
                {lang === 'en'
                  ? 'Under the hood, we keep it simple: ?lang=pt|en + localStorage.'
                  : 'Por baixo do capô, é simples: ?lang=pt|en + localStorage.'}
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
