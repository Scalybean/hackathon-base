/**
 * The one rate-limiter interface. Swap the implementation, never the callers.
 */

export type RateLimitResult = {
  success: boolean;
  limit: number;
  remaining: number;
  /** Epoch milliseconds at which the current window resets. */
  reset: number;
};

export type RateLimitRule = {
  /** Requests allowed per window. */
  limit: number;
  /** Window length in milliseconds. */
  windowMs: number;
};

export interface RateLimiter {
  readonly name: string;
  check(key: string, rule: RateLimitRule): Promise<RateLimitResult>;
}
