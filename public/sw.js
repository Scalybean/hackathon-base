/**
 * Service worker. Makes the app installable and gives it an offline fallback.
 *
 * THE RULE: this worker caches build artefacts and nothing else. It never
 * caches HTML, API responses, or any request carrying a session, because a
 * cache is shared by every person who uses the device. One cached page from a
 * signed-in user is a data leak to the next one. See SECURITY.md.
 *
 * The policy is exported on `self.SW_POLICY` so tests/sw-cache-policy.test.ts
 * can assert against this exact file rather than a copy of it.
 */

const VERSION = 'v1';
const ASSET_CACHE = `assets-${VERSION}`;
const SHELL_CACHE = `shell-${VERSION}`;
const OFFLINE_URL = '/offline.html';

/** Precached so the offline fallback is available on the very first drop-out. */
const PRECACHE = [OFFLINE_URL, '/icon-192.png', '/icon-512.png'];

/**
 * Content-hashed build output and static brand assets. No user data can appear
 * in any of these, which is the only reason they are safe to keep.
 */
const CACHEABLE = [
  /^\/_next\/static\//,
  /^\/icon-\d+\.png$/,
  /^\/icon-maskable-\d+\.png$/,
  /^\/apple-touch-icon\.png$/,
  /^\/favicon\.ico$/,
  /^\/offline\.html$/,
];

/**
 * Belt and braces. Nothing under these prefixes may ever be cached, even if a
 * future edit widens CACHEABLE by accident.
 */
const NEVER = [/^\/api\//, /^\/auth\//, /^\/login/, /^\/signup/, /^\/reset-password/];

/** True only for a request whose response is identical for every user. */
function isCacheable(request, url) {
  // A cache entry is keyed by URL, so anything that varies by user is unsafe.
  if (request.method !== 'GET') return false;
  if (url.origin !== self.location.origin) return false;

  // HTML is rendered per user. Never store it.
  if (request.mode === 'navigate') return false;
  if (request.destination === 'document') return false;

  // A credentialed request has a session attached by definition.
  if (request.credentials === 'include') return false;

  if (NEVER.some((pattern) => pattern.test(url.pathname))) return false;
  return CACHEABLE.some((pattern) => pattern.test(url.pathname));
}

/** Navigations get the network, then the offline page. Never a cached page. */
function isNavigation(request) {
  return request.mode === 'navigate' || request.destination === 'document';
}

self.SW_POLICY = { isCacheable, isNavigation, CACHEABLE, NEVER, OFFLINE_URL };

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(SHELL_CACHE)
      .then((cache) => cache.addAll(PRECACHE))
      // A precache miss must not wedge the install; the worker is still useful.
      .catch(() => undefined)
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== ASSET_CACHE && key !== SHELL_CACHE)
            .map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  if (isNavigation(request)) {
    event.respondWith(
      fetch(request).catch(() =>
        caches.match(OFFLINE_URL, { cacheName: SHELL_CACHE }).then(
          (cached) =>
            cached ??
            new Response('Offline', { status: 503, headers: { 'Content-Type': 'text/plain' } }),
        ),
      ),
    );
    return;
  }

  if (!isCacheable(request, url)) return; // Straight to the network, untouched.

  event.respondWith(
    caches.match(request, { cacheName: ASSET_CACHE }).then((cached) => {
      if (cached) return cached;

      return fetch(request).then((response) => {
        // Only store a clean same-origin 200. An opaque or errored response
        // would poison the cache for every later visitor.
        if (response.ok && response.type === 'basic') {
          const copy = response.clone();
          caches.open(ASSET_CACHE).then((cache) => cache.put(request, copy));
        }
        return response;
      });
    }),
  );
});

/**
 * Sign-out sends this. Nothing user-specific is cached, so it is defence in
 * depth rather than a fix, but it makes the intent explicit and costs nothing.
 */
self.addEventListener('message', (event) => {
  if (event.data?.type !== 'CLEAR_CACHES') return;
  event.waitUntil(caches.keys().then((keys) => Promise.all(keys.map((key) => caches.delete(key)))));
});
