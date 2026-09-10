/**
 * The origin this app is served from. Auth emails link back here, so getting it
 * wrong sends a preview's confirmation link to production.
 *
 * Explicit config wins. Otherwise a Vercel deployment uses its own URL, so a
 * preview confirms against that preview. Locally it falls back to localhost.
 */
import { clientEnv } from '@/lib/env/client';

export function siteUrl(): string {
  const configured = clientEnv.NEXT_PUBLIC_SITE_URL;
  if (configured) return configured.replace(/\/+$/, '');

  // Vercel sets this per deployment, without a scheme.
  const vercel = process.env.VERCEL_URL ?? process.env.NEXT_PUBLIC_VERCEL_URL;
  if (vercel) return `https://${vercel.replace(/\/+$/, '')}`;

  return 'http://localhost:3000';
}
