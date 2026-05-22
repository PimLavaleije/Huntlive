'use client'
import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase-client'
import { haversineDistance } from '@/lib/distance'
import { useLanguage } from '@/contexts/LanguageContext'
import { LangToggle } from '@/components/LangToggle'
import type { Game, Player, Location } from '@/types'

interface CaptureEvent { id: string; hunter_player_id: string; confirmed: boolean; created_at: string }

export default function EndPage() {
  const router = useRouter()
  const params = useParams()
  const code = (params.code as string).toUpperCase()

  const [game, setGame] = useState<Game | null>(null)
  const [players, setPlayers] = useState<Player[]>([])
  const [allLocations, setAllLocations] = useState<Location[]>([])
  const [captures, setCaptures] = useState<CaptureEvent[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      const { data: g } = await supabase.from('games').select('*').eq('code', code).single()
      if (!g) { router.replace('/'); return }
      setGame(g)
      const [{ data: p }, { data: locs }, { data: caps }] = await Promise.all([
        supabase.from('players').select('*').eq('game_id', g.id).order('joined_at'),
        supabase.from('locations').select('*').eq('game_id', g.id).order('created_at', { ascending: true }),
        supabase.from('capture_events').select('*').eq('game_id', g.id),
      ])
      setPlayers(p ?? [])
      setAllLocations(locs ?? [])
      setCaptures(caps ?? [])
      setLoading(false)
    }
    load()
  }, [code, router])

  const { t } = useLanguage()

  if (loading || !game) {
    return <div className="min-h-svh" style={{ background: '#080c1a' }} />
  }

  const fugitiveWon = game.winner === 'fugitive'
  const huntersWon  = game.winner === 'hunters'
  const fugitives   = players.filter(p => p.role === 'fugitive')
  const hunters     = players.filter(p => p.role === 'hunter' || p.role === 'admin')
  const confirmedCaptures = captures.filter(e => e.confirmed)

  // Distance per player
  const byPlayer = new Map<string, Location[]>()
  allLocations.forEach(loc => {
    if (!byPlayer.has(loc.player_id)) byPlayer.set(loc.player_id, [])
    byPlayer.get(loc.player_id)!.push(loc)
  })
  const distByPlayer = new Map<string, number>()
  byPlayer.forEach((locs, pid) => {
    let d = 0
    for (let i = 1; i < locs.length; i++)
      d += haversineDistance(locs[i-1].latitude, locs[i-1].longitude, locs[i].latitude, locs[i].longitude)
    distByPlayer.set(pid, d)
  })

  // Captures per hunter
  const capsByHunter = new Map<string, number>()
  confirmedCaptures.forEach(e => capsByHunter.set(e.hunter_player_id, (capsByHunter.get(e.hunter_player_id) ?? 0) + 1))

  // Time remaining when hunters won
  const firstCap = confirmedCaptures[0]
  let timeLeft = '--:--'
  if (firstCap && game.ends_at) {
    const ms  = Math.max(0, new Date(game.ends_at).getTime() - new Date(firstCap.created_at).getTime())
    timeLeft  = `${String(Math.floor(ms / 60000)).padStart(2,'0')}:${String(Math.floor((ms % 60000)/1000)).padStart(2,'0')}`
  }

  const xp = fugitiveWon
    ? Math.round(500 + game.duration_minutes * 25)
    : Math.round(200 + confirmedCaptures.length * 300)

  const runnerBoard = [...fugitives].sort((a,b) => (distByPlayer.get(b.id)??0) - (distByPlayer.get(a.id)??0))
  const hunterBoard = [...hunters ].sort((a,b) => (capsByHunter.get(b.id)??0) - (capsByHunter.get(a.id)??0))

  const handleRematch = () => {
    if (!game) return
    sessionStorage.setItem('rematch_settings', JSON.stringify({
      duration_minutes: game.duration_minutes,
      headstart_minutes: game.headstart_minutes,
      location_interval_minutes: game.location_interval_minutes,
      capture_radius_meters: game.capture_radius_meters,
      rules_text: game.rules_text,
    }))
    router.push('/create')
  }

  // ── Theme ─────────────────────────────────────────────────────────────────
  const accent    = fugitiveWon ? '#3b82f6' : huntersWon ? '#ef4444' : '#6b7280'
  const accentDim = fugitiveWon ? '#1d4ed8' : huntersWon ? '#b91c1c' : '#374151'
  const bg        = fugitiveWon ? '#030b18' : huntersWon ? '#0e0303' : '#0a0a0a'
  const title     = fugitiveWon ? t('end_runnersTitle') : huntersWon ? t('end_huntersTitle') : t('end_gameTitle')
  const subtitle  = fugitiveWon
    ? <span>{t('end_notCaught')} <span style={{ color: '#fff' }}>{t('end_missionSuccess')}</span></span>
    : huntersWon
    ? <span>{t('end_huntSuccess')}</span>
    : <span style={{ color: '#9ca3af' }}>{t('end_gameEnded')}</span>

  return (
    <main className="min-h-svh flex flex-col" style={{ background: bg, color: '#fff' }}>

      {/* ── HERO ── */}
      <div className="relative flex flex-col items-center pt-10 pb-6 px-4 text-center overflow-hidden">
        <div className="absolute top-3 right-4 z-10"><LangToggle /></div>
        {/* City map background */}
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 375 280" preserveAspectRatio="xMidYMid slice" style={{ opacity: 0.3 }}>
          {[40,85,130,175,220].map(y => <line key={y} x1="0" y1={y} x2="375" y2={y} stroke={accent} strokeWidth="0.7" opacity="0.35" />)}
          {[50,110,170,230,290,340].map(x => <line key={x} x1={x} y1="0" x2={x} y2="280" stroke={accent} strokeWidth="0.7" opacity="0.35" />)}
          <line x1="0"   y1="80"  x2="220" y2="280" stroke={accent} strokeWidth="0.7" opacity="0.2" />
          <line x1="80"  y1="0"   x2="310" y2="280" stroke={accent} strokeWidth="0.7" opacity="0.2" />
          <line x1="320" y1="0"   x2="160" y2="280" stroke={accent} strokeWidth="0.7" opacity="0.2" />
        </svg>

        {/* Winner icon */}
        <div className="relative z-10 mb-3">
          {fugitiveWon ? <ShieldRunnerSVG /> : huntersWon ? <SkullCrosshairSVG /> : <span style={{ fontSize: '4rem' }}>🏁</span>}
        </div>

        {/* Title */}
        <div className="relative z-10">
          <div className="font-black tracking-widest uppercase" style={{ fontSize: '2.6rem', lineHeight: 1, textShadow: '0 2px 20px rgba(0,0,0,0.9)' }}>
            {title}
          </div>
          <div className="font-black tracking-widest uppercase" style={{ fontSize: '3.4rem', lineHeight: 1, color: accent, textShadow: `0 0 40px ${accent}66` }}>
            {t('end_win')}
          </div>
        </div>

        <p className="relative z-10 mt-3 tracking-widest uppercase" style={{ fontSize: '0.65rem', color: '#9ca3af' }}>
          {subtitle}
        </p>
      </div>

      <div className="flex flex-col gap-3 px-4 pb-8">

        {/* ── STATS PANEL ── */}
        <div className="grid grid-cols-3 rounded-2xl overflow-hidden" style={{ background: '#0d1120', border: `1px solid ${accentDim}55` }}>
          {fugitiveWon && <>
            <StatCell icon={<TimerSVG c={accent}/>} label={t('end_survivedTime')} value={`${String(game.duration_minutes).padStart(2,'0')}:00`} color={accent} />
            <StatCell icon={<RunnerSVG c={accent}/>} label={t('end_evadedHunters')} value={`${hunters.length} / ${hunters.length}`} color={accent} bordered />
            <StatCell icon={<XpSVG c={accent}/>} label={t('end_xpEarned')} value={`+${xp}`} color={accent} />
          </>}
          {huntersWon && <>
            <StatCell icon={<CrosshairSVG c={accent}/>} label={t('end_targetsCaptured')} value={`${confirmedCaptures.length} / ${fugitives.length}`} color={accent} />
            <StatCell icon={<TimerSVG c={accent}/>} label={t('end_timeRemaining')} value={timeLeft} color={accent} bordered />
            <StatCell icon={<TrophySVG c={accent}/>} label={t('end_xpEarned')} value={`+${xp}`} color={accent} />
          </>}
          {!fugitiveWon && !huntersWon && (
            <div className="col-span-3 py-5 text-center text-sm" style={{ color: '#6b7280' }}>{t('end_noWinner')}</div>
          )}
        </div>

        {/* ── LEADERBOARD ── */}
        {(fugitiveWon || huntersWon) && (
          <div className="rounded-2xl overflow-hidden" style={{ background: '#0d1120', border: `1px solid ${accentDim}44` }}>
            <div className="px-4 py-3" style={{ borderBottom: `1px solid ${accentDim}55` }}>
              <span className="font-black tracking-widest text-xs uppercase" style={{ color: accent }}>
                {fugitiveWon ? t('end_topRunners') : t('end_bestHunters')}
              </span>
            </div>
            {fugitiveWon && runnerBoard.map((p, i) => (
              <LeaderRow
                key={p.id} rank={i+1} name={p.user_name} accent={accent}
                stat={`${((distByPlayer.get(p.id)??0)/1000).toFixed(2)} ${t('end_km')}`}
              />
            ))}
            {huntersWon && hunterBoard.map((p, i) => (
              <LeaderRow
                key={p.id} rank={i+1} name={p.user_name} accent={accent}
                stat={`${capsByHunter.get(p.id)??0} GEVANGEN`}
              />
            ))}
          </div>
        )}

        {/* ── BUTTONS ── */}
        <div className="flex gap-3 mt-1">
          <button
            onClick={handleRematch}
            className="flex-1 flex items-center justify-between rounded-xl font-black tracking-widest text-white transition-transform active:scale-95"
            style={{
              padding: '1rem 1.25rem', fontSize: '0.82rem',
              background: fugitiveWon
                ? 'linear-gradient(135deg,#1e3a8a,#2563eb)'
                : 'linear-gradient(135deg,#6b0000,#b91c1c)',
              border: `1px solid ${accent}`,
              boxShadow: `0 0 20px ${accent}44`,
            }}
          >
            <span>NIEUW SPEL</span>
            <span style={{ fontSize: '1.3rem', lineHeight: 1 }}>›</span>
          </button>
          <button
            onClick={() => router.push('/')}
            className="flex-1 rounded-xl font-black tracking-widest text-white transition-transform active:scale-95"
            style={{ padding: '1rem', fontSize: '0.75rem', background: '#111827', border: '1px solid #374151' }}
          >
            TERUG NAAR MENU
          </button>
        </div>
      </div>
    </main>
  )
}

