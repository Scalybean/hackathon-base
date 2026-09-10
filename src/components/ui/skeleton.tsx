/** Loading placeholder. Sized by the caller; never animates more than opacity. */
import * as React from 'react';

import { cn } from '@/lib/cn';

export function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      aria-hidden
      className={cn('animate-pulse rounded-[var(--radius-sm)] bg-bg-sunken', className)}
      {...props}
    />
  );
}
