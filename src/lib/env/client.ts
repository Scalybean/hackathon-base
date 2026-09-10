/**
 * Browser-safe environment variables, validated at import time.
 * Only NEXT_PUBLIC_* values live here. Never add a secret to this file.
 */
import { z } from 'zod';

const clientEnvSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.url(),
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z.string().min(20),
  // Optional: on Vercel previews the deployment URL is used instead, so a
  // preview's auth emails come back to that preview. See @/lib/site-url.
  NEXT_PUBLIC_SITE_URL: z.url().optional(),
});

// Next.js inlines NEXT_PUBLIC_* only when referenced as full literals, so the
// object cannot be built by iterating over process.env.
const parsed = clientEnvSchema.safeParse({
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
});

if (!parsed.success) {
  throw new Error(
    `Invalid public environment variables: ${parsed.error.issues.map((i) => i.path.join('.')).join(', ')}`,
  );
}

export const clientEnv = parsed.data;
