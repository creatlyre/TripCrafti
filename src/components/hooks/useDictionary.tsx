import type { ReactNode } from 'react';

import React, { createContext, useContext, useState, useMemo } from 'react';

import { getDictionary, type Lang } from '@/lib/i18n';

interface DictionaryContextValue {
  lang: Lang;
  dict: ReturnType<typeof getDictionary>;
  setLang: (lang: Lang) => void;
}

const DictionaryContext = createContext<DictionaryContextValue | undefined>(undefined);

export const DictionaryProvider = ({ initialLang = 'pl', children }: { initialLang?: Lang; children: ReactNode }) => {
  const [lang, setLang] = useState<Lang>(initialLang);
  const dict = useMemo(() => getDictionary(lang), [lang]);
  const value = useMemo(() => ({ lang, dict, setLang }), [lang, dict]);
  return <DictionaryContext.Provider value={value}>{children}</DictionaryContext.Provider>;
};

export function useDictionary() {
  const ctx = useContext(DictionaryContext);
  if (!ctx) {
    // Fallback: attempt query param ?lang=, then global, else 'pl'
    let inferred: Lang | undefined;
    try {
      if (typeof window !== 'undefined') {
        const url = new URL(window.location.href);
        const qp = url.searchParams.get('lang');
        if (qp === 'pl' || qp === 'en') inferred = qp;
      }
    } catch {
      /* ignore */
    }
    if (!inferred) {
      const g = globalThis as Record<string, unknown>;
      const globalLang = g.__lang as Lang | undefined;
      inferred = globalLang;
    }
    return getDictionary(inferred || 'pl');
  }
  return ctx.dict;
}

export function useLang() {
  const ctx = useContext(DictionaryContext);
  if (!ctx) {
    let inferred: Lang | undefined;
    try {
      if (typeof window !== 'undefined') {
        const url = new URL(window.location.href);
        const qp = url.searchParams.get('lang');
        if (qp === 'pl' || qp === 'en') inferred = qp;
      }
    } catch {
      /* ignore */
    }
    if (!inferred) {
      const g = globalThis as Record<string, unknown>;
      inferred = g.__lang as Lang | undefined;
    }
    const lang: Lang = inferred || 'pl';
    const noop = () => void 0; // no-op setLang outside provider
    return { lang, setLang: noop };
  }
  return { lang: ctx.lang, setLang: ctx.setLang };
}
