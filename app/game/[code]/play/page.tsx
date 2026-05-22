'use client'
import { useEffect, useState, useCallback, useRef } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useRealtimeGame } from '@/hooks/useRealtimeGame'
import { useGeolocation } from '@/hooks/useGeolocation'
import { useGameTimer } from '@/hooks/useGameTimer'
import { supabase, saveLocation } from '@/lib/supabase-client'
import { haversineDistance, formatDistance } from '@/lib/distance'
import { isLocationSnapshotMoment, getNextLocationUpdateSeconds, formatRelativeTime } from '@/lib/game-state'
import { requestWakeLock } from '@/lib/geolocation'
import { GameTimer } from '@/components/GameTimer'
import { MapView } from '@/components/MapView'
import { LocationStatus } from '@/components/LocationStatus'
import { GameStatusBanner } from '@/components/GameStatusBanner'
import { CaptureButton } from '@/components/CaptureButton'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { RoleBadge } from '@/components/RoleBadge'
import type { Location } from '@/types'

export default function PlayPage() {
  const router = useRouter()
  const params = useParams()
  const code = (params.code as string).toUpperCase()

  const [playerId, setPlayerId] = useState<string | null>(null)
  const [notification, setNotification] = useState<string | null>(null)
  const notificationTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

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

  // Navigate away when game ends
  useEffect(() => {
    if (game?.status === 'finished') {
      router.push(`/game/${code}/end`)
    }
    if (game?.status === 'waiting') {
      router.push(`/game/${code}/lobby`)
    }
  }, [game?.status, code, router])

  // Notify hunters of new location
  const prevLocationRef = useRef<Location | null>(null)
  useEffect(() => {
    if (!isHunter || !latestFugitiveLocation) return
    if (prevLocationRef.current?.id !== latestFugitiveLocation.id) {
      if (prevLocationRef.current) showNotification('📍 Nieuwe locatie van de boef ontvangen!')
      prevLocationRef.current = latestFugitiveLocation
    }
  }, [latestFugitiveLocation, isHunter, showNotification])

  // Save fugitive location every 8 seconds & make visible on interval moments
  const lastSnapshotRef = useRef<number>(0)
  useEffect(() => {
    if (!isFugitive || !game || !playerId || !position) return
    if (game.status !== 'headstart' && game.status !== 'active') return

    const interval = setInterval(async () => {
      const shouldBeVisible =
        game.status === 'active' &&
        isLocationSnapshotMoment(game) &&
        Date.now() - lastSnapshotRef.current > 30_000 // debounce 30s

      if (shouldBeVisible) {
        lastSnapshotRef.current = Date.now()
        showNotification('📡 Je locatie is gedeeld met de jagers!')
      }

      await saveLocation(
        game.id,
        playerId,
        position.latitude,
        position.longitude,
        position.accuracy,
        shouldBeVisible
      )
    }, 8000)

    return () => clearInterval(interval)
  }, [isFugitive, game, playerId, position, showNotification])

  // Warn fugitive 30 seconds before location share
  useEffect(() => {
    if (!isFugitive || !game || game.status !== 'active') return
    if (nextUpdateLeft === 30) {
      showNotification('⚠️ Je locatie wordt over 30 seconden gedeeld!')
    }
  }, [nextUpdateLeft, isFugitive, game, showNotification])

  // Heartbeat: update last_seen_at
  useEffect(() => {
    if (!playerId) return
    const interval = setInterval(() => {
      supabase.from('players').update({ last_seen_at: new Date().toISOString() }).eq('id', playerId)
    }, 30_000)
    return () => clearInterval(interval)
  }, [playerId])

  const handleCapture = async () => {
    if (!position || !game || !playerId) return { success: false, message: 'Locatie niet beschikbaar' }

    // Get latest actual fugitive location (not just visible snapshot)
    const { data: fugitiveLocations } = await supabase
      .from('locations')
      .select('*')
      .eq('game_id', game.id)
      .order('created_at', { ascending: false })
      .limit(1)

    const fugitiveLoc = fugitiveLocations?.[0]
    if (!fugitiveLoc) return { success: false, message: 'Locatie van boef niet beschikbaar' }

    const distance = haversineDistance(
      position.latitude,
      position.longitude,
      fugitiveLoc.latitude,
      fugitiveLoc.longitude
    )

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

    return {
      success: false,
      distance,
      message: `Te ver weg. Afstand: ${formatDistance(distance)}. Vangradius: ${game.capture_radius_meters}m`,
    }
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
    const newStatus = game.status === 'paused' ? 'active' : 'paused'
    await supabase.from('games').update({ status: newStatus }).eq('id', game.id)
  }

  if (!game || !currentPlayer) {
    return <div className="min-h-svh bg-gray-900 flex items-center justify-center text-gray-400">Laden...</div>
  }

  const mapMarkers = []

  // Own position marker
  if (position) {
    mapMarkers.push({
      lat: position.latitude,
      lng: position.longitude,
      type: 'self' as const,
      label: `Jij (${currentPlayer.user_name})`,
    })
  }

  // Hunter sees latest fugitive location
  if (isHunter && latestFugitiveLocation) {
    mapMarkers.push({
      lat: latestFugitiveLocation.latitude,
      lng: latestFugitiveLocation.longitude,
      type: 'fugitive' as const,
      label: `Boef – ${formatRelativeTime(latestFugitiveLocation.created_at)}`,
    })
  }

  const mapCenter: [number, number] | undefined = position
    ? [position.latitude, position.longitude]
    : isHunter && latestFugitiveLocation
    ? [latestFugitiveLocation.latitude, latestFugitiveLocation.longitude]
    : undefined

  const timerSeconds = game.status === 'headstart' ? headstartLeft : gameLeft
  const timerLabel = game.status === 'headstart' ? 'Voorsprong nog' : 'Tijd over'

  return (
    <main className="min-h-svh bg-gray-900 text-white flex flex-col max-w-lg mx-auto w-full">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800">
        <div className="flex items-center gap-2">
          <span className="font-bold text-sm">{game.name}</span>
          <RoleBadge role={currentPlayer.role} />
        </div>
        <LocationStatus accuracy={accuracy} error={geoError} loading={geoLoading} />
      </div>

      {/* Notification banner */}
      {notification && (
        <div className="bg-orange-600 text-white text-sm font-medium px-4 py-3 text-center animate-pulse">
          {notification}
        </div>
      )}

      {/* Status banner */}
      <div className="px-4 pt-3">
        <GameStatusBanner status={game.status} />
      </div>

      {/* Timer */}
      <div className="flex justify-center py-5">
        <GameTimer
          seconds={timerSeconds}
          label={timerLabel}
          urgent
        />
      </div>

      {/* Map */}
      <div className="px-4">
        <MapView
          center={mapCenter}
          markers={mapMarkers}
          fugitiveHistory={isHunter ? locationHistory : []}
          geofence={
            game.geofence_center_lat && game.geofence_radius_meters
              ? { lat: game.geofence_center_lat, lng: game.geofence_center_lng!, radius: game.geofence_radius_meters }
              : null
          }
          className="w-full h-64 rounded-2xl overflow-hidden"
        />
      </div>

      {/* Role-specific info */}
      <div className="px-4 mt-4 flex flex-col gap-3">
        {isFugitive && (
          <FugitivePanel
            game={game}
            nextUpdateLeft={nextUpdateLeft}
            onSurrender={handleSurrender}
          />
        )}

        {isHunter && !isAdmin && (
          <HunterPanel
            game={game}
            nextUpdateLeft={nextUpdateLeft}
            latestFugitiveLocation={latestFugitiveLocation}
            onCapture={handleCapture}
          />
        )}

        {isAdmin && (
          <AdminPanel
            game={game}
            onEnd={handleAdminEnd}
            onPause={handleAdminPause}
            onCapture={handleCapture}
            nextUpdateLeft={nextUpdateLeft}
            latestFugitiveLocation={latestFugitiveLocation}
          />
        )}
      </div>

      {/* Spacer */}
      <div className="h-8" />
    </main>
  )
}

