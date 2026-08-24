-- Monthly plan quota: 3 generations + 3 edits per generation. Admin/Plus are unlimited.

alter table public.profiles
  add column if not exists plan text not null default 'free';

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'profiles_plan_check'
  ) then
    alter table public.profiles
      add constraint profiles_plan_check check (plan in ('free', 'plus'));
  end if;
end
$$;

create table if not exists public.plan_generations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  edit_count integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists plan_generations_user_created_idx
  on public.plan_generations (user_id, created_at desc);

alter table public.plan_generations enable row level security;

drop policy if exists plan_generations_select_own on public.plan_generations;
create policy plan_generations_select_own
  on public.plan_generations for select
  using (auth.uid() = user_id);

drop policy if exists plan_generations_insert_own on public.plan_generations;
create policy plan_generations_insert_own
  on public.plan_generations for insert
  with check (auth.uid() = user_id);

drop policy if exists plan_generations_update_own on public.plan_generations;
create policy plan_generations_update_own
  on public.plan_generations for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

grant select, insert, update on public.plan_generations to authenticated;
