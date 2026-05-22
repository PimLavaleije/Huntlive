'use client'
import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase-client'
import type { Game, Player, Location } from '@/types'

interface UseRealtimeGameReturn {
  game: Game | null
  players: Player[]
  latestFugitiveLocation: Location | null
  locationHistory: Location[]
  loading: boolean
  error: string | null
  refetchGame: () => Promise<void>
}

export function useRealtimeGame(gameCode: string, playerId: string | null): UseRealtimeGameReturn {
  const [game, setGame] = useState<Game | null>(null)
  const [players, setPlayers] = useState<Player[]>([])
  const [latestFugitiveLocation, setLatestFugitiveLocation] = useState<Location | null>(null)
  const [locationHistory, setLocationHistory] = useState<Location[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchGame = useCallback(async () => {
    const { data, error } = await supabase
      .from('games')
      .select('*')
      .eq('code', gameCode.toUpperCase())
      .single()
    if (error) { setError('Spel niet gevonden'); return }
    setGame(data)
  }, [gameCode])

  const fetchPlayers = useCallback(async (gameId: string) => {
    const { data } = await supabase
      .from('players')
      .select('*')
      .eq('game_id', gameId)
      .order('joined_at', { ascending: true })
    setPlayers(data ?? [])
  }, [])

  const fetchFugitiveLocation = useCallback(async (gameId: string) => {
    const { data } = await supabase
      .from('locations')
      .select('*')
      .eq('game_id', gameId)
      .eq('visible_to_hunters', true)
      .order('created_at', { ascending: false })
      .limit(1)
    if (data && data.length > 0) setLatestFugitiveLocation(data[0])

    const { data: history } = await supabase
      .from('locations')
      .select('*')
      .eq('game_id', gameId)
      .eq('visible_to_hunters', true)
      .order('created_at', { ascending: true })
    setLocationHistory(history ?? [])
  }, [])

  // Initial load
  useEffect(() => {
    setLoading(true)
    fetchGame().then(async () => {
      setLoading(false)
    })
  }, [fetchGame])

  // Fetch players + location when game id is available
  useEffect(() => {
    if (!game) return
    fetchPlayers(game.id)
    fetchFugitiveLocation(game.id)
  }, [game, fetchPlayers, fetchFugitiveLocation])

  // Realtime subscriptions
  useEffect(() => {
    if (!game) return

    const channel = supabase
      .channel(`game-${game.id}`)
      // Game status changes
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'games', filter: `id=eq.${game.id}` }, (payload) => {
        setGame(payload.new as Game)
      })
      // Players joining / updating
      .on('postgres_changes', { event: '*', schema: 'public', table: 'players', filter: `game_id=eq.${game.id}` }, () => {
        fetchPlayers(game.id)
      })
      // New visible fugitive location
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'locations', filter: `game_id=eq.${game.id}` }, (payload) => {
        const loc = payload.new as Location
        if (loc.visible_to_hunters) {
          setLatestFugitiveLocation(loc)
          setLocationHistory((prev) => [...prev, loc])
        }
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [game, fetchPlayers])

  return {
    game,
    players,
    latestFugitiveLocation,
    locationHistory,
    loading,
    error,
    refetchGame: fetchGame,
  }
}
