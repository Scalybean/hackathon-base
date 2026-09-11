/**
 * Error boundary for every protected page. Deliberately says nothing about
 * what went wrong: `error.message` can carry server detail, and the digest is
 * the only thing safe to show. It is enough to find the real error in the log.
 */
'use client';

import { useEffect } from 'react';
import { RotateCcw } from 'lucide-react';

import { PageHeader } from '@/components/app/page-header';
import { Button } from '@/components/ui/button';

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // The server has already logged this. Record it client-side too so a
    // browser-only failure is not invisible.
    console.error('page error', error.digest ?? '(no digest)');
  }, [error]);

  return (
    <>
      <PageHeader
        title="That did not work"
        description="Something went wrong loading this page. Trying again usually fixes it."
      />

      <div className="flex flex-wrap items-center gap-3">
        <Button onClick={reset}>
          <RotateCcw aria-hidden className="size-3.5" strokeWidth={2} />
          Try again
        </Button>
        {error.digest ? (
          <p className="font-mono text-2xs text-fg-subtle">Reference {error.digest}</p>
        ) : null}
      </div>
    </>
  );
}
