-- v0.3: usernames, reviews, submissions, edits, reports, storage, RLS

alter table public.profiles
  add column if not exists username text,
  add column if not exists bio text,
  add column if not exists role text not null default 'user';

alter table public.profiles
  drop constraint if exists profiles_role_check;

alter table public.profiles
  add constraint profiles_role_check check (role in ('user', 'admin'));

create unique index if not exists profiles_username_lower_idx
  on public.profiles (lower(username))
  where username is not null;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name, username)
  values (
    new.id,
    nullif(new.raw_user_meta_data ->> 'display_name', ''),
    nullif(lower(trim(new.raw_user_meta_data ->> 'username')), '')
  )
  on conflict (id) do nothing;
  return new;
exception
  when unique_violation then
    insert into public.profiles (id, display_name)
    values (
      new.id,
      nullif(new.raw_user_meta_data ->> 'display_name', '')
    )
    on conflict (id) do nothing;
    return new;
end;
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select p.role = 'admin' from public.profiles p where p.id = auth.uid()),
    false
  );
$$;

grant execute on function public.is_admin() to anon, authenticated;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_public"
  on public.profiles for select
  using (true);

create or replace function public.protect_profile_role()
returns trigger
language plpgsql
as $$
begin
  -- SQL Editor / migrations have no JWT, so auth.uid() is null. RLS still
  -- blocks anonymous clients from updating profiles.
  if new.role is distinct from old.role
     and auth.uid() is not null
     and not public.is_admin() then
    new.role := old.role;
  end if;
  if new.username is not null then
    new.username := lower(trim(new.username));
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_protect_role on public.profiles;
create trigger profiles_protect_role
  before update on public.profiles
  for each row execute function public.protect_profile_role();