// ── Sub-components ────────────────────────────────────────────────────────────

function StatCell({ icon, label, value, color, bordered }: { icon: React.ReactNode; label: string; value: string; color: string; bordered?: boolean }) {
  return (
    <div
      className="flex flex-col items-center py-4 px-1 gap-1"
      style={bordered ? { borderLeft: '1px solid #1e2a40', borderRight: '1px solid #1e2a40' } : {}}
    >
      {icon}
      <span className="text-center leading-tight tracking-wider uppercase mt-0.5" style={{ fontSize: '0.45rem', color: '#6b7280' }}>{label}</span>
      <span className="font-black tracking-wide" style={{ fontSize: '1.25rem', color }}>{value}</span>
    </div>
  )
}

function LeaderRow({ rank, name, stat, accent }: { rank: number; name: string; stat: string; accent: string }) {
  return (
    <div className="flex items-center gap-3 px-4 py-3" style={{ borderBottom: '1px solid #1a2540' }}>
      <span className="font-black text-sm w-4 shrink-0" style={{ color: accent }}>{rank}</span>
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="8" r="3.5" fill={accent} opacity="0.7" />
        <path d="M5 20c0-3.9 3.1-7 7-7s7 3.1 7 7" fill={accent} opacity="0.4" />
        <path d="M7 12.5 C7 9 9 6.5 12 6.5 C15 6.5 17 9 17 12.5" fill="none" stroke={accent} strokeWidth="1.2" opacity="0.5" />
      </svg>
      <span className="flex-1 font-black text-sm tracking-wider uppercase">{name}</span>
      <span className="font-black text-sm shrink-0" style={{ color: '#6b7280' }}>{stat}</span>
    </div>
  )
}

