/** Notes list. The worked example of an owned resource. */
import { FileText } from 'lucide-react';

import { PageHeader } from '@/components/app/page-header';
import { EmptyState } from '@/components/ui/empty-state';
import { requireUser } from '@/lib/auth/require-user';
import { listNotes } from '@/lib/db/notes';

import { NoteComposer } from './note-composer';
import { NoteList } from './note-list';

export const metadata = { title: 'Notes' };

export default async function NotesPage() {
  const { user, supabase } = await requireUser();
  const notes = await listNotes(supabase, user.id);

  return (
    <>
      <PageHeader
        title="Notes"
        description="Owned rows. Another signed-in user cannot read, edit or delete any of these, and the database is what stops them."
      />

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start">
        <div>
          {notes.length === 0 ? (
            <EmptyState
              icon={FileText}
              title="Nothing here yet"
              description="Write one on the right. Then sign in as another seeded user and confirm this list stays empty for them."
            />
          ) : (
            <NoteList notes={notes} />
          )}
        </div>

        <NoteComposer />
      </div>
    </>
  );
}
