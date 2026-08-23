-- v0.2: accounts, persisted trips, public sharing, RLS
create extension if not exists "pgcrypto";

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.trips (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null,
  description text,
  start_location_name text not null,
  start_latitude double precision,
  start_longitude double precision,
  start_date date not null,
  number_of_days integer not null,
  number_of_people integer not null default 2,
  budget numeric,
  transport text not null,
  max_distance_km numeric,
  travel_style text not null default 'balanced',
  additional_preferences text,
  duration_preset text,
  interests text[] not null default '{}',
  estimated_total_cost numeric,
  total_distance_km numeric,
  total_travel_minutes integer,
  route_coordinates jsonb,
  request_snapshot jsonb,
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
  estimated_distance_km numeric,
  estimated_travel_minutes integer,
  estimated_cost numeric,
  created_at timestamptz not null default now(),
  unique (trip_id, day_number)
);

create table public.trip_stops (
  id uuid primary key default gen_random_uuid(),
  trip_day_id uuid not null references public.trip_days (id) on delete cascade,
  position integer not null,
  place_id uuid,
  external_place_id text,
  name text not null,
  latitude double precision not null,
  longitude double precision not null,
  stop_type text not null default 'place',
  arrival_time text,
  departure_time text,
  duration_minutes integer,
  estimated_cost numeric,
  reason text,
  metadata jsonb,
  created_at timestamptz not null default now()
);

create index trips_user_created_idx on public.trips (user_id, created_at desc);
create index trips_share_slug_idx on public.trips (share_slug);
create index trip_stops_day_position_idx on public.trip_stops (trip_day_id, position);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

create trigger trips_updated_at
  before update on public.trips
  for each row execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    coalesce(
      new.raw_user_meta_data ->> 'display_name',
      split_part(new.email, '@', 1)
    )
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.trips enable row level security;
alter table public.trip_days enable row level security;
alter table public.trip_stops enable row level security;

create policy "profiles_select_own"
  on public.profiles for select
  using (id = auth.uid());

create policy "profiles_update_own"
  on public.profiles for update
  using (id = auth.uid())
  with check (id = auth.uid());

create policy "trips_select_own_or_public"
  on public.trips for select
  using (is_public = true or user_id = auth.uid());

create policy "trips_insert_own"
  on public.trips for insert
  with check (user_id = auth.uid());

create policy "trips_update_own"
  on public.trips for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "trips_delete_own"
  on public.trips for delete
  using (user_id = auth.uid());

create policy "trip_days_select_via_trip"
  on public.trip_days for select
  using (
    exists (
      select 1 from public.trips t
      where t.id = trip_id
        and (t.is_public = true or t.user_id = auth.uid())
    )
  );

create policy "trip_days_write_own"
  on public.trip_days for all
  using (
    exists (
      select 1 from public.trips t
      where t.id = trip_id and t.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.trips t
      where t.id = trip_id and t.user_id = auth.uid()
    )
  );

create policy "trip_stops_select_via_trip"
  on public.trip_stops for select
  using (
    exists (
      select 1
      from public.trip_days d
      join public.trips t on t.id = d.trip_id
      where d.id = trip_day_id
        and (t.is_public = true or t.user_id = auth.uid())
    )
  );

create policy "trip_stops_write_own"
  on public.trip_stops for all
  using (
    exists (
      select 1
      from public.trip_days d
      join public.trips t on t.id = d.trip_id
      where d.id = trip_day_id and t.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1
      from public.trip_days d
      join public.trips t on t.id = d.trip_id
      where d.id = trip_day_id and t.user_id = auth.uid()
    )
  );

grant select, update on public.profiles to authenticated;
grant select, insert, update, delete on public.trips to authenticated;
grant select on public.trips to anon;
grant select, insert, update, delete on public.trip_days to authenticated;
grant select on public.trip_days to anon;
grant select, insert, update, delete on public.trip_stops to authenticated;
grant select on public.trip_stops to anon;
