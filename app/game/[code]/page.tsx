'use client'
import { useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { supabase, getGameByCode } from '@/lib/supabase-client'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card } from '@/components/ui/Card'
import { GameStatusBanner } from '@/components/GameStatusBanner'
import { useLanguage } from '@/contexts/LanguageContext'
import { LangToggle } from '@/components/LangToggle'

export default function JoinGamePage() {
  const router = useRouter()
  const params = useParams()
  const code = (params.code as string).toUpperCase()
  const { t } = useLanguage()

  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [gamePreview, setGamePreview] = useState<{ name: string; status: string; playerCount: number } | null>(null)
  const [previewing, setPreviewing] = useState(false)

  useState(() => {
    const loadPreview = async () => {
      setPreviewing(true)
      const game = await getGameByCode(code)
      if (game) {
        const { count } = await supabase.from('players').select('*', { count: 'exact', head: true }).eq('game_id', game.id)
        setGamePreview({ name: game.name, status: game.status, playerCount: count ?? 0 })
      } else {
        setError(t('join_notFound'))
      }
      setPreviewing(false)
    }
    loadPreview()
  })

  const handleJoin = async () => {
    if (!name.trim()) { setError(t('join_nameError')); return }
    setLoading(true)
    setError('')

    try {
      const game = await getGameByCode(code)
      if (!game) throw new Error(t('join_notFoundShort'))
      if (game.status === 'finished') throw new Error(t('join_alreadyFinished'))

      const { data: existing } = await supabase
        .from('players')
        .select('id')
        .eq('game_id', game.id)
        .eq('user_name', name.trim())
        .single()

      if (existing) throw new Error(t('join_nameTaken'))

      const { data: player, error: playerErr } = await supabase.from('players').insert({
        game_id: game.id,
        user_name: name.trim(),
        role: 'hunter',
        is_host: false,
        last_seen_at: new Date().toISOString(),
      }).select().single()

      if (playerErr || !player) throw new Error(playerErr?.message ?? t('join_failed'))

      sessionStorage.setItem(`player_${code}`, player.id)
      sessionStorage.setItem(`player_name_${code}`, name.trim())

      router.push(`/game/${code}/lobby`)
    } catch (err) {
      setError(err instanceof Error ? err.message : t('join_failed'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-svh text-white flex flex-col" style={{ background: '#000000' }}>
      <div className="flex items-center gap-3 px-4 py-4" style={{ borderBottom: '1px solid #1a2540' }}>
        <button
          onClick={() => router.push('/')}
          className="text-gray-500 hover:text-white transition-colors text-sm tracking-widest uppercase font-bold"
        >
          {t('home')}
        </button>
        <h1 className="font-black tracking-widest font-mono text-white">{code}</h1>
        <div className="ml-auto"><LangToggle /></div>
      </div>

      <div className="flex-1 flex flex-col justify-center px-5 max-w-sm mx-auto w-full gap-5 py-8">
        {previewing ? (
          <div className="text-center text-gray-500 tracking-widest uppercase text-xs">{t('join_loading')}</div>
        ) : gamePreview ? (
          <>
            <Card className="text-center">
              <p className="text-xs text-gray-600 uppercase tracking-widest mb-1">{t('join_joining')}</p>
              <h2 className="font-black text-xl text-white mt-1">{gamePreview.name}</h2>
              <div className="mt-2">
                <GameStatusBanner status={gamePreview.status as never} />
              </div>
              <p className="text-xs text-gray-500 mt-2 tracking-widest">{t('join_playerCount', { n: gamePreview.playerCount })}</p>
            </Card>

            <Input
              label={t('join_yourName')}
              placeholder={t('join_namePlaceholder')}
              value={name}
              onChange={(e) => { setName(e.target.value); setError('') }}
              autoFocus
              onKeyDown={(e) => e.key === 'Enter' && handleJoin()}
            />

            {error && <p className="text-red-400 text-sm text-center">{error}</p>}

            <Button size="lg" loading={loading} onClick={handleJoin} className="w-full">
              {t('join_joinBtn')}
            </Button>
          </>
        ) : (
          <div className="text-center">
            <p className="text-red-400 mb-4">{error || t('join_notFoundShort')}</p>
            <Button variant="ghost" onClick={() => router.push('/')}>{t('backToHome')}</Button>
          </div>
        )}
      </div>
    </main>
  )
}
