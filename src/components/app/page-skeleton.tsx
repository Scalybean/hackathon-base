/** The shared loading shape: page header, then a content block. */
import { Skeleton } from '@/components/ui/skeleton';

export function PageSkeleton({ stats = false }: { stats?: boolean }) {
  return (
    <div aria-busy="true" aria-live="polite">
      <span className="sr-only">Loading</span>

      <header className="mb-7">
        <div className="rule-accent mb-4 w-full" />
        <Skeleton className="h-9 w-64" />
        <Skeleton className="mt-3 h-4 w-full max-w-sm" />
      </header>

      {stats ? (
        <div className="mb-8 grid gap-4 sm:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-[5.5rem] rounded-[var(--radius-lg)]" />
          ))}
        </div>
      ) : null}

      <Skeleton className="h-64 rounded-[var(--radius-lg)]" />
    </div>
  );
}
