-- The role guard was blocking server-side seeding and administration.
-- private.is_admin() reads auth.uid(), which is null for the service role, so
-- every service-role write to profiles.role was rejected. `pnpm seed` failed
-- on its first admin.
--
-- Privileged database roles are now trusted. They are reachable only from
-- server code holding the secret key, or from a migration. The guard exists to
-- stop the `authenticated` role, which is what a browser holds, and that path
-- is unchanged.

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

  if new.role is distinct from old.role
     and current_user not in ('service_role', 'postgres', 'supabase_admin')
     and not private.is_admin() then
    raise exception 'profiles.role may only be changed by an admin';
  end if;

  return new;
end;
$$;

revoke all on function private.guard_profile_privileged_columns() from public, anon;
grant execute on function private.guard_profile_privileged_columns() to authenticated;