// ── Winner icons ──────────────────────────────────────────────────────────────

function ShieldRunnerSVG() {
  return (
    <svg width="130" height="140" viewBox="0 0 130 140" fill="none">
      <defs>
        <radialGradient id="sg" cx="50%" cy="35%">
          <stop offset="0%" stopColor="#1d4ed8" /><stop offset="100%" stopColor="#0a1a5c" />
        </radialGradient>
      </defs>
      <ellipse cx="65" cy="80" rx="56" ry="46" fill="#3b82f6" opacity="0.1" />
      <path d="M65 8L118 32L118 82C118 112 65 136 65 136C65 136 12 112 12 82L12 32Z" fill="url(#sg)" stroke="#60a5fa" strokeWidth="2.5" />
      <path d="M65 8L118 32L118 82C118 112 65 136 65 136C65 136 12 112 12 82L12 32Z" fill="none" stroke="#93c5fd" strokeWidth="1" opacity="0.4" />
      <circle cx="80" cy="43" r="8" fill="#e2e8f0" />
      <path d="M74 51L69 72"  stroke="#e2e8f0" strokeWidth="7" strokeLinecap="round" fill="none" />
      <path d="M73 59L52 67"  stroke="#e2e8f0" strokeWidth="5" strokeLinecap="round" fill="none" />
      <path d="M73 56L91 47"  stroke="#e2e8f0" strokeWidth="5" strokeLinecap="round" fill="none" />
      <path d="M69 72L85 89L95 100" stroke="#e2e8f0" strokeWidth="6" strokeLinecap="round" fill="none" />
      <path d="M69 72L55 89L46 105" stroke="#e2e8f0" strokeWidth="6" strokeLinecap="round" fill="none" />
    </svg>
  )
}

