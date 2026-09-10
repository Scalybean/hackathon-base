/** Text input primitive. Error state is driven by aria-invalid, not a prop. */
import * as React from 'react';

import { cn } from '@/lib/cn';

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

export function Input({ className, ...props }: InputProps) {
  return (
    <input
      className={cn(
        'block w-full rounded-[var(--radius-md)] border border-border-strong bg-bg-raised',
        'h-9 px-2.5 text-sm text-fg',
        'transition-[border-color,box-shadow] duration-150',
        'hover:border-[var(--fg-subtle)]',
        'focus:border-accent focus:outline-none focus:shadow-[var(--shadow-focus)]',
        'disabled:cursor-not-allowed disabled:bg-bg-sunken disabled:text-fg-subtle',
        'aria-[invalid=true]:border-danger aria-[invalid=true]:focus:shadow-[0_0_0_3px_rgb(163_43_34_/_0.2)]',
        className,
      )}
      {...props}
    />
  );
}

export type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement>;

export function Textarea({ className, ...props }: TextareaProps) {
  return (
    <textarea
      className={cn(
        'block w-full rounded-[var(--radius-md)] border border-border-strong bg-bg-raised',
        'min-h-24 px-2.5 py-2 text-sm text-fg leading-relaxed resize-y',
        'transition-[border-color,box-shadow] duration-150',
        'hover:border-[var(--fg-subtle)]',
        'focus:border-accent focus:outline-none focus:shadow-[var(--shadow-focus)]',
        'disabled:cursor-not-allowed disabled:bg-bg-sunken disabled:text-fg-subtle',
        'aria-[invalid=true]:border-danger',
        className,
      )}
      {...props}
    />
  );
}
