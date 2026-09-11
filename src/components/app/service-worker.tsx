/** Registers the service worker once, after hydration. Renders nothing. */
'use client';

import { useEffect } from 'react';

import { registerServiceWorker } from '@/lib/pwa/client';

export function ServiceWorker() {
  useEffect(() => {
    registerServiceWorker();
  }, []);

  return null;
}
