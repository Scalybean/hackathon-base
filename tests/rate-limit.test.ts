/** The limiter is what a red team hits first. It must count, and it must expire. */
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { memoryRateLimiter } from '@/lib/rate-limit/memory';

const rule = { limit: 3, windowMs: 1_000 };

describe('memoryRateLimiter', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-01T00:00:00Z'));
  });

  it('allows exactly the configured number of requests', async () => {
    const key = `allow-${Math.random()}`;
    for (let i = 0; i < rule.limit; i += 1) {
      expect((await memoryRateLimiter.check(key, rule)).success).toBe(true);
    }
    expect((await memoryRateLimiter.check(key, rule)).success).toBe(false);
  });

  it('keeps separate counters per key', async () => {
    const a = `a-${Math.random()}`;
    const b = `b-${Math.random()}`;
    for (let i = 0; i < rule.limit; i += 1) await memoryRateLimiter.check(a, rule);

    expect((await memoryRateLimiter.check(a, rule)).success).toBe(false);
    expect((await memoryRateLimiter.check(b, rule)).success).toBe(true);
  });

  it('resets after the window elapses', async () => {
    const key = `reset-${Math.random()}`;
    for (let i = 0; i < rule.limit + 1; i += 1) await memoryRateLimiter.check(key, rule);
    expect((await memoryRateLimiter.check(key, rule)).success).toBe(false);

    vi.advanceTimersByTime(rule.windowMs + 1);
    expect((await memoryRateLimiter.check(key, rule)).success).toBe(true);
  });

  it('reports remaining and never goes negative', async () => {
    const key = `remaining-${Math.random()}`;
    const first = await memoryRateLimiter.check(key, rule);
    expect(first.remaining).toBe(rule.limit - 1);

    for (let i = 0; i < 10; i += 1) await memoryRateLimiter.check(key, rule);
    expect((await memoryRateLimiter.check(key, rule)).remaining).toBe(0);
  });
});
