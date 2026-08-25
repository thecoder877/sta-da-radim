# Supabase setup for Šta da radim?

You do **not** need the Supabase CLI for v0.2. The dashboard SQL editor is enough.

## 1. Create a project

1. Open [https://supabase.com/dashboard](https://supabase.com/dashboard) and sign in.
2. Click **New project**.
3. Choose an organization, name the project (for example `sta-da-radim`), set a database password, and pick a region close to you.
4. Wait until the project is ready.

## 2. Copy environment variables

In the project sidebar open **Project Settings → API**.

Copy these into `.env.local` in the app repo:

| Variable                        | Where it is         | Browser?  |
| ------------------------------- | ------------------- | --------- |
| `NEXT_PUBLIC_SUPABASE_URL`      | Project URL         | yes       |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `anon` `public` key | yes       |
| `SUPABASE_SERVICE_ROLE_KEY`     | `service_role` key  | **never** |

The service-role key can unlock every row. This app does not need it for v0.2. If you store it, keep it server-only and never prefix it with `NEXT_PUBLIC_`.

Restart `npm run dev` after saving `.env.local`.

## 3. Run the database migration

1. In the dashboard open **SQL Editor**.
2. Click **New query**.
3. Paste the full contents of [`migrations/0001_init.sql`](migrations/0001_init.sql).
4. Click **Run**.

That script creates:

- `profiles` (one row per Auth user, created by a trigger on `auth.users`)
- `trips`, `trip_days`, `trip_stops`
- indexes, `updated_at` triggers
- Row Level Security policies
- grants so anonymous visitors can read **public** trips only

If you later install the [Supabase CLI](https://supabase.com/docs/guides/cli), the same file can be applied with `supabase db push`. CLI is optional.

## 4. Auth redirect URLs

Open **Authentication → URL Configuration**.

Set:

- **Site URL**: `http://localhost:3000` for local work
- **Redirect URLs**:
  - `http://localhost:3000/**`
  - `http://127.0.0.1:3000/**`

If you deploy the app, add that origin too, for example `https://your-domain.com/**`.

Email/password in this app stays on the same origin, so a missing redirect URL usually only matters if you later enable magic links or OAuth.

## 5. Email confirmation

Open **Authentication → Providers → Email**.

Two workable setups:

### Local testing (recommended)

Turn **Confirm email** off.

Registration then creates a session immediately. The app can resume a pending save or regenerate without waiting for an inbox.

### Production-like

Leave **Confirm email** on.

After registration the user sees: _Nalog je uspešno napravljen. Proveri email da potvrdiš adresu, pa se prijavi._ They must confirm, then log in. Pending save/generate stays in `sessionStorage` until that login.

Use the dashboard **Authentication → Users** page if you need to confirm a user by hand.

## 6. Other dashboard settings

You do **not** need to enable extra Auth providers for v0.2.

Leave **Enable email signup** on.

Do not turn off RLS on `trips`, `trip_days`, or `trip_stops`.

## 7. How to test Row Level Security

Use two accounts, for example `ana@example.com` and `bora@example.com`.

1. Log in as Ana, generate a trip, click **Sačuvaj**. Leave it private.
2. Copy Ana’s trip URL, `/trip/<uuid>`.
3. Log out. Open that URL, or log in as Bora and open it.
4. Expected: _Putovanje nije pronađeno_. The API returns 404. Guessing the UUID must not reveal the itinerary.
5. As Ana, click **Podeli** and copy `/trip/share/<slug>`.
6. Open that public URL while logged out. The itinerary and map should load. No email or user id should appear.
7. As Ana, click **Isključi deljenje**. Reload the old public URL. Expected: the trip is hidden.
8. As Bora, you must not be able to delete or unshare Ana’s trip. The API returns 401/404.

In **SQL Editor** you can also inspect policies:

```sql
select schemaname, tablename, policyname, cmd, qual
from pg_policies
where tablename in ('profiles', 'trips', 'trip_days', 'trip_stops');
```

## 8. How to test sharing in a private window

1. Log in, save a trip, click **Podeli**. The public link is copied.
2. Open a private/incognito window (or another browser).
3. Paste `/trip/share/...` without logging in.
4. You should see title, dates, origin, days, map, route, stops, hotels, and estimates.
5. You should **not** see Ana’s email, user id, **Sačuvaj**, **Obriši**, or **Isključi deljenje**.
6. Disable sharing in the original window and refresh the incognito tab. The public page should no longer show the itinerary.

## Optional CLI

If you want the CLI later:

```bash
npm install -g supabase
supabase login
supabase link --project-ref <your-project-ref>
supabase db push
```

The project ref is in **Project Settings → General**.
