# Šta da radim?

AI-powered travel and activity planner for Serbia. The app helps people decide where to go, what to visit, and how to organize a day trip or multi-day itinerary from a starting city, date, budget, transport, distance, and interests.

Phase 1 is a complete local MVP: homepage, trip planner, mock Serbian place catalog, deterministic itinerary generation, trip result page with map, explore, and place pages. Supabase, OpenAI, auth, and sharing come in later phases without rewriting the app.

## Stack

- Next.js App Router, TypeScript, Tailwind CSS, shadcn/ui
- Leaflet + CARTO/OSM tiles for trip maps (pins and road routes, no token)
- MapLibre remains available for place-page fallbacks if needed
- Official Google Maps Platform APIs when `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` / `GOOGLE_MAPS_API_KEY` are set (map tiles, Directions, lodging). This is the supported Google integration — not scraping.
- Zod + React Hook Form
- Prepared adapters for Supabase, OpenAI, routing, geocoding, and weather

## Run locally

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Optional environment variables:

```env
NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN=
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=
GOOGLE_MAPS_API_KEY=
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
OPENAI_API_KEY=
```

Never commit real secrets. Never expose the OpenAI key or Supabase service-role key to the browser.

## What works now

1. Open the homepage and start from **Planiraj putovanje**.
2. Fill the planner form and click **Napravi mi plan**.
3. Review the itinerary, estimates, and map on `/trip/[id]`.
4. Open `/trip/demo` for a sample Fruška gora / Novi Sad day.
5. Browse `/explore` and individual `/place/[slug]` pages. Search works like a map: type a city (`Ruma`, `Beograd`), a kind of place (`bazen`, `manastir`), or a specific name. City searches show nearby places, not only names that contain the word.

Generated trips are stored in `sessionStorage` until a database is connected.

## Project structure

- `src/types` — Place, trip, and user models
- `src/data/mockPlaces.ts` — Internal catalog of Serbian places
- `src/lib/tripPlanner` — Distance filtering and scoring (no AI)
- `src/lib/ai` — Trip generation entry point; Phase 1 uses a deterministic mock
- `src/lib/providers` — Place/geocoding/routing/weather interfaces
- `src/components/map/TripMap.tsx` — Mapbox map with a straight-line route placeholder
- `supabase/migrations` — Suggested schema and RLS for Phase 2+

## Later phases

- Phase 2: Supabase places and trips
- Phase 3: OpenAI itineraries with strict place-id validation
- Phase 4: Auth, saved trips/places, shareable URLs
- Phase 5: Community submissions, reviews, chat edits, weather, real routing
