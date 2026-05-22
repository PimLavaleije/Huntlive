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
    <main className="min-h-svh text-white flex flex-col" style={{ background: '#000000' }}>
      {/* Header */}
      <div className="px-4 py-4" style={{ borderBottom: '1px solid #1a2540' }}>
        <div className="flex items-center justify-between">
          <h1 className="font-black tracking-widest uppercase text-white text-sm">{game.name}</h1>
          {currentPlayer && <RoleBadge role={currentPlayer.role} />}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 max-w-lg mx-auto w-full flex flex-col gap-4">
        <GameStatusBanner status={game.status} />

        {/* Game code share */}
        <Card>
          <div className="text-center">
            <p className="text-xs text-gray-600 uppercase tracking-widest mb-2">Deel deze code met je vrienden</p>
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
          <p className="text-xs font-black tracking-widest uppercase text-gray-500 mb-3">Spel-instellingen</p>
          <div className="grid grid-cols-2 gap-2">
            {[
              ['Speelduur', `${game.duration_minutes} min`],
              ['Voorsprong', `${game.headstart_minutes} min`],
              ['Locatie-ping', `elke ${game.location_interval_minutes} min`],
              ['Vangradius', `${game.capture_radius_meters}m`],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between">
                <span className="text-gray-600 text-xs">{k}</span>
                <span className="text-white font-bold text-xs">{v}</span>
              </div>
            ))}
          </div>
          {game.rules_text && (
            <div className="mt-3 pt-3" style={{ borderTop: '1px solid #1a2540' }}>
              <p className="text-xs text-gray-600 mb-1 uppercase tracking-widest">Regels</p>
              <p className="text-sm text-gray-300">{game.rules_text}</p>
            </div>
          )}
        </Card>

        {/* Players */}
        <Card>
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-black tracking-widest uppercase text-gray-500">
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
              style={{ background: 'linear-gradient(135deg, #6b0000, #b91c1c, #991b1b)', border: '1px solid #ef4444', boxShadow: '0 0 24px rgba(239,68,68,0.35)' }}
            >
              🚀 Spel starten
            </Button>
            {players.length < 2 && (
              <p className="text-center text-gray-600 text-xs tracking-widest uppercase">Wacht op meer spelers...</p>
            )}
          </div>
        )}

        {!isHost && (
          <div className="text-center text-gray-600 text-xs py-4 tracking-widest uppercase">
            Wacht tot de spelleider het spel start...
          </div>
        )}
      </div>
    </main>
  )
}

function LoadingScreen() {
  return (
    <div className="min-h-svh flex items-center justify-center" style={{ background: '#000000' }}>
      <div className="text-gray-600 tracking-widest uppercase text-xs">Lobby laden...</div>
    </div>
  )
}

function ErrorScreen({ message }: { message: string }) {
  const router = useRouter()
  return (
    <div className="min-h-svh flex flex-col items-center justify-center gap-4" style={{ background: '#000000' }}>
      <p className="text-red-400">{message}</p>
      <Button onClick={() => router.push('/')}>Terug naar home</Button>
    </div>
  )
}
