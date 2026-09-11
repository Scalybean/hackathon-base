/**
 * The one definition of the app's navigation. Shared by the desktop sidebar
 * and the mobile tab bar so the two can never drift apart.
 * Hiding an entry is presentation, never access control: every route is
 * protected server-side as well.
 */
import { FileText, LayoutDashboard, Palette, Settings, ShieldCheck } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export type NavItem = { href: string; label: string; icon: LucideIcon };

export const MAIN: NavItem[] = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/notes', label: 'Notes', icon: FileText },
  { href: '/settings', label: 'Settings', icon: Settings },
];

export const ADMIN: NavItem[] = [{ href: '/admin', label: 'Admin', icon: ShieldCheck }];

export const DEV: NavItem[] = [{ href: '/styleguide', label: 'Styleguide', icon: Palette }];

/** True when `pathname` is this entry or one of its children. */
export function isActive(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}
