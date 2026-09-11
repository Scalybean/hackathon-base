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
        description="Everything you have written, newest first."
      />

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start">
        <div>
          {notes.length === 0 ? (
            <EmptyState
              icon={FileText}
              title="Nothing here yet"
              description="Write your first one on the right."
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
