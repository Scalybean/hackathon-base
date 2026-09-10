/**
 * Note mutations. Every one of these is the canonical shape: action() handles
 * rate limit, auth and Zod; the query helper re-checks ownership.
 * See PATTERNS.md §3.
 */
'use server';

import { revalidatePath } from 'next/cache';

import { action } from '@/lib/api/action';
import { createNote, deleteNote, updateNote } from '@/lib/db/notes';
import { createNoteSchema, noteIdSchema, updateNoteSchema } from '@/lib/schemas/notes';
import { z } from 'zod';

export const createNoteAction = action(
  { rateLimit: 'mutation', input: createNoteSchema },
  async ({ input, supabase }) => {
    const note = await createNote(supabase, input);
    revalidatePath('/notes');
    revalidatePath('/dashboard');
    return note;
  },
);

export const updateNoteAction = action(
  { rateLimit: 'mutation', input: updateNoteSchema.extend({ id: noteIdSchema }) },
  async ({ input, supabase, user }) => {
    const note = await updateNote(supabase, user.id, input.id, {
      title: input.title,
      body: input.body,
    });
    revalidatePath('/notes');
    revalidatePath(`/notes/${input.id}`);
    return note;
  },
);

export const deleteNoteAction = action(
  { rateLimit: 'mutation', input: z.object({ id: noteIdSchema }) },
  async ({ input, supabase, user }) => {
    await deleteNote(supabase, user.id, input.id);
    revalidatePath('/notes');
    revalidatePath('/dashboard');
    return { id: input.id };
  },
);
