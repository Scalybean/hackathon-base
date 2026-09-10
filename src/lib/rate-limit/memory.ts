/**
 * In-memory fixed-window limiter. The default in dev and on a single instance.
 * State is per-process, so it does not hold across Vercel's serverless
 * instances: set the Upstash variables before relying on it in production.
 */
import type { RateLimitResult, RateLimitRule, RateLimiter } from './types';

type Bucket = { count: number; reset: number };

const buckets = new Map<string, Bucket>();
let lastSweep = 0;

function sweep(now: number) {
  if (now - lastSweep < 60_000) return;
  lastSweep = now;
  for (const [key, bucket] of buckets) {
    if (bucket.reset <= now) buckets.delete(key);
  }
}

export const memoryRateLimiter: RateLimiter = {
  name: 'memory',
  async check(key: string, rule: RateLimitRule): Promise<RateLimitResult> {
    const now = Date.now();
    sweep(now);

    const existing = buckets.get(key);
    const bucket =
      existing && existing.reset > now ? existing : { count: 0, reset: now + rule.windowMs };

    bucket.count += 1;
    buckets.set(key, bucket);

    return {
      success: bucket.count <= rule.limit,
      limit: rule.limit,
      remaining: Math.max(0, rule.limit - bucket.count),
      reset: bucket.reset,
    };
  },
};
