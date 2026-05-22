'use client'
import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase-client'
import { useRealtimeGame } from '@/hooks/useRealtimeGame'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { PlayerList } from '@/components/PlayerList'
import { GameStatusBanner } from '@/components/GameStatusBanner'
import { RoleBadge } from '@/components/RoleBadge'
import type { Player } from '@/types'

export default function LobbyPage() {
  const router = useRouter()
  const params = useParams()
  const code = (params.code as string).toUpperCase()

  const [playerId, setPlayerId] = useState<string | null>(null)
  const [starting, setStarting] = useState(false)
  const [copied, setCopied] = useState(false)

  const { game, players, loading, error } = useRealtimeGame(code, playerId)

  useEffect(() => {
    const id = sessionStorage.getItem(`player_${code}`)
    if (!id) { router.replace(`/game/${code}`); return }
    setPlayerId(id)
  }, [code, router])

  // Navigate to play screen when game starts
  useEffect(() => {
    if (game?.status === 'headstart' || game?.status === 'active') {
      router.push(`/game/${code}/play`)
    }
    if (game?.status === 'finished') {
      router.push(`/game/${code}/end`)
    }
  }, [game?.status, code, router])

  const currentPlayer = players.find((p) => p.id === playerId)
  const isHost = currentPlayer?.is_host || currentPlayer?.role === 'admin'
  const hasFugitive = players.some((p) => p.role === 'fugitive')

  const handleRoleChange = async (targetPlayerId: string, role: Player['role']) => {
    await supabase.from('players').update({ role }).eq('id', targetPlayerId)
  }

  const handleStart = async () => {
    if (!game || !hasFugitive) return
    setStarting(true)
    const now = new Date()
    const activeAt = new Date(now.getTime() + game.headstart_minutes * 60 * 1000)
    const endsAt = new Date(activeAt.getTime() + game.duration_minutes * 60 * 1000)

    await supabase.from('games').update({
      status: 'headstart',
      started_at: now.toISOString(),
      active_at: activeAt.toISOString(),
      ends_at: endsAt.toISOString(),
    }).eq('id', game.id)
    setStarting(false)
  }

  const handleCopyCode = () => {
    navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleCopyLink = () => {
    navigator.clipboard.writeText(`${window.location.origin}/game/${code}`)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (loading) return <LoadingScreen />
  if (error || !game) return <ErrorScreen message={error ?? 'Spel niet gevonden'} />

  return (
    <main className="min-h-svh bg-gray-900 text-white flex flex-col">
      {/* Header */}
      <div className="px-4 py-4 border-b border-gray-800">
        <div className="flex items-center justify-between">
          <h1 className="font-bold text-lg">{game.name}</h1>
          {currentPlayer && <RoleBadge role={currentPlayer.role} />}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 max-w-lg mx-auto w-full flex flex-col gap-4">
        <GameStatusBanner status={game.status} />

        {/* Game code share */}
        <Card>
          <div className="text-center">
            <p className="text-xs text-gray-500 mb-2">Deel deze code met je vrienden</p>
            <div className="font-mono text-4xl font-black tracking-widest text-white mb-3">{code}</div>
            <div className="flex gap-2 justify-center">
              <Button variant="ghost" size="sm" onClick={handleCopyCode}>
                {copied ? '✓ Gekopieerd' : '📋 Kopieer code'}
              </Button>
              <Button variant="ghost" size="sm" onClick={handleCopyLink}>
                🔗 Kopieer link
              </Button>
            </div>
          </div>
        </Card>

        {/* Game settings summary */}
        <Card>
          <p className="text-xs text-gray-500 mb-3 font-semibold uppercase tracking-widest">Spel-instellingen</p>
          <div className="grid grid-cols-2 gap-2 text-sm">
            {[
              ['Speelduur', `${game.duration_minutes} min`],
              ['Voorsprong', `${game.headstart_minutes} min`],
              ['Locatie-ping', `elke ${game.location_interval_minutes} min`],
              ['Vangradius', `${game.capture_radius_meters}m`],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between">
                <span className="text-gray-500">{k}</span>
                <span className="font-medium">{v}</span>
              </div>
            ))}
          </div>
          {game.rules_text && (
            <div className="mt-3 pt-3 border-t border-gray-700">
              <p className="text-xs text-gray-500 mb-1">Regels</p>
              <p className="text-sm text-gray-300">{game.rules_text}</p>
            </div>
          )}
        </Card>

        {/* Players */}
        <Card>
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs text-gray-500 font-semibold uppercase tracking-widest">
              Spelers ({players.length})
            </p>
            {!hasFugitive && (
              <span className="text-xs text-orange-400 animate-pulse">Wijs een boef aan!</span>
            )}
          </div>
          <PlayerList
            players={players}
            currentPlayerId={playerId}
            showRoles
            onRoleChange={isHost ? handleRoleChange : undefined}
          />
        </Card>

        {/* Start button (host only) */}
        {isHost && (
          <div className="flex flex-col gap-3">
            {!hasFugitive && (
              <p className="text-center text-orange-400 text-sm">
                Je moet eerst een boef aanwijzen voordat je kunt starten.
              </p>
            )}
            <Button
              size="xl"
              loading={starting}
              disabled={!hasFugitive || players.length < 2}
              onClick={handleStart}
              className="w-full"
            >
              🚀 Spel starten
            </Button>
            {players.length < 2 && (
              <p className="text-center text-gray-500 text-xs">Wacht op meer spelers...</p>
            )}
          </div>
        )}

        {!isHost && (
          <div className="text-center text-gray-500 text-sm py-4">
            Wacht tot de spelleider het spel start...
          </div>
        )}
      </div>
    </main>
  )
}

function LoadingScreen() {
  return (
    <div className="min-h-svh bg-gray-900 flex items-center justify-center">
      <div className="text-gray-400">Lobby laden...</div>
    </div>
  )
}

function ErrorScreen({ message }: { message: string }) {
  const router = useRouter()
  return (
    <div className="min-h-svh bg-gray-900 flex flex-col items-center justify-center gap-4">
      <p className="text-red-400">{message}</p>
      <Button onClick={() => router.push('/')}>Terug naar home</Button>
    </div>
  )
}
