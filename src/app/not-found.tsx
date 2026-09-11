/**
 * The 404 for the whole app. Reached by notFound() as well as by a bad URL,
 * so it must read sensibly for "does not exist" and for "not yours" alike.
 */
import Link from 'next/link';

import { Button } from '@/components/ui/button';

export const metadata = { title: 'Not found' };

export default function NotFound() {
  return (
    <div className="grid min-h-dvh place-items-center px-6 py-16">
      <div className="w-full max-w-md">
        <div className="rule-accent mb-8 w-32" />
        <h1 className="font-display text-4xl leading-[1.08] tracking-[-0.02em]">
          We cannot find that
        </h1>
        <p className="mt-4 text-sm leading-relaxed text-fg-muted">
          The page may have moved, or the link may be out of date.
        </p>
        <div className="mt-7 flex flex-wrap gap-3">
          <Button asChild>
            <Link href="/dashboard">Go to your notes</Link>
          </Button>
          <Button asChild variant="secondary">
            <Link href="/">Home</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
