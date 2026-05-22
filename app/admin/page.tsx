'use client'
import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'

type GameStatus = 'waiting' | 'headstart' | 'active' | 'paused' | 'finished'
type Session = { id: string; code: string; name: string; status: GameStatus; created_by: string; created_at: string; player_count: number }
type CleanupResult = { deleted: { finished: number; abandoned: number; stuck: number } }

const STATUS_LABEL: Record<GameStatus, string> = {
  waiting:   'Wachten',
  headstart: 'Voorsprong',
  active:    'Actief',
  paused:    'Gepauzeerd',
  finished:  'Afgelopen',
}
const STATUS_COLOR: Record<GameStatus, string> = {
  waiting:   '#6b7280',
  headstart: '#f97316',
  active:    '#22c55e',
  paused:    '#eab308',
  finished:  '#374151',
}

export default function AdminPage() {
  const router = useRouter()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loggedIn, setLoggedIn] = useState(false)
  const [loginError, setLoginError] = useState('')

  const [tab, setTab] = useState<'sessions' | 'cleanup'>('sessions')
  const [sessions, setSessions] = useState<Session[]>([])
  const [sessionsLoading, setSessionsLoading] = useState(false)

  const [cleanupLoading, setCleanupLoading] = useState(false)
  const [cleanupResult, setCleanupResult] = useState<CleanupResult | null>(null)
  const [cleanupError, setCleanupError] = useState('')

  const [joiningId, setJoiningId] = useState<string | null>(null)

  const fetchSessions = useCallback(async (u: string, p: string) => {
    setSessionsLoading(true)
    const res = await fetch(`/api/admin?username=${u}&password=${p}`)
    if (res.ok) setSessions((await res.json()).games)
    setSessionsLoading(false)
  }, [])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoginError('')
    const res = await fetch('/api/admin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password, _check: true }),
    })
    if (res.ok) {
      setLoggedIn(true)
      fetchSessions(username, password)
    } else {
      setLoginError('Verkeerde inloggegevens')
    }
  }

  const handleCleanup = async () => {
    setCleanupLoading(true)
    setCleanupResult(null)
    setCleanupError('')
    const res = await fetch('/api/admin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    })
    if (res.ok) setCleanupResult(await res.json())
    else setCleanupError('Cleanup mislukt')
    setCleanupLoading(false)
  }

  const handleJoin = async (session: Session) => {
    setJoiningId(session.id)
    const res = await fetch('/api/admin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password, action: 'join', gameId: session.id, gameCode: session.code }),
    })
    if (res.ok) {
      const { playerId, gameCode } = await res.json()
      sessionStorage.setItem(`player_${gameCode}`, playerId)
      const dest = session.status === 'waiting' ? 'lobby' : session.status === 'finished' ? 'end' : 'play'
      router.push(`/game/${gameCode}/${dest}`)
    }
    setJoiningId(null)
  }

  if (!loggedIn) {
    return (
      <main className="min-h-svh flex flex-col items-center justify-center px-4" style={{ background: '#000000', color: '#fff' }}>
        <form onSubmit={handleLogin} className="flex flex-col gap-4 w-full max-w-xs">
          <h1 className="font-black tracking-widest uppercase text-center text-sm text-gray-400">Admin</h1>
          <input
            type="text"
            placeholder="Gebruikersnaam"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="bg-transparent border rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none"
            style={{ borderColor: '#1a2540' }}
            autoFocus
          />
          <input
            type="password"
            placeholder="Wachtwoord"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="bg-transparent border rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none"
            style={{ borderColor: '#1a2540' }}
          />
          {loginError && <p className="text-red-400 text-sm text-center">{loginError}</p>}
          <button
            type="submit"
            className="font-black tracking-widest uppercase text-white rounded-xl py-3"
            style={{ background: 'linear-gradient(135deg,#1e3a8a,#2563eb)', border: '1px solid #3b82f6' }}
          >
            Inloggen
          </button>
        </form>
      </main>
    )
  }

  return (
    <main className="min-h-svh flex flex-col px-4 py-6 max-w-lg mx-auto w-full" style={{ background: '#000000', color: '#fff' }}>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-black tracking-widest uppercase text-sm text-gray-400">Admin Dashboard</h1>
        <button
          onClick={() => { setLoggedIn(false); setSessions([]) }}
          className="text-xs text-gray-600 hover:text-gray-400 tracking-widest uppercase"
        >
          Uitloggen
        </button>
      </div>

      {/* Tabs */}
      <div className="flex rounded-xl overflow-hidden mb-5" style={{ border: '1px solid #1a2540' }}>
        {(['sessions', 'cleanup'] as const).map((t) => (
          <button
            key={t}
            onClick={() => { setTab(t); if (t === 'sessions') fetchSessions(username, password) }}
            className="flex-1 py-2.5 text-xs font-bold tracking-widest uppercase transition-colors"
            style={tab === t
              ? { background: 'linear-gradient(135deg,#1e3a8a,#2563eb)', color: '#fff' }
              : { background: '#0d1018', color: '#6b7280' }}
          >
            {t === 'sessions' ? '🎮 Sessies' : '🗑️ Cleanup'}
          </button>
        ))}
      </div>

      {/* Sessions tab */}
      {tab === 'sessions' && (
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500 uppercase tracking-widest">{sessions.length} spellen</span>
            <button
              onClick={() => fetchSessions(username, password)}
              className="text-xs text-blue-400 hover:text-blue-300 tracking-widest uppercase"
            >
              ↻ Ververs
            </button>
          </div>

          {sessionsLoading && (
            <div className="text-center text-gray-600 text-xs tracking-widest uppercase py-8">Laden...</div>
          )}

          {!sessionsLoading && sessions.length === 0 && (
            <div className="text-center text-gray-600 text-xs tracking-widest uppercase py-8">Geen spellen gevonden</div>
          )}

          {sessions.map((s) => (
            <div key={s.id} className="rounded-2xl p-4 flex flex-col gap-3" style={{ background: '#0d1018', border: '1px solid #1a2540' }}>
              <div className="flex items-start justify-between gap-2">
                <div className="flex flex-col gap-0.5 min-w-0">
                  <span className="font-bold text-white text-sm truncate">{s.name}</span>
                  <span className="font-mono text-xs text-gray-500">{s.code}</span>
                </div>
                <div className="flex flex-col items-end gap-1 shrink-0">
                  <span className="text-xs font-bold rounded-full px-2 py-0.5" style={{ background: STATUS_COLOR[s.status] + '22', color: STATUS_COLOR[s.status], border: `1px solid ${STATUS_COLOR[s.status]}44` }}>
                    {STATUS_LABEL[s.status]}
                  </span>
                  <span className="text-xs text-gray-600">{s.player_count} spelers</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-600">Aangemaakt door {s.created_by}</span>
                {s.status !== 'finished' && (
                  <button
                    onClick={() => handleJoin(s)}
                    disabled={joiningId === s.id}
                    className="text-xs font-bold tracking-widest uppercase text-white rounded-lg px-3 py-1.5 disabled:opacity-50 transition-colors"
                    style={{ background: 'linear-gradient(135deg,#1e3a8a,#2563eb)', border: '1px solid #3b82f6' }}
                  >
                    {joiningId === s.id ? '...' : '👑 Join als spelleider'}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Cleanup tab */}
      {tab === 'cleanup' && (
        <div className="flex flex-col gap-4">
          <div className="rounded-2xl p-4 flex flex-col gap-3" style={{ background: '#0d1018', border: '1px solid #1a2540' }}>
            <p className="text-xs text-gray-500 uppercase tracking-widest">Wat wordt verwijderd</p>
            <div className="text-xs text-gray-400 flex flex-col gap-1">
              <span>• Finished games ouder dan 7 dagen</span>
              <span>• Waiting games ouder dan 24 uur</span>
              <span>• Vastgelopen games ouder dan 48 uur</span>
            </div>
            <button
              onClick={handleCleanup}
              disabled={cleanupLoading}
              className="font-black tracking-widest uppercase text-white rounded-xl py-3 disabled:opacity-50"
              style={{ background: 'linear-gradient(135deg,#6b0000,#b91c1c)', border: '1px solid #ef4444' }}
            >
              {cleanupLoading ? 'Bezig...' : '🗑️ Cleanup uitvoeren'}
            </button>
          </div>

          {cleanupResult && (
            <div className="rounded-2xl p-4 flex flex-col gap-2" style={{ background: '#0a1a0a', border: '1px solid #22c55e' }}>
              <p className="text-xs text-green-400 uppercase tracking-widest font-bold">✓ Cleanup voltooid</p>
              <div className="text-sm flex flex-col gap-1">
                <div className="flex justify-between"><span className="text-gray-400">Finished games</span><span className="text-white font-bold">{cleanupResult.deleted.finished}</span></div>
                <div className="flex justify-between"><span className="text-gray-400">Abandoned lobbies</span><span className="text-white font-bold">{cleanupResult.deleted.abandoned}</span></div>
                <div className="flex justify-between"><span className="text-gray-400">Vastgelopen games</span><span className="text-white font-bold">{cleanupResult.deleted.stuck}</span></div>
                <div className="flex justify-between border-t mt-1 pt-1" style={{ borderColor: '#1a2540' }}>
                  <span className="text-gray-400">Totaal</span>
                  <span className="text-green-400 font-bold">{cleanupResult.deleted.finished + cleanupResult.deleted.abandoned + cleanupResult.deleted.stuck}</span>
                </div>
              </div>
            </div>
          )}

          {cleanupError && <p className="text-red-400 text-sm text-center">{cleanupError}</p>}
        </div>
      )}
    </main>
  )
}
