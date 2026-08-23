-- Suggested schema for Phase 2+. Not applied in Phase 1.
-- Enable extensions as needed in the Supabase project.

create extension if not exists "pgcrypto";

create type public.transport_type as enum ('car', 'bus', 'train', 'walk', 'bike');
create type public.travel_style as enum ('relaxed', 'balanced', 'packed');
create type public.place_source as enum ('internal', 'community', 'google', 'mapbox');
create type public.submission_status as enum ('pending', 'approved', 'rejected');

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  username text unique,
  display_name text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.places (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  short_description text not null,
  description text,
  latitude double precision not null,
  longitude double precision not null,
  city text,
  region text,
  category text not null,
  estimated_duration_minutes integer,
  estimated_cost_per_person integer,
  website text,
  image_url text,
  source public.place_source not null default 'internal',
  verified boolean not null default false,
  created_by uuid references public.profiles (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.place_tags (
  id uuid primary key default gen_random_uuid(),
  place_id uuid not null references public.places (id) on delete cascade,
  tag text not null,
  unique (place_id, tag)
);

create table public.trips (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles (id) on delete set null,
  title text not null,
  start_location_name text not null,
  start_latitude double precision,
  start_longitude double precision,
  start_date date not null,
  number_of_days integer not null,
  number_of_people integer not null default 2,
  budget integer,
  transport public.transport_type not null,
  max_distance_km integer,
  travel_style public.travel_style not null default 'balanced',
  additional_preferences text,
  estimated_total_cost integer,
  total_distance_km numeric,
  total_travel_minutes integer,
  is_public boolean not null default false,
  share_slug text unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.trip_days (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips (id) on delete cascade,
  day_number integer not null,
  date date not null,
  unique (trip_id, day_number)
);

create table public.trip_stops (
  id uuid primary key default gen_random_uuid(),
  trip_day_id uuid not null references public.trip_days (id) on delete cascade,
  place_id uuid not null references public.places (id),
  position integer not null,
  arrival_time time not null,
  departure_time time,
  duration_minutes integer not null,
  estimated_cost integer,
  reason text
);

create table public.saved_places (
  user_id uuid not null references public.profiles (id) on delete cascade,
  place_id uuid not null references public.places (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, place_id)
);

create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  place_id uuid not null references public.places (id) on delete cascade,
  rating integer not null check (rating between 1 and 5),
  title text,
  content text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.place_submissions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  name text not null,
  description text not null,
  latitude double precision not null,
  longitude double precision not null,
  category text not null,
  status public.submission_status not null default 'pending',
  moderator_note text,
  created_at timestamptz not null default now(),
  reviewed_at timestamptz
);

alter table public.profiles enable row level security;
alter table public.places enable row level security;
alter table public.place_tags enable row level security;
alter table public.trips enable row level security;
alter table public.trip_days enable row level security;
alter table public.trip_stops enable row level security;
alter table public.saved_places enable row level security;
alter table public.reviews enable row level security;
alter table public.place_submissions enable row level security;

-- Public can read verified places and public trips.
create policy "public_read_verified_places"
  on public.places for select
  using (verified = true);

create policy "public_read_place_tags"
  on public.place_tags for select
  using (
    exists (
      select 1 from public.places p
      where p.id = place_id and p.verified = true
    )
  );

create policy "public_read_public_trips"
  on public.trips for select
  using (is_public = true or user_id = auth.uid());

create policy "owners_manage_trips"
  on public.trips for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "owners_manage_saved_places"
  on public.saved_places for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "owners_manage_reviews"
  on public.reviews for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "public_read_reviews"
  on public.reviews for select
  using (true);

create policy "users_submit_places"
  on public.place_submissions for insert
  with check (user_id = auth.uid());

create policy "users_read_own_submissions"
  on public.place_submissions for select
  using (user_id = auth.uid());

-- Users cannot approve their own submissions or mark places verified.
-- Admin/moderator policies will be added with a role claim in Phase 5.
