'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'

export default function HomePage() {
  const router = useRouter()
  const [code, setCode] = useState('')
  const [error, setError] = useState('')

  const handleJoin = () => {
    const trimmed = code.trim().toUpperCase()
    if (!trimmed) { setError('Voer een gamecode in'); return }
    router.push(`/game/${trimmed}`)
  }

  return (
    <main className="min-h-svh flex flex-col" style={{ background: '#000000', color: '#fff' }}>

      {/* ── HERO ── */}
      <div className="flex flex-col items-center px-5 pt-6 pb-2 text-center">
        <Image src="/logo.png" alt="Chase Zone logo" width={280} height={280} className="object-contain w-full max-w-xs" priority />
      </div>

      {/* ── MAP ILLUSTRATION ── */}
      <div className="w-full overflow-hidden" style={{ height: 210 }}>
        <Image
          src="/map-bg.png"
          alt="Map"
          width={800}
          height={210}
          className="w-full h-full object-cover"
        />
      </div>

      {/* ── FEATURE CARDS ── */}
      <div className="grid grid-cols-3 gap-2 px-3" style={{ marginTop: -8 }}>

        <div className="flex items-center justify-center rounded-2xl overflow-hidden" style={{ background: '#0d1018', border: '1px solid #2a1a1a' }}>
          <Image src="/advantage.png" alt="Voorsprong" width={160} height={160} className="w-full h-auto object-contain" />
        </div>

        <div className="flex items-center justify-center rounded-2xl overflow-hidden" style={{ background: '#0d1018', border: '1px solid #0f1e35' }}>
          <Image src="/icon-gps.png" alt="GPS Pings" width={160} height={160} className="w-full h-auto object-contain" />
        </div>

        <div className="flex items-center justify-center rounded-2xl overflow-hidden" style={{ background: '#0d1018', border: '1px solid #0f2018' }}>
          <Image src="/icon-trophy.png" alt="Win of Ontsnap" width={160} height={160} className="w-full h-auto object-contain" />
        </div>

      </div>

      {/* ── CTA ── */}
      <div className="px-4 mt-6">
        <button
          onClick={() => router.push('/create')}
          className="w-full flex items-center justify-between rounded-xl font-black tracking-widest text-white transition-transform active:scale-[0.98]"
          style={{
            padding: '1.05rem 1.5rem',
            fontSize: '1rem',
            background: 'linear-gradient(135deg, #6b0000 0%, #b91c1c 45%, #991b1b 100%)',
            border: '1px solid #ef4444',
            boxShadow: '0 0 30px rgba(239,68,68,0.35), inset 0 1px 0 rgba(255,255,255,0.06)',
          }}
        >
          <span>NIEUW SPEL AANMAKEN</span>
          <span style={{ color: '#ef4444', fontSize: '1.4rem', lineHeight: 1, fontWeight: 900 }}>›</span>
        </button>
      </div>

      {/* ── JOIN ── */}
      <div className="px-4 mt-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="flex-1 h-px" style={{ background: '#1a2540' }} />
          <span className="tracking-widest uppercase" style={{ fontSize: '0.6rem', color: '#4b5563', whiteSpace: 'nowrap' }}>
            Of join een bestaand spel
          </span>
          <div className="flex-1 h-px" style={{ background: '#1a2540' }} />
        </div>
        <div className="flex gap-2">
          <div className="flex-1 flex items-center gap-2 px-3" style={{ background: '#0b1120', border: '1px solid #1e2d45', borderRadius: '0.75rem' }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0, opacity: 0.45 }}>
              <circle cx="12" cy="8" r="4" fill="#9ca3af"/>
              <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" fill="#9ca3af"/>
            </svg>
            <input
              value={code}
              onChange={(e) => { setCode(e.target.value.toUpperCase()); setError('') }}
              onKeyDown={(e) => e.key === 'Enter' && handleJoin()}
              placeholder="GAMECODE (BIJV. AB12CD)"
              maxLength={6}
              className="flex-1 bg-transparent font-mono tracking-widest text-white placeholder-gray-600 focus:outline-none py-3.5"
              style={{ fontSize: '0.78rem' }}
            />
          </div>
          <button
            onClick={handleJoin}
            className="font-black tracking-widest text-white transition-transform active:scale-95"
            style={{
              background: 'linear-gradient(135deg, #1e3a8a, #2563eb)',
              border: '1px solid #3b82f6',
              borderRadius: '0.75rem',
              padding: '0.875rem 1.25rem',
              fontSize: '0.82rem',
              boxShadow: '0 0 16px rgba(37,99,235,0.4)',
            }}
          >
            JOIN
          </button>
        </div>
        {error && <p className="text-red-400 mt-1.5 ml-1" style={{ fontSize: '0.75rem' }}>{error}</p>}
      </div>

      {/* ── FOOTER ── */}
      <div className="flex justify-around px-4 mt-auto py-8">
        <button className="flex items-center gap-1.5 tracking-widest uppercase transition-colors hover:text-gray-300" style={{ fontSize: '0.65rem', color: '#4b5563' }}>
          <span>⚙</span> Instellingen
        </button>
        <button className="flex items-center gap-1.5 tracking-widest uppercase transition-colors hover:text-gray-300" style={{ fontSize: '0.65rem', color: '#4b5563' }}>
          <span>ⓘ</span> Hoe het werkt
        </button>
      </div>
    </main>
  )
}
