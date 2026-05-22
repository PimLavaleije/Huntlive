@AGENTS.md

# Hunt Live (Chase Zone)

Real-time multiplayer GPS chase game. One fugitive evades hunters in a geofenced area. Built on Next.js 16 App Router + Supabase.

## Stack

- **Next.js 16.2.6** — App Router, `app/` directory, `route.ts` API routes
- **React 19** — use client/server components, no pages router
- **Supabase** — Postgres + Realtime subscriptions for live game state
- **Tailwind v4** — utility classes, no `tailwind.config.ts` (uses defaults)
- **Leaflet** — map rendering via `react-leaflet`, excluded from SSR in `next.config.ts`
- **TypeScript** — strict mode, path alias `@/*` → project root

## Project structure

```
app/
  page.tsx               # Home: enter code or create game
  create/page.tsx        # Create game with settings
  game/[code]/
    page.tsx             # Join screen
    lobby/page.tsx       # Waiting room (host starts game here)
    play/page.tsx        # Active gameplay: map, capture, timers
    end/page.tsx         # Results
  admin/page.tsx         # Admin dashboard (login: admin/admin)
  api/
    admin/route.ts       # GET: list games; POST: login check, join, cleanup
    cleanup/route.ts     # Cron endpoint (requires Bearer CRON_SECRET)

lib/
  supabase-client.ts     # createClient + helpers (getGameByCode, saveLocation, …)
  i18n.ts                # NL/EN translation dictionaries + tr() function
  game-state.ts          # Phase logic, timers, location snapshot timing
  distance.ts            # Haversine distance + geofence check
  geolocation.ts         # GPS watcher, wake lock, error translation

contexts/
  LanguageContext.tsx    # Lang state (localStorage key: chase_lang), useLanguage()

components/
  LangToggle.tsx         # NL/EN pill toggle — add to every new page header
  MapView.tsx            # Leaflet map with player pins, fugitive trail, geofence
  CaptureButton.tsx      # Hunter capture with distance validation
  PlayerList.tsx         # Players with roles + status
  GameTimer.tsx          # Countdown timers
  RoleBadge.tsx          # Role color badge (fugitive=blue, admin=yellow)
  LocationStatus.tsx     # GPS signal indicator
```

## Database

Tables: `games`, `players`, `locations`, `capture_events`. All have `ON DELETE CASCADE`. RLS enabled on all.

- **Client-side code** uses the anon key (`supabase-client.ts`) — subject to RLS
- **API routes** use `SUPABASE_SERVICE_ROLE_KEY` — bypasses RLS, use for admin/cleanup only

Game status flow: `waiting` → `headstart` → `active` → `paused?` → `finished`

## Key conventions

**i18n:** All user-visible strings go through `t('key')` from `useLanguage()`. Add new keys to both `nl` and `en` dicts in `lib/i18n.ts`. Never hardcode Dutch strings in JSX.

**Language toggle:** Import `LangToggle` from `@/components/LangToggle` and place it in the header of every page.

**Player identity:** Stored in `sessionStorage` as `player_${gameCode}` (the player UUID). No auth system — identity is scoped to the browser session.

**Admin auth:** Hardcoded `admin`/`admin` in `app/api/admin/route.ts`. Not for production secrets.

**Maps:** Leaflet must be dynamically imported or wrapped in `'use client'` + `typeof window` guard — it breaks SSR.

## Environment variables

```
NEXT_PUBLIC_SUPABASE_URL        # Public, safe in client
NEXT_PUBLIC_SUPABASE_ANON_KEY   # Public, safe in client
SUPABASE_SERVICE_ROLE_KEY       # Server only — never expose to client
CRON_SECRET                     # Bearer token for /api/cleanup
```

## Deployment

Vercel. Cron job runs `/api/cleanup` daily at 03:00 UTC (configured in `vercel.json`). `CRON_SECRET` must be set in Vercel environment variables for cleanup to work.
