/**
 * Theme preference, stored in a cookie so the server can render the right
 * palette on the first paint. No inline script, so nothing to allow in the CSP.
 */
import 'server-only';

import { cookies } from 'next/headers';

export const THEME_COOKIE = 'theme';
export type Theme = 'light' | 'dark' | 'system';

export async function getTheme(): Promise<Theme> {
  const value = (await cookies()).get(THEME_COOKIE)?.value;
  return value === 'light' || value === 'dark' ? value : 'system';
}

/** `system` renders no attribute, which hands the decision to the media query. */
export function themeAttribute(theme: Theme): 'light' | 'dark' | undefined {
  return theme === 'system' ? undefined : theme;
}
