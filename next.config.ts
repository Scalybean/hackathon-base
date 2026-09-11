/**
 * Next config. Static security headers live here; the CSP is per-request and
 * lives in proxy.ts because it needs a fresh nonce each time.
 */
import type { NextConfig } from 'next';

const securityHeaders = [
  // Legacy sibling of CSP frame-ancestors 'none'. Kept for old browsers.
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload',
  },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=(), browsing-topics=(), payment=()',
  },
  { key: 'X-DNS-Prefetch-Control', value: 'off' },
  { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
];

const nextConfig: NextConfig = {
  // Do not advertise the framework version to anyone fingerprinting the app.
  poweredByHeader: false,
  reactStrictMode: true,

  // A type error must fail the deploy, not ship to production. Lint is a
  // separate gate in `pnpm verify`; Next 16 no longer runs it during build.
  typescript: { ignoreBuildErrors: false },

  async headers() {
    return [
      { source: '/:path*', headers: securityHeaders },
      {
        // The worker must never be stale: a pinned old worker keeps serving an
        // old cache policy. Its own CSP is tighter than the page's, because it
        // legitimately needs nothing but same-origin script.
        source: '/sw.js',
        headers: [
          { key: 'Content-Type', value: 'application/javascript; charset=utf-8' },
          { key: 'Cache-Control', value: 'no-cache, no-store, must-revalidate' },
          { key: 'Content-Security-Policy', value: "default-src 'self'; script-src 'self'" },
          // Root scope, so one worker covers the whole app.
          { key: 'Service-Worker-Allowed', value: '/' },
        ],
      },
    ];
  },
};

export default nextConfig;
