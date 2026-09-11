/**
 * The service worker cache is shared by everyone who uses the device, so a
 * cached authenticated response is a data leak to the next person.
 *
 * These tests evaluate the shipped public/sw.js, not a copy of it, so the
 * policy cannot drift away from what actually runs in the browser.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { beforeAll, describe, expect, it } from 'vitest';

type Policy = {
  isCacheable: (request: FakeRequest, url: URL) => boolean;
  isNavigation: (request: FakeRequest) => boolean;
  OFFLINE_URL: string;
};

type FakeRequest = {
  method: string;
  mode: string;
  destination: string;
  credentials: string;
};

const ORIGIN = 'https://app.example';

function request(overrides: Partial<FakeRequest> = {}): FakeRequest {
  return { method: 'GET', mode: 'no-cors', destination: 'script', credentials: 'same-origin', ...overrides };
}

let policy: Policy;

beforeAll(() => {
  const source = readFileSync(join(process.cwd(), 'public', 'sw.js'), 'utf8');

  // A minimal ServiceWorkerGlobalScope. Only what the file touches at load
  // time: the event listeners it registers are collected and discarded.
  const self: Record<string, unknown> = {
    location: { origin: ORIGIN },
    addEventListener: () => {},
    clients: { claim: () => {} },
    skipWaiting: () => {},
  };

  new Function('self', 'caches', 'fetch', 'Response', source)(
    self,
    { open: () => {}, keys: () => {}, match: () => {}, delete: () => {} },
    () => {},
    class {},
  );

  policy = self.SW_POLICY as Policy;
  expect(policy, 'public/sw.js must export self.SW_POLICY').toBeDefined();
});

describe('what the service worker will cache', () => {
  it.each([
    '/_next/static/chunks/main-abc123.js',
    '/_next/static/css/abc123.css',
    '/icon-192.png',
    '/icon-maskable-512.png',
    '/apple-touch-icon.png',
    '/favicon.ico',
    '/offline.html',
  ])('caches the build artefact %s', (pathname) => {
    expect(policy.isCacheable(request(), new URL(pathname, ORIGIN))).toBe(true);
  });
});

describe('what it must never cache', () => {
  it.each([
    ['an API response', '/api/notes'],
    ['a single record', '/api/notes/1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed'],
    ['the sign-out endpoint', '/api/auth/sign-out'],
    ['the auth callback', '/auth/confirm'],
    ['the login page', '/login'],
    ['the signup page', '/signup'],
    ['the password reset page', '/reset-password'],
    ['a dashboard page', '/dashboard'],
    ['a notes page', '/notes'],
    ['an admin page', '/admin'],
    ['account settings', '/settings'],
    ['the root', '/'],
  ])('refuses to cache %s', (_label, pathname) => {
    expect(policy.isCacheable(request(), new URL(pathname, ORIGIN))).toBe(false);
  });

  it('refuses any navigation, even to an otherwise cacheable path', () => {
    const navigation = request({ mode: 'navigate', destination: 'document' });
    expect(policy.isCacheable(navigation, new URL('/_next/static/chunks/x.js', ORIGIN))).toBe(false);
  });

  it('refuses a document destination', () => {
    const document = request({ destination: 'document' });
    expect(policy.isCacheable(document, new URL('/_next/static/chunks/x.js', ORIGIN))).toBe(false);
  });

  it('refuses a credentialed request', () => {
    const credentialed = request({ credentials: 'include' });
    expect(policy.isCacheable(credentialed, new URL('/_next/static/chunks/x.js', ORIGIN))).toBe(false);
  });

  it.each(['POST', 'PATCH', 'DELETE', 'PUT'])('refuses %s', (method) => {
    expect(policy.isCacheable(request({ method }), new URL('/_next/static/x.js', ORIGIN))).toBe(false);
  });

  it('refuses a cross-origin request', () => {
    const supabase = new URL('/storage/v1/object/sign/avatars/x.png', 'https://project.supabase.co');
    expect(policy.isCacheable(request(), supabase)).toBe(false);
  });

  it('refuses a path that merely looks like a build artefact', () => {
    expect(policy.isCacheable(request(), new URL('/notes/_next/static/x.js', ORIGIN))).toBe(false);
    expect(policy.isCacheable(request(), new URL('/icon-192.png.html', ORIGIN))).toBe(false);
  });
});

describe('navigation handling', () => {
  it('treats navigations and documents as navigation', () => {
    expect(policy.isNavigation(request({ mode: 'navigate' }))).toBe(true);
    expect(policy.isNavigation(request({ destination: 'document' }))).toBe(true);
  });

  it('does not treat an asset as navigation', () => {
    expect(policy.isNavigation(request())).toBe(false);
  });

  it('falls back to a static file, never a rendered page', () => {
    // A server-rendered fallback could carry one user's data to the next.
    expect(policy.OFFLINE_URL).toBe('/offline.html');
  });
});
