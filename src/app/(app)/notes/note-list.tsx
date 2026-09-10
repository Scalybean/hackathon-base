/** Note rows with a delete confirmation dialog. */
'use client';

import Link from 'next/link';
import { useState, useTransition } from 'react';
import { Trash2 } from 'lucide-react';

import { deleteNoteAction } from '@/app/(app)/notes/actions';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { TBody, TD, TH, THead, TR, Table } from '@/components/ui/table';
import { toast } from '@/components/ui/toast';
import type { Note } from '@/lib/db/notes';

export function NoteList({ notes }: { notes: Note[] }) {
  const [pendingDelete, setPendingDelete] = useState<Note | null>(null);
  const [isDeleting, startDelete] = useTransition();

  function confirmDelete() {
    if (!pendingDelete) return;
    const note = pendingDelete;

    startDelete(async () => {
      const result = await deleteNoteAction({ id: note.id });
      if (result.ok) {
        toast.success('Note deleted');
      } else {
        toast.error(result.message);
      }
      setPendingDelete(null);
    });
  }

  return (
    <>
      <div className="overflow-hidden rounded-[var(--radius-lg)] border border-border bg-bg-raised">
        <Table>
          <THead>
            <TR>
              <TH>Title</TH>
              <TH>Updated</TH>
              <TH />
            </TR>
          </THead>
          <TBody>
            {notes.map((note) => (
              <TR key={note.id}>
                <TD>
                  <Link href={`/notes/${note.id}`} className="font-medium hover:text-accent">
                    {note.title}
                  </Link>
                  {note.body ? (
                    <p className="mt-0.5 line-clamp-1 text-xs text-fg-subtle">{note.body}</p>
                  ) : null}
                </TD>
                <TD className="whitespace-nowrap text-fg-muted">
                  {new Date(note.updated_at).toLocaleDateString(undefined, {
                    day: 'numeric',
                    month: 'short',
                  })}
                </TD>
                <TD className="text-right">
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={`Delete ${note.title}`}
                    onClick={() => setPendingDelete(note)}
                  >
                    <Trash2 aria-hidden className="size-3.5" strokeWidth={1.75} />
                  </Button>
                </TD>
              </TR>
            ))}
          </TBody>
        </Table>
      </div>

      <Dialog open={pendingDelete !== null} onOpenChange={(open) => !open && setPendingDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete this note?</DialogTitle>
            <DialogDescription>This cannot be undone.</DialogDescription>
          </DialogHeader>
          <DialogBody>
            <p className="text-sm text-fg-muted">
              <span className="font-medium text-fg">{pendingDelete?.title}</span> will be removed
              permanently.
            </p>
          </DialogBody>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setPendingDelete(null)}>
              Cancel
            </Button>
            <Button variant="danger" loading={isDeleting} onClick={confirmDelete}>
              Delete note
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
