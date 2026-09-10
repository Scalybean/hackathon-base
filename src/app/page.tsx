/** Public landing page. No session required and nothing personal on it. */
import Link from 'next/link';
import { ArrowRight, Database, KeyRound, ShieldCheck } from 'lucide-react';

import { Button } from '@/components/ui/button';

export default function HomePage() {
  return (
    <div className="min-h-dvh">
      <header className="mx-auto flex max-w-5xl items-center justify-between px-6 py-6">
        <span className="flex items-baseline gap-2">
          <span className="font-display text-xl font-semibold tracking-tight">Base</span>
          <span className="h-1.5 w-1.5 rounded-full bg-accent" />
        </span>
        <nav className="flex items-center gap-2">
          <Button asChild variant="ghost" size="sm">
            <Link href="/styleguide">Styleguide</Link>
          </Button>
          <Button asChild variant="secondary" size="sm">
            <Link href="/login">Sign in</Link>
          </Button>
        </nav>
      </header>

      <main className="mx-auto max-w-5xl px-6 pb-24 pt-16">
        <div className="rule-accent mb-10 w-40" />
        <h1 className="max-w-3xl font-display text-5xl leading-[1.03] tracking-[-0.025em]">
          The boring, dangerous parts.
          <br />
          <span className="text-accent">Already finished.</span>
        </h1>
        <p className="mt-7 max-w-xl text-lg leading-relaxed text-fg-muted">
          Auth, row-level security, rate limiting, a private storage bucket and a design system
          that does not look generated. Build the product on top.
        </p>

        <div className="mt-9 flex flex-wrap gap-3">
          <Button asChild size="lg">
            <Link href="/signup">
              Create an account
              <ArrowRight aria-hidden className="size-4" strokeWidth={2} />
            </Link>
          </Button>
          <Button asChild size="lg" variant="secondary">
            <Link href="/login">Sign in</Link>
          </Button>
        </div>

        <dl className="mt-24 grid gap-px overflow-hidden rounded-[var(--radius-lg)] border border-border bg-border sm:grid-cols-3">
          <Feature
            icon={ShieldCheck}
            term="Default deny"
            detail="Every table has RLS forced on, with one policy per operation and ownership derived from auth.uid()."
          />
          <Feature
            icon={KeyRound}
            term="No leaked keys"
            detail="The service-role key is server-only, and the build fails if it ever reaches a client chunk."
          />
          <Feature
            icon={Database}
            term="One command"
            detail="pnpm verify runs typecheck, lint, tests, the RLS audit, the build and the leak scan."
          />
        </dl>
      </main>
    </div>
  );
}

function Feature({
  icon: Icon,
  term,
  detail,
}: {
  icon: typeof ShieldCheck;
  term: string;
  detail: string;
}) {
  return (
    <div className="bg-bg-raised px-6 py-7">
      <Icon aria-hidden className="size-4 text-accent" strokeWidth={1.75} />
      <dt className="mt-3 font-medium">{term}</dt>
      <dd className="mt-1.5 text-sm leading-relaxed text-fg-muted">{detail}</dd>
    </div>
  );
}
