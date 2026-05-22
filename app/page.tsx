'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

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
      <div className="flex flex-col items-center px-5 pt-12 pb-2 text-center">
        <LogoSVG />
        <h1 className="mt-5 font-black tracking-[0.1em]" style={{ fontSize: '3rem', lineHeight: 1 }}>
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
        <MapIllustration />
      </div>

      {/* ── FEATURE CARDS ── */}
      <div className="grid grid-cols-3 gap-3 px-4" style={{ marginTop: -8 }}>

        <div className="flex flex-col items-center text-center px-2 py-4 rounded-2xl" style={{ background: '#0e1425', border: '1px solid #1a2540' }}>
          <RunnerIcon />
          <span className="mt-2 font-black tracking-wide" style={{ fontSize: '0.65rem', color: '#f97316', lineHeight: 1.2 }}>VOORSPRONG</span>
          <span className="mt-1.5 leading-tight" style={{ fontSize: '0.65rem', color: '#9ca3af' }}>Boef pakt een vluchtvlucht</span>
        </div>

        <div className="flex flex-col items-center text-center px-2 py-4 rounded-2xl" style={{ background: '#0e1425', border: '1px solid #1a2540' }}>
          <PinIcon />
          <span className="mt-2 font-black tracking-wide" style={{ fontSize: '0.65rem', color: '#3b82f6', lineHeight: 1.2 }}>GPS PINGS</span>
          <span className="mt-1.5 leading-tight" style={{ fontSize: '0.65rem', color: '#9ca3af' }}>Jagers krijgen locatie-updates</span>
        </div>

        <div className="flex flex-col items-center text-center px-2 py-4 rounded-2xl" style={{ background: '#0e1425', border: '1px solid #1a2540' }}>
          <TrophyIcon />
          <span className="mt-2 font-black tracking-wide" style={{ fontSize: '0.65rem', color: '#22c55e', lineHeight: 1.2 }}>WIN OF{'\n'}ONTSNAP</span>
          <span className="mt-1.5 leading-tight" style={{ fontSize: '0.65rem', color: '#9ca3af' }}>Vang of overleef de tijd</span>
        </div>

      </div>

      {/* ── CTA ── */}
      <div className="px-4 mt-6">
        <button
          onClick={() => router.push('/create')}
          className="w-full flex items-center justify-center gap-3 rounded-2xl font-black tracking-widest text-white transition-transform active:scale-[0.98]"
          style={{
            padding: '1rem 1.5rem',
            fontSize: '0.95rem',
            background: 'linear-gradient(135deg, #1e3a8a 0%, #2563eb 50%, #1d4ed8 100%)',
            boxShadow: '0 0 40px rgba(37,99,235,0.5), inset 0 1px 0 rgba(255,255,255,0.08)',
          }}
        >
          NIEUW SPEL AANMAKEN <span style={{ fontSize: '1.2rem', lineHeight: 1 }}>→</span>
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
          <input
            value={code}
            onChange={(e) => { setCode(e.target.value.toUpperCase()); setError('') }}
            onKeyDown={(e) => e.key === 'Enter' && handleJoin()}
            placeholder="GAMECODE (BIJV. AB12CD)"
            maxLength={6}
            className="flex-1 font-mono tracking-widest text-white placeholder-gray-600 focus:outline-none focus:border-blue-600 transition-colors"
            style={{
              background: '#0b1120',
              border: '1px solid #1e2d45',
              borderRadius: '0.75rem',
              padding: '0.875rem 1rem',
              fontSize: '0.8rem',
            }}
          />
          <button
            onClick={handleJoin}
            className="font-black tracking-widest text-white transition-transform active:scale-95"
            style={{
              background: '#2563eb',
              borderRadius: '0.75rem',
              padding: '0.875rem 1.25rem',
              fontSize: '0.8rem',
              boxShadow: '0 0 20px rgba(37,99,235,0.45)',
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

/* ── LOGO ── */
function LogoSVG() {
  return (
    <svg width="120" height="120" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <clipPath id="cz-left"><rect x="0" y="0" width="50" height="100" /></clipPath>
        <clipPath id="cz-right"><rect x="50" y="0" width="50" height="100" /></clipPath>
        <radialGradient id="gz-red" cx="35%" cy="45%" r="60%">
          <stop offset="0%" stopColor="#ef4444" stopOpacity="0.25" />
          <stop offset="100%" stopColor="#ef4444" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="gz-blue" cx="65%" cy="45%" r="60%">
          <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.25" />
          <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Ambient glow */}
      <circle cx="35" cy="48" r="38" fill="url(#gz-red)" />
      <circle cx="65" cy="48" r="38" fill="url(#gz-blue)" />

      {/* Outer ring */}
      <circle cx="50" cy="50" r="44" stroke="#1e3a5f" strokeWidth="1.5" />

      {/* Crosshair arms */}
      <line x1="1" y1="50" x2="6" y2="50" stroke="#1e3a5f" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="94" y1="50" x2="99" y2="50" stroke="#1e3a5f" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="50" y1="1" x2="50" y2="6" stroke="#1e3a5f" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="50" y1="94" x2="50" y2="99" stroke="#1e3a5f" strokeWidth="1.5" strokeLinecap="round" />

      {/* Diagonal tick marks */}
      <line x1="76" y1="20" x2="73" y2="23" stroke="#1e3a5f" strokeWidth="1" />
      <line x1="76" y1="80" x2="73" y2="77" stroke="#1e3a5f" strokeWidth="1" />
      <line x1="24" y1="20" x2="27" y2="23" stroke="#1e3a5f" strokeWidth="1" />
      <line x1="24" y1="80" x2="27" y2="77" stroke="#1e3a5f" strokeWidth="1" />

      {/* Helmet — left (red) */}
      <g clipPath="url(#cz-left)">
        <path
          d="M50,13 C43,13 35,18 30,27 L26,40 L24,54 C24,65 28,73 35,79 L39,83 C43,86 47,88 50,88 Z"
          fill="#c0392b"
        />
        <path
          d="M50,13 C43,13 35,18 30,27 L26,40 L24,54 C24,65 28,73 35,79 L39,83 C43,86 47,88 50,88 Z"
          fill="url(#gz-red)"
        />
        {/* Left visor */}
        <path d="M50,30 L44,46 L44,72 L50,75 Z" fill="#080c1a" opacity="0.85" />
        {/* Edge highlight */}
        <line x1="50" y1="13" x2="50" y2="88" stroke="#ef4444" strokeWidth="0.5" opacity="0.4" />
      </g>

      {/* Helmet — right (blue) */}
      <g clipPath="url(#cz-right)">
        <path
          d="M50,13 C57,13 65,18 70,27 L74,40 L76,54 C76,65 72,73 65,79 L61,83 C57,86 53,88 50,88 Z"
          fill="#1d4ed8"
        />
        <path
          d="M50,13 C57,13 65,18 70,27 L74,40 L76,54 C76,65 72,73 65,79 L61,83 C57,86 53,88 50,88 Z"
          fill="url(#gz-blue)"
        />
        {/* Right visor */}
        <path d="M50,30 L56,46 L56,72 L50,75 Z" fill="#080c1a" opacity="0.85" />
        {/* Edge highlight */}
        <line x1="50" y1="13" x2="50" y2="88" stroke="#3b82f6" strokeWidth="0.5" opacity="0.4" />
      </g>

      {/* Center divider */}
      <line x1="50" y1="13" x2="50" y2="88" stroke="#080c1a" strokeWidth="2.5" />

      {/* Sparkles */}
      <circle cx="28" cy="17" r="1.5" fill="#ef4444" opacity="0.7" />
      <circle cx="73" cy="14" r="1" fill="#3b82f6" opacity="0.7" />
      <circle cx="82" cy="29" r="1.2" fill="#60a5fa" opacity="0.5" />
      <circle cx="19" cy="35" r="1" fill="#f87171" opacity="0.4" />
    </svg>
  )
}

/* ── MAP ILLUSTRATION ── */
function MapIllustration() {
  return (
    <svg viewBox="0 0 375 210" className="w-full h-full" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
      <rect width="375" height="210" fill="#080c1a" />

      {/* City grid */}
      {[35, 75, 115, 155, 190].map((y) => (
        <line key={`h${y}`} x1="0" y1={y} x2="375" y2={y} stroke="#0d1f35" strokeWidth="0.8" />
      ))}
      {[45, 95, 150, 205, 265, 315].map((x) => (
        <line key={`v${x}`} x1={x} y1="0" x2={x} y2="210" stroke="#0d1f35" strokeWidth="0.8" />
      ))}
      {/* Diagonal roads */}
      <line x1="0"   y1="60"  x2="190" y2="210" stroke="#0d1f35" strokeWidth="0.8" />
      <line x1="70"  y1="0"   x2="260" y2="210" stroke="#0d1f35" strokeWidth="0.8" />
      <line x1="290" y1="0"   x2="160" y2="210" stroke="#0d1f35" strokeWidth="0.8" />
      <line x1="375" y1="40"  x2="210" y2="210" stroke="#0d1f35" strokeWidth="0.8" />

      {/* Fugitive sonar — right side */}
      <polygon points="305,100 100,25 100,175" fill="#1e40af" opacity="0.07" />
      <circle cx="305" cy="100" r="80" fill="none" stroke="#1d4ed8" strokeWidth="0.8" opacity="0.15" />
      <circle cx="305" cy="100" r="58" fill="none" stroke="#2563eb" strokeWidth="1"   opacity="0.28" />
      <circle cx="305" cy="100" r="36" fill="none" stroke="#3b82f6" strokeWidth="1.5" opacity="0.5"  />
      <circle cx="305" cy="100" r="16" fill="none" stroke="#60a5fa" strokeWidth="2"   opacity="0.75" />
      <circle cx="305" cy="100" r="5.5" fill="#3b82f6" />
      <circle cx="305" cy="100" r="9"   fill="none" stroke="#93c5fd" strokeWidth="1.5" opacity="0.9" />

      {/* Hunter crosshairs — left/center */}
      <CrosshairSVG cx={92}  cy={62}  r={14} />
      <CrosshairSVG cx={190} cy={108} r={11} />
      <CrosshairSVG cx={72}  cy={152} r={16} />
    </svg>
  )
}

function CrosshairSVG({ cx, cy, r }: { cx: number; cy: number; r: number }) {
  const ext = r + 7
  return (
    <g>
      <circle cx={cx} cy={cy} r={r}   fill="none" stroke="#ef4444" strokeWidth="1.5" />
      <circle cx={cx} cy={cy} r={3.5} fill="#ef4444" />
      <line x1={cx - ext} y1={cy} x2={cx - r - 2} y2={cy} stroke="#ef4444" strokeWidth="1.5" strokeLinecap="round" />
      <line x1={cx + r + 2} y1={cy} x2={cx + ext} y2={cy} stroke="#ef4444" strokeWidth="1.5" strokeLinecap="round" />
      <line x1={cx} y1={cy - ext} x2={cx} y2={cy - r - 2} stroke="#ef4444" strokeWidth="1.5" strokeLinecap="round" />
      <line x1={cx} y1={cy + r + 2} x2={cx} y2={cy + ext} stroke="#ef4444" strokeWidth="1.5" strokeLinecap="round" />
    </g>
  )
}

/* ── CARD ICONS ── */
function RunnerIcon() {
  return (
    <svg width="36" height="36" viewBox="0 0 24 24" fill="none">
      <circle cx="14" cy="4" r="2" fill="#f97316" />
      <path d="M6 20L9 14L12 16L15 10L19 12" stroke="#f97316" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <path d="M9.5 9L12 7L15 8.5L13 13L10 11Z" fill="#f97316" opacity="0.8" />
    </svg>
  )
}

function PinIcon() {
  return (
    <svg width="36" height="36" viewBox="0 0 24 24" fill="none">
      <path d="M12 2C8.69 2 6 4.69 6 8c0 5.25 6 13 6 13s6-7.75 6-13c0-3.31-2.69-6-6-6z" fill="#ec4899" />
      <circle cx="12" cy="8" r="2.5" fill="#080c1a" />
    </svg>
  )
}

function TrophyIcon() {
  return (
    <svg width="36" height="36" viewBox="0 0 24 24" fill="none">
      <path d="M8 21h8M12 17v4M7 4H5C4 4 3 5 3 7c0 3 2 5 4 5.5M17 4h2c1 0 2 1 2 3c0 3-2 5-4 5.5" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" fill="none" />
      <path d="M7 4h10v7a5 5 0 01-10 0V4z" fill="#22c55e" />
    </svg>
  )
}
