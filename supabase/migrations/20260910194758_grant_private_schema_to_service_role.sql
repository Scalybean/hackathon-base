-- The trigger functions on public.profiles live in the `private` schema and run
-- SECURITY INVOKER, so the writing role must be able to resolve them. The
-- baseline migration granted that to `authenticated` but not to `service_role`,
-- so every service-role write to profiles failed with
-- "permission denied for schema private". `pnpm seed` died on its first admin.
--
-- This grants no new reachability: PostgREST only publishes the schemas listed
-- in the project's API settings, and `private` is not one of them, so nothing
-- here becomes an HTTP endpoint.

grant usage on schema private to service_role;
grant execute on all functions in schema private to service_role;

-- Cover functions added by later migrations too.
alter default privileges in schema private grant execute on functions to service_role;
