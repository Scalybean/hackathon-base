/**
 * Web app manifest. Served at /manifest.webmanifest and linked automatically.
 * Colours come from the design tokens; keep them in step with tokens.css.
 */
import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'hackathon-base',
    short_name: 'Base',
    description: 'A secure Next.js and Supabase base template.',
    // Installed users land in the app, not on the marketing page. Signed-out
    // users are redirected to /login from there by proxy.ts.
    start_url: '/dashboard',
    scope: '/',
    display: 'standalone',
    orientation: 'portrait-primary',
    background_color: '#faf7f2',
    theme_color: '#b4451f',
    categories: ['productivity'],
    icons: [
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
    shortcuts: [
      { name: 'Notes', short_name: 'Notes', url: '/notes' },
      { name: 'Settings', short_name: 'Settings', url: '/settings' },
    ],
  };
}
