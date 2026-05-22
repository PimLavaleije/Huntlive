export type GameStatus = 'waiting' | 'headstart' | 'active' | 'finished' | 'paused'
export type PlayerRole = 'admin' | 'fugitive' | 'hunter'
export type GameWinner = 'fugitive' | 'hunters' | null

export interface Game {
  id: string
  code: string
  name: string
  status: GameStatus
  created_by: string
  duration_minutes: number
  headstart_minutes: number
  location_interval_minutes: number
  capture_radius_meters: number
  rules_text: string | null
  geofence_center_lat: number | null
  geofence_center_lng: number | null
  geofence_radius_meters: number | null
  started_at: string | null
  active_at: string | null
  ends_at: string | null
  winner: GameWinner
  created_at: string
}

export interface Player {
  id: string
  game_id: string
  user_name: string
  role: PlayerRole
  is_host: boolean
  joined_at: string
  last_seen_at: string | null
}

export interface Location {
  id: string
  game_id: string
  player_id: string
  latitude: number
  longitude: number
  accuracy: number | null
  created_at: string
  visible_to_hunters: boolean
}

export interface CaptureEvent {
  id: string
  game_id: string
  hunter_player_id: string
  fugitive_player_id: string
  latitude: number
  longitude: number
  distance_meters: number
  confirmed: boolean
  created_at: string
}

export interface GeolocationState {
  latitude: number | null
  longitude: number | null
  accuracy: number | null
  error: string | null
  loading: boolean
}

export interface GameCreateForm {
  name: string
  duration_minutes: number
  headstart_minutes: number
  location_interval_minutes: number
  capture_radius_meters: number
  rules_text: string
  geofence_radius_meters: number | null
}
