-- Security baseline for the public schema and the private helper schema.
-- Runs first so every later migration inherits a deny-by-default posture.

-- ---------------------------------------------------------------------------
-- Default privileges.
--
-- Two separate footguns are closed here:
--   1. Supabase grants ALL on newly created public tables to anon/authenticated.
--      A table whose RLS was forgotten would be world-readable. We revoke that
--      default so a forgotten table fails loudly (permission denied) instead of
--      leaking silently. Every table must GRANT its columns explicitly.
--   2. Postgres grants EXECUTE on every new function to PUBLIC, and PostgREST
--      publishes public-schema functions at /rest/v1/rpc/<name>. Revoking the
--      PUBLIC default keeps helper and trigger functions off the HTTP surface.
-- ---------------------------------------------------------------------------
alter default privileges in schema public revoke all on tables from anon, authenticated;
alter default privileges in schema public revoke all on sequences from anon, authenticated;
alter default privileges in schema public revoke all on functions from anon, authenticated;
alter default privileges in schema public revoke execute on functions from public;

-- The anon role never touches application data in this template. Public pages
-- are static; every read goes through an authenticated session.
revoke all on schema public from anon;
grant usage on schema public to anon, authenticated;

-- ---------------------------------------------------------------------------
-- private schema: helper and trigger functions live here, NOT in public.
-- PostgREST only exposes the schemas listed in the project's API settings
-- (public, graphql_public), so nothing in here is reachable over HTTP even
-- though RLS policies can still call it.
-- ---------------------------------------------------------------------------
create schema if not exists private;

revoke all on schema private from anon, authenticated, public;
grant usage on schema private to authenticated;

alter default privileges in schema private revoke execute on functions from public;
alter default privileges in schema private revoke all on tables from anon, authenticated;

-- updated_at maintenance, reused by every table.
create or replace function private.set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

revoke all on function private.set_updated_at() from public, anon, authenticated;

comment on function private.set_updated_at is
  'Trigger function: stamps updated_at on UPDATE. Attach to every table with an updated_at column.';
