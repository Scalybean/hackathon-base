/**
 * Service-role Supabase client. Bypasses RLS entirely.
 * Only import this from a route handler, server action or script, and only
 * after the caller has been authenticated and authorised.
 */
import 'server-only';

import { createClient } from '@supabase/supabase-js';

import { clientEnv } from '@/lib/env/client';
import { noRealtime } from '@/lib/supabase/no-realtime';
import { serverEnv } from '@/lib/env/server';
import type { Database } from '@/types/database';

export function createAdminSupabase() {
  return createClient<Database>(
    clientEnv.NEXT_PUBLIC_SUPABASE_URL,
    serverEnv.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: { persistSession: false, autoRefreshToken: false },
      ...noRealtime,
    },
  );
}
