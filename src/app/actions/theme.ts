/**
 * Sets the theme cookie. Not routed through action() on purpose: it touches no
 * user data, so it needs neither auth nor a rate limit.
 */
'use server';

import { cookies } from 'next/headers';

import { THEME_COOKIE, type Theme } from '@/lib/theme';

const ALLOWED: Theme[] = ['light', 'dark', 'system'];

export async function setTheme(next: string): Promise<void> {
  if (!ALLOWED.includes(next as Theme)) return;

  const store = await cookies();
  store.set(THEME_COOKIE, next, {
    path: '/',
    sameSite: 'lax',
    httpOnly: false,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 60 * 24 * 365,
  });
}
