/**
 * Lands every emailed link: signup confirmation, password recovery, email
 * change. Exchanges the one-time token for a session, then redirects.
 * Not wrapped in route(): Supabase controls the shape of this callback.
 */
import { NextResponse, type NextRequest } from 'next/server';
import type { EmailOtpType } from '@supabase/supabase-js';

import { safeRedirect } from '@/lib/safe-redirect';
import { createServerSupabase } from '@/lib/supabase/server';

const ALLOWED_TYPES: EmailOtpType[] = ['signup', 'recovery', 'email_change', 'invite', 'magiclink'];

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const tokenHash = params.get('token_hash');
  const type = params.get('type') as EmailOtpType | null;
  const next = safeRedirect(params.get('next'));

  const failed = new URL('/login?error=link', request.nextUrl.origin);

  if (!tokenHash || !type || !ALLOWED_TYPES.includes(type)) {
    return NextResponse.redirect(failed);
  }

  const supabase = await createServerSupabase();
  const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });

  // The specific reason (expired, already used, forged) is never returned:
  // one generic outcome for every failure mode.
  if (error) return NextResponse.redirect(failed);

  return NextResponse.redirect(new URL(next, request.nextUrl.origin));
}
