/**
 * The single wrapper for every route handler. It runs rate limit, then
 * authentication, then authorisation, then Zod validation, then your code.
 * If you are writing a route handler and not calling this, you are doing it
 * wrong. See PATTERNS.md section 4.
 */
import 'server-only';

import { NextResponse, type NextRequest } from 'next/server';
import type { SupabaseClient, User } from '@supabase/supabase-js';
import { z } from 'zod';

import { RATE_LIMITS, getRateLimiter, type RateLimitName } from '@/lib/rate-limit';
import { createServerSupabase } from '@/lib/supabase/server';
import { logError, newTraceId } from '@/lib/log';
import type { Database } from '@/types/database';

import {
  ApiError,
  internalError,
  invalidInputError,
  rateLimitedError,
  unauthorizedError,
} from './errors';
import { getClientIp } from './request-ip';

type ZodAny = z.ZodType;
type Infer<T> = T extends ZodAny ? z.infer<T> : undefined;

export type RouteConfig<TBody extends ZodAny | undefined, TQuery extends ZodAny | undefined> = {
  /** Named rule from RATE_LIMITS. Required: there is no unlimited route. */
  rateLimit: RateLimitName;
  /** Zod schema for the JSON body. Omit for GET/DELETE. */
  body?: TBody;
  /** Zod schema for search params. */
  query?: TQuery;
  /** Set false only for genuinely public endpoints. Defaults to true. */
  auth?: boolean;
  /** Requires profiles.role = 'admin'. Implies auth. */
  admin?: boolean;
};

export type RouteContext<TBody extends ZodAny | undefined, TQuery extends ZodAny | undefined> = {
  request: NextRequest;
  supabase: SupabaseClient<Database>;
  user: User;
  body: Infer<TBody>;
  query: Infer<TQuery>;
  params: Record<string, string>;
};

type NextRouteArgs = { params: Promise<Record<string, string>> };

const MAX_BODY_BYTES = 64 * 1024;

export function route<
  TBody extends ZodAny | undefined = undefined,
  TQuery extends ZodAny | undefined = undefined,
>(
  config: RouteConfig<TBody, TQuery>,
  handler: (context: RouteContext<TBody, TQuery>) => Promise<unknown>,
) {
  return async function handle(request: NextRequest, args?: NextRouteArgs) {
    const traceId = newTraceId();

    try {
      // 0. Rate limit, keyed by IP, before any database or auth work so that
      //    unauthenticated spray cannot amplify into Supabase calls.
      const rule = RATE_LIMITS[config.rateLimit];
      const limiterKey = `${new URL(request.url).pathname}:${getClientIp(request)}`;
      const limit = await getRateLimiter().check(limiterKey, rule);
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
        // Generic 404: never confirm that an admin surface exists.
        if (profile?.role !== 'admin') throw new ApiError('not_found', 'Not found.');
      }

      // 3. Validate.
      let body: unknown;
      if (config.body) {
        const raw = await readJsonBody(request);
        const parsed = config.body.safeParse(raw);
        if (!parsed.success) throw invalidInputError(fieldErrors(parsed.error));
        body = parsed.data;
      }

      let query: unknown;
      if (config.query) {
        const searchParams = Object.fromEntries(new URL(request.url).searchParams.entries());
        const parsed = config.query.safeParse(searchParams);
        if (!parsed.success) throw invalidInputError(fieldErrors(parsed.error));
        query = parsed.data;
      }

      // 4. Act.
      const params = args ? await args.params : {};
      const result = await handler({
        request,
        supabase,
        user: user as User,
        body: body as Infer<TBody>,
        query: query as Infer<TQuery>,
        params,
      });

      return NextResponse.json({ ok: true, data: result ?? null });
    } catch (error) {
      return errorResponse(error, traceId);
    }
  };
}

async function readJsonBody(request: NextRequest): Promise<unknown> {
  const declared = Number(request.headers.get('content-length') ?? '0');
  if (declared > MAX_BODY_BYTES) throw invalidInputError();

  const text = await request.text();
  if (text.length > MAX_BODY_BYTES) throw invalidInputError();
  if (!text) return {};

  try {
    return JSON.parse(text);
  } catch {
    throw invalidInputError();
  }
}

function fieldErrors(error: z.ZodError): Record<string, string[]> {
  const out: Record<string, string[]> = {};
  for (const issue of error.issues) {
    const key = issue.path.join('.') || '_';
    (out[key] ??= []).push(issue.message);
  }
  return out;
}

/**
 * The only place an error becomes a response. Known ApiErrors carry a safe
 * message; everything else is flattened to a generic 500 so that Postgres
 * messages and stack traces never reach the client.
 */
export function errorResponse(error: unknown, traceId: string) {
  if (error instanceof ApiError) {
    if (error.status >= 500) logError(traceId, 'route', error);
    return NextResponse.json(
      {
        ok: false,
        error: { code: error.code, message: error.message, fields: error.fieldErrors, traceId },
      },
      { status: error.status },
    );
  }

  // Next's redirect()/notFound() signal via a thrown value. Let them through.
  if (isNextControlFlow(error)) throw error;

  logError(traceId, 'route', error);
  const generic = internalError();
  return NextResponse.json(
    { ok: false, error: { code: generic.code, message: generic.message, traceId } },
    { status: 500 },
  );
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
