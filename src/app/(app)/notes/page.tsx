/** Notes list. The worked example of an owned resource. */
import { PageHeader } from '@/components/app/page-header';
import { requireUser } from '@/lib/auth/require-user';
import { listNotes } from '@/lib/db/notes';

import { NotesWorkspace } from './notes-workspace';

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
