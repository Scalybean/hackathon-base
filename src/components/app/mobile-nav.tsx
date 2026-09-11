/**
 * Bottom tab bar for small screens. The sidebar is desktop-only, and the app
 * is installable on a phone, so without this there is no way to move around.
 * Sits above the home indicator via the safe-area inset.
 */
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { ADMIN, MAIN, isActive } from '@/components/app/nav-items';
import { cn } from '@/lib/cn';

export function MobileNav({ isAdmin }: { isAdmin: boolean }) {
  const pathname = usePathname();
  const items = isAdmin ? [...MAIN, ...ADMIN] : MAIN;

  return (
    <nav
      aria-label="Main"
      className={cn(
        'fixed inset-x-0 bottom-0 z-40 md:hidden',
        'border-t border-border bg-[color-mix(in_srgb,var(--bg)_92%,transparent)] backdrop-blur',
        'pb-[env(safe-area-inset-bottom)]',
      )}
    >
      <ul className="flex items-stretch">
        {items.map(({ href, label, icon: Icon }) => {
          const active = isActive(pathname, href);
          return (
            <li key={href} className="flex-1">
              <Link
                href={href}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'flex flex-col items-center gap-1 px-1 py-2.5',
                  'text-2xs font-medium transition-colors',
                  active ? 'text-accent' : 'text-fg-subtle hover:text-fg',
                )}
              >
                <Icon aria-hidden className="size-5" strokeWidth={active ? 2 : 1.75} />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
