/**
 * Single note. The IDOR case: getNote() filters on user_id as well as id, so a
 * guessed id returns the same 404 as a non-existent one — even though RLS
 * would already have blocked the read.
 */
import { notFound } from 'next/navigation';

import { Breadcrumb } from '@/components/app/breadcrumb';
import { PageHeader } from '@/components/app/page-header';
import { ApiError } from '@/lib/api/errors';
import { requireUser } from '@/lib/auth/require-user';
import { getNote } from '@/lib/db/notes';
import { noteIdSchema } from '@/lib/schemas/notes';

import { NoteEditor } from './note-editor';

export const metadata = { title: 'Note' };

export default async function NotePage(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params;

  // A malformed id is a 404, not a 500 and not a database error.
  const parsed = noteIdSchema.safeParse(id);
  if (!parsed.success) notFound();

  const { user, supabase } = await requireUser();

  try {
    const note = await getNote(supabase, user.id, parsed.data);

    return (
      <>
        <div className="mb-4">
          <Breadcrumb items={[{ label: 'Notes', href: '/notes' }, { label: note.title }]} />
        </div>
        <PageHeader title={note.title} />
        <NoteEditor note={note} />
      </>
    );
  } catch (error) {
    if (error instanceof ApiError && error.code === 'not_found') notFound();
    throw error;
  }
}
