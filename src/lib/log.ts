/**
 * Server-side error logging. The client only ever sees a trace id, so this is
 * where the real error stays. Never log request bodies or tokens.
 */
import 'server-only';

/** Short, unguessable id correlating a client-visible failure to a server log. */
export function newTraceId(): string {
  return crypto.randomUUID().slice(0, 8);
}

export function logError(traceId: string, scope: string, error: unknown): void {
  const detail =
    error instanceof Error ? { name: error.name, message: error.message, stack: error.stack } : { error };
  console.error(JSON.stringify({ level: 'error', traceId, scope, ...detail }));
}
