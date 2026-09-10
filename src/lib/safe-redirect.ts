/**
 * Turns a client-supplied `next` parameter into a path we are willing to
 * redirect to. Anything absolute, protocol-relative or unknown collapses to
 * the fallback, which is how the open-redirect class of bug is closed.
 */
const FALLBACK = '/dashboard';

export function safeRedirect(next: string | null | undefined, fallback = FALLBACK): string {
  if (!next) return fallback;
  // Must be a site-relative path. "//evil.com" and "https://evil.com" both fail.
  if (!next.startsWith('/') || next.startsWith('//')) return fallback;
  // No backslashes: some browsers normalise "/\evil.com" to a host.
  if (next.includes('\\')) return fallback;
  return next;
}
