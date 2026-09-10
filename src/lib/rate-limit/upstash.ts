/**
 * Upstash Redis limiter over the REST API. No SDK dependency: it is two
 * pipelined commands. Used automatically when the Upstash env vars are set.
 */
import 'server-only';

import type { RateLimitResult, RateLimitRule, RateLimiter } from './types';

type PipelineReply = Array<{ result?: number; error?: string }>;

export function createUpstashRateLimiter(url: string, token: string): RateLimiter {
  return {
    name: 'upstash',
    async check(key: string, rule: RateLimitRule): Promise<RateLimitResult> {
      const windowSeconds = Math.ceil(rule.windowMs / 1000);
      const window = Math.floor(Date.now() / rule.windowMs);
      const redisKey = `rl:${key}:${window}`;

      const response = await fetch(`${url}/pipeline`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify([
          ['INCR', redisKey],
          ['EXPIRE', redisKey, String(windowSeconds), 'NX'],
        ]),
        cache: 'no-store',
      });

      if (!response.ok) {
        // Fail closed: an unreachable limiter must not become an open door.
        return { success: false, limit: rule.limit, remaining: 0, reset: Date.now() + rule.windowMs };
      }

      const body = (await response.json()) as PipelineReply;
      const count = body[0]?.result ?? rule.limit + 1;

      return {
        success: count <= rule.limit,
        limit: rule.limit,
        remaining: Math.max(0, rule.limit - count),
        reset: (window + 1) * rule.windowMs,
      };
    },
  };
}
