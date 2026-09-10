/**
 * Supabase client for server components, server actions and route handlers.
 * Reads and refreshes the session from cookies. Subject to RLS.
 */
import 'server-only';

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

import { clientEnv } from '@/lib/env/client';
import type { Database } from '@/types/database';

export async function createServerSupabase() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    clientEnv.NEXT_PUBLIC_SUPABASE_URL,
    clientEnv.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            for (const { name, value, options } of cookiesToSet) {
              cookieStore.set(name, value, options);
            }
          } catch {
            // Called from a Server Component, where cookies are read-only.
            // The middleware refreshes the session instead, so this is safe.
          }
        },
      },
    },
  );
}
