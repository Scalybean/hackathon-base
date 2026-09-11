/**
 * Service worker registration and teardown, from the browser side.
 * Registration is production-only: in development a cached build artefact is
 * a debugging trap, not a feature.
 */
'use client';

export function registerServiceWorker(): void {
  if (typeof window === 'undefined') return;
  if (!('serviceWorker' in navigator)) return;
  if (process.env.NODE_ENV !== 'production') return;

  navigator.serviceWorker
    // updateViaCache: 'none' so a stale worker cannot pin itself in place.
    .register('/sw.js', { scope: '/', updateViaCache: 'none' })
    .catch(() => {
      // An unavailable service worker must never break the page.
    });
}

/**
 * Called on sign-out. The worker caches no user data, so this is defence in
 * depth: it guarantees nothing survives a session on a shared device.
 */
export async function clearServiceWorkerCaches(): Promise<void> {
  if (typeof window === 'undefined') return;
  if (!('serviceWorker' in navigator)) return;

  try {
    navigator.serviceWorker.controller?.postMessage({ type: 'CLEAR_CACHES' });
    if ('caches' in window) {
      const keys = await caches.keys();
      await Promise.all(keys.map((key) => caches.delete(key)));
    }
  } catch {
    // Storage can be unavailable in a private window. Signing out still works.
  }
}
