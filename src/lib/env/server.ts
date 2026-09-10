/**
 * Server-only environment variables, validated at import time.
 * `server-only` makes the build fail if this module is ever pulled into a
 * client component, which is the primary guard on SUPABASE_SERVICE_ROLE_KEY.
 */
import 'server-only';

import { z } from 'zod';

const serverEnvSchema = z.object({
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(20),
  SUPABASE_DB_URL: z.string().min(1).optional(),
  UPSTASH_REDIS_REST_URL: z.url().optional(),
  UPSTASH_REDIS_REST_TOKEN: z.string().min(1).optional(),
});

const parsed = serverEnvSchema.safeParse({
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
  SUPABASE_DB_URL: process.env.SUPABASE_DB_URL,
  UPSTASH_REDIS_REST_URL: process.env.UPSTASH_REDIS_REST_URL,
  UPSTASH_REDIS_REST_TOKEN: process.env.UPSTASH_REDIS_REST_TOKEN,
});

if (!parsed.success) {
  throw new Error(
    `Invalid server environment variables: ${parsed.error.issues.map((i) => i.path.join('.')).join(', ')}`,
  );
}

export const serverEnv = parsed.data;
