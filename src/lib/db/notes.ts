/**
 * Query helpers for the notes resource. Every function takes an authenticated
 * client and re-checks ownership in the WHERE clause even though RLS already
 * enforces it. Belt and braces: see CLAUDE.md rule 6.
 */
import type { SupabaseClient } from '@supabase/supabase-js';

import { notFoundError } from '@/lib/api/errors';
import type { Database, Tables, TablesInsert, TablesUpdate } from '@/types/database';

export type Note = Tables<'notes'>;

type Client = SupabaseClient<Database>;

export async function listNotes(supabase: Client, userId: string): Promise<Note[]> {
  const { data, error } = await supabase
    .from('notes')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(200);

  if (error) throw error;
  return data ?? [];
}

export async function getNote(supabase: Client, userId: string, id: string): Promise<Note> {
  const { data, error } = await supabase
    .from('notes')
    .select('*')
    .eq('id', id)
    .eq('user_id', userId)
    .maybeSingle();

  if (error) throw error;
  // Same error whether the row is missing or belongs to someone else.
  if (!data) throw notFoundError();
  return data;
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
    .select('*')
    .maybeSingle();

  if (error) throw error;
  if (!data) throw notFoundError();
  return data;
}

export async function deleteNote(supabase: Client, userId: string, id: string): Promise<void> {
  const { data, error } = await supabase
    .from('notes')
    .delete()
    .eq('id', id)
    .eq('user_id', userId)
    .select('id')
    .maybeSingle();

  if (error) throw error;
  if (!data) throw notFoundError();
}
