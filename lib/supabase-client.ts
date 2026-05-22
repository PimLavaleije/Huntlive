import { createClient } from '@supabase/supabase-js'
import type { Game, Player, Location } from '@/types'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Use untyped client to avoid complex generic inference issues with Supabase's row types.
// All return types are cast explicitly via helper functions below.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const supabase = createClient<any>(supabaseUrl, supabaseAnonKey, {
  realtime: { params: { eventsPerSecond: 10 } },
})

export async function getGameByCode(code: string): Promise<Game | null> {
  const { data, error } = await supabase
    .from('games')
    .select('*')
    .eq('code', code.toUpperCase())
    .single()
  if (error) return null
  return data as Game
}

export async function getPlayers(gameId: string): Promise<Player[]> {
  const { data } = await supabase
    .from('players')
    .select('*')
    .eq('game_id', gameId)
    .order('joined_at', { ascending: true })
  return (data ?? []) as Player[]
}

export async function getLatestFugitiveLocation(gameId: string): Promise<Location | null> {
  const { data } = await supabase
    .from('locations')
    .select('*')
    .eq('game_id', gameId)
    .eq('visible_to_hunters', true)
    .order('created_at', { ascending: false })
    .limit(1)
  return (data?.[0] ?? null) as Location | null
}

export async function getFugitiveLocationHistory(gameId: string): Promise<Location[]> {
  const { data } = await supabase
    .from('locations')
    .select('*')
    .eq('game_id', gameId)
    .eq('visible_to_hunters', true)
    .order('created_at', { ascending: true })
  return (data ?? []) as Location[]
}

export async function saveLocation(
  gameId: string,
  playerId: string,
  lat: number,
  lng: number,
  accuracy: number | null,
  visibleToHunters: boolean
): Promise<void> {
  await supabase.from('locations').insert({
    game_id: gameId,
    player_id: playerId,
    latitude: lat,
    longitude: lng,
    accuracy,
    visible_to_hunters: visibleToHunters,
  })
}

export async function updateGameStatus(
  gameId: string,
  updates: Partial<Game>
): Promise<void> {
  await supabase.from('games').update(updates).eq('id', gameId)
}

export function generateGameCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  return Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
}
