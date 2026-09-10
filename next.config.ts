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
    return [{ source: '/:path*', headers: securityHeaders }];
  },
};

export default nextConfig;
