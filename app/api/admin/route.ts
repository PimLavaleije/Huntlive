import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

function makeClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
}

function checkAuth(username: string, password: string) {
  return username === 'admin' && password === 'admin'
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const username = searchParams.get('username') ?? ''
  const password = searchParams.get('password') ?? ''
  if (!checkAuth(username, password)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = makeClient()
  const { data: games } = await supabase
    .from('games')
    .select('id, code, name, status, created_by, created_at, started_at')
    .order('created_at', { ascending: false })
    .limit(50)

  if (!games) return NextResponse.json({ games: [] })

  const counts = await Promise.all(
    games.map((g) =>
      supabase.from('players').select('id', { count: 'exact', head: true }).eq('game_id', g.id)
    )
  )

  const result = games.map((g, i) => ({ ...g, player_count: counts[i].count ?? 0 }))
  return NextResponse.json({ games: result })
}

export async function POST(request: Request) {
  const body = await request.json()
  const { username, password, _check, action } = body

  if (!checkAuth(username, password)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  if (_check) return NextResponse.json({ ok: true })

  const supabase = makeClient()

  if (action === 'join') {
    const { gameId, gameCode } = body
    const { data: player, error } = await supabase.from('players').insert({
      game_id: gameId,
      user_name: 'Admin',
      role: 'admin',
      is_host: false,
      last_seen_at: new Date().toISOString(),
    }).select().single()
    if (error || !player) return NextResponse.json({ error: 'Join mislukt' }, { status: 500 })
    return NextResponse.json({ playerId: player.id, gameCode })
  }

  // cleanup
  const now = new Date()
  const ago7d  = new Date(now.getTime() - 7  * 24 * 60 * 60 * 1000).toISOString()
  const ago24h = new Date(now.getTime() - 24 *      60 * 60 * 1000).toISOString()
  const ago48h = new Date(now.getTime() - 48 *      60 * 60 * 1000).toISOString()

  const [finished, abandoned, stuck] = await Promise.all([
    supabase.from('games').delete().eq('status', 'finished').lt('created_at', ago7d).select('id'),
    supabase.from('games').delete().eq('status', 'waiting').lt('created_at', ago24h).select('id'),
    supabase.from('games').delete().in('status', ['active', 'headstart', 'paused']).lt('created_at', ago48h).select('id'),
  ])

  return NextResponse.json({
    deleted: {
      finished:  finished.data?.length  ?? 0,
      abandoned: abandoned.data?.length ?? 0,
      stuck:     stuck.data?.length     ?? 0,
    },
  })
}
