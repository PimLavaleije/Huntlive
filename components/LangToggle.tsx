'use client'
import { useLanguage } from '@/contexts/LanguageContext'

export function LangToggle() {
  const { lang, setLang } = useLanguage()
  return (
    <div className="flex rounded-lg overflow-hidden" style={{ border: '1px solid #1a2540' }}>
      {(['nl', 'en'] as const).map((l) => (
        <button
          key={l}
          onClick={() => setLang(l)}
          className="px-3 py-1.5 text-xs font-bold tracking-widest transition-colors uppercase"
          style={lang === l
            ? { background: 'linear-gradient(135deg,#1e3a8a,#2563eb)', color: '#fff' }
            : { background: '#0d1018', color: '#6b7280' }}
        >
          {l}
        </button>
      ))}
    </div>
  )
}
