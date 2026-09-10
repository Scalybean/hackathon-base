/** Button primitive. Variants and sizes are closed sets; do not add inline classes. */
'use client';

import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { Loader2 } from 'lucide-react';

import { cn } from '@/lib/cn';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'link';
export type ButtonSize = 'sm' | 'md' | 'lg' | 'icon';

const VARIANTS: Record<ButtonVariant, string> = {
  primary:
    'bg-accent text-fg-on-accent border border-transparent hover:bg-accent-hover active:bg-accent-active shadow-[var(--shadow-xs)]',
  secondary:
    'bg-bg-raised text-fg border border-border-strong hover:bg-bg-hover active:bg-bg-active shadow-[var(--shadow-xs)]',
  ghost: 'bg-transparent text-fg-muted border border-transparent hover:bg-bg-hover hover:text-fg',
  danger: 'bg-danger text-fg-on-accent border border-transparent hover:brightness-110 active:brightness-95',
  link: 'bg-transparent text-accent border border-transparent underline underline-offset-4 decoration-1 hover:decoration-2 px-0',
};

const SIZES: Record<ButtonSize, string> = {
  sm: 'h-7 px-2.5 text-xs gap-1.5',
  md: 'h-9 px-3.5 text-sm gap-2',
  lg: 'h-11 px-5 text-base gap-2',
  icon: 'h-9 w-9 p-0',
};

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Renders the child element instead of a <button>. Use for links. */
  asChild?: boolean;
  loading?: boolean;
};

export function Button({
  className,
  variant = 'primary',
  size = 'md',
  asChild = false,
  loading = false,
  disabled,
  children,
  ...props
}: ButtonProps) {
  const Component = asChild ? Slot : 'button';

  return (
    <Component
      className={cn(
        'inline-flex items-center justify-center rounded-[var(--radius-md)] font-medium',
        'transition-[background-color,color,box-shadow] duration-150',
        'disabled:pointer-events-none disabled:opacity-45',
        // Font feature: Archivo's default figures are proportional; buttons
        // with counts look wrong unless they are lining.
        'font-sans tracking-[0.01em] [font-variant-numeric:lining-nums]',
        VARIANTS[variant],
        SIZES[size],
        className,
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? <Loader2 aria-hidden className="size-3.5 animate-spin" /> : null}
      {children}
    </Component>
  );
}
