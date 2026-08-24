<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Cursor Cloud specific instructions

This is a single Next.js 16 (App Router, Turbopack) app — "Šta da radim?", a deterministic travel planner for Serbia. Node 22 and npm are available; the update script runs `npm install`.

Standard commands (see `package.json`):

- `npm run dev` — dev server on port 3000 (Turbopack). Run it in a background terminal, not in `install`.
- `npm run lint` — ESLint (flat config).
- `npm test` — a single `node --test` suite for `src/lib/access/generationAccess.test.ts` (uses `--experimental-strip-types`).
- `npm run build` — production build (not needed for dev).

Non-obvious notes:

- The core product runs with NO configuration. Copy `.env.example` to `.env.local` (all values blank is fine). The planner, Explore, place pages, maps, and the first anonymous trip generation all work without Supabase or any API keys; the deterministic planner uses bundled OSM data plus OSRM/Nominatim.
- Supabase env vars (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`) are only required for accounts, cloud-saved trips, and public sharing — not for the core planner flow. There is no local Supabase stack; those features expect a hosted Supabase project (see `supabase/README.md`).
- Anonymous trip generation is limited to one per browser (tracked in `sessionStorage`); subsequent generate/regenerate actions open an auth modal. Clear site data / use a fresh browser profile to re-test the anonymous flow.
