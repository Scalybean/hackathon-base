/** The one form-level error banner. Never renders a server error verbatim. */
import { AlertCircle } from 'lucide-react';

export function FormError({ message }: { message?: string }) {
  if (!message) return null;

  return (
    <p
      role="alert"
      className="flex items-start gap-2 rounded-[var(--radius-md)] border border-danger-soft bg-danger-soft px-3 py-2 text-sm text-danger-fg"
    >
      <AlertCircle aria-hidden className="mt-0.5 size-3.5 shrink-0" strokeWidth={2} />
      {message}
    </p>
  );
}
