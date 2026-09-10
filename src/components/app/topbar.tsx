/** Top bar: breadcrumb on the left, theme toggle and user menu on the right. */
import { Breadcrumb, type Crumb } from '@/components/app/breadcrumb';
import { ThemeToggle } from '@/components/app/theme-toggle';
import { UserMenu, type UserMenuProps } from '@/components/app/user-menu';
import type { Theme } from '@/lib/theme';

export type TopbarProps = {
  crumbs: Crumb[];
  theme: Theme;
  user: UserMenuProps;
};

export function Topbar({ crumbs, theme, user }: TopbarProps) {
  return (
    <header className="sticky top-0 z-30 flex h-[var(--topbar-height)] items-center gap-4 border-b border-border bg-[color-mix(in_srgb,var(--bg)_88%,transparent)] px-5 backdrop-blur">
      <Breadcrumb items={crumbs} />
      <div className="ml-auto flex items-center gap-1.5">
        <ThemeToggle theme={theme} />
        <UserMenu {...user} />
      </div>
    </header>
  );
}
