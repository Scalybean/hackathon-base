/**
 * Query helpers for the notes resource. Every function takes an authenticated
 * client and re-checks ownership in the WHERE clause even though RLS already
 * enforces it. Belt and braces: see CLAUDE.md rule 6.
 *
 * Deletion is soft. Every read here filters `deleted_at is null`; if you add a
 * query, it belongs in this file so it cannot forget to.
 */
import type { SupabaseClient } from '@supabase/supabase-js';

import { notFoundError } from '@/lib/api/errors';
import type { Database, Tables, TablesInsert, TablesUpdate } from '@/types/database';

export type Note = Tables<'notes'>;

type Client = SupabaseClient<Database>;

const LIST_LIMIT = 200;
const SEARCH_LIMIT = 20;

export async function listNotes(supabase: Client, userId: string): Promise<Note[]> {
  const { data, error } = await supabase
    .from('notes')
    .select('*')
    .eq('user_id', userId)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
    .limit(LIST_LIMIT);

  if (error) throw error;
  return data ?? [];
}

export async function getNote(supabase: Client, userId: string, id: string): Promise<Note> {
  const { data, error } = await supabase
    .from('notes')
    .select('*')
    .eq('id', id)
    .eq('user_id', userId)
    .is('deleted_at', null)
    .maybeSingle();

  if (error) throw error;
  // Same error whether the row is missing or belongs to someone else.
  if (!data) throw notFoundError();
  return data;
}

/**
 * Escapes a user's search term for a PostgREST `or=` filter.
 *
 * Two separate injections are possible here and both are closed:
 *   - PostgREST parses `,` `(` `)` `.` and `"` as filter syntax, so a raw term
 *     could rewrite the query into one selecting other rows.
 *   - `%` and `_` are LIKE wildcards, so a term of `%` would match everything.
 * Exported for tests/search-term.test.ts.
 */
export function escapeSearchTerm(term: string): string {
  return term
    .trim()
    .slice(0, 100)
    // Drop everything PostgREST treats as structure.
    .replace(/[,()".:*\\]/g, ' ')
    // Neutralise LIKE wildcards so they match themselves.
    .replace(/[%_]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Title and body substring search over the caller's own live notes. */
export async function searchNotes(
  supabase: Client,
  userId: string,
  term: string,
): Promise<Note[]> {
  const safe = escapeSearchTerm(term);
  if (safe.length === 0) return [];

  const pattern = `%${safe}%`;

  const { data, error } = await supabase
    .from('notes')
    .select('*')
    .eq('user_id', userId)
    .is('deleted_at', null)
    .or(`title.ilike.${pattern},body.ilike.${pattern}`)
    .order('updated_at', { ascending: false })
    .limit(SEARCH_LIMIT);

  if (error) throw error;
  return data ?? [];
}

export async function createNote(
  supabase: Client,
  input: Pick<TablesInsert<'notes'>, 'title' | 'body'>,
): Promise<Note> {
  // user_id is deliberately not set here. The column default is auth.uid() and
  // the INSERT grant does not include the column, so the database owns it.
  const { data, error } = await supabase
    .from('notes')
    .insert({ title: input.title, body: input.body ?? '' })
    .select('*')
    .single();

  if (error) throw error;
  return data;
}

export async function updateNote(
  supabase: Client,
  userId: string,
  id: string,
  input: Pick<TablesUpdate<'notes'>, 'title' | 'body'>,
): Promise<Note> {
  const { data, error } = await supabase
    .from('notes')
    .update({ title: input.title, body: input.body })
    .eq('id', id)
    .eq('user_id', userId)
    .is('deleted_at', null)
    .select('*')
    .maybeSingle();

  if (error) throw error;
  if (!data) throw notFoundError();
  return data;
}

/** Hides the note. Reversible by restoreNote, which is what Undo calls. */
export async function deleteNote(supabase: Client, userId: string, id: string): Promise<void> {
  const { data, error } = await supabase
    .from('notes')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id)
    .eq('user_id', userId)
    .is('deleted_at', null)
    .select('id')
    .maybeSingle();

  if (error) throw error;
  if (!data) throw notFoundError();
}

export async function restoreNote(supabase: Client, userId: string, id: string): Promise<Note> {
  const { data, error } = await supabase
    .from('notes')
    .update({ deleted_at: null })
    .eq('id', id)
    .eq('user_id', userId)
    .not('deleted_at', 'is', null)
    .select('*')
    .maybeSingle();

  if (error) throw error;
  if (!data) throw notFoundError();
  return data;
}
