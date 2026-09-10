-- notes: the worked example of an owned resource. `pnpm new:resource` generates
-- this exact shape. Copy it, do not invent a new one.

create table public.notes (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null default auth.uid() references auth.users (id) on delete cascade,
  title      text not null check (char_length(title) between 1 and 200),
  body       text not null default '' check (char_length(body) <= 10000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.notes is 'Example owned resource. Ownership is set by the auth.uid() column default, never by the client.';

create index notes_user_id_created_at_idx on public.notes (user_id, created_at desc);

create trigger notes_set_updated_at
  before update on public.notes
  for each row execute function private.set_updated_at();

-- ---------------------------------------------------------------------------
-- Privileges. user_id is deliberately absent from the INSERT and UPDATE grants:
-- the client cannot set or change an owner even if it tries, and the column
-- default fills it from auth.uid(). This is the "never trust a client user_id"
-- rule enforced by Postgres rather than by our code.
-- ---------------------------------------------------------------------------
revoke all on public.notes from anon, authenticated;
grant select on public.notes to authenticated;
grant insert (title, body) on public.notes to authenticated;
grant update (title, body) on public.notes to authenticated;
grant delete on public.notes to authenticated;

-- ---------------------------------------------------------------------------
-- RLS: default deny, one policy per operation.
-- ---------------------------------------------------------------------------
alter table public.notes enable row level security;
alter table public.notes force row level security;

create policy notes_select_own on public.notes
  for select to authenticated
  using (user_id = (select auth.uid()));

create policy notes_insert_own on public.notes
  for insert to authenticated
  with check (user_id = (select auth.uid()));

create policy notes_update_own on public.notes
  for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy notes_delete_own on public.notes
  for delete to authenticated
  using (user_id = (select auth.uid()));

-- Admins can read every note. Read-only on purpose: an admin panel that can
-- silently edit user content is a bigger liability than one that cannot.
create policy notes_select_admin on public.notes
  for select to authenticated
  using (private.is_admin());
