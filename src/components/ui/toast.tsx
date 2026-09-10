/**
 * Toast. Sonner, restyled onto the tokens so it does not look like a default.
 * Import { toast } from here, never from 'sonner' directly.
 */
'use client';

import { Toaster as Sonner, toast } from 'sonner';

export { toast };

export function Toaster() {
  return (
    <Sonner
      position="bottom-right"
      gap={8}
      toastOptions={{
        unstyled: true,
        classNames: {
          toast:
            'flex w-full items-start gap-2.5 rounded-[var(--radius-md)] border border-border bg-bg-raised px-3.5 py-3 text-sm text-fg shadow-[var(--shadow-md)] font-sans',
          title: 'font-medium',
          description: 'text-fg-muted text-xs mt-0.5',
          success: 'border-l-2 border-l-[var(--success)]',
          error: 'border-l-2 border-l-[var(--danger)]',
          actionButton: 'ml-auto text-xs font-medium text-accent',
        },
      }}
    />
  );
}
