// lib/useLang.ts
// Hook client-side para ler/sincronizar idioma via URL (?lang=pt|en)
// com fallback no localStorage.

'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

import { LANG_KEY, type Lang, getLangFromSearchParams, isLang, normalizeLang, setLangInUrl } from '@/lib/lang';

export function useLang() {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();

  const urlLang = useMemo(() => getLangFromSearchParams(sp), [sp]);

  const [lang, setLangState] = useState<Lang>(() => urlLang ?? 'pt');

  // Sincroniza estado com URL / localStorage
  useEffect(() => {
    // 1) URL vence (link compartilhável)
    if (urlLang) {
      setLangState(urlLang);
      try {
        localStorage.setItem(LANG_KEY, urlLang);
      } catch {}
      return;
    }

    // 2) Fallback localStorage
    let stored: Lang | null = null;
    try {
      const v = localStorage.getItem(LANG_KEY);
      if (isLang(v)) stored = v;
    } catch {}

    if (stored && stored !== lang) {
      setLangState(stored);
    }

    // 3) Se não tem lang na URL, aplica o stored na URL (preserva query)
    if (stored) {
      const nextUrl = setLangInUrl(pathname, new URLSearchParams(sp.toString()), stored);
      router.replace(nextUrl, { scroll: false });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [urlLang]);

  // Ajusta <html lang="...">
  useEffect(() => {
    try {
      const html = document.documentElement;
      html.setAttribute('lang', lang === 'en' ? 'en' : 'pt-BR');
    } catch {}
  }, [lang]);

  const setLang = useCallback(
    (next: Lang) => {
      const normalized = normalizeLang(next);
      setLangState(normalized);

      try {
        localStorage.setItem(LANG_KEY, normalized);
      } catch {}

      const nextUrl = setLangInUrl(pathname, new URLSearchParams(sp.toString()), normalized);
      router.replace(nextUrl, { scroll: false });
    },
    [pathname, router, sp]
  );

  const toggleLang = useCallback(() => {
    setLang(lang === 'pt' ? 'en' : 'pt');
  }, [lang, setLang]);

  return { lang, setLang, toggleLang };
}
