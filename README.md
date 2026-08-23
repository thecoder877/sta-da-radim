# Šta da radim?

Travel planner for Serbia. The app helps people decide where to go, what to visit, and how to organize a day trip or multi-day itinerary from a starting city, date, budget, transport, distance, and interests.

v0.2 adds real accounts, cloud-saved trips, public sharing, and one free anonymous generation per browser. The existing planner, maps, and OSM/OSRM stack are unchanged.

## Stack

- Next.js App Router, TypeScript, Tailwind CSS, shadcn/ui
- Leaflet + CARTO/OSM tiles for trip maps (pins and road routes, no token)
- Official Google Maps Platform APIs when `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` / `GOOGLE_MAPS_API_KEY` are set
- Supabase Auth + Postgres for accounts and saved trips
- Zod + React Hook Form
- Deterministic planner (no OpenAI yet)

## Run locally

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

The planner, Explore, maps, and the first anonymous trip work without Supabase. Accounts, cloud save, and public sharing need a Supabase project. Follow [supabase/README.md](supabase/README.md).

## Environment

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN=
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=
GOOGLE_MAPS_API_KEY=
OPENAI_API_KEY=
```

`NEXT_PUBLIC_SUPABASE_*` are safe to expose to the browser. Never put `SUPABASE_SERVICE_ROLE_KEY` in a `NEXT_PUBLIC_` variable. The service-role key is optional in v0.2 and is not required for Auth, save, or sharing.

## What works now

1. Browse the homepage, Explore, and place pages without an account.
2. Generate **one** complete personalized trip as a visitor.
3. After that first success, further generate/regenerate actions open an auth modal.
4. Register or log in with email/password. The current trip and form stay behind the modal.
5. Save the trip to your account, open it later from **Sačuvano**, share a public link, or delete it.
6. Public `/trip/share/[slug]` pages show the itinerary and map without owner email or account IDs.

Anonymous trips still live in `sessionStorage` until you save them. Logging out does **not** reset the free-generation flag.

## Project structure

- `src/lib/access` — generation quota and pending protected actions
- `src/lib/trips` — session storage, Supabase repository, mappers
- `src/lib/supabase` — browser, server, and middleware clients
- `src/lib/tripPlanner` — distance filtering and scoring (no AI)
- `src/lib/ai/generateTrip.ts` — deterministic planner entry point
- `src/components/map` — Leaflet trip map
- `supabase/migrations` — profiles, trips, days, stops, RLS

## Later phases

- v0.3: AI-assisted itineraries using the existing planner + OpenAI structured output
- Later: reviews, community submissions, subscriptions, weather
