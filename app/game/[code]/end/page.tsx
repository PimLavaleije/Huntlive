'use client'
import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase-client'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { MapView } from '@/components/MapView'
import { RoleBadge } from '@/components/RoleBadge'
import type { Game, Player, Location } from '@/types'

export default function EndPage() {
  const router = useRouter()
  const params = useParams()
  const code = (params.code as string).toUpperCase()

  const [game, setGame] = useState<Game | null>(null)
  const [players, setPlayers] = useState<Player[]>([])
  const [locationHistory, setLocationHistory] = useState<Location[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      const { data: g } = await supabase.from('games').select('*').eq('code', code).single()
      if (!g) { router.replace('/'); return }
      setGame(g)

      const { data: p } = await supabase.from('players').select('*').eq('game_id', g.id).order('joined_at')
      setPlayers(p ?? [])

      const { data: locs } = await supabase
        .from('locations')
        .select('*')
        .eq('game_id', g.id)
        .eq('visible_to_hunters', true)
        .order('created_at', { ascending: true })
      setLocationHistory(locs ?? [])

      setLoading(false)
    }
    load()
  }, [code, router])

  const handleRematch = async () => {
    if (!game) return
    // Store settings in sessionStorage and go to create with pre-filled data
    sessionStorage.setItem('rematch_settings', JSON.stringify({
      duration_minutes: game.duration_minutes,
      headstart_minutes: game.headstart_minutes,
      location_interval_minutes: game.location_interval_minutes,
      capture_radius_meters: game.capture_radius_meters,
      rules_text: game.rules_text,
    }))
    router.push('/create')
  }

  if (loading || !game) {
    return <div className="min-h-svh bg-gray-900 flex items-center justify-center text-gray-400">Laden...</div>
  }

  const fugitiveWon = game.winner === 'fugitive'
  const huntersWon = game.winner === 'hunters'
  const noWinner = !game.winner

  const lastLocation = locationHistory[locationHistory.length - 1]

  const mapMarkers = locationHistory.map((loc, i) => ({
    lat: loc.latitude,
    lng: loc.longitude,
    type: 'history' as const,
    label: `Ping ${i + 1} – ${new Date(loc.created_at).toLocaleTimeString('nl-NL')}`,
  }))

  const mapCenter: [number, number] | undefined = lastLocation
    ? [lastLocation.latitude, lastLocation.longitude]
    : undefined

  return (
    <main className="min-h-svh bg-gray-900 text-white flex flex-col max-w-lg mx-auto w-full">
      {/* Winner announcement */}
      <div
        className={`px-4 py-10 text-center ${
          fugitiveWon ? 'bg-orange-900/40' : huntersWon ? 'bg-blue-900/40' : 'bg-gray-800'
        }`}
      >
        <div className="text-6xl mb-3">
          {fugitiveWon ? '🏃' : huntersWon ? '🎯' : '🏁'}
        </div>
        <h1 className="text-3xl font-black mb-1">
          {fugitiveWon ? 'Boef gewonnen!' : huntersWon ? 'Jagers gewonnen!' : 'Spel beëindigd'}
        </h1>
        <p className="text-gray-400">
          {fugitiveWon
            ? 'De voortvluchtige is ontsnapt!'
            : huntersWon
            ? 'De voortvluchtige is gevangen!'
            : 'Het spel is beëindigd door de admin'}
        </p>
        <p className="text-sm text-gray-500 mt-2">
          {new Date(game.ends_at ?? Date.now()).toLocaleString('nl-NL')}
        </p>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-5 flex flex-col gap-4">
        {/* Players */}
        <Card>
          <p className="text-xs text-gray-500 font-semibold uppercase tracking-widest mb-3">Spelers</p>
          <div className="flex flex-col gap-2">
            {players.map((p) => (
              <div key={p.id} className="flex items-center justify-between px-3 py-2 bg-gray-700/50 rounded-xl">
                <span className="font-medium">{p.user_name}</span>
                <RoleBadge role={p.role} />
              </div>
            ))}
          </div>
        </Card>

        {/* Location timeline */}
        {locationHistory.length > 0 && (
          <Card>
            <p className="text-xs text-gray-500 font-semibold uppercase tracking-widest mb-3">
              Locatie-tijdlijn ({locationHistory.length} pings)
            </p>
            <MapView
              center={mapCenter}
              markers={mapMarkers}
              fugitiveHistory={locationHistory}
              className="w-full h-64 rounded-xl overflow-hidden mb-3"
            />
            <div className="flex flex-col gap-1 max-h-40 overflow-y-auto">
              {locationHistory.map((loc, i) => (
                <div key={loc.id} className="flex justify-between text-xs text-gray-400 px-1">
                  <span>Ping {i + 1}</span>
                  <span>{new Date(loc.created_at).toLocaleTimeString('nl-NL')}</span>
                  <span className="text-orange-400">
                    {loc.latitude.toFixed(5)}, {loc.longitude.toFixed(5)}
                  </span>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Game stats */}
        <Card>
          <p className="text-xs text-gray-500 font-semibold uppercase tracking-widest mb-3">Spelinfo</p>
          <div className="grid grid-cols-2 gap-2 text-sm">
            {[
              ['Speelduur', `${game.duration_minutes} min`],
              ['Voorsprong', `${game.headstart_minutes} min`],
              ['Locatie-pings', `${locationHistory.length}`],
              ['Vangradius', `${game.capture_radius_meters}m`],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between">
                <span className="text-gray-500">{k}</span>
                <span className="font-medium">{v}</span>
              </div>
            ))}
          </div>
        </Card>

        {/* Actions */}
        <div className="flex flex-col gap-3">
          <Button size="lg" onClick={handleRematch} className="w-full">
            🔄 Nieuw spel met dezelfde instellingen
          </Button>
          <Button variant="ghost" size="lg" onClick={() => router.push('/')} className="w-full">
            🏠 Terug naar home
          </Button>
        </div>

        <div className="h-4" />
      </div>
    </main>
  )
}
