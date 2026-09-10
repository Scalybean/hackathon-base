/**
 * Public auth shell. A two-column split, not a card floating on grey: the left
 * panel is editorial, the right is the form.
 */
import Link from 'next/link';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-dvh lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
      <aside className="relative hidden flex-col justify-between overflow-hidden border-r border-border bg-bg-inset px-12 py-14 lg:flex">
        <Link href="/" className="flex items-baseline gap-2">
          <span className="font-display text-2xl font-semibold tracking-tight">Base</span>
          <span className="h-1.5 w-1.5 rounded-full bg-accent" />
        </Link>

        <div className="max-w-md">
          <div className="rule-accent mb-8 w-32" />
          <p className="font-display text-4xl leading-[1.08] tracking-[-0.02em]">
            Ship the product.
            <br />
            The plumbing is
            <span className="text-accent"> already done</span>.
          </p>
          <p className="mt-6 max-w-sm text-sm leading-relaxed text-fg-muted">
            Row-level security on every table, a single authenticated entry point for
            server code, and rate limits on everything that writes.
          </p>
        </div>

        <p className="font-mono text-2xs uppercase tracking-[0.14em] text-fg-subtle">
          hackathon-base
        </p>
      </aside>

      <main className="flex items-center justify-center px-6 py-14">
        <div className="w-full max-w-sm">{children}</div>
      </main>
    </div>
  );
}
