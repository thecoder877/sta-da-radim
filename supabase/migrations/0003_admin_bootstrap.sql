-- Allow the first admin to be set from the Supabase SQL Editor.
-- The previous trigger treated a missing JWT as a non-admin and silently
-- kept role = 'user'.

create or replace function public.protect_profile_role()
returns trigger
language plpgsql
as $$
begin
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