create table if not exists public.places (
  id uuid primary key default gen_random_uuid(),
  place_key text not null unique,
  source text not null,
  external_id text,
  slug text not null,
  name text not null,
  short_description text,
  description text,
  latitude double precision not null,
  longitude double precision not null,
  address text,
  city text,
  region text,
  category text,
  opening_hours text,
  phone text,
  website text,
  instagram text,
  facebook text,
  price_info text,
  parking_info text,
  estimated_duration_minutes integer,
  estimated_cost_per_person numeric,
  environment text,
  family_friendly boolean,
  pet_friendly boolean,
  accessibility_notes text,
  tags text[] not null default '{}',
  image_url text,
  last_verified_at timestamptz,
  is_published boolean not null default true,
  created_by uuid references auth.users (id),
  updated_by uuid references auth.users (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists places_source_external_idx
  on public.places (source, external_id)
  where external_id is not null;
create index if not exists places_slug_idx on public.places (slug);
create index if not exists places_published_idx on public.places (is_published);

create trigger places_updated_at
  before update on public.places
  for each row execute function public.set_updated_at();

create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  place_id uuid not null references public.places (id) on delete cascade,
  place_key text not null,
  user_id uuid not null references auth.users (id) on delete cascade,
  rating integer not null check (rating between 1 and 5),
  title text,
  content text not null,
  visit_date date,
  parking_rating text,
  crowd_level text,
  worth_visiting boolean,
  recommended_for text[] not null default '{}',
  status text not null default 'published' check (status in ('published', 'removed', 'hidden')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  removed_at timestamptz,
  removed_by uuid references auth.users (id),
  removal_reason text,
  unique (user_id, place_id)
);

create index if not exists reviews_place_id_idx on public.reviews (place_id);
create index if not exists reviews_user_id_idx on public.reviews (user_id);
create index if not exists reviews_created_at_idx on public.reviews (created_at desc);
create index if not exists reviews_place_status_idx on public.reviews (place_id, status);

create trigger reviews_updated_at
  before update on public.reviews
  for each row execute function public.set_updated_at();

create table if not exists public.review_photos (
  id uuid primary key default gen_random_uuid(),
  review_id uuid not null references public.reviews (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  storage_path text not null,
  caption text,
  status text not null default 'visible' check (status in ('visible', 'removed', 'hidden')),
  created_at timestamptz not null default now(),
  removed_at timestamptz,
  removed_by uuid references auth.users (id)
);

create index if not exists review_photos_review_id_idx on public.review_photos (review_id);

create table if not exists public.review_votes (
  review_id uuid not null references public.reviews (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  vote smallint not null check (vote in (-1, 1)),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (review_id, user_id)
);

create index if not exists review_votes_review_id_idx on public.review_votes (review_id);

create table if not exists public.review_replies (
  id uuid primary key default gen_random_uuid(),
  review_id uuid not null references public.reviews (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  content text not null,
  status text not null default 'published' check (status in ('published', 'removed', 'hidden')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  removed_at timestamptz,
  removed_by uuid references auth.users (id),
  removal_reason text
);

create index if not exists review_replies_review_id_idx on public.review_replies (review_id);

create trigger review_replies_updated_at
  before update on public.review_replies
  for each row execute function public.set_updated_at();

create table if not exists public.place_submissions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  short_description text not null,
  description text,
  latitude double precision not null,
  longitude double precision not null,
  address text,
  city text,
  region text,
  category text not null,
  opening_hours text,
  phone text,
  website text,
  instagram text,
  facebook text,
  price_info text,
  parking_info text,
  estimated_duration_minutes integer,
  indoor boolean,
  outdoor boolean,
  family_friendly boolean,
  pet_friendly boolean,
  accessibility_notes text,
  tags text[] not null default '{}',
  source_note text,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  public_moderator_note text,
  moderator_note text,
  approved_place_id uuid references public.places (id),
  created_at timestamptz not null default now(),
  reviewed_at timestamptz,
  reviewed_by uuid references auth.users (id)
);

create index if not exists place_submissions_user_id_idx on public.place_submissions (user_id);
create index if not exists place_submissions_status_idx on public.place_submissions (status);

create table if not exists public.place_submission_photos (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid not null references public.place_submissions (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  storage_path text not null,
  caption text,
  created_at timestamptz not null default now()
);

create table if not exists public.place_edit_requests (
  id uuid primary key default gen_random_uuid(),
  place_id uuid not null references public.places (id) on delete cascade,
  place_key text not null,
  user_id uuid not null references auth.users (id) on delete cascade,
  source_note text,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  public_moderator_note text,
  moderator_note text,
  created_at timestamptz not null default now(),
  reviewed_at timestamptz,
  reviewed_by uuid references auth.users (id)
);

create table if not exists public.place_edit_suggestions (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.place_edit_requests (id) on delete cascade,
  place_id uuid not null references public.places (id) on delete cascade,
  place_key text not null,
  user_id uuid not null references auth.users (id) on delete cascade,
  field_name text not null,
  old_value jsonb,
  new_value jsonb not null,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  created_at timestamptz not null default now()
);

create index if not exists place_edit_requests_place_id_idx on public.place_edit_requests (place_id);
create index if not exists place_edit_requests_status_idx on public.place_edit_requests (status);
create index if not exists place_edit_suggestions_place_id_idx on public.place_edit_suggestions (place_id);
create index if not exists place_edit_suggestions_status_idx on public.place_edit_suggestions (status);

create table if not exists public.place_photos (
  id uuid primary key default gen_random_uuid(),
  place_id uuid not null references public.places (id) on delete cascade,
  place_key text not null,
  user_id uuid references auth.users (id),
  storage_path text not null,
  caption text,
  is_primary boolean not null default false,
  source text not null default 'community',
  status text not null default 'visible' check (status in ('visible', 'removed', 'hidden')),
  created_at timestamptz not null default now(),
  removed_at timestamptz,
  removed_by uuid references auth.users (id)
);

create index if not exists place_photos_place_id_idx on public.place_photos (place_id);

create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_user_id uuid not null references auth.users (id) on delete cascade,
  target_type text not null,
  target_id text not null,
  reason text not null,
  details text,
  status text not null default 'open' check (status in ('open', 'resolved', 'dismissed')),
  created_at timestamptz not null default now(),
  resolved_at timestamptz,
  resolved_by uuid references auth.users (id),
  resolution_note text
);

create unique index if not exists reports_unique_open_idx
  on public.reports (reporter_user_id, target_type, target_id)
  where status = 'open';
create index if not exists reports_status_idx on public.reports (status);
create index if not exists reports_target_idx on public.reports (target_type, target_id);

-- RLS
alter table public.places enable row level security;
alter table public.reviews enable row level security;
alter table public.review_photos enable row level security;
alter table public.review_votes enable row level security;
alter table public.review_replies enable row level security;
alter table public.place_submissions enable row level security;
alter table public.place_submission_photos enable row level security;
alter table public.place_edit_requests enable row level security;
alter table public.place_edit_suggestions enable row level security;
alter table public.place_photos enable row level security;
alter table public.reports enable row level security;

create policy "places_select_published"
  on public.places for select
  using (is_published = true or public.is_admin());

create policy "places_write_admin"
  on public.places for all
  using (public.is_admin())
  with check (public.is_admin());

create policy "places_insert_authenticated"
  on public.places for insert
  to authenticated
  with check (
    auth.uid() is not null
    and (
      source in ('internal', 'osm', 'google', 'mapbox')
      or public.is_admin()
    )
  );

create policy "reviews_select_published"
  on public.reviews for select
  using (status = 'published' or user_id = auth.uid() or public.is_admin());

create policy "reviews_insert_own"
  on public.reviews for insert
  with check (user_id = auth.uid());

create policy "reviews_update_own_or_admin"
  on public.reviews for update
  using (user_id = auth.uid() or public.is_admin())
  with check (user_id = auth.uid() or public.is_admin());

create policy "review_photos_select"
  on public.review_photos for select
  using (status = 'visible' or user_id = auth.uid() or public.is_admin());

create policy "review_photos_insert_own"
  on public.review_photos for insert
  with check (user_id = auth.uid());

create policy "review_photos_update_own_or_admin"
  on public.review_photos for update
  using (user_id = auth.uid() or public.is_admin())
  with check (user_id = auth.uid() or public.is_admin());

create policy "review_votes_select"
  on public.review_votes for select
  using (true);

create policy "review_votes_write_own"
  on public.review_votes for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "review_replies_select"
  on public.review_replies for select
  using (status = 'published' or user_id = auth.uid() or public.is_admin());

create policy "review_replies_insert_own"
  on public.review_replies for insert
  with check (user_id = auth.uid());

create policy "review_replies_update_own_or_admin"
  on public.review_replies for update
  using (user_id = auth.uid() or public.is_admin())
  with check (user_id = auth.uid() or public.is_admin());

create policy "place_submissions_select_own_or_admin"
  on public.place_submissions for select
  using (user_id = auth.uid() or public.is_admin());

create policy "place_submissions_insert_own"
  on public.place_submissions for insert
  with check (user_id = auth.uid());

create policy "place_submissions_update_own_pending_or_admin"
  on public.place_submissions for update
  using ((user_id = auth.uid() and status = 'pending') or public.is_admin())
  with check ((user_id = auth.uid() and status = 'pending') or public.is_admin());

create policy "place_submission_photos_select_own_or_admin"
  on public.place_submission_photos for select
  using (user_id = auth.uid() or public.is_admin());

create policy "place_submission_photos_insert_own"
  on public.place_submission_photos for insert
  with check (user_id = auth.uid());

create policy "place_edit_requests_select_own_or_admin"
  on public.place_edit_requests for select
  using (user_id = auth.uid() or public.is_admin());

create policy "place_edit_requests_insert_own"
  on public.place_edit_requests for insert
  with check (user_id = auth.uid());

create policy "place_edit_requests_update_admin"
  on public.place_edit_requests for update
  using (public.is_admin() or (user_id = auth.uid() and status = 'pending'))
  with check (public.is_admin() or (user_id = auth.uid() and status = 'pending'));

create policy "place_edit_suggestions_select_own_or_admin"
  on public.place_edit_suggestions for select
  using (user_id = auth.uid() or public.is_admin());

create policy "place_edit_suggestions_insert_own"
  on public.place_edit_suggestions for insert
  with check (user_id = auth.uid());

create policy "place_edit_suggestions_update_admin"
  on public.place_edit_suggestions for update
  using (public.is_admin() or (user_id = auth.uid() and status = 'pending'))
  with check (public.is_admin() or (user_id = auth.uid() and status = 'pending'));

create policy "place_photos_select"
  on public.place_photos for select
  using (status = 'visible' or user_id = auth.uid() or public.is_admin());

create policy "place_photos_insert_own"
  on public.place_photos for insert
  with check (user_id = auth.uid() or public.is_admin());

create policy "place_photos_update_own_or_admin"
  on public.place_photos for update
  using (user_id = auth.uid() or public.is_admin())
  with check (user_id = auth.uid() or public.is_admin());

create policy "reports_insert_own"
  on public.reports for insert
  with check (reporter_user_id = auth.uid());

create policy "reports_select_own_or_admin"
  on public.reports for select
  using (reporter_user_id = auth.uid() or public.is_admin());

create policy "reports_update_admin"
  on public.reports for update
  using (public.is_admin())
  with check (public.is_admin());

grant select, insert, update on public.places to authenticated;
grant select on public.places to anon;
grant select, insert, update on public.reviews to authenticated;
grant select on public.reviews to anon;
grant select, insert, update on public.review_photos to authenticated;
grant select on public.review_photos to anon;
grant select, insert, update, delete on public.review_votes to authenticated;
grant select on public.review_votes to anon;
grant select, insert, update on public.review_replies to authenticated;
grant select on public.review_replies to anon;
grant select, insert, update on public.place_submissions to authenticated;
grant select, insert on public.place_submission_photos to authenticated;
grant select, insert, update on public.place_edit_requests to authenticated;
grant select, insert, update on public.place_edit_suggestions to authenticated;
grant select, insert, update on public.place_photos to authenticated;
grant select on public.place_photos to anon;
grant select, insert, update on public.reports to authenticated;

create or replace function public.protect_moderation_fields()
returns trigger
language plpgsql
as $$
begin
  if public.is_admin() then
    return new;
  end if;
  if tg_table_name in ('reviews', 'review_replies', 'review_photos', 'place_photos') then
    if old.status in ('removed', 'hidden') and old.removed_by is distinct from auth.uid() then
      new.status := old.status;
      new.removed_at := old.removed_at;
      new.removed_by := old.removed_by;
      if tg_table_name in ('reviews', 'review_replies') then
        new.removal_reason := old.removal_reason;
      end if;
    end if;
  end if;
  if tg_table_name in ('place_submissions', 'place_edit_requests') then
    if old.status is distinct from new.status then
      new.status := old.status;
      new.reviewed_at := old.reviewed_at;
      new.reviewed_by := old.reviewed_by;
    end if;
  end if;
  if tg_table_name = 'place_edit_suggestions' then
    if old.status is distinct from new.status then
      new.status := old.status;
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists reviews_protect_moderation on public.reviews;
create trigger reviews_protect_moderation
  before update on public.reviews
  for each row execute function public.protect_moderation_fields();

drop trigger if exists review_replies_protect_moderation on public.review_replies;
create trigger review_replies_protect_moderation
  before update on public.review_replies
  for each row execute function public.protect_moderation_fields();

drop trigger if exists review_photos_protect_moderation on public.review_photos;
create trigger review_photos_protect_moderation
  before update on public.review_photos
  for each row execute function public.protect_moderation_fields();

drop trigger if exists place_photos_protect_moderation on public.place_photos;
create trigger place_photos_protect_moderation
  before update on public.place_photos
  for each row execute function public.protect_moderation_fields();

drop trigger if exists place_submissions_protect_moderation on public.place_submissions;
create trigger place_submissions_protect_moderation
  before update on public.place_submissions
  for each row execute function public.protect_moderation_fields();

drop trigger if exists place_edit_requests_protect_moderation on public.place_edit_requests;
create trigger place_edit_requests_protect_moderation
  before update on public.place_edit_requests
  for each row execute function public.protect_moderation_fields();

drop trigger if exists place_edit_suggestions_protect_moderation on public.place_edit_suggestions;
create trigger place_edit_suggestions_protect_moderation
  before update on public.place_edit_suggestions
  for each row execute function public.protect_moderation_fields();

-- Storage buckets
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('avatars', 'avatars', true, 5242880, array['image/jpeg', 'image/png', 'image/webp', 'image/jpg']),
  ('review-photos', 'review-photos', true, 10485760, array['image/jpeg', 'image/png', 'image/webp', 'image/jpg']),
  ('place-submission-photos', 'place-submission-photos', true, 10485760, array['image/jpeg', 'image/png', 'image/webp', 'image/jpg'])
on conflict (id) do nothing;

drop policy if exists "avatars_public_read" on storage.objects;
drop policy if exists "avatars_own_write" on storage.objects;
drop policy if exists "avatars_own_update" on storage.objects;
drop policy if exists "avatars_own_delete" on storage.objects;
drop policy if exists "review_photos_public_read" on storage.objects;
drop policy if exists "review_photos_own_write" on storage.objects;
drop policy if exists "review_photos_own_delete" on storage.objects;
drop policy if exists "place_submission_photos_own_read" on storage.objects;
drop policy if exists "place_submission_photos_own_write" on storage.objects;
drop policy if exists "storage_admin_all" on storage.objects;

create policy "avatars_public_read"
  on storage.objects for select
  using (bucket_id = 'avatars');

create policy "avatars_own_write"
  on storage.objects for insert
  with check (
    bucket_id = 'avatars'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "avatars_own_update"
  on storage.objects for update
  using (
    bucket_id = 'avatars'
    and (auth.uid()::text = (storage.foldername(name))[1] or public.is_admin())
  );

create policy "avatars_own_delete"
  on storage.objects for delete
  using (
    bucket_id = 'avatars'
    and (auth.uid()::text = (storage.foldername(name))[1] or public.is_admin())
  );

create policy "review_photos_public_read"
  on storage.objects for select
  using (bucket_id = 'review-photos');

create policy "review_photos_own_write"
  on storage.objects for insert
  with check (
    bucket_id = 'review-photos'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "review_photos_own_delete"
  on storage.objects for delete
  using (
    bucket_id in ('review-photos', 'place-submission-photos')
    and (auth.uid()::text = (storage.foldername(name))[1] or public.is_admin())
  );

create policy "place_submission_photos_own_read"
  on storage.objects for select
  using (bucket_id = 'place-submission-photos');

create policy "place_submission_photos_own_write"
  on storage.objects for insert
  with check (
    bucket_id = 'place-submission-photos'
    and auth.uid()::text = (storage.foldername(name))[1]
  );
