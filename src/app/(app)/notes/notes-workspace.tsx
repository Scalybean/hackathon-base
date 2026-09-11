/**
 * Owns the note list and the composer together, because both mutate the same
 * optimistic state. Creating shows the note immediately; deleting removes it
 * immediately and offers Undo instead of asking first.
 */
'use client';

import { useOptimistic, useRef, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { FileText } from 'lucide-react';

import {
  createNoteAction,
  deleteNoteAction,
  restoreNoteAction,
} from '@/app/(app)/notes/actions';
import { EmptyState } from '@/components/ui/empty-state';
import { toast } from '@/components/ui/toast';
import type { Note } from '@/lib/db/notes';

import { NoteComposer } from './note-composer';
import { NoteList } from './note-list';

type Pending =
  | { kind: 'created'; note: Note }
  | { kind: 'deleted'; id: string };

/** A note that exists only on this client until the server confirms it. */
export function isPendingNote(id: string): boolean {
  return id.startsWith('pending-');
}

export function NotesWorkspace({ notes }: { notes: Note[] }) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [creating, setCreating] = useState(false);

  const [visible, applyPending] = useOptimistic(notes, (current: Note[], pending: Pending) =>
    pending.kind === 'created'
      ? [pending.note, ...current]
      : current.filter((note) => note.id !== pending.id),
  );

  // Survives the re-render that follows a delete, so Undo still knows the id.
  const lastDeleted = useRef<string | null>(null);

  function create(title: string, body: string) {
    const now = new Date().toISOString();
    const optimistic: Note = {
      id: `pending-${now}`,
      user_id: '',
      title,
      body,
      created_at: now,
      updated_at: now,
      deleted_at: null,
    };

    setCreating(true);
    startTransition(async () => {
      applyPending({ kind: 'created', note: optimistic });
      const result = await createNoteAction({ title, body });
      setCreating(false);

      if (!result.ok) {
        toast.error(result.message);
        return;
      }
      router.refresh();
    });
  }

  function remove(note: Note) {
    if (isPendingNote(note.id)) return; // Not saved yet; nothing to delete.

    startTransition(async () => {
      applyPending({ kind: 'deleted', id: note.id });
      const result = await deleteNoteAction({ id: note.id });

      if (!result.ok) {
        toast.error(result.message);
        router.refresh();
        return;
      }

      lastDeleted.current = note.id;
      toast('Note deleted', {
        description: note.title,
        action: { label: 'Undo', onClick: () => restore(note.id) },
      });
      router.refresh();
    });
  }

  function restore(id: string) {
    startTransition(async () => {
      const result = await restoreNoteAction({ id });
      if (!result.ok) {
        toast.error(result.message);
        return;
      }
      lastDeleted.current = null;
      toast.success('Note restored');
      router.refresh();
    });
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start">
      <div>
        {visible.length === 0 ? (
          <EmptyState
            icon={FileText}
            title="Nothing here yet"
            description="Write your first one on the right."
          />
        ) : (
          <NoteList notes={visible} onDelete={remove} />
        )}
      </div>

      <NoteComposer onCreate={create} pending={creating} />
    </div>
  );
}
