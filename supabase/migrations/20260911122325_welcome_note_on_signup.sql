-- A new account used to land on an empty dashboard reading zero, zero and two
-- dashes, which is the first screen anyone sees. Give them one note.
--
-- The insert is wrapped so that a failure here can never block a signup: an
-- auth trigger that depends on an application table is otherwise a way to
-- break registration by touching public.notes.

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

  begin
    insert into public.notes (user_id, title, body)
    values (
      new.id,
      'Start here',
      'This is a note. Write whatever you like, then use the form on the right to add another.'
      || chr(10) || chr(10) ||
      'Press Cmd K, or Ctrl K, to search everything you have written and jump straight to it.'
      || chr(10) || chr(10) ||
      'Delete a note and you get a moment to undo it, so nothing goes missing by accident.'
      || chr(10) || chr(10) ||
      'You can delete this one whenever you are ready.'
    );
  exception
    when others then
      -- Never let a welcome note stop someone registering.
      null;
  end;

  return new;
end;
$$;

revoke all on function private.handle_new_user() from public, anon, authenticated;
