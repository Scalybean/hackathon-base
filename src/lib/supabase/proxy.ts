/**
 * Session refresh for proxy.ts (Next 16 renamed middleware -> proxy).
 * Rewrites auth cookies onto the outgoing response so server components see a
 * fresh token, and reports who the caller is.
 */
import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

import { clientEnv } from '@/lib/env/client';
import type { Database } from '@/types/database';
import type { User } from '@supabase/supabase-js';

export type SessionResult = { response: NextResponse; user: User | null };

/**
 * `requestHeaders` are forwarded to the app (used to pass the CSP nonce down).
 * They must be re-applied every time the response is rebuilt.
 */
export async function updateSession(
  request: NextRequest,
  requestHeaders: Headers,
): Promise<SessionResult> {
  let response = NextResponse.next({ request: { headers: requestHeaders } });

  const supabase = createServerClient<Database>(
    clientEnv.NEXT_PUBLIC_SUPABASE_URL,
    clientEnv.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          for (const { name, value } of cookiesToSet) {
            request.cookies.set(name, value);
          }
          response = NextResponse.next({ request: { headers: requestHeaders } });
          for (const { name, value, options } of cookiesToSet) {
            response.cookies.set(name, value, options);
          }
        },
      },
    },
  );

  // getUser() revalidates the token against the auth server. getSession() only
  // decodes the cookie and must never be used for an access decision.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return { response, user };
}
