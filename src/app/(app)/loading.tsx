/**
 * Shown while any protected page fetches. Mirrors the page header plus a
 * content block, so the layout does not jump when the real content lands.
 */
import { Skeleton } from '@/components/ui/skeleton';

export default function Loading() {
  return (
    <div aria-busy="true" aria-live="polite">
      <span className="sr-only">Loading</span>

      <header className="mb-7">
        <div className="rule-accent mb-4 w-full" />
        <Skeleton className="h-9 w-64" />
        <Skeleton className="mt-3 h-4 w-full max-w-sm" />
      </header>

      <div className="grid gap-4 sm:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} className="h-[5.5rem] rounded-[var(--radius-lg)]" />
        ))}
      </div>

      <Skeleton className="mt-8 h-64 rounded-[var(--radius-lg)]" />
    </div>
  );
}
