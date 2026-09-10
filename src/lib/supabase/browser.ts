/**
 * Supabase client for client components. Carries the publishable key only and
 * is bound to the user's session cookies. Never use it for privileged work.
 */
'use client';

import { createBrowserClient } from '@supabase/ssr';

import { clientEnv } from '@/lib/env/client';
import type { Database } from '@/types/database';

export function createBrowserSupabase() {
  return createBrowserClient<Database>(
    clientEnv.NEXT_PUBLIC_SUPABASE_URL,
    clientEnv.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  );
}
