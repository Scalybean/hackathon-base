/**
 * Runs before every page request: refreshes the Supabase session, applies the
 * CSP and the security headers, and bounces unauthenticated users out of the
 * protected route group. Authorisation still happens in the page/route itself.
 */
import { NextResponse, type NextRequest } from 'next/server';

import { clientEnv } from '@/lib/env/client';
import { CSP_HEADER_NAME, buildCsp, newNonce } from '@/lib/security/csp';
import { updateSession } from '@/lib/supabase/proxy';

/** Route prefixes that require a session. Keep in sync with app/(app)/. */
const PROTECTED_PREFIXES = ['/dashboard', '/notes', '/settings', '/admin'];

/** Signed-in users have no business on these. */
const AUTH_ONLY_PREFIXES = ['/login', '/signup', '/forgot-password'];

export async function proxy(request: NextRequest) {
  const nonce = newNonce();
  const csp = buildCsp(nonce, new URL(clientEnv.NEXT_PUBLIC_SUPABASE_URL).origin);

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-nonce', nonce);
  // Next reads the nonce off this request header to stamp its own scripts.
  // The response header below is what the browser actually enforces.
  requestHeaders.set('Content-Security-Policy', csp);

  const { response, user } = await updateSession(request, requestHeaders);

  const { pathname } = request.nextUrl;

  if (!user && PROTECTED_PREFIXES.some((prefix) => pathname.startsWith(prefix))) {
    const login = request.nextUrl.clone();
    login.pathname = '/login';
    login.search = '';
    // Relative path only: an absolute `next` would be an open redirect.
    login.searchParams.set('next', pathname);
    return withSecurityHeaders(NextResponse.redirect(login), csp, nonce);
  }

  if (user && AUTH_ONLY_PREFIXES.some((prefix) => pathname.startsWith(prefix))) {
    const dashboard = request.nextUrl.clone();
    dashboard.pathname = '/dashboard';
    dashboard.search = '';
    return withSecurityHeaders(NextResponse.redirect(dashboard), csp, nonce);
  }

  return withSecurityHeaders(response, csp, nonce);
}

function withSecurityHeaders(response: NextResponse, csp: string, nonce: string): NextResponse {
  response.headers.set(CSP_HEADER_NAME, csp);
  response.headers.set('x-nonce', nonce);
  return response;
}

export const config = {
  matcher: [
    // Everything except static assets and the image optimiser. API routes are
    // included so they get the security headers too.
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|woff2?)$).*)',
  ],
};
