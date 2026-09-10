# SECURITY

What a red team with the source and the publishable key will try, and where each
attempt dies. Every row names the file or policy that stops it.

The publishable (anon) key is public by design. It is exactly as powerful as the RLS
policies allow, which is why the policies are the product.

## The attacks, and where they are blocked

### 1. Read another user's rows

**Try**: sign in as Bob, call `GET /api/notes?user_id=<alice>`, or hit
`/notes/<alice's id>`, or use the publishable key directly against PostgREST.

**Blocked at three layers**:
- `notes_select_own` (`supabase/migrations/*_notes.sql`) — `using (user_id = (select auth.uid()))`.
  Postgres returns zero rows regardless of what the query asks for.
- `getNote()` (`src/lib/db/notes.ts`) filters on `user_id` as well as `id`.
- `notFoundError()` (`src/lib/api/errors.ts`) returns the same 404 for "missing" and
  "not yours", so the endpoint is not an existence oracle.

**Proven by**: `pnpm seed` then the five-step check it prints.

### 2. Forge ownership on write

**Try**: `POST /api/notes` with `{"title":"x","user_id":"<alice>"}`.

**Blocked at three layers**:
- The `INSERT` grant lists only `(title, body)`. Postgres refuses the column outright.
- `user_id` defaults to `auth.uid()`, so the database assigns the owner.
- `createNoteSchema` (`src/lib/schemas/notes.ts`) has no `user_id` field, so Zod
  strips it before the query is built.

**Proven by**: `tests/schemas.test.ts` and the `Client-writable ownership column`
check in `scripts/check-rls.ts`.

### 3. Escalate to admin

**Try**: `PATCH /profiles` setting `role: 'admin'`, or pass `role` in signup metadata.

**Blocked at three layers**:
- The `UPDATE` grant on `profiles` covers `(display_name, avatar_path)` only.
- `profiles_guard_privileged_columns` raises an exception if `role` changes and the
  caller is not already an admin.
- `private.handle_new_user()` never reads a role from `raw_user_meta_data`; every new
  user is `'user'`.

### 4. Find the admin surface

**Try**: guess `/admin` as a normal user.

**Blocked**: `requireAdmin()` (`src/lib/auth/require-user.ts`) calls `notFound()`, so
the response is a 404 and not a 403. A 403 would confirm the route exists. The
sidebar also hides the link, but that is cosmetic, not a control.

### 5. Steal the service-role key

**Try**: grep the JS bundle, or find a client component that imports a server module.

**Blocked**:
- `src/lib/env/server.ts` imports `server-only`, so pulling it into a client component
  fails the build.
- `pnpm check:leak` scans every `src/**` client component for server-only imports and
  greps every built client chunk for both the variable name and the literal key value.
  It runs inside `pnpm verify`.
- The key is never referenced outside `src/lib/supabase/admin.ts` and `scripts/`.

### 6. Session forgery / cookie tampering

**Try**: edit the session cookie, or replay an old one.

**Blocked**: every access decision calls `supabase.auth.getUser()`, which revalidates
the JWT against the auth server. `getSession()` only decodes the cookie and is banned
by the `no-restricted-syntax` rule in `eslint.config.mjs`.

### 7. Stored XSS

**Try**: save `<img src=x onerror=alert(1)>` as a note title, or a note body full of
markup, and wait for it to be rendered.

**Blocked**:
- Everything is rendered as React text, which escapes by default.
- `react/no-danger` is an error everywhere except `src/components/ui/safe-html.tsx`.
- `SafeHtml` routes through `sanitizeHtml()` (`src/lib/sanitize.ts`), a js-xss
  allow-list of formatting tags only, with `javascript:`, `data:` and `vbscript:`
  hrefs dropped and dangerous tag bodies stripped rather than escaped.
- The CSP forbids inline script even if something slipped through.

**Proven by**: `tests/sanitize.test.ts`, including mutation-XSS and `mglyph` payloads.

### 8. Clickjacking and framing

**Blocked**: `frame-ancestors 'none'` in the CSP plus `X-Frame-Options: DENY` in
`next.config.ts` for browsers that predate CSP level 2.

### 9. Open redirect off the login page

**Try**: `/login?next=https://evil.example`, or `//evil.example`, or `/\evil.example`.

**Blocked**: `safeRedirect()` (`src/lib/safe-redirect.ts`) accepts only single-slash
site-relative paths with no backslashes, and falls back to `/dashboard`.
`proxy.ts` and `/auth/confirm` both use it.

**Proven by**: `tests/safe-redirect.test.ts`.

### 10. Credential stuffing and password spraying

**Blocked**: the `auth` rate limit is 5 requests per minute per IP, applied before any
Supabase call so unauthenticated spray cannot amplify into database load.
`src/lib/api/action.ts` and `src/lib/api/handler.ts` apply it first, always.

Set `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` in production: without
them the limiter is per-process memory and does not hold across Vercel instances.
The Upstash limiter fails **closed** if Redis is unreachable.

### 11. User enumeration

**Try**: compare responses for a registered and an unregistered address.

**Blocked**: sign-in returns one message for both wrong password and unknown account.
Sign-up and password reset both return the same "check your inbox" screen either way.
`/auth/confirm` returns one generic failure for expired, already-used and forged links.

### 12. Account takeover via a stolen session

**Try**: with a hijacked cookie, delete or take over the account.

**Blocked**: `deleteAccountAction` re-authenticates with the password before touching
anything. `resetPasswordAction` signs out every other device afterwards.

### 13. Information disclosure through errors

**Blocked**: `errorResponse()` and `actionFailure()` are the only places an error
becomes a response. Known `ApiError`s carry a message written to be shown; anything
else becomes `"Something went wrong. Please try again."` with the real error logged
server-side under a trace id the client also receives.

### 14. Denial of wallet on a paid API

**Blocked**: the `expensive` rate limit is 10 per minute. Any route calling a paid API
uses it, and third-party keys live only in `src/lib/env/server.ts`, so no browser can
call the provider directly.

## Tightening the CSP

The CSP ships **report-only** so a missed directive breaks the console rather than the
product. To enforce it:

1. Open every page including `/styleguide` in a browser, in light and dark.
2. Confirm zero `Content-Security-Policy-Report-Only` violations in the console.
3. Set `CSP_ENFORCE=true` in the Vercel environment and redeploy.

One directive is still loose: `style-src` carries `'unsafe-inline'` because next/font
and Tailwind emit unnonced inline `<style>`. Scripts are already nonce + `strict-dynamic`
with no `'unsafe-inline'`, which is the directive that matters for XSS. The policy
lives in one place: `src/lib/security/csp.ts`.

## What is deliberately not covered

- **CSRF tokens.** Next server actions carry an origin check, and session cookies are
  `SameSite=Lax`. Add explicit tokens if you introduce a cross-site form post.
- **Audit logging.** No append-only record of who changed what.
- **Multi-factor auth.** Supabase supports it; it is not wired up.
- **Automated dependency scanning.** Run `pnpm audit` before the demo.

## Reporting

This is a hackathon template, not a product. There is no disclosure process. If you
find a hole in the template itself, fix it in a migration or a wrapper — never with a
one-off check at a call site, because the next agent will not know it exists.