function SkullCrosshairSVG() {
  return (
    <svg width="130" height="130" viewBox="0 0 130 130" fill="none">
      <circle cx="65" cy="65" r="58" fill="#ef4444" opacity="0.12" />
      <circle cx="65" cy="65" r="55" fill="none" stroke="#ef4444" strokeWidth="2" />
      <line x1="0"   y1="65" x2="18"  y2="65" stroke="#ef4444" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="112" y1="65" x2="130" y2="65" stroke="#ef4444" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="65"  y1="0"  x2="65"  y2="18"  stroke="#ef4444" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="65"  y1="112" x2="65" y2="130" stroke="#ef4444" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M65 20C46 20 34 33 34 48C34 58 39 67 47 71L47 80L83 80L83 71C91 67 96 58 96 48C96 33 84 20 65 20Z" fill="#dc2626" />
      <ellipse cx="53" cy="48" rx="9"  ry="10" fill="#7f1d1d" />
      <ellipse cx="77" cy="48" rx="9"  ry="10" fill="#7f1d1d" />
      <path d="M61 61L65 57L69 61" fill="#7f1d1d" />
      <rect x="47" y="80" width="36" height="10" rx="2" fill="#dc2626" />
      <rect x="51" y="82" width="5" height="8" fill="#7f1d1d" />
      <rect x="59" y="82" width="5" height="8" fill="#7f1d1d" />
      <rect x="67" y="82" width="5" height="8" fill="#7f1d1d" />
      <rect x="75" y="82" width="5" height="8" fill="#7f1d1d" />
    </svg>
  )
}

// ── Stat icons ────────────────────────────────────────────────────────────────

function TimerSVG({ c }: { c: string }) {
  return <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="13" r="8"/><path d="M12 9v4l2 2"/><path d="M9 2h6M12 2v3"/></svg>
}
function RunnerSVG({ c }: { c: string }) {
  return <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><circle cx="16" cy="4" r="2" fill={c}/><path d="M13 7L11 14L7 20" stroke={c} strokeWidth="2" strokeLinecap="round"/><path d="M12 10L18 8" stroke={c} strokeWidth="2" strokeLinecap="round"/><path d="M11 14L17 19" stroke={c} strokeWidth="2" strokeLinecap="round"/></svg>
}
function XpSVG({ c }: { c: string }) {
  return <svg width="26" height="26" viewBox="0 0 26 26" fill="none"><polygon points="13,2 16,10 24,10 18,15 20,23 13,18 6,23 8,15 2,10 10,10" stroke={c} strokeWidth="1.5" strokeLinejoin="round"/></svg>
}
function CrosshairSVG({ c }: { c: string }) {
  return <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="7"/><circle cx="12" cy="12" r="2" fill={c}/><path d="M2 12h4M18 12h4M12 2v4M12 18v4"/></svg>
}
function TrophySVG({ c }: { c: string }) {
  return <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round"><path d="M6 9H4a2 2 0 000 4l2 1M18 9h2a2 2 0 010 4l-2 1"/><path d="M6 4h12v9a6 6 0 01-12 0V4z"/><path d="M9 19l-1 2h8l-1-2M8 21h8"/></svg>
}
