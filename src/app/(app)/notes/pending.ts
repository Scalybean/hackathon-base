/**
 * Marks a note that exists only on this client until the server confirms it.
 * Its own file so the list and the workspace can both use it without importing
 * each other, which `pnpm graph` correctly refuses.
 */
const PREFIX = 'pending-';

export function pendingNoteId(): string {
  return `${PREFIX}${crypto.randomUUID()}`;
}

export function isPendingNote(id: string): boolean {
  return id.startsWith(PREFIX);
}
