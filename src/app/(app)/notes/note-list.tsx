/**
 * The note rows. Deleting happens immediately with an Undo in the toast, so
 * there is no confirmation dialog: a dialog taxes the many intentional deletes
 * to guard the rare accidental one.
 */
'use client';

import Link from 'next/link';
import { Trash2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { TBody, TD, TH, THead, TR, Table } from '@/components/ui/table';
import { cn } from '@/lib/cn';
import type { Note } from '@/lib/db/notes';

import { isPendingNote } from './pending';

export type NoteListProps = {
  notes: Note[];
  onDelete: (note: Note) => void;
};

export function NoteList({ notes, onDelete }: NoteListProps) {
  return (
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
          {notes.map((note) => {
            // Still in flight: it has no real id yet, so it cannot be opened.
            const saving = isPendingNote(note.id);

            return (
              <TR key={note.id} className={cn(saving && 'opacity-55')}>
                <TD>
                  {saving ? (
                    <span className="font-medium">{note.title}</span>
                  ) : (
                    <Link href={`/notes/${note.id}`} className="font-medium hover:text-accent">
                      {note.title}
                    </Link>
                  )}
                  {note.body ? (
                    <p className="mt-0.5 line-clamp-1 text-xs text-fg-subtle">{note.body}</p>
                  ) : null}
                </TD>
                <TD className="whitespace-nowrap text-fg-muted">
                  {saving
                    ? 'Saving'
                    : new Date(note.updated_at).toLocaleDateString(undefined, {
                        day: 'numeric',
                        month: 'short',
                      })}
                </TD>
                <TD className="text-right">
                  <Button
                    variant="ghost"
                    size="icon"
                    disabled={saving}
                    aria-label={`Delete ${note.title}`}
                    onClick={() => onDelete(note)}
                  >
                    <Trash2 aria-hidden className="size-3.5" strokeWidth={1.75} />
                  </Button>
                </TD>
              </TR>
            );
          })}
        </TBody>
      </Table>
    </div>
  );
}
