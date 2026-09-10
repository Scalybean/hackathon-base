/** safeRedirect is the only thing stopping an open redirect off the login page. */
import { describe, expect, it } from 'vitest';

import { safeRedirect } from '@/lib/safe-redirect';

describe('safeRedirect', () => {
  it('allows a site-relative path', () => {
    expect(safeRedirect('/notes')).toBe('/notes');
    expect(safeRedirect('/notes/abc?tab=1')).toBe('/notes/abc?tab=1');
  });

  it.each([
    'https://evil.example',
    'http://evil.example',
    '//evil.example',
    '/\\evil.example',
    '\\\\evil.example',
    'javascript:alert(1)',
    'notes',
    '',
  ])('rejects %s', (next) => {
    expect(safeRedirect(next)).toBe('/dashboard');
  });

  it('falls back when the value is missing', () => {
    expect(safeRedirect(null)).toBe('/dashboard');
    expect(safeRedirect(undefined)).toBe('/dashboard');
  });

  it('honours a custom fallback', () => {
    expect(safeRedirect('https://evil.example', '/login')).toBe('/login');
  });
});
