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
    <main className="min-h-svh flex flex-col" style={{ background: '#080c1a', color: '#fff' }}>

      {/* ── HERO ── */}
      <div className="flex flex-col items-center px-5 pt-10 pb-2 text-center">
        <Image src="/logo.png" alt="Chase Zone logo" width={160} height={160} className="object-contain" priority />
        <h1 className="mt-4 font-black tracking-[0.1em]" style={{ fontSize: '3rem', lineHeight: 1 }}>
          <span style={{ color: '#ef4444' }}>CHASE</span>{' '}
          <span style={{ color: '#3b82f6' }}>ZONE</span>
        </h1>
        <p className="mt-3 tracking-[0.22em] uppercase" style={{ fontSize: '0.65rem', color: '#6b7280' }}>
          De <span style={{ color: '#f97316', fontWeight: 700 }}>jacht</span> is echt. Jij bent het{' '}
          <span style={{ color: '#60a5fa', fontWeight: 700 }}>doel</span>.
        </p>
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

        <div className="flex flex-col items-center text-center px-1.5 pt-4 pb-3 rounded-2xl" style={{ background: '#0d1018', border: '1px solid #2a1a1a' }}>
          <div className="h-[72px] flex items-center justify-center">
            <Image src="/advantage.png" alt="Voorsprong" width={72} height={72} className="object-contain max-h-[72px]" />
          </div>
          <span className="mt-2 font-black tracking-wider uppercase" style={{ fontSize: '0.62rem', color: '#ef4444', lineHeight: 1.2 }}>VOORSPRONG</span>
          <span className="mt-1 leading-tight uppercase" style={{ fontSize: '0.55rem', color: '#9ca3af' }}>Boef pakt een vluchtvlucht</span>
        </div>

        <div className="flex flex-col items-center text-center px-1.5 pt-4 pb-3 rounded-2xl" style={{ background: '#0d1018', border: '1px solid #0f1e35' }}>
          <div className="h-[72px] flex items-center justify-center">
            <Image src="/icon-gps.png" alt="GPS Pings" width={72} height={72} className="object-contain max-h-[72px]" />
          </div>
          <span className="mt-2 font-black tracking-wider uppercase" style={{ fontSize: '0.62rem', color: '#3b82f6', lineHeight: 1.2 }}>GPS PINGS</span>
          <span className="mt-1 leading-tight uppercase" style={{ fontSize: '0.55rem', color: '#9ca3af' }}>Jagers krijgen locatie-updates</span>
        </div>

        <div className="flex flex-col items-center text-center px-1.5 pt-4 pb-3 rounded-2xl" style={{ background: '#0d1018', border: '1px solid #0f2018' }}>
          <div className="h-[72px] flex items-center justify-center">
            <Image src="/icon-trophy.png" alt="Win of Ontsnap" width={72} height={72} className="object-contain max-h-[72px]" />
          </div>
          <span className="mt-2 font-black tracking-wider uppercase" style={{ fontSize: '0.62rem', color: '#22c55e', lineHeight: 1.2 }}>WIN OF ONTSNAP</span>
          <span className="mt-1 leading-tight uppercase" style={{ fontSize: '0.55rem', color: '#9ca3af' }}>Vang of overleef de tijd</span>
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
