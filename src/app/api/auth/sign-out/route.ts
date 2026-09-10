/**
 * Sign out. POST only, so a stray <img src> cannot log a user out.
 * Clears the session cookies server-side rather than trusting the client.
 */
import { NextResponse } from 'next/server';

import { createServerSupabase } from '@/lib/supabase/server';

export async function POST() {
  const supabase = await createServerSupabase();
  await supabase.auth.signOut();
  return NextResponse.json({ ok: true });
}
