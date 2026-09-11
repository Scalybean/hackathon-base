/** Avatar dropdown in the topbar. Sign out posts to a route handler so the
 *  session cookie is cleared server-side. */
'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTransition } from 'react';
import { LogOut, Settings, ShieldCheck } from 'lucide-react';

import { clearServiceWorkerCaches } from '@/lib/pwa/client';
import { Avatar } from '@/components/ui/avatar';
import {
  Dropdown,
  DropdownContent,
  DropdownItem,
  DropdownLabel,
  DropdownSeparator,
  DropdownTrigger,
} from '@/components/ui/dropdown';

export type UserMenuProps = {
  displayName: string;
  email: string;
  avatarUrl: string | null;
  isAdmin: boolean;
};

export function UserMenu({ displayName, email, avatarUrl, isAdmin }: UserMenuProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function signOut() {
    startTransition(async () => {
      await fetch('/api/auth/sign-out', { method: 'POST' });
      // Leave nothing behind on a shared device.
      await clearServiceWorkerCaches();
      router.replace('/login');
      router.refresh();
    });
  }

  return (
    <Dropdown>
      <DropdownTrigger
        aria-label="Account menu"
        className="rounded-[var(--radius-full)] focus:outline-none focus-visible:shadow-[var(--shadow-focus)]"
      >
        <Avatar name={displayName} src={avatarUrl} size="md" />
      </DropdownTrigger>
      <DropdownContent>
        <DropdownLabel>{displayName}</DropdownLabel>
        <p className="truncate px-2 pb-1.5 text-xs text-fg-subtle">{email}</p>
        <DropdownSeparator />
        <DropdownItem asChild>
          <Link href="/settings">
            <Settings aria-hidden className="size-3.5" strokeWidth={1.75} />
            Account settings
          </Link>
        </DropdownItem>
        {isAdmin ? (
          <DropdownItem asChild>
            <Link href="/admin">
              <ShieldCheck aria-hidden className="size-3.5" strokeWidth={1.75} />
              Admin
            </Link>
          </DropdownItem>
        ) : null}
        <DropdownSeparator />
        <DropdownItem destructive disabled={pending} onSelect={signOut}>
          <LogOut aria-hidden className="size-3.5" strokeWidth={1.75} />
          Sign out
        </DropdownItem>
      </DropdownContent>
    </Dropdown>
  );
}
