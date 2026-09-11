-- Soft delete, so "Undo" is a real operation rather than re-creating a row
-- under a new id. It also means an accidental delete is recoverable, which is
-- the right default for anything a person typed.
--
-- deleted_at is client-writable on purpose: setting and clearing it IS the
-- delete and the undo. RLS still pins every write to the caller's own rows,
-- and user_id remains ungrantable, so ownership is unaffected.

alter table public.notes add column deleted_at timestamptz;

comment on column public.notes.deleted_at is
  'Soft delete. Non-null means hidden from the owner. Every query in src/lib/db/notes.ts filters on this.';

-- The only index the app reads through: live rows for one owner, newest first.
create index notes_user_id_live_idx
  on public.notes (user_id, created_at desc)
  where deleted_at is null;

grant update (title, body, deleted_at) on public.notes to authenticated;
