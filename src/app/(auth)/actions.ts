/**
 * Every auth mutation. All of them go through action(), so all of them are
 * rate limited and Zod validated before Supabase is touched.
 * Error messages here are deliberately vague: see CLAUDE.md rule 10.
 */
'use server';

import { redirect } from 'next/navigation';

import { action } from '@/lib/api/action';
import { ApiError } from '@/lib/api/errors';
import { clientEnv } from '@/lib/env/client';
import { safeRedirect } from '@/lib/safe-redirect';
import {
  forgotPasswordSchema,
  resetPasswordSchema,
  signInSchema,
  signUpSchema,
} from '@/lib/schemas/auth';
import { z } from 'zod';

const nextSchema = z.string().optional();

/**
 * Sign in. The failure message is identical for "no such account" and "wrong
 * password" so the form cannot be used to enumerate registered emails.
 */
export const signInAction = action(
  {
    rateLimit: 'auth',
    auth: false,
    input: signInSchema.extend({ next: nextSchema }),
  },
  async ({ input, supabase }) => {
    const { error } = await supabase.auth.signInWithPassword({
      email: input.email,
      password: input.password,
    });

    if (error) {
      throw new ApiError('unauthorized', 'Email or password is incorrect.');
    }

    redirect(safeRedirect(input.next));
  },
);

/**
 * Sign up. Always reports the same "check your inbox" outcome, whether or not
 * the address was already registered. Supabase itself sends a "someone tried
 * to sign up with your address" mail in that case.
 */
export const signUpAction = action(
  {
    rateLimit: 'auth',
    auth: false,
    input: signUpSchema,
  },
  async ({ input, supabase }) => {
    const { error } = await supabase.auth.signUp({
      email: input.email,
      password: input.password,
      options: {
        // display_name is client-controlled; the signup trigger sanitises it
        // before it reaches profiles. Nothing here can set a role.
        data: { display_name: input.displayName },
        emailRedirectTo: `${clientEnv.NEXT_PUBLIC_SITE_URL}/auth/confirm?next=/dashboard`,
      },
    });

    // A rate-limit error from Supabase is worth surfacing; anything else is
    // swallowed so the response is identical for new and existing addresses.
    if (error?.status === 429) {
      throw new ApiError('rate_limited', 'Too many attempts. Please try again shortly.');
    }

    return { email: input.email };
  },
);

/** Password reset request. Same response whether or not the account exists. */
export const forgotPasswordAction = action(
  {
    rateLimit: 'auth',
    auth: false,
    input: forgotPasswordSchema,
  },
  async ({ input, supabase }) => {
    await supabase.auth.resetPasswordForEmail(input.email, {
      redirectTo: `${clientEnv.NEXT_PUBLIC_SITE_URL}/auth/confirm?next=/reset-password`,
    });
    return { email: input.email };
  },
);

/**
 * Sets a new password. Requires the recovery session that /auth/confirm
 * established, so `auth` stays on: no session, no reset.
 */
export const resetPasswordAction = action(
  {
    rateLimit: 'auth',
    input: resetPasswordSchema,
  },
  async ({ input, supabase }) => {
    const { error } = await supabase.auth.updateUser({ password: input.password });
    if (error) {
      throw new ApiError('invalid_input', 'That password could not be set. Try a different one.');
    }

    // Every other device holding a session for this account is signed out.
    await supabase.auth.signOut({ scope: 'others' });
    redirect('/dashboard');
  },
);
