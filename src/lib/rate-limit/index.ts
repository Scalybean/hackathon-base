/**
 * Picks the limiter implementation and holds the named rules.
 * Add a rule here rather than passing raw numbers at call sites.
 */
import 'server-only';

import { memoryRateLimiter } from './memory';
import type { RateLimitRule, RateLimiter } from './types';
import { createUpstashRateLimiter } from './upstash';

export type { RateLimitResult, RateLimitRule, RateLimiter } from './types';

let cached: RateLimiter | null = null;

export function getRateLimiter(): RateLimiter {
  if (cached) return cached;

  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  cached = url && token ? createUpstashRateLimiter(url, token) : memoryRateLimiter;
  return cached;
}

/**
 * Named rules. `auth` is deliberately tight: these endpoints are the ones a
 * red team will spray. `expensive` is for anything calling a paid API.
 */
export const RATE_LIMITS = {
  auth: { limit: 5, windowMs: 60_000 },
  mutation: { limit: 30, windowMs: 60_000 },
  read: { limit: 120, windowMs: 60_000 },
  expensive: { limit: 10, windowMs: 60_000 },
} as const satisfies Record<string, RateLimitRule>;

export type RateLimitName = keyof typeof RATE_LIMITS;
