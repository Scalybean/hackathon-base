/**
 * Avatar storage. The bucket is private, so every read is a short-lived signed
 * URL minted on the server. Object keys are always <user_id>/<name>, which is
 * what the storage RLS policies match on.
 */
import 'server-only';

import type { SupabaseClient } from '@supabase/supabase-js';

import type { Database } from '@/types/database';

export const AVATAR_BUCKET = 'avatars';
export const AVATAR_MAX_BYTES = 2 * 1024 * 1024;
export const AVATAR_MIME_TYPES = ['image/png', 'image/jpeg', 'image/webp'] as const;

const SIGNED_URL_TTL_SECONDS = 60 * 10;

/** Object key for a user's avatar. The user id prefix is the ownership check. */
export function avatarPath(userId: string, extension: string): string {
  const safe = extension.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 5);
  return `${userId}/avatar-${Date.now()}.${safe || 'bin'}`;
}

/** Null rather than throwing: a missing avatar must never break a page. */
export async function signedAvatarUrl(
  supabase: SupabaseClient<Database>,
  path: string | null,
): Promise<string | null> {
  if (!path) return null;

  const { data, error } = await supabase.storage
    .from(AVATAR_BUCKET)
    .createSignedUrl(path, SIGNED_URL_TTL_SECONDS);

  return error ? null : data.signedUrl;
}
