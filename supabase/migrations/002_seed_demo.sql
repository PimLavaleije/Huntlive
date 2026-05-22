-- ============================================================
-- Chase Zone — Demo seed data voor lokaal testen
-- Run AFTER 001_initial.sql
-- ============================================================

-- Demo game (code: DEMO01)
INSERT INTO games (
  id, code, name, status, created_by,
  duration_minutes, headstart_minutes, location_interval_minutes,
  capture_radius_meters, rules_text, winner
) VALUES (
  'aaaaaaaa-0000-0000-0000-000000000001',
  'DEMO01',
  'Demo Jacht Amsterdam',
  'waiting',
  'Spelleider',
  60, 5, 5, 50,
  'Alleen te voet en op de fiets. Geen openbaar vervoer.',
  NULL
) ON CONFLICT (code) DO NOTHING;

-- Host/admin player
INSERT INTO players (id, game_id, user_name, role, is_host) VALUES
  ('bbbbbbbb-0000-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-000000000001', 'Spelleider', 'admin', true)
ON CONFLICT DO NOTHING;

-- Fugitive
INSERT INTO players (id, game_id, user_name, role, is_host) VALUES
  ('bbbbbbbb-0000-0000-0000-000000000002', 'aaaaaaaa-0000-0000-0000-000000000001', 'Max (boef)', 'fugitive', false)
ON CONFLICT DO NOTHING;

-- Hunters
INSERT INTO players (id, game_id, user_name, role, is_host) VALUES
  ('bbbbbbbb-0000-0000-0000-000000000003', 'aaaaaaaa-0000-0000-0000-000000000001', 'Stef', 'hunter', false),
  ('bbbbbbbb-0000-0000-0000-000000000004', 'aaaaaaaa-0000-0000-0000-000000000001', 'Lisa', 'hunter', false)
ON CONFLICT DO NOTHING;
