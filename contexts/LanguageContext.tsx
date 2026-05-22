'use client'
import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { translations, tr } from '@/lib/i18n'
import type { Lang, TranslationKey } from '@/lib/i18n'

interface LanguageContextValue {
  lang: Lang
  setLang: (l: Lang) => void
  t: (key: TranslationKey, replacements?: Record<string, string | number>) => string
}

const LanguageContext = createContext<LanguageContextValue | null>(null)

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>('nl')

  useEffect(() => {
    const saved = localStorage.getItem('chase_lang') as Lang | null
    if (saved === 'nl' || saved === 'en') setLangState(saved)
  }, [])

  const setLang = useCallback((l: Lang) => {
    setLangState(l)
    localStorage.setItem('chase_lang', l)
  }, [])

  const t = useCallback(
    (key: TranslationKey, replacements?: Record<string, string | number>) =>
      tr(lang, key, replacements),
    [lang]
  )

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const ctx = useContext(LanguageContext)
  if (!ctx) throw new Error('useLanguage must be used within LanguageProvider')
  return ctx
}

export type { Lang, TranslationKey }
