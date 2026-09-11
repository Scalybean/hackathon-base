/**
 * Notes list, at /notes. It sits in a (list) route group so that its
 * loading.tsx covers only this page: a loading boundary makes a route stream,
 * and a streamed route has already flushed a 200 by the time notFound() runs.
 * /notes/[id] must keep its real 404, so it stays outside the group.
 */
import { PageHeader } from '@/components/app/page-header';
import { requireUser } from '@/lib/auth/require-user';
import { listNotes } from '@/lib/db/notes';

import { NotesWorkspace } from '../notes-workspace';

export const metadata = { title: 'Notes' };

export default async function NotesPage() {
  const { user, supabase } = await requireUser();
  const notes = await listNotes(supabase, user.id);

  return (
    <>
      <PageHeader
        title="Notes"
        description="Everything you have written, newest first."
      />

      <NotesWorkspace notes={notes} />
    </>
  );
}
