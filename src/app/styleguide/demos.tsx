/** Interactive styleguide examples. Client-only; nothing product-specific. */
'use client';

import { ChevronDown } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Dropdown,
  DropdownContent,
  DropdownItem,
  DropdownLabel,
  DropdownSeparator,
  DropdownTrigger,
} from '@/components/ui/dropdown';
import { toast } from '@/components/ui/toast';

export function DialogDemo() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="secondary">Open dialog</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Dialog title</DialogTitle>
          <DialogDescription>Focus trap, escape to close, scroll lock.</DialogDescription>
        </DialogHeader>
        <DialogBody>
          <p className="text-sm text-fg-muted">
            Use this for destructive confirmations and short forms, never for a whole page.
          </p>
        </DialogBody>
        <DialogFooter>
          <Button variant="secondary" size="sm">
            Cancel
          </Button>
          <Button variant="danger" size="sm">
            Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function DropdownDemo() {
  return (
    <Dropdown>
      <DropdownTrigger asChild>
        <Button variant="secondary">
          Open menu
          <ChevronDown aria-hidden className="size-3.5" strokeWidth={1.75} />
        </Button>
      </DropdownTrigger>
      <DropdownContent align="start">
        <DropdownLabel>Section</DropdownLabel>
        <DropdownItem>First item</DropdownItem>
        <DropdownItem>Second item</DropdownItem>
        <DropdownSeparator />
        <DropdownItem destructive>Destructive item</DropdownItem>
      </DropdownContent>
    </Dropdown>
  );
}

export function ToastDemo() {
  return (
    <div className="flex gap-2">
      <Button variant="secondary" onClick={() => toast.success('Saved')}>
        Success toast
      </Button>
      <Button variant="secondary" onClick={() => toast.error('Something went wrong.')}>
        Error toast
      </Button>
    </div>
  );
}
