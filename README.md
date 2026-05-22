# Chase Zone — Real-Life GPS Chase Game

Multiplayer GPS-jachtspel: één voortvluchtige probeert te ontsnappen, jagers ontvangen periodiek GPS-pings. Gebouwd met Next.js, Supabase en Leaflet.

## Snel starten

### 1. Supabase instellen

1. Maak een account op [supabase.com](https://supabase.com) en maak een nieuw project.
2. Open **SQL Editor** en voer uit:
   - `supabase/migrations/001_initial.sql` — tabellen + RLS
   - `supabase/migrations/002_seed_demo.sql` — (optioneel) demo-data
3. Kopieer je project-URL en anon key via **Project Settings → API**.

### 2. Environment variabelen

```bash
cp .env.local.example .env.local
# Vul NEXT_PUBLIC_SUPABASE_URL en NEXT_PUBLIC_SUPABASE_ANON_KEY in
```

### 3. Installeren & starten

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Spelverloop

| Fase | Beschrijving |
|------|-------------|
| **Lobby** | Spelers joinen via gamecode. Admin wijst rollen toe. |
| **Voorsprong** | Boef krijgt X minuten om weg te komen. Jagers wachten. |
| **Actief** | Jagers ontvangen elke Y minuten de GPS-locatie van de boef. |
| **Einde** | Tijdslimiet verstreken (boef wint) of boef gevangen (jagers winnen). |

## Projectstructuur

```
app/                    Next.js App Router pagina's
├── page.tsx            Homepagina
├── create/             Spel aanmaken
└── game/[code]/
    ├── page.tsx        Join-pagina
    ├── lobby/          Lobby (wachten op start)
    ├── play/           Spelscherm (boef & jagers)
    └── end/            Eindscherm + tijdlijn

components/
├── GameTimer.tsx       Countdown-timer
├── MapView.tsx         Leaflet kaart (dynamisch geladen)
├── PlayerList.tsx      Spelerslijst met rolbeheer
├── LocationStatus.tsx  GPS-signaalkwaliteit indicator
├── RoleBadge.tsx       Kleurgecodeerde rolbadge
├── GameStatusBanner.tsx Statusbanner per fase
└── CaptureButton.tsx   Vangknop met bevestiging

lib/
├── supabase-client.ts  Supabase helpers
├── geolocation.ts      Browser GPS API wrappers
├── distance.ts         Haversine-formule
└── game-state.ts       Timer & fase-berekeningen

hooks/
├── useGeolocation.ts   Live GPS-positie hook
├── useRealtimeGame.ts  Supabase realtime subscriptions
└── useGameTimer.ts     Aftimers voor alle fases

supabase/migrations/
├── 001_initial.sql     Schema + RLS policies
└── 002_seed_demo.sql   Demo-data
```

## Technische details

- **GPS-opslag**: Boef-locatie wordt elke 8 seconden opgeslagen, maar `visible_to_hunters = true` wordt alleen gezet op exact de intervalmomenten.
- **Realtime**: Supabase realtime subscriptions voor speler-updates, game-status en nieuwe locatie-pings.
- **Capture**: Bij "Boef gevangen" berekent de app de afstand met Haversine en vergelijkt met `capture_radius_meters`.
- **Wake Lock**: De app vraagt om screen wake lock zodat het scherm aan blijft tijdens het spelen.
- **PWA**: Configuratie via `public/manifest.json` voor installatie als app.

## Deployment

Deploy op [Vercel](https://vercel.com): verbind de GitHub repo en voeg de env vars toe.

```bash
npm run build
npm run start
```
