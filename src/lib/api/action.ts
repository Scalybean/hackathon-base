/**
 * The single wrapper for every server action. Same order as route(): rate
 * limit, authenticate, authorise, validate, act. Returns a plain serialisable
 * result so forms can render errors without try/catch. See PATTERNS.md §3.
 */
import 'server-only';

import { headers } from 'next/headers';
import type { SupabaseClient, User } from '@supabase/supabase-js';
import { z } from 'zod';

import { RATE_LIMITS, getRateLimiter, type RateLimitName } from '@/lib/rate-limit';
import { createServerSupabase } from '@/lib/supabase/server';
import { logError, newTraceId } from '@/lib/log';
import type { Database } from '@/types/database';

import { ApiError, internalError, invalidInputError, rateLimitedError, unauthorizedError } from './errors';
import { getClientIpFromHeaders } from './request-ip';

export type ActionSuccess<T> = { ok: true; data: T };
export type ActionFailure = {
  ok: false;
  message: string;
  code: string;
  fields?: Record<string, string[]>;
};
export type ActionResult<T> = ActionSuccess<T> | ActionFailure;

export type ActionConfig<TInput extends z.ZodType> = {
  /** Named rule from RATE_LIMITS. Required: there is no unlimited action. */
  rateLimit: RateLimitName;
  /** Zod schema applied to the FormData or object the action receives. */
  input: TInput;
  /** Set false only for genuinely public actions (login, signup). Default true. */
  auth?: boolean;
  /** Requires profiles.role = 'admin'. Implies auth. */
  admin?: boolean;
};

export type ActionContext<TInput extends z.ZodType> = {
  input: z.infer<TInput>;
  supabase: SupabaseClient<Database>;
  user: User;
};

export function action<TInput extends z.ZodType, TResult>(
  config: ActionConfig<TInput>,
  handler: (context: ActionContext<TInput>) => Promise<TResult>,
) {
  return async function run(raw: FormData | Record<string, unknown>): Promise<ActionResult<TResult>> {
    const traceId = newTraceId();

    try {
      // 0. Rate limit by IP before doing any work.
      const rule = RATE_LIMITS[config.rateLimit];
      const headerList = await headers();
      const ip = getClientIpFromHeaders(headerList);
      const limit = await getRateLimiter().check(`action:${config.rateLimit}:${ip}`, rule);
      if (!limit.success) throw rateLimitedError();

      // 1. Authenticate.
      const supabase = await createServerSupabase();
      const requiresAuth = config.auth !== false || config.admin === true;

      let user: User | null = null;
      if (requiresAuth) {
        const {
          data: { user: authedUser },
        } = await supabase.auth.getUser();
        if (!authedUser) throw unauthorizedError();
        user = authedUser;
      }

      // 2. Authorise.
      if (config.admin) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user!.id)
          .single();
        if (profile?.role !== 'admin') throw new ApiError('not_found', 'Not found.');
      }

      // 3. Validate.
      const candidate = raw instanceof FormData ? formDataToObject(raw) : raw;
      const parsed = config.input.safeParse(candidate);
      if (!parsed.success) throw invalidInputError(fieldErrors(parsed.error));

      // 4. Act.
      const data = await handler({ input: parsed.data, supabase, user: user as User });
      return { ok: true, data };
    } catch (error) {
      return actionFailure(error, traceId);
    }
  };
}

function formDataToObject(formData: FormData): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [key, value] of formData.entries()) {
    if (value instanceof File) continue;
    out[key] = value;
  }
  return out;
}

function fieldErrors(error: z.ZodError): Record<string, string[]> {
  const out: Record<string, string[]> = {};
  for (const issue of error.issues) {
    const key = issue.path.join('.') || '_';
    (out[key] ??= []).push(issue.message);
  }
  return out;
}

/** Flattens any thrown value into a safe, serialisable failure. */
export function actionFailure(error: unknown, traceId: string): ActionFailure {
  if (isNextControlFlow(error)) throw error;

  if (error instanceof ApiError) {
    if (error.status >= 500) logError(traceId, 'action', error);
    return { ok: false, code: error.code, message: error.message, fields: error.fieldErrors };
  }

  logError(traceId, 'action', error);
  const generic = internalError();
  return { ok: false, code: generic.code, message: generic.message };
}

function isNextControlFlow(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'digest' in error &&
    typeof (error as { digest?: unknown }).digest === 'string' &&
    ((error as { digest: string }).digest.startsWith('NEXT_REDIRECT') ||
      (error as { digest: string }).digest === 'NEXT_NOT_FOUND')
  );
}