// --- Sub panels ---

function FugitivePanel({
  game,
  nextUpdateLeft,
  onSurrender,
}: {
  game: import('@/types').Game
  nextUpdateLeft: number
  onSurrender: () => void
}) {
  const [surrenderConfirm, setSurrenderConfirm] = useState(false)

  return (
    <>
      {game.status === 'active' && (
        <Card className="bg-orange-900/30 border-orange-700">
          <div className="flex justify-between text-sm">
            <span className="text-orange-300">Volgende locatie-ping over:</span>
            <span className="font-mono font-bold text-orange-200">{nextUpdateLeft}s</span>
          </div>
          {nextUpdateLeft <= 30 && (
            <p className="text-orange-400 text-xs mt-1 animate-pulse">⚠️ Beweeg je snel!</p>
          )}
        </Card>
      )}

      {game.status === 'headstart' && (
        <Card className="bg-orange-900/40 border-orange-600 text-center">
          <p className="text-orange-300 font-semibold">🏃 Pak je voorsprong!</p>
          <p className="text-orange-200 text-sm mt-1">Jagers kunnen je nog niet zien</p>
        </Card>
      )}

      {!surrenderConfirm ? (
        <Button variant="secondary" onClick={() => setSurrenderConfirm(true)} className="w-full">
          🏳️ Ik geef op
        </Button>
      ) : (
        <Card className="bg-red-900/40 border-red-700">
          <p className="text-center text-white mb-3">Weet je zeker dat je wilt opgeven?</p>
          <div className="flex gap-3">
            <Button variant="ghost" className="flex-1" onClick={() => setSurrenderConfirm(false)}>Annuleer</Button>
            <Button variant="danger" className="flex-1" onClick={onSurrender}>Ja, geef op</Button>
          </div>
        </Card>
      )}
    </>
  )
}

