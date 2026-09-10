/** The one empty state. An icon, a line, and at most one action. */
import * as React from 'react';
import type { LucideIcon } from 'lucide-react';

import { cn } from '@/lib/cn';

export type EmptyStateProps = {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
};

export function EmptyState({ icon: Icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-start gap-3 border border-dashed border-border-strong',
        'rounded-[var(--radius-lg)] bg-bg-inset px-6 py-10',
        className,
      )}
    >
      <Icon aria-hidden className="size-5 text-fg-subtle" strokeWidth={1.5} />
      <div>
        <p className="font-display text-lg font-semibold">{title}</p>
        {description ? <p className="mt-1 max-w-prose text-sm text-fg-muted">{description}</p> : null}
      </div>
      {action}
    </div>
  );
}
