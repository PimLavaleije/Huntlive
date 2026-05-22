'use client'
import { useState } from 'react'

type CleanupResult = { deleted: { finished: number; abandoned: number; stuck: number } }

export default function AdminPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loggedIn, setLoggedIn] = useState(false)
  const [loginError, setLoginError] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<CleanupResult | null>(null)
  const [error, setError] = useState('')

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
    } else {
      setLoginError('Verkeerde inloggegevens')
    }
  }

  const handleCleanup = async () => {
    setLoading(true)
    setResult(null)
    setError('')
    const res = await fetch('/api/admin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    })
    if (res.ok) {
      setResult(await res.json())
    } else {
      setError('Cleanup mislukt')
    }
    setLoading(false)
  }

  return (
    <main className="min-h-svh flex flex-col items-center justify-center px-4" style={{ background: '#000000', color: '#fff' }}>
      {!loggedIn ? (
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
            className="font-black tracking-widest uppercase text-white rounded-xl py-3 transition-colors"
            style={{ background: 'linear-gradient(135deg,#1e3a8a,#2563eb)', border: '1px solid #3b82f6' }}
          >
            Inloggen
          </button>
        </form>
      ) : (
        <div className="flex flex-col gap-6 w-full max-w-sm">
          <h1 className="font-black tracking-widest uppercase text-center text-sm text-gray-400">Admin Dashboard</h1>

          <div className="rounded-2xl p-4 flex flex-col gap-3" style={{ background: '#0d1018', border: '1px solid #1a2540' }}>
            <p className="text-xs text-gray-500 uppercase tracking-widest">Database cleanup</p>
            <div className="text-xs text-gray-400 flex flex-col gap-1">
              <span>• Finished games ouder dan 7 dagen</span>
              <span>• Waiting games ouder dan 24 uur</span>
              <span>• Vastgelopen games ouder dan 48 uur</span>
            </div>
            <button
              onClick={handleCleanup}
              disabled={loading}
              className="font-black tracking-widest uppercase text-white rounded-xl py-3 transition-colors disabled:opacity-50"
              style={{ background: 'linear-gradient(135deg,#6b0000,#b91c1c)', border: '1px solid #ef4444' }}
            >
              {loading ? 'Bezig...' : '🗑️ Cleanup uitvoeren'}
            </button>
          </div>

          {result && (
            <div className="rounded-2xl p-4 flex flex-col gap-2" style={{ background: '#0a1a0a', border: '1px solid #22c55e' }}>
              <p className="text-xs text-green-400 uppercase tracking-widest font-bold">✓ Cleanup voltooid</p>
              <div className="text-sm flex flex-col gap-1">
                <div className="flex justify-between"><span className="text-gray-400">Finished games</span><span className="text-white font-bold">{result.deleted.finished}</span></div>
                <div className="flex justify-between"><span className="text-gray-400">Abandoned lobbies</span><span className="text-white font-bold">{result.deleted.abandoned}</span></div>
                <div className="flex justify-between"><span className="text-gray-400">Vastgelopen games</span><span className="text-white font-bold">{result.deleted.stuck}</span></div>
                <div className="flex justify-between border-t mt-1 pt-1" style={{ borderColor: '#1a2540' }}>
                  <span className="text-gray-400">Totaal</span>
                  <span className="text-green-400 font-bold">{result.deleted.finished + result.deleted.abandoned + result.deleted.stuck}</span>
                </div>
              </div>
            </div>
          )}

          {error && <p className="text-red-400 text-sm text-center">{error}</p>}

          <button
            onClick={() => { setLoggedIn(false); setResult(null); setError('') }}
            className="text-xs text-gray-600 hover:text-gray-400 transition-colors tracking-widest uppercase"
          >
            Uitloggen
          </button>
        </div>
      )}
    </main>
  )
}
