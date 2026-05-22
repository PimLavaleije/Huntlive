import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const { username, password, _check } = await request.json()
  if (username !== 'admin' || password !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  if (_check) return NextResponse.json({ ok: true })

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )

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