function HunterPanel({
  game,
  nextUpdateLeft,
  latestFugitiveLocation,
  onCapture,
}: {
  game: import('@/types').Game
  nextUpdateLeft: number
  latestFugitiveLocation: Location | null
  onCapture: () => Promise<{ success: boolean; distance?: number; message: string }>
}) {
  return (
    <>
      {latestFugitiveLocation && (
        <Card className="bg-blue-900/30 border-blue-700">
          <div className="flex justify-between text-sm mb-1">
            <span className="text-blue-300">Laatste bekende locatie boef:</span>
            <span className="text-blue-200 text-xs">{formatRelativeTime(latestFugitiveLocation.created_at)}</span>
          </div>
          {game.status === 'active' && (
            <div className="flex justify-between text-sm">
              <span className="text-blue-400">Volgende update over:</span>
              <span className="font-mono font-bold text-blue-200">{nextUpdateLeft}s</span>
            </div>
          )}
        </Card>
      )}

      {!latestFugitiveLocation && game.status === 'active' && (
        <Card className="bg-blue-900/20 border-blue-800 text-center">
          <p className="text-blue-400 text-sm">
            Nog geen locatie ontvangen — wacht op eerste ping ({nextUpdateLeft}s)
          </p>
        </Card>
      )}

      {game.status === 'active' && (
        <CaptureButton onCapture={onCapture} />
      )}
    </>
  )
}

function AdminPanel({
  game,
  onEnd,
  onPause,
  onCapture,
  nextUpdateLeft,
  latestFugitiveLocation,
}: {
  game: import('@/types').Game
  onEnd: () => void
  onPause: () => void
  onCapture: () => Promise<{ success: boolean; distance?: number; message: string }>
  nextUpdateLeft: number
  latestFugitiveLocation: Location | null
}) {
  return (
    <>
      <HunterPanel
        game={game}
        nextUpdateLeft={nextUpdateLeft}
        latestFugitiveLocation={latestFugitiveLocation}
        onCapture={onCapture}
      />
      <Card className="bg-yellow-900/20 border-yellow-700">
        <p className="text-xs text-yellow-400 font-semibold mb-2 uppercase tracking-widest">Admin-controls</p>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" onClick={onPause} className="flex-1">
            {game.status === 'paused' ? '▶️ Hervatten' : '⏸️ Pauzeren'}
          </Button>
          <Button variant="danger" size="sm" onClick={onEnd} className="flex-1">
            🛑 Spel beëindigen
          </Button>
        </div>
      </Card>
    </>
  )
}
