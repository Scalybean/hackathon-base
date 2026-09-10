/**
 * Notes collection endpoint. The canonical route handler: every export is
 * route(...), which enforces rate limit, auth and Zod before the body runs.
 * See PATTERNS.md §4.
 */
import { route } from '@/lib/api/handler';
import { createNote, listNotes } from '@/lib/db/notes';
import { createNoteSchema } from '@/lib/schemas/notes';

export const GET = route({ rateLimit: 'read' }, async ({ supabase, user }) =>
  listNotes(supabase, user.id),
);

export const POST = route(
  { rateLimit: 'mutation', body: createNoteSchema },
  async ({ supabase, body }) => createNote(supabase, body),
);

// Anything not listed is a 405 from Next itself; there is no catch-all handler.
export const dynamic = 'force-dynamic';
