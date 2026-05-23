'use client'
import { useState } from 'react'
import { supabase, generateGameCode } from '@/lib/supabase-client'
import { Button } from '@/components/ui/Button'

// Mock GPS trail — Vondelpark, Amsterdam
const FUGITIVE_TRAIL = [
  [52.3579, 4.8686],
  [52.3585, 4.8700],
  [52.3592, 4.8714],
  [52.3600, 4.8707],
  [52.3607, 4.8721],
  [52.3614, 4.8735],
]

type MockPlayer = { role: string; name: string; id: string }
type MockResult = { code: string; players: MockPlayer[] }

const ROLE_COLORS: Record<string, string> = {
  admin: '#eab308',
  fugitive: '#3b82f6',
  hunter: '#ef4444',
}

const ROLE_LABELS: Record<string, string> = {
  admin: 'Spelleider',
  fugitive: 'Boef',
  hunter: 'Jager',
}

export default function MockPage() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<MockResult | null>(null)
  const [error, setError] = useState('')

  const create = async () => {
    setLoading(true)
    setError('')
    try {
      const code = generateGameCode()
      const now = Date.now()

      const { data: game, error: gameErr } = await supabase.from('games').insert({
        code,
        name: 'Mock Spel',
        status: 'active',
        created_by: 'Mock',
        duration_minutes: 60,
        headstart_minutes: 5,
        location_interval_minutes: 2,
        capture_radius_meters: 50,
        rules_text: null,
        geofence_radius_meters: null,
        geofence_center_lat: null,
        geofence_center_lng: null,
        winner: null,
        started_at: new Date(now - 11 * 60 * 1000).toISOString(),
        active_at: new Date(now - 6 * 60 * 1000).toISOString(),
        ends_at: new Date(now + 54 * 60 * 1000).toISOString(),
      }).select().single()
      if (gameErr || !game) throw new Error(gameErr?.message ?? 'Spel aanmaken mislukt')

      const defs = [
        { user_name: 'Spelleider', role: 'admin',    is_host: true  },
        { user_name: 'De Boef',    role: 'fugitive',  is_host: false },
        { user_name: 'De Jager',   role: 'hunter',    is_host: false },
      ]
      const players: MockPlayer[] = []
      for (const def of defs) {
        const { data: p, error: pErr } = await supabase.from('players').insert({
          game_id: game.id,
          ...def,
          last_seen_at: new Date().toISOString(),
        }).select().single()
        if (pErr || !p) throw new Error(pErr?.message ?? 'Speler aanmaken mislukt')
        players.push({ role: p.role, name: p.user_name, id: p.id })
      }

      const fugitive = players.find((p) => p.role === 'fugitive')!
      const hunter   = players.find((p) => p.role === 'hunter')!

      // Fugitive trail — each ping 2 min apart going back in time
      for (let i = 0; i < FUGITIVE_TRAIL.length; i++) {
        const minsAgo = (FUGITIVE_TRAIL.length - i) * 2
        await supabase.from('locations').insert({
          game_id: game.id,
          player_id: fugitive.id,
          latitude: FUGITIVE_TRAIL[i][0],
          longitude: FUGITIVE_TRAIL[i][1],
          accuracy: 12,
          visible_to_hunters: true,
          created_at: new Date(now - minsAgo * 60 * 1000).toISOString(),
        })
      }

      // Hunter starting position
      await supabase.from('locations').insert({
        game_id: game.id,
        player_id: hunter.id,
        latitude: FUGITIVE_TRAIL[0][0] + 0.0015,
        longitude: FUGITIVE_TRAIL[0][1] - 0.0020,
        accuracy: 18,
        visible_to_hunters: false,
      })

      setResult({ code, players })
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Onbekende fout')
    } finally {
      setLoading(false)
    }
  }

  const joinUrl = (id: string, name: string) => {
    const base = window.location.origin
    return `${base}/mock/join?code=${result!.code}&id=${id}&name=${encodeURIComponent(name)}`
  }

  return (
    <main className="min-h-svh text-white flex flex-col items-center justify-center gap-6 p-6" style={{ background: '#000000' }}>
      <div className="text-center">
        <p className="font-black tracking-widest uppercase text-xs text-gray-500 mb-1">Dev tool</p>
        <h1 className="font-black tracking-widest uppercase text-white text-lg">Mock spel</h1>
      </div>

      {!result ? (
        <>
          <p className="text-gray-500 text-sm text-center max-w-xs">
            Maakt een nep-spel aan met spelleider, boef en jager. De boef heeft al een GPS-trail van 6 pings.
          </p>
          <Button size="lg" loading={loading} onClick={create}>
            Maak mock spel
          </Button>
          {error && <p className="text-red-400 text-sm text-center">{error}</p>}
        </>
      ) : (
        <div className="flex flex-col gap-3 w-full max-w-xs">
          <p className="text-center text-gray-400 text-xs tracking-widest uppercase mb-1">
            Code: <span className="text-white font-black">{result.code}</span>
          </p>
          <p className="text-center text-gray-600 text-xs mb-2">Open elk in een apart tabblad</p>

          {result.players.map((p) => (
            <a
              key={p.id}
              href={joinUrl(p.id, p.name)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between rounded-xl px-4 py-3 font-bold text-sm transition-opacity hover:opacity-80"
              style={{
                background: '#0d1018',
                border: `1px solid ${ROLE_COLORS[p.role]}44`,
                color: ROLE_COLORS[p.role],
              }}
            >
              <span>{p.name}</span>
              <span className="text-xs tracking-widest uppercase opacity-50">{ROLE_LABELS[p.role]} ↗</span>
            </a>
          ))}

          <button
            onClick={() => setResult(null)}
            className="text-gray-700 text-xs mt-2 hover:text-gray-500"
          >
            Nieuw mock spel
          </button>
        </div>
      )}
    </main>
  )
}
