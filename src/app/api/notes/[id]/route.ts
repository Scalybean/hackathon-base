/**
 * Single-note endpoint. Ownership is re-checked in the query helper on every
 * verb, so a guessed id is a 404 rather than someone else's row.
 */
import { z } from 'zod';

import { notFoundError } from '@/lib/api/errors';
import { route } from '@/lib/api/handler';
import { deleteNote, getNote, updateNote } from '@/lib/db/notes';
import { noteIdSchema, updateNoteSchema } from '@/lib/schemas/notes';

const paramsSchema = z.object({ id: noteIdSchema });

/** A malformed id is "not found", never a validation error that echoes input. */
function noteId(params: Record<string, string>): string {
  const parsed = paramsSchema.safeParse(params);
  if (!parsed.success) throw notFoundError();
  return parsed.data.id;
}

export const GET = route({ rateLimit: 'read' }, async ({ supabase, user, params }) => {
  return getNote(supabase, user.id, noteId(params));
});

export const PATCH = route(
  { rateLimit: 'mutation', body: updateNoteSchema },
  async ({ supabase, user, params, body }) => {
    return updateNote(supabase, user.id, noteId(params), body);
  },
);

export const DELETE = route({ rateLimit: 'mutation' }, async ({ supabase, user, params }) => {
  const id = noteId(params);
  await deleteNote(supabase, user.id, id);
  return { id };
});
