'use client'
import { useEffect, useState, useCallback, useRef } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useRealtimeGame } from '@/hooks/useRealtimeGame'
import { useGeolocation } from '@/hooks/useGeolocation'
import { useGameTimer } from '@/hooks/useGameTimer'
import { supabase, saveLocation } from '@/lib/supabase-client'
import { haversineDistance, formatDistance } from '@/lib/distance'
import { isLocationSnapshotMoment, formatRelativeTime } from '@/lib/game-state'
import { requestWakeLock } from '@/lib/geolocation'
import { GameTimer } from '@/components/GameTimer'
import { MapView } from '@/components/MapView'
import { LocationStatus } from '@/components/LocationStatus'
import { CaptureButton } from '@/components/CaptureButton'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { RoleBadge } from '@/components/RoleBadge'
import type { Location, Player } from '@/types'

export default function PlayPage() {
  const router = useRouter()
  const params = useParams()
  const code = (params.code as string).toUpperCase()

  const [playerId, setPlayerId] = useState<string | null>(null)
  const [notification, setNotification] = useState<string | null>(null)
  const [panelOpen, setPanelOpen] = useState(true)
  const [allPlayerLocations, setAllPlayerLocations] = useState<Map<string, { lat: number; lng: number }>>(new Map())
  const [hunterLocations, setHunterLocations] = useState<Map<string, { lat: number; lng: number }>>(new Map())
  const [phaseModal, setPhaseModal] = useState<{ title: string; body: string } | null>(null)
  const notificationTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const lastSnapshotRef = useRef<number>(0)
  const prevGameStatusRef = useRef<string | null>(null)
  const playersRef = useRef<Player[]>([])

  useEffect(() => {
    const id = sessionStorage.getItem(`player_${code}`)
    if (!id) { router.replace(`/game/${code}`); return }
    setPlayerId(id)
    requestWakeLock()
  }, [code, router])

  const { game, players, latestFugitiveLocation, locationHistory } = useRealtimeGame(code, playerId)
  const { position, error: geoError, loading: geoLoading, accuracy } = useGeolocation(!!playerId)
  const { headstartLeft, gameLeft, nextUpdateLeft } = useGameTimer(game)

  const currentPlayer = players.find((p) => p.id === playerId)
  const isAdmin = currentPlayer?.role === 'admin'
  const isFugitive = currentPlayer?.role === 'fugitive'
  const isHunter = currentPlayer?.role === 'hunter' || isAdmin

  const showNotification = useCallback((msg: string) => {
    setNotification(msg)
    if (notificationTimer.current) clearTimeout(notificationTimer.current)
    notificationTimer.current = setTimeout(() => setNotification(null), 5000)
  }, [])

  useEffect(() => {
    if (game?.status === 'finished') router.push(`/game/${code}/end`)
    if (game?.status === 'waiting') router.push(`/game/${code}/lobby`)
  }, [game?.status, code, router])

  // Keep playersRef current for use inside intervals
  useEffect(() => { playersRef.current = players }, [players])

  // Notify hunters of new location
  const prevLocationRef = useRef<Location | null>(null)
  useEffect(() => {
    if (!isHunter || !latestFugitiveLocation) return
    if (prevLocationRef.current?.id !== latestFugitiveLocation.id) {
      if (prevLocationRef.current) showNotification('📍 Nieuwe locatie van de boef ontvangen!')
      prevLocationRef.current = latestFugitiveLocation
    }
  }, [latestFugitiveLocation, isHunter, showNotification])

  // Fetch static snapshot of hunter positions (for fugitive view)
  const fetchHunterSnapshot = useCallback(async (gameId: string) => {
    const hunterIds = playersRef.current
      .filter((p) => p.role === 'hunter' || p.role === 'admin')
      .map((p) => p.id)
    if (hunterIds.length === 0) return
    const { data } = await supabase
      .from('locations')
      .select('*')
      .eq('game_id', gameId)
      .in('player_id', hunterIds)
      .order('created_at', { ascending: false })
      .limit(hunterIds.length * 5)
    if (!data) return
    const latest = new Map<string, { lat: number; lng: number }>()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data.forEach((loc: any) => {
      if (!latest.has(loc.player_id)) latest.set(loc.player_id, { lat: loc.latitude, lng: loc.longitude })
    })
    setHunterLocations(latest)
  }, [])

  // Headstart → active: show modal and mutual position reveal
  useEffect(() => {
    if (!game || !currentPlayer) return
    const prev = prevGameStatusRef.current
    prevGameStatusRef.current = game.status
    if (prev !== 'headstart' || game.status !== 'active') return

    if (isFugitive) {
      setPhaseModal({
        title: '🚨 Jagers losgelaten!',
        body: 'De voorsprong is voorbij. Jagers weten nu waar je bent. Je ziet hun startlocaties op de kaart.',
      })
      fetchHunterSnapshot(game.id)
    } else if (isAdmin) {
      setPhaseModal({ title: '🏃 Jacht begonnen!', body: 'De voorsprong is voorbij. Het spel is actief.' })
    } else {
      setPhaseModal({
        title: '🏃 Jacht begonnen!',
        body: `De boef heeft ${game.headstart_minutes} min. voorsprong gehad. Je ziet zijn locatie op de kaart.`,
      })
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [game?.status])

  // Save location every 8 seconds for all active players
  useEffect(() => {
    if (!game || !playerId || !position) return
    if (game.status !== 'headstart' && game.status !== 'active') return

    const interval = setInterval(async () => {
      let shouldBeVisible = false
      if (isFugitive) {
        shouldBeVisible =
          game.status === 'active' &&
          isLocationSnapshotMoment(game) &&
          Date.now() - lastSnapshotRef.current > 30_000
        if (shouldBeVisible) {
          lastSnapshotRef.current = Date.now()
          showNotification('📡 Locaties gedeeld — jagers zien jou, jij ziet de jagers!')
          fetchHunterSnapshot(game.id)
        }
      }
      await saveLocation(game.id, playerId, position.latitude, position.longitude, position.accuracy, shouldBeVisible)
    }, 8000)

    return () => clearInterval(interval)
  }, [isFugitive, game, playerId, position, showNotification])

  // Admin: track all player locations in realtime
  useEffect(() => {
    if (!isAdmin || !game) return

    supabase
      .from('locations')
      .select('*')
      .eq('game_id', game.id)
      .order('created_at', { ascending: false })
      .limit(100)
      .then(({ data }) => {
        if (!data) return
        const latest = new Map<string, { lat: number; lng: number }>()
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        data.forEach((loc: any) => {
          if (!latest.has(loc.player_id)) latest.set(loc.player_id, { lat: loc.latitude, lng: loc.longitude })
        })
        setAllPlayerLocations(latest)
      })

    const channel = supabase
      .channel(`admin-locs-${game.id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'locations', filter: `game_id=eq.${game.id}` }, (payload) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const loc = payload.new as any
        setAllPlayerLocations((prev) => {
          const next = new Map(prev)
          next.set(loc.player_id, { lat: loc.latitude, lng: loc.longitude })
          return next
        })
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [isAdmin, game])

  // Warn fugitive 30s before share
  useEffect(() => {
    if (!isFugitive || !game || game.status !== 'active') return
    if (nextUpdateLeft === 30) showNotification('⚠️ Je locatie wordt over 30 seconden gedeeld!')
  }, [nextUpdateLeft, isFugitive, game, showNotification])

  // Heartbeat
  useEffect(() => {
    if (!playerId) return
    const interval = setInterval(() => {
      supabase.from('players').update({ last_seen_at: new Date().toISOString() }).eq('id', playerId)
    }, 30_000)
    return () => clearInterval(interval)
  }, [playerId])

  const handleCapture = async () => {
    if (!position || !game || !playerId) return { success: false, message: 'Locatie niet beschikbaar' }

    const { data: fugitiveLocations } = await supabase
      .from('locations')
      .select('*')
      .eq('game_id', game.id)
      .order('created_at', { ascending: false })
      .limit(1)

    const fugitiveLoc = fugitiveLocations?.[0]
    if (!fugitiveLoc) return { success: false, message: 'Locatie van boef niet beschikbaar' }

    const distance = haversineDistance(position.latitude, position.longitude, fugitiveLoc.latitude, fugitiveLoc.longitude)
    const fugitivePlayer = players.find((p) => p.role === 'fugitive')

    await supabase.from('capture_events').insert({
      game_id: game.id,
      hunter_player_id: playerId,
      fugitive_player_id: fugitivePlayer?.id ?? '',
      latitude: position.latitude,
      longitude: position.longitude,
      distance_meters: Math.round(distance),
      confirmed: distance <= game.capture_radius_meters,
    })

    if (distance <= game.capture_radius_meters) {
      await supabase.from('games').update({ status: 'finished', winner: 'hunters' }).eq('id', game.id)
      return { success: true, distance, message: `Gevangen! Afstand: ${formatDistance(distance)}` }
    }

    return { success: false, distance, message: `Te ver weg. Afstand: ${formatDistance(distance)}. Radius: ${game.capture_radius_meters}m` }
  }

  const handleSurrender = async () => {
    if (!game) return
    await supabase.from('games').update({ status: 'finished', winner: 'hunters' }).eq('id', game.id)
  }

  const handleAdminEnd = async () => {
    if (!game) return
    await supabase.from('games').update({ status: 'finished', winner: null }).eq('id', game.id)
  }

  const handleAdminPause = async () => {
    if (!game) return
    await supabase.from('games').update({ status: game.status === 'paused' ? 'active' : 'paused' }).eq('id', game.id)
  }

  if (!game || !currentPlayer) {
    return <div className="min-h-svh bg-gray-900 flex items-center justify-center text-gray-400">Laden...</div>
  }

  const mapMarkers = []
  if (position) {
    mapMarkers.push({ lat: position.latitude, lng: position.longitude, type: 'self' as const, label: `Jij (${currentPlayer.user_name})` })
  }
  if (isAdmin) {
    allPlayerLocations.forEach((loc, pid) => {
      if (pid === playerId) return
      const player = players.find((p) => p.id === pid)
      if (!player) return
      const type = player.role === 'fugitive' ? 'fugitive' as const : 'hunter' as const
      mapMarkers.push({ lat: loc.lat, lng: loc.lng, type, label: player.user_name })
    })
  } else if (isHunter && latestFugitiveLocation) {
    mapMarkers.push({ lat: latestFugitiveLocation.latitude, lng: latestFugitiveLocation.longitude, type: 'fugitive' as const, label: `Boef – ${formatRelativeTime(latestFugitiveLocation.created_at)}` })
  } else if (isFugitive) {
    hunterLocations.forEach((loc, pid) => {
      const player = players.find((p) => p.id === pid)
      mapMarkers.push({ lat: loc.lat, lng: loc.lng, type: 'hunter' as const, label: player?.user_name ?? 'Jager' })
    })
  }

  const mapCenter: [number, number] | undefined = position
    ? [position.latitude, position.longitude]
    : isHunter && latestFugitiveLocation
    ? [latestFugitiveLocation.latitude, latestFugitiveLocation.longitude]
    : undefined

  const timerSeconds = game.status === 'headstart' ? headstartLeft : gameLeft
  const timerLabel = game.status === 'headstart' ? 'Voorsprong' : 'Tijd over'

  const statusColor = game.status === 'headstart' ? 'bg-orange-500' : game.status === 'active' ? 'bg-red-500' : 'bg-yellow-500'

  return (
    // Full viewport layout — map fills everything
    <div className="fixed inset-0 bg-gray-900 flex flex-col">

      {/* ── MAP (fills all remaining space) ── */}
      <div className="flex-1 relative">
        <MapView
          center={mapCenter}
          markers={mapMarkers}
          fugitiveHistory={isHunter ? locationHistory : []}
          geofence={
            game.geofence_center_lat && game.geofence_radius_meters
              ? { lat: game.geofence_center_lat, lng: game.geofence_center_lng!, radius: game.geofence_radius_meters }
              : null
          }
          className="w-full h-full"
        />

        {/* ── TOP OVERLAY ── */}
        <div className="absolute top-0 left-0 right-0 z-[500] p-3 flex items-start justify-between pointer-events-none">
          {/* Left: game name + role */}
          <div className="bg-gray-900/85 backdrop-blur-sm rounded-xl px-3 py-2 flex flex-col gap-1 pointer-events-auto border border-gray-700">
            <span className="font-bold text-white text-sm leading-none">{game.name}</span>
            <div className="flex items-center gap-2">
              <RoleBadge role={currentPlayer.role} />
              <span className={`w-2 h-2 rounded-full ${statusColor}`} />
            </div>
          </div>

          {/* Right: timer */}
          <div className="bg-gray-900/85 backdrop-blur-sm rounded-xl px-3 py-2 pointer-events-auto border border-gray-700 text-center">
            <p className="text-xs text-gray-400 leading-none mb-1">{timerLabel}</p>
            <p className={`font-mono font-black text-2xl tabular-nums leading-none ${timerSeconds < 60 ? 'text-red-400' : 'text-white'}`}>
              {String(Math.floor(timerSeconds / 60)).padStart(2, '0')}:{String(timerSeconds % 60).padStart(2, '0')}
            </p>
          </div>
        </div>

        {/* ── NOTIFICATION TOAST ── */}
        {notification && (
          <div className="absolute top-20 left-1/2 -translate-x-1/2 z-[500] bg-orange-600/95 text-white text-sm font-medium px-4 py-2.5 rounded-xl shadow-lg backdrop-blur-sm max-w-xs text-center border border-orange-500 pointer-events-none">
            {notification}
          </div>
        )}

        {/* ── GPS STATUS (bottom-right of map, above panel toggle) ── */}
        <div className="absolute bottom-16 right-3 z-[500] pointer-events-none">
          <div className="bg-gray-900/80 backdrop-blur-sm rounded-lg px-2 py-1 border border-gray-700">
            <LocationStatus accuracy={accuracy} error={geoError} loading={geoLoading} />
          </div>
        </div>

        {/* ── PANEL TOGGLE BUTTON ── */}
        <button
          onClick={() => setPanelOpen((o) => !o)}
          className="absolute bottom-3 left-1/2 -translate-x-1/2 z-[500] bg-gray-800/90 hover:bg-gray-700 backdrop-blur-sm text-white rounded-full px-5 py-2 text-sm font-medium border border-gray-600 flex items-center gap-2 shadow-lg"
        >
          {panelOpen ? '▼ Verberg acties' : '▲ Toon acties'}
        </button>
      </div>

      {/* ── PHASE TRANSITION MODAL ── */}
      {phaseModal && (
        <div
          className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/75 backdrop-blur-sm"
          onClick={() => setPhaseModal(null)}
        >
          <div className="bg-gray-800 border border-gray-600 rounded-2xl p-6 max-w-sm mx-4 text-center shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <p className="text-2xl font-bold text-white mb-2">{phaseModal.title}</p>
            <p className="text-gray-300 text-sm mb-5">{phaseModal.body}</p>
            <button
              className="bg-orange-600 hover:bg-orange-500 text-white font-semibold px-6 py-2.5 rounded-xl transition-colors"
              onClick={() => setPhaseModal(null)}
            >
              Begrepen
            </button>
          </div>
        </div>
      )}

      {/* ── BOTTOM PANEL (collapsible) ── */}
      {panelOpen && (
        <div className="bg-gray-900 border-t border-gray-700 px-4 py-3 flex flex-col gap-3 max-h-[45vh] overflow-y-auto">

          {/* Fugitive info */}
          {isFugitive && game.status === 'active' && (
            <div className="flex justify-between items-center bg-orange-900/30 border border-orange-700 rounded-xl px-4 py-2.5 text-sm">
              <span className="text-orange-300">Volgende ping over</span>
              <span className={`font-mono font-bold ${nextUpdateLeft <= 30 ? 'text-red-400 animate-pulse' : 'text-orange-200'}`}>{nextUpdateLeft}s</span>
            </div>
          )}

          {isFugitive && game.status === 'headstart' && (
            <div className="bg-orange-900/40 border border-orange-600 rounded-xl px-4 py-2.5 text-center">
              <p className="text-orange-300 font-semibold text-sm">🏃 Pak je voorsprong — jagers kunnen je nog niet zien</p>
            </div>
          )}

          {/* Hunter info */}
          {isHunter && latestFugitiveLocation && (
            <div className="flex justify-between items-center bg-blue-900/30 border border-blue-700 rounded-xl px-4 py-2.5 text-sm">
              <span className="text-blue-300">Boef gezien</span>
              <span className="text-blue-200">{formatRelativeTime(latestFugitiveLocation.created_at)}</span>
              {game.status === 'active' && (
                <span className="text-blue-400 text-xs">volgende: {nextUpdateLeft}s</span>
              )}
            </div>
          )}

          {isHunter && !latestFugitiveLocation && game.status === 'active' && (
            <div className="bg-blue-900/20 border border-blue-800 rounded-xl px-4 py-2.5 text-center text-sm text-blue-400">
              Wacht op eerste locatie-ping ({nextUpdateLeft}s)
            </div>
          )}

          {/* Action buttons */}
          <div className="flex flex-col gap-2">
            {game.status === 'active' && isHunter && (
              <CaptureButton onCapture={handleCapture} />
            )}

            {isFugitive && (
              <SurrenderButton onSurrender={handleSurrender} />
            )}

            {isAdmin && (
              <div className="flex gap-2">
                <Button variant="secondary" size="sm" onClick={handleAdminPause} className="flex-1">
                  {game.status === 'paused' ? '▶️ Hervatten' : '⏸️ Pauzeren'}
                </Button>
                <Button variant="danger" size="sm" onClick={handleAdminEnd} className="flex-1">
                  🛑 Beëindigen
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function SurrenderButton({ onSurrender }: { onSurrender: () => void }) {
  const [confirm, setConfirm] = useState(false)
  if (!confirm) {
    return (
      <Button variant="secondary" onClick={() => setConfirm(true)} className="w-full">
        🏳️ Ik geef op
      </Button>
    )
  }
  return (
    <Card className="bg-red-900/40 border-red-700">
      <p className="text-center text-white text-sm mb-3">Weet je zeker dat je wilt opgeven?</p>
      <div className="flex gap-3">
        <Button variant="ghost" className="flex-1" onClick={() => setConfirm(false)}>Annuleer</Button>
        <Button variant="danger" className="flex-1" onClick={onSurrender}>Ja, geef op</Button>
      </div>
    </Card>
  )
}
