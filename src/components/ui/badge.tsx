/** Badge primitive. Status colour comes from the soft token pair, never a raw hue. */
import * as React from 'react';

import { cn } from '@/lib/cn';

export type BadgeTone = 'neutral' | 'accent' | 'success' | 'warning' | 'danger' | 'info';

const TONES: Record<BadgeTone, string> = {
  neutral: 'bg-bg-sunken text-fg-muted border-border',
  accent: 'bg-accent-soft text-accent-soft-fg border-transparent',
  success: 'bg-success-soft text-success-fg border-transparent',
  warning: 'bg-warning-soft text-warning-fg border-transparent',
  danger: 'bg-danger-soft text-danger-fg border-transparent',
  info: 'bg-info-soft text-info-fg border-transparent',
};

export type BadgeProps = React.HTMLAttributes<HTMLSpanElement> & { tone?: BadgeTone };

export function Badge({ className, tone = 'neutral', ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-[var(--radius-full)] border',
        'px-2 py-0.5 text-2xs font-semibold uppercase tracking-[0.06em]',
        TONES[tone],
        className,
      )}
      {...props}
    />
  );
}
