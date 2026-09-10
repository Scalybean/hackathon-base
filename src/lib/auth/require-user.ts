/**
 * The only way server code gets the current user.
 * Every helper here calls supabase.auth.getUser(), which revalidates the JWT
 * against the auth server. Never make an access decision from getSession().
 */
import 'server-only';

import { notFound, redirect } from 'next/navigation';
import type { SupabaseClient, User } from '@supabase/supabase-js';

import { createServerSupabase } from '@/lib/supabase/server';
import type { Database, Tables } from '@/types/database';

export type Profile = Tables<'profiles'>;

export type AuthedContext = {
  user: User;
  supabase: SupabaseClient<Database>;
};

export type AuthedProfileContext = AuthedContext & {
  profile: Profile;
};

/** Returns the current user, or null. Use only on genuinely public pages. */
export async function getOptionalUser(): Promise<User | null> {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

/** Returns the current user, or redirects to /login. */
export async function requireUser(): Promise<AuthedContext> {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  return { user, supabase };
}

/** Returns the current user plus their profile row, or redirects to /login. */
export async function requireProfile(): Promise<AuthedProfileContext> {
  const { user, supabase } = await requireUser();

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (!profile) {
    // The signup trigger failed or the row was removed. Treat as unauthenticated
    // rather than rendering a half-built session.
    redirect('/login');
  }

  return { user, supabase, profile };
}

/** True when the current user is an admin. */
export async function isAdmin(): Promise<boolean> {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return false;

  const { data } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  return data?.role === 'admin';
}

/**
 * Returns the current user, or renders 404 when they are not an admin.
 * 404 rather than 403 so the existence of the admin surface is not confirmed
 * to a non-admin.
 */
export async function requireAdmin(): Promise<AuthedProfileContext> {
  const context = await requireProfile();
  if (context.profile.role !== 'admin') {
    notFound();
  }
  return context;
}
