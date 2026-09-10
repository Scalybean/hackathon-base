/** Dropdown menu primitive over Radix. Used by the user menu and row actions. */
'use client';

import * as React from 'react';
import * as Menu from '@radix-ui/react-dropdown-menu';

import { cn } from '@/lib/cn';

export const Dropdown = Menu.Root;
export const DropdownTrigger = Menu.Trigger;

export function DropdownContent({
  className,
  align = 'end',
  sideOffset = 6,
  ...props
}: React.ComponentProps<typeof Menu.Content>) {
  return (
    <Menu.Portal>
      <Menu.Content
        align={align}
        sideOffset={sideOffset}
        className={cn(
          'z-50 min-w-48 overflow-hidden rounded-[var(--radius-md)] border border-border',
          'bg-bg-raised p-1 shadow-[var(--shadow-md)]',
          className,
        )}
        {...props}
      />
    </Menu.Portal>
  );
}

export function DropdownItem({
  className,
  destructive = false,
  ...props
}: React.ComponentProps<typeof Menu.Item> & { destructive?: boolean }) {
  return (
    <Menu.Item
      className={cn(
        'flex cursor-pointer select-none items-center gap-2 rounded-[var(--radius-sm)]',
        'px-2 py-1.5 text-sm outline-none',
        'data-[highlighted]:bg-bg-hover',
        destructive ? 'text-danger-fg data-[highlighted]:bg-danger-soft' : 'text-fg',
        className,
      )}
      {...props}
    />
  );
}

export function DropdownLabel({ className, ...props }: React.ComponentProps<typeof Menu.Label>) {
  return (
    <Menu.Label
      className={cn(
        'px-2 py-1.5 text-2xs font-semibold uppercase tracking-[0.07em] text-fg-subtle',
        className,
      )}
      {...props}
    />
  );
}

export function DropdownSeparator({ className, ...props }: React.ComponentProps<typeof Menu.Separator>) {
  return <Menu.Separator className={cn('my-1 h-px bg-border', className)} {...props} />;
}
