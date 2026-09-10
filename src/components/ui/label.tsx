/** Form label plus the field wrapper that renders hint and error text. */
import * as React from 'react';
import * as LabelPrimitive from '@radix-ui/react-label';

import { cn } from '@/lib/cn';

export function Label({ className, ...props }: React.ComponentProps<typeof LabelPrimitive.Root>) {
  return (
    <LabelPrimitive.Root
      className={cn(
        'block text-xs font-semibold uppercase tracking-[0.07em] text-fg-muted',
        className,
      )}
      {...props}
    />
  );
}

export type FieldProps = {
  label: string;
  htmlFor: string;
  hint?: string;
  /** Rendered under the control and wired to it via aria-describedby. */
  error?: string;
  children: React.ReactNode;
};

/** The canonical form row. Every form field in the app uses this. */
export function Field({ label, htmlFor, hint, error, children }: FieldProps) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
      {error ? (
        <p id={`${htmlFor}-error`} role="alert" className="text-xs text-danger-fg">
          {error}
        </p>
      ) : hint ? (
        <p id={`${htmlFor}-hint`} className="text-xs text-fg-subtle">
          {hint}
        </p>
      ) : null}
    </div>
  );
}
