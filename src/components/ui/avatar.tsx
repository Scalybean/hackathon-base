/** Avatar. Falls back to initials on a deterministic tint when there is no image. */
import * as React from 'react';

import { cn } from '@/lib/cn';

const SIZES = { sm: 'size-6 text-2xs', md: 'size-8 text-xs', lg: 'size-16 text-lg' } as const;

export type AvatarProps = {
  name: string;
  src?: string | null;
  size?: keyof typeof SIZES;
  className?: string;
};

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function Avatar({ name, src, size = 'md', className }: AvatarProps) {
  const classes = cn(
    'inline-flex shrink-0 items-center justify-center rounded-[var(--radius-full)]',
    'border border-border object-cover font-semibold tracking-tight',
    SIZES[size],
    className,
  );

  if (src) {
    // Signed URLs expire in ten minutes; next/image would cache a URL that
    // stops resolving, so a plain img is the correct element here.
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={src} alt="" className={classes} />
    );
  }

  return (
    <span aria-hidden className={cn(classes, 'bg-accent-soft text-accent-soft-fg')}>
      {initials(name)}
    </span>
  );
}
