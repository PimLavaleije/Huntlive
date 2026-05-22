'use client'
import { useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { supabase, getGameByCode } from '@/lib/supabase-client'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card } from '@/components/ui/Card'
import { GameStatusBanner } from '@/components/GameStatusBanner'

export default function JoinGamePage() {
  const router = useRouter()
  const params = useParams()
  const code = (params.code as string).toUpperCase()

  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [gamePreview, setGamePreview] = useState<{ name: string; status: string; playerCount: number } | null>(null)
  const [previewing, setPreviewing] = useState(false)

  // Load game preview on first render
  useState(() => {
    const loadPreview = async () => {
      setPreviewing(true)
      const game = await getGameByCode(code)
      if (game) {
        const { count } = await supabase.from('players').select('*', { count: 'exact', head: true }).eq('game_id', game.id)
        setGamePreview({ name: game.name, status: game.status, playerCount: count ?? 0 })
      } else {
        setError('Spel niet gevonden. Controleer de code.')
      }
      setPreviewing(false)
    }
    loadPreview()
  })

  const handleJoin = async () => {
    if (!name.trim()) { setError('Vul je naam in'); return }
    setLoading(true)
    setError('')

    try {
      const game = await getGameByCode(code)
      if (!game) throw new Error('Spel niet gevonden')
      if (game.status === 'finished') throw new Error('Dit spel is al afgelopen')

      // Check if name is already taken
      const { data: existing } = await supabase
        .from('players')
        .select('id')
        .eq('game_id', game.id)
        .eq('user_name', name.trim())
        .single()

      if (existing) throw new Error('Deze naam is al in gebruik in dit spel')

      const { data: player, error: playerErr } = await supabase.from('players').insert({
        game_id: game.id,
        user_name: name.trim(),
        role: 'hunter',
        is_host: false,
        last_seen_at: new Date().toISOString(),
      }).select().single()

      if (playerErr || !player) throw new Error(playerErr?.message ?? 'Joinen mislukt')

      sessionStorage.setItem(`player_${code}`, player.id)
      sessionStorage.setItem(`player_name_${code}`, name.trim())

      router.push(`/game/${code}/lobby`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Onbekende fout')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-svh bg-gray-900 text-white flex flex-col">
      <div className="flex items-center gap-3 px-4 py-4 border-b border-gray-800">
        <button onClick={() => router.push('/')} className="text-gray-400 hover:text-white">← Home</button>
        <h1 className="font-bold text-lg font-mono tracking-widest">{code}</h1>
      </div>

      <div className="flex-1 flex flex-col justify-center px-5 max-w-sm mx-auto w-full gap-5 py-8">
        {previewing ? (
          <div className="text-center text-gray-400">Spel laden...</div>
        ) : gamePreview ? (
          <>
            <Card className="text-center">
              <p className="text-xs text-gray-500 mb-1">Je gaat joinen:</p>
              <h2 className="font-bold text-xl text-white">{gamePreview.name}</h2>
              <div className="mt-2">
                <GameStatusBanner status={gamePreview.status as never} />
              </div>
              <p className="text-sm text-gray-400 mt-2">{gamePreview.playerCount} spelers joined</p>
            </Card>

            <Input
              label="Jouw naam"
              placeholder="bijv. Stef"
              value={name}
              onChange={(e) => { setName(e.target.value); setError('') }}
              autoFocus
              onKeyDown={(e) => e.key === 'Enter' && handleJoin()}
            />

            {error && <p className="text-red-400 text-sm text-center">{error}</p>}

            <Button size="lg" loading={loading} onClick={handleJoin} className="w-full">
              Join spel als jager
            </Button>
          </>
        ) : (
          <div className="text-center">
            <p className="text-red-400 mb-4">{error || 'Spel niet gevonden'}</p>
            <Button variant="ghost" onClick={() => router.push('/')}>Terug naar home</Button>
          </div>
        )}
      </div>
    </main>
  )
}
