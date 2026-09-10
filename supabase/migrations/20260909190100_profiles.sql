-- profiles: one row per auth.users row, created by a trigger on signup.
-- Holds display name, avatar path and role. Role escalation is blocked twice:
-- once by column-level grants, once by a BEFORE UPDATE trigger.

create type public.user_role as enum ('user', 'admin');

create table public.profiles (
  id           uuid primary key references auth.users (id) on delete cascade,
  display_name text not null default '' check (char_length(display_name) <= 60),
  avatar_path  text check (avatar_path is null or char_length(avatar_path) <= 300),
  role         public.user_role not null default 'user',
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

comment on table public.profiles is 'Public profile per user. Keyed to auth.users.id. Role is server-controlled.';

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function private.set_updated_at();

-- ---------------------------------------------------------------------------
-- Privileges: the client may only ever write display_name and avatar_path.
-- No INSERT grant (the signup trigger creates rows) and no DELETE grant
-- (account deletion goes through the auth.users cascade, service-role only).
-- ---------------------------------------------------------------------------
revoke all on public.profiles from anon, authenticated;
grant select on public.profiles to authenticated;
grant update (display_name, avatar_path) on public.profiles to authenticated;

-- ---------------------------------------------------------------------------
-- is_admin(): SECURITY DEFINER so it bypasses RLS and cannot recurse into the
-- profiles policies that call it. Lives in `private` so PostgREST cannot
-- publish it as an RPC endpoint. RLS policy expressions are evaluated as the
-- querying role, so `authenticated` genuinely needs EXECUTE here.
-- ---------------------------------------------------------------------------
create or replace function private.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = (select auth.uid()) and p.role = 'admin'
  );
$$;

revoke all on function private.is_admin() from public, anon;
grant execute on function private.is_admin() to authenticated;

comment on function private.is_admin is 'True when the calling session belongs to an admin. Use inside RLS policies.';

-- ---------------------------------------------------------------------------
-- RLS: default deny, one policy per operation, ownership from auth.uid().
-- ---------------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.profiles force row level security;

-- Own row only. Other users' profiles are NOT readable by default.
-- To make profiles readable by everyone later, add a separate SELECT policy
-- rather than widening this one. See PATTERNS.md section 1.
create policy profiles_select_own on public.profiles
  for select to authenticated
  using (id = (select auth.uid()));

create policy profiles_select_admin on public.profiles
  for select to authenticated
  using (private.is_admin());

create policy profiles_update_own on public.profiles
  for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

create policy profiles_update_admin on public.profiles
  for update to authenticated
  using (private.is_admin())
  with check (private.is_admin());

-- No INSERT or DELETE policy: both are denied for every client role.

-- ---------------------------------------------------------------------------
-- Belt and braces against role escalation. The column grants above already
-- prevent it, but a future migration that widens the grant would otherwise
-- open a silent hole.
-- ---------------------------------------------------------------------------
create or replace function private.guard_profile_privileged_columns()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if new.id is distinct from old.id then
    raise exception 'profiles.id is immutable';
  end if;
  if new.role is distinct from old.role and not private.is_admin() then
    raise exception 'profiles.role may only be changed by an admin';
  end if;
  return new;
end;
$$;

revoke all on function private.guard_profile_privileged_columns() from public, anon;
grant execute on function private.guard_profile_privileged_columns() to authenticated;

create trigger profiles_guard_privileged_columns
  before update on public.profiles
  for each row execute function private.guard_profile_privileged_columns();

-- ---------------------------------------------------------------------------
-- Signup trigger. raw_user_meta_data is client-controlled, so the display name
-- is trimmed, stripped of control characters and truncated. Role is never read
-- from metadata; every new user starts as 'user'.
-- ---------------------------------------------------------------------------
create or replace function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  raw_name   text;
  clean_name text;
begin
  raw_name := coalesce(new.raw_user_meta_data ->> 'display_name', '');
  clean_name := left(btrim(regexp_replace(raw_name, '[[:cntrl:]]', '', 'g')), 60);

  if clean_name = '' then
    clean_name := left(split_part(coalesce(new.email, 'member'), '@', 1), 60);
  end if;

  insert into public.profiles (id, display_name)
  values (new.id, clean_name)
  on conflict (id) do nothing;

  return new;
end;
$$;

revoke all on function private.handle_new_user() from public, anon, authenticated;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function private.handle_new_user();
