import type { Game } from '@/types'
import { tr } from './i18n'
import type { Lang } from './i18n'

// Seconds remaining in headstart phase
export function getHeadstartSecondsLeft(game: Game): number {
  if (!game.started_at || game.status !== 'headstart') return 0
  const startedAt = new Date(game.started_at).getTime()
  const headstartMs = game.headstart_minutes * 60 * 1000
  const elapsed = Date.now() - startedAt
  return Math.max(0, Math.round((headstartMs - elapsed) / 1000))
}

// Seconds remaining in the active game phase
export function getGameSecondsLeft(game: Game): number {
  if (!game.ends_at) return 0
  const endsAt = new Date(game.ends_at).getTime()
  return Math.max(0, Math.round((endsAt - Date.now()) / 1000))
}

// Seconds until next hunter location snapshot
export function getNextLocationUpdateSeconds(game: Game): number {
  if (!game.active_at || game.status !== 'active') return 0
  const activeAt = new Date(game.active_at).getTime()
  const intervalMs = game.location_interval_minutes * 60 * 1000
  const elapsed = Date.now() - activeAt
  const msUntilNext = intervalMs - (elapsed % intervalMs)
  return Math.round(msUntilNext / 1000)
}

// True if right now is a location snapshot moment (within 3s window)
export function isLocationSnapshotMoment(game: Game): boolean {
  return getNextLocationUpdateSeconds(game) <= 3
}

// Format seconds as MM:SS
export function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
}

// Format a timestamp to a relative time string (e.g., "3m ago")
export function formatRelativeTime(isoString: string, lang: Lang = 'nl'): string {
  const diff = Math.round((Date.now() - new Date(isoString).getTime()) / 1000)
  if (diff < 60) return tr(lang, 'play_timeAgoSeconds', { n: diff })
  if (diff < 3600) return tr(lang, 'play_timeAgoMinutes', { n: Math.floor(diff / 60) })
  return tr(lang, 'play_timeAgoHours', { n: Math.floor(diff / 3600) })
}
