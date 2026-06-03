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
import { useLanguage } from '@/contexts/LanguageContext'
import { LangToggle } from '@/components/LangToggle'
import type { Player } from '@/types'

export default function LobbyPage() {
  const router = useRouter()
  const params = useParams()
  const code = (params.code as string).toUpperCase()
  const { t } = useLanguage()

  const [playerId, setPlayerId] = useState<string | null>(null)
  const [starting, setStarting] = useState(false)
  const [copied, setCopied] = useState(false)
  const [locationStatus, setLocationStatus] = useState<'checking' | 'granted' | 'denied' | 'prompt' | 'unavailable'>('checking')

  const { game, players, loading, error } = useRealtimeGame(code, playerId)

  useEffect(() => {
    const id = sessionStorage.getItem(`player_${code}`)
    if (!id) { router.replace(`/game/${code}`); return }
    setPlayerId(id)
  }, [code, router])

  useEffect(() => {
    if (!navigator.geolocation) { setLocationStatus('unavailable'); return }
    if (!navigator.permissions) {
      navigator.geolocation.getCurrentPosition(
        () => setLocationStatus('granted'),
        () => setLocationStatus('denied'),
      )
      return
    }
    navigator.permissions.query({ name: 'geolocation' }).then((result) => {
      setLocationStatus(result.state as 'granted' | 'denied' | 'prompt')
      result.onchange = () => setLocationStatus(result.state as 'granted' | 'denied' | 'prompt')
    })
  }, [])

  const requestLocation = () => {
    navigator.geolocation.getCurrentPosition(
      () => setLocationStatus('granted'),
      () => setLocationStatus('denied'),
    )
  }

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

  if (loading) return <LoadingScreen label={t('lobby_loading')} />
  if (error || !game) return <ErrorScreen message={error ?? t('lobby_notFound')} backLabel={t('backToHome')} />

  return (
    <main className="min-h-svh text-white flex flex-col" style={{ background: '#000000' }}>
      <div className="px-4 py-4" style={{ borderBottom: '1px solid #1a2540' }}>
        <div className="flex items-center justify-between">
          <h1 className="font-black tracking-widest uppercase text-white text-sm">{game.name}</h1>
          <div className="flex items-center gap-2">
            <LangToggle />
            {currentPlayer && <RoleBadge role={currentPlayer.role} />}
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 max-w-lg mx-auto w-full flex flex-col gap-4">
        <GameStatusBanner status={game.status} />

        <Card>
          <div className="text-center">
            <p className="text-xs text-gray-600 uppercase tracking-widest mb-2">{t('lobby_shareCode')}</p>
            <div className="font-mono text-4xl font-black tracking-widest text-white mb-3">{code}</div>
            <div className="flex gap-2 justify-center">
              <Button variant="ghost" size="sm" onClick={handleCopyCode}>
                {copied ? t('lobby_copied') : t('lobby_copyCode')}
              </Button>
              <Button variant="ghost" size="sm" onClick={handleCopyLink}>
                {t('lobby_copyLink')}
              </Button>
            </div>
          </div>
        </Card>

        <Card>
          <p className="text-xs font-black tracking-widest uppercase text-gray-500 mb-3">{t('lobby_settings')}</p>
          <div className="grid grid-cols-2 gap-2">
            {[
              [t('lobby_settingsDuration'), t('lobby_settingsDurationVal', { n: game.duration_minutes })],
              [t('lobby_settingsHeadstart'), t('lobby_settingsDurationVal', { n: game.headstart_minutes })],
              [t('lobby_settingsInterval'), t('lobby_settingsIntervalVal', { n: game.location_interval_minutes })],
              [t('lobby_settingsRadius'), t('lobby_settingsRadiusVal', { n: game.capture_radius_meters })],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between">
                <span className="text-gray-600 text-xs">{k}</span>
                <span className="text-white font-bold text-xs">{v}</span>
              </div>
            ))}
          </div>
          {game.rules_text && (
            <div className="mt-3 pt-3" style={{ borderTop: '1px solid #1a2540' }}>
              <p className="text-xs text-gray-600 mb-1 uppercase tracking-widest">{t('lobby_rules')}</p>
              <p className="text-sm text-gray-300">{game.rules_text}</p>
            </div>
          )}
        </Card>

        {locationStatus === 'denied' && (
          <div className="rounded-2xl px-4 py-3 flex flex-col gap-1" style={{ background: '#1c0a0a', border: '1px solid #ef4444' }}>
            <p className="text-red-400 font-black text-sm uppercase tracking-widest">{t('lobby_locationBlocked')}</p>
            <p className="text-red-300 text-xs">{t('lobby_locationBlockedDesc')}</p>
          </div>
        )}
        {(locationStatus === 'prompt' || locationStatus === 'checking') && (
          <div className="rounded-2xl px-4 py-3 flex flex-col gap-2" style={{ background: '#0d1a0a', border: '1px solid #f97316' }}>
            <p className="text-orange-400 font-black text-sm uppercase tracking-widest">{t('lobby_locationRequired')}</p>
            <p className="text-orange-300 text-xs">{t('lobby_locationRequiredDesc')}</p>
            <button
              onClick={requestLocation}
              className="text-xs font-black tracking-widest uppercase text-white rounded-xl px-4 py-2 transition-colors"
              style={{ background: 'linear-gradient(135deg, #92400e, #d97706)', border: '1px solid #f97316' }}
            >
              {t('lobby_enableLocation')}
            </button>
          </div>
        )}
        {locationStatus === 'unavailable' && (
          <div className="rounded-2xl px-4 py-3" style={{ background: '#1c0a0a', border: '1px solid #ef4444' }}>
            <p className="text-red-400 font-black text-sm uppercase tracking-widest">{t('lobby_gpsUnavailable')}</p>
            <p className="text-red-300 text-xs mt-1">{t('lobby_gpsUnavailableDesc')}</p>
          </div>
        )}

        <Card>
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-black tracking-widest uppercase text-gray-500">
              {t('lobby_players', { n: players.length })}
            </p>
            {!hasFugitive && (
              <span className="text-xs text-orange-400 animate-pulse">{t('lobby_assignFugitive')}</span>
            )}
          </div>
          <PlayerList
            players={players}
            currentPlayerId={playerId}
            showRoles
            onRoleChange={isHost ? handleRoleChange : undefined}
          />
        </Card>

        {isHost && (
          <div className="flex flex-col gap-3">
            <div className="rounded-xl px-4 py-3 flex flex-col gap-2" style={{ background: '#0d1018', border: '1px solid #1a2540' }}>
              <div className={`flex items-center gap-2.5 text-sm ${hasFugitive ? 'text-green-400' : 'text-orange-400 animate-pulse'}`}>
                <span className="font-black w-4 text-center">{hasFugitive ? '✓' : '○'}</span>
                <span>{hasFugitive ? t('lobby_reqFugitiveOk') : t('lobby_reqFugitive')}</span>
              </div>
              <div className={`flex items-center gap-2.5 text-sm ${players.length >= 2 ? 'text-green-400' : 'text-gray-500'}`}>
                <span className="font-black w-4 text-center">{players.length >= 2 ? '✓' : '○'}</span>
                <span>{players.length >= 2 ? t('lobby_reqMinPlayersOk', { n: players.length }) : t('lobby_reqMinPlayers', { n: players.length })}</span>
              </div>
            </div>
            <Button
              size="xl"
              loading={starting}
              disabled={!hasFugitive || players.length < 2}
              onClick={handleStart}
              className="w-full"
              style={{ background: hasFugitive && players.length >= 2 ? 'linear-gradient(135deg, #6b0000, #b91c1c, #991b1b)' : '#1a1a1a', border: hasFugitive && players.length >= 2 ? '1px solid #ef4444' : '1px solid #374151', boxShadow: hasFugitive && players.length >= 2 ? '0 0 24px rgba(239,68,68,0.35)' : 'none' }}
            >
              {t('lobby_startGame')}
            </Button>
          </div>
        )}

        {!isHost && (
          <div className="text-center text-gray-600 text-xs py-4 tracking-widest uppercase">
            {t('lobby_waitingHost')}
          </div>
        )}
      </div>
    </main>
  )
}

function LoadingScreen({ label }: { label: string }) {
  return (
    <div className="min-h-svh flex items-center justify-center" style={{ background: '#000000' }}>
      <div className="text-gray-600 tracking-widest uppercase text-xs">{label}</div>
    </div>
  )
}

function ErrorScreen({ message, backLabel }: { message: string; backLabel: string }) {
  const router = useRouter()
  return (
    <div className="min-h-svh flex flex-col items-center justify-center gap-4" style={{ background: '#000000' }}>
      <p className="text-red-400">{message}</p>
      <Button onClick={() => router.push('/')}>{backLabel}</Button>
    </div>
  )
}
