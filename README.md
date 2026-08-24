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

Registered accounts get **3 new plans per month** and **3 edits per plan**. After that, a countdown shows when the limit resets (1st of the next month, Europe/Belgrade). Admins are unlimited. Apply `supabase/migrations/0004_plan_quota.sql`. `/upgrade` is the Plus waitlist until billing ships.

## Project structure

- `src/lib/access` — generation quota and pending protected actions
- `src/lib/trips` — session storage, Supabase repository, mappers
- `src/lib/community` — reviews, votes, replies, submissions, edits, reports
- `src/lib/admin` — moderation counts and status changes
- `src/lib/places` — canonical place identity for catalog + OSM + community
- `src/lib/supabase` — browser, server, and middleware clients
- `src/lib/tripPlanner` — distance filtering and scoring (no AI)
- `src/components/map` — Leaflet trip map
- `supabase/migrations` — 0001 accounts/trips, 0002 community/RLS/storage, 0003 admin, 0004 plan quota

## GitHub + Vercel

The app is a standard Next.js project. Create an empty GitHub repo, push `main`, then import that repo in [Vercel](https://vercel.com/new).

```bash
git remote add github https://github.com/<tvoj-nalog>/sta-da-radim.git
git push -u github main
```

In the Vercel project, set these environment variables (same values as `.env.local`):

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (server-only, optional for some admin paths)
- `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` / `GOOGLE_MAPS_API_KEY` (optional)

After the first deploy, add the Vercel URL in Supabase **Authentication → URL Configuration**:

- Site URL: `https://<projekat>.vercel.app`
- Redirect URLs: `https://<projekat>.vercel.app/**`

Also run `supabase/migrations/0004_plan_quota.sql` in the Supabase SQL Editor if you have not already.

`.env.local` is gitignored and must never be committed.

## Later phases

- AI-assisted itineraries using the existing planner + OpenAI structured output
- Community reputation / badges
- Business listing ownership
- Paid plans and quotas
- Weather and live information
