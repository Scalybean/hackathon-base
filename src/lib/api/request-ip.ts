/**
 * Best-effort client IP for rate limiting.
 * Only headers Vercel itself sets are trusted; a client-supplied X-Forwarded-For
 * on a non-Vercel host would otherwise let an attacker rotate their own key.
 */
import type { NextRequest } from 'next/server';

export function getClientIp(request: NextRequest): string {
  // Vercel overwrites this header at the edge, so the first entry is authoritative.
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    const first = forwarded.split(',')[0]?.trim();
    if (first) return first;
  }
  return request.headers.get('x-real-ip')?.trim() ?? 'unknown';
}

/** Same rule, for server actions where only next/headers is available. */
export function getClientIpFromHeaders(headerList: Headers): string {
  const forwarded = headerList.get('x-forwarded-for');
  if (forwarded) {
    const first = forwarded.split(',')[0]?.trim();
    if (first) return first;
  }
  return headerList.get('x-real-ip')?.trim() ?? 'unknown';
}
