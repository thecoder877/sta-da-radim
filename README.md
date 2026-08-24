# Šta da radim?

Travel planner for Serbia. The app helps people decide where to go, what to visit, and how to organize a day trip or multi-day itinerary from a starting city, date, budget, transport, distance, and interests.

v0.3 adds community reviews, usernames, place submissions, factual edit suggestions, and admin moderation. The existing planner, maps, OSM/OSRM stack, anonymous generation limit, saved trips, and public sharing are unchanged.

## Stack

- Next.js App Router, TypeScript, Tailwind CSS, shadcn/ui
- Leaflet + CARTO/OSM tiles for trip maps (pins and road routes, no token)
- Official Google Maps Platform APIs when `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` / `GOOGLE_MAPS_API_KEY` are set
- Supabase Auth + Postgres for accounts, saved trips, and community content
- Supabase Storage for avatars, review photos, and place-submission photos
- Zod + React Hook Form
- Deterministic planner (no OpenAI yet)
- Walking and cycling times use foot/bike routing and a pace model (~4.5 km/h walk, ~14 km/h bike). A car OSRM duration is never shown as walking time.

## Run locally

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

The planner, Explore, maps, and the first anonymous trip work without Supabase. Accounts, cloud save, sharing, reviews, and contributions need a Supabase project. Follow [supabase/README.md](supabase/README.md).

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

`NEXT_PUBLIC_SUPABASE_*` are the public anon keys. Never put `SUPABASE_SERVICE_ROLE_KEY` or `OPENAI_API_KEY` in a `NEXT_PUBLIC_` variable. `.env.local` is gitignored. Passwords are hashed by Supabase Auth. Community writes go through server auth, Zod validation, and RLS.

## What works now

1. Browse the homepage, Explore, and place pages without an account.
2. Generate **one** complete personalized trip as a visitor.
3. After that first success, further generate/regenerate actions open an auth modal.
4. Register with email, password, username, and optional display name.
5. Save trips, share public links, or delete them. Email is never shown publicly.
6. Write reviews, vote helpful / not helpful, reply once, and report content.
7. Submit a new place or suggest a factual edit. Both wait for admin approval.
8. Admins moderate submissions, edits, reviews, photos, and reports at `/admin`.

Anonymous trips still live in `sessionStorage` until you save them. Logging out does **not** reset the free-generation flag.

## Project structure

- `src/lib/access` — generation quota and pending protected actions
- `src/lib/trips` — session storage, Supabase repository, mappers
- `src/lib/community` — reviews, votes, replies, submissions, edits, reports
- `src/lib/admin` — moderation counts and status changes
- `src/lib/places` — canonical place identity for catalog + OSM + community
- `src/lib/supabase` — browser, server, and middleware clients
- `src/lib/tripPlanner` — distance filtering and scoring (no AI)
- `src/components/map` — Leaflet trip map
- `supabase/migrations` — 0001 accounts/trips, 0002 community/RLS/storage

## Later phases

- AI-assisted itineraries using the existing planner + OpenAI structured output
- Community reputation / badges
- Business listing ownership
- Paid plans and quotas
- Weather and live information
