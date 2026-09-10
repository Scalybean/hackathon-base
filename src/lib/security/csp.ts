/**
 * The one Content-Security-Policy definition. Built per-request because the
 * script nonce must be unique. See SECURITY.md "Tightening the CSP".
 */

/**
 * Report-only while the app is being built, so a missed directive breaks the
 * browser console instead of the product. Flip CSP_ENFORCE=true in Vercel once
 * /styleguide and every page render clean with zero violations reported.
 */
export const CSP_ENFORCED = process.env.CSP_ENFORCE === 'true';

export const CSP_HEADER_NAME = CSP_ENFORCED
  ? 'Content-Security-Policy'
  : 'Content-Security-Policy-Report-Only';

export function newNonce(): string {
  return btoa(crypto.randomUUID());
}

/**
 * `supabaseOrigin` is passed in rather than read from env so this module stays
 * importable from tests without a full environment.
 */
export function buildCsp(nonce: string, supabaseOrigin: string): string {
  const isDev = process.env.NODE_ENV === 'development';

  const directives = [
    `default-src 'self'`,
    // strict-dynamic makes the allow-list irrelevant for scripts: only the
    // nonced loader runs, plus whatever it chooses to load.
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${isDev ? " 'unsafe-eval'" : ''}`,
    // 'unsafe-inline' is still required: next/font and Tailwind emit inline
    // <style> without a nonce. This is the one directive left to tighten.
    `style-src 'self' 'unsafe-inline'`,
    `img-src 'self' blob: data: ${supabaseOrigin}`,
    `font-src 'self' data:`,
    `connect-src 'self' ${supabaseOrigin} ${supabaseOrigin.replace('https://', 'wss://')}`,
    `media-src 'self' ${supabaseOrigin}`,
    `object-src 'none'`,
    `base-uri 'self'`,
    `form-action 'self'`,
    `frame-ancestors 'none'`,
    `frame-src 'none'`,
    `worker-src 'self' blob:`,
    `manifest-src 'self'`,
    ...(isDev ? [] : ['upgrade-insecure-requests']),
  ];

  return directives.join('; ');
}
