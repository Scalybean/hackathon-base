/** The CSP is one string. A missing directive is a silent hole, so assert them. */
import { describe, expect, it } from 'vitest';

import { buildCsp, newNonce } from '@/lib/security/csp';

const ORIGIN = 'https://project.supabase.co';

describe('buildCsp', () => {
  const csp = buildCsp('test-nonce', ORIGIN);

  it.each([
    "default-src 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "frame-src 'none'",
  ])('declares %s', (directive) => {
    expect(csp).toContain(directive);
  });

  it('nonces scripts and uses strict-dynamic', () => {
    expect(csp).toContain("'nonce-test-nonce'");
    expect(csp).toContain("'strict-dynamic'");
  });

  it('never allows inline script', () => {
    const scriptSrc = csp.split('; ').find((directive) => directive.startsWith('script-src'));
    expect(scriptSrc).not.toContain("'unsafe-inline'");
  });

  it('allows the Supabase origin to be reached but nothing wildcarded', () => {
    const connectSrc = csp.split('; ').find((directive) => directive.startsWith('connect-src'));
    expect(connectSrc).toContain(ORIGIN);
    expect(connectSrc).toContain('wss://project.supabase.co');
    expect(connectSrc).not.toContain('*');
  });
});

describe('newNonce', () => {
  it('is unpredictable per call', () => {
    const nonces = new Set(Array.from({ length: 50 }, () => newNonce()));
    expect(nonces.size).toBe(50);
  });
});
