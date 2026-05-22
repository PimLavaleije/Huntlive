-- ============================================================
-- Chase Zone — Initial Schema
-- ============================================================

-- Games table
CREATE TABLE IF NOT EXISTS games (
  id                        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code                      text NOT NULL UNIQUE,
  name                      text NOT NULL,
  status                    text NOT NULL DEFAULT 'waiting'
                              CHECK (status IN ('waiting','headstart','active','paused','finished')),
  created_by                text NOT NULL,
  duration_minutes          integer NOT NULL DEFAULT 60,
  headstart_minutes         integer NOT NULL DEFAULT 5,
  location_interval_minutes integer NOT NULL DEFAULT 5,
  capture_radius_meters     integer NOT NULL DEFAULT 50,
  rules_text                text,
  geofence_center_lat       double precision,
  geofence_center_lng       double precision,
  geofence_radius_meters    integer,
  started_at                timestamptz,
  active_at                 timestamptz,
  ends_at                   timestamptz,
  winner                    text CHECK (winner IN ('fugitive','hunters') OR winner IS NULL),
  created_at                timestamptz NOT NULL DEFAULT now()
);

-- Players table
CREATE TABLE IF NOT EXISTS players (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id       uuid NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  user_name     text NOT NULL,
  role          text NOT NULL DEFAULT 'hunter'
                  CHECK (role IN ('admin','fugitive','hunter')),
  is_host       boolean NOT NULL DEFAULT false,
  joined_at     timestamptz NOT NULL DEFAULT now(),
  last_seen_at  timestamptz
);

-- Locations table
CREATE TABLE IF NOT EXISTS locations (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id           uuid NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  player_id         uuid NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  latitude          double precision NOT NULL,
  longitude         double precision NOT NULL,
  accuracy          double precision,
  created_at        timestamptz NOT NULL DEFAULT now(),
  visible_to_hunters boolean NOT NULL DEFAULT false
);

-- Capture events table
CREATE TABLE IF NOT EXISTS capture_events (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id             uuid NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  hunter_player_id    uuid NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  fugitive_player_id  uuid NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  latitude            double precision NOT NULL,
  longitude           double precision NOT NULL,
  distance_meters     integer NOT NULL,
  confirmed           boolean NOT NULL DEFAULT false,
  created_at          timestamptz NOT NULL DEFAULT now()
);

-- Indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_games_code           ON games(code);
CREATE INDEX IF NOT EXISTS idx_players_game_id      ON players(game_id);
CREATE INDEX IF NOT EXISTS idx_locations_game_id    ON locations(game_id);
CREATE INDEX IF NOT EXISTS idx_locations_player_id  ON locations(player_id);
CREATE INDEX IF NOT EXISTS idx_locations_visible     ON locations(game_id, visible_to_hunters)
  WHERE visible_to_hunters = true;
CREATE INDEX IF NOT EXISTS idx_capture_game_id      ON capture_events(game_id);

-- ============================================================
-- Row Level Security
-- ============================================================

ALTER TABLE games          ENABLE ROW LEVEL SECURITY;
ALTER TABLE players        ENABLE ROW LEVEL SECURITY;
ALTER TABLE locations      ENABLE ROW LEVEL SECURITY;
ALTER TABLE capture_events ENABLE ROW LEVEL SECURITY;

-- Games: anyone can read (by code), anyone can insert, updates go through api
CREATE POLICY "games_select" ON games FOR SELECT USING (true);
CREATE POLICY "games_insert" ON games FOR INSERT WITH CHECK (true);
CREATE POLICY "games_update" ON games FOR UPDATE USING (true);

-- Players: anyone can read players in any game (needed for lobby)
-- In production you'd scope this to game membership via JWT claims
CREATE POLICY "players_select" ON players FOR SELECT USING (true);
CREATE POLICY "players_insert" ON players FOR INSERT WITH CHECK (true);
CREATE POLICY "players_update" ON players FOR UPDATE USING (true);

-- Locations:
--   Hunters may only read locations where visible_to_hunters = true
--   Fugitives can read all their own locations
--   We enforce this via the API layer (supabase-client.ts) and the visible_to_hunters flag
--   Here we allow all reads (the flag filters the data, not RLS, to allow realtime subscriptions)
CREATE POLICY "locations_select" ON locations FOR SELECT USING (true);
CREATE POLICY "locations_insert" ON locations FOR INSERT WITH CHECK (true);
CREATE POLICY "locations_update" ON locations FOR UPDATE USING (true);

-- Capture events: game participants can read and insert
CREATE POLICY "capture_select" ON capture_events FOR SELECT USING (true);
CREATE POLICY "capture_insert" ON capture_events FOR INSERT WITH CHECK (true);

-- ============================================================
-- Realtime: enable replication for these tables
-- ============================================================
ALTER PUBLICATION supabase_realtime ADD TABLE games;
ALTER PUBLICATION supabase_realtime ADD TABLE players;
ALTER PUBLICATION supabase_realtime ADD TABLE locations;
ALTER PUBLICATION supabase_realtime ADD TABLE capture_events;
