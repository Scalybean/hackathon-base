/** Left navigation. Admin entries are only rendered for admins, and are also
 *  protected server-side — hiding a link is not an access control. */
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { ADMIN, DEV, MAIN, isActive, type NavItem } from '@/components/app/nav-items';
import { cn } from '@/lib/cn';

export function Sidebar({ isAdmin }: { isAdmin: boolean }) {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Main"
      className="hidden w-[var(--sidebar-width)] shrink-0 border-r border-border bg-bg-inset md:block"
    >
      <div className="sticky top-0 flex h-dvh flex-col px-3 py-4">
        <Link href="/dashboard" className="mb-6 flex items-baseline gap-1.5 px-2">
          <span className="font-display text-xl font-semibold tracking-tight">Base</span>
          <span className="h-1.5 w-1.5 rounded-full bg-accent" />
        </Link>

        <Section items={MAIN} pathname={pathname} />

        {isAdmin ? (
          <>
            <p className="mb-1.5 mt-6 px-2 text-2xs font-semibold uppercase tracking-[0.08em] text-fg-subtle">
              Admin
            </p>
            <Section items={ADMIN} pathname={pathname} />
          </>
        ) : null}

        <div className="mt-auto">
          <Section items={DEV} pathname={pathname} />
        </div>
      </div>
    </nav>
  );
}

function Section({ items, pathname }: { items: NavItem[]; pathname: string }) {
  return (
    <ul className="space-y-0.5">
      {items.map(({ href, label, icon: Icon }) => {
        const active = isActive(pathname, href);
        return (
          <li key={href}>
            <Link
              href={href}
              aria-current={active ? 'page' : undefined}
              className={cn(
                'flex items-center gap-2.5 rounded-[var(--radius-md)] px-2 py-1.5 text-sm',
                'transition-colors',
                active
                  ? 'bg-bg-raised font-medium text-fg shadow-[var(--shadow-xs)]'
                  : 'text-fg-muted hover:bg-bg-hover hover:text-fg',
              )}
            >
              <Icon
                aria-hidden
                strokeWidth={1.75}
                className={cn('size-4', active ? 'text-accent' : 'text-fg-subtle')}
              />
              {label}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
