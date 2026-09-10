/**
 * Zod schemas for the notes resource. Note what is absent: there is no user_id
 * field. Ownership never travels in a request body. See CLAUDE.md rule 3.
 */
import { z } from 'zod';

export const noteTitleSchema = z
  .string()
  .trim()
  .min(1, 'Enter a title.')
  .max(200, 'Use at most 200 characters.');

export const noteBodySchema = z.string().trim().max(10_000, 'Use at most 10,000 characters.');

export const createNoteSchema = z.object({
  title: noteTitleSchema,
  body: noteBodySchema.default(''),
});

export const updateNoteSchema = z.object({
  title: noteTitleSchema,
  body: noteBodySchema,
});

export const noteIdSchema = z.uuid('Not found.');

export type CreateNoteInput = z.infer<typeof createNoteSchema>;
export type UpdateNoteInput = z.infer<typeof updateNoteSchema>;
