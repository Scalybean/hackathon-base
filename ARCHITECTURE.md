# ARCHITECTURE

Why the pieces are shaped the way they are. For *how to add something*, read
`PATTERNS.md` instead.

## Pinned versions

Everything is pinned exactly (`save-exact=true` in `.npmrc`) and the lockfile is
committed, so day one has no install churn and no surprise minor.

| package | version | why this one |
| --- | --- | --- |
| next | 16.3.4 | App Router, Turbopack by default, `proxy.ts` replaces middleware |
| react / react-dom | 19.2.8 | what Next 16.3 ships against |
| typescript | 5.9.3 | strict mode, `noEmit` |
| tailwindcss | 4.3.3 | CSS-first config; tokens live in CSS, not a JS object |
| @supabase/ssr | 0.12.7 | cookie sessions. The deprecated auth-helpers is lint-banned |
| @supabase/supabase-js | 2.116.0 | client, admin client, storage |
| zod | 4.6.1 | every input boundary |
| vitest | 5.0.0 | security-invariant tests only |
| xss | 1.0.15 | the sanitiser (see below) |
| @radix-ui/* | dialog 1.1.23, dropdown 2.1.24, label 2.1.15, slot 1.3.3 | unstyled a11y behaviour |
| sonner | 2.0.8 | toasts, restyled onto tokens |
| lucide-react | 1.44.0 | icons, because emoji are not icons |
| madge | 8.0.0 | dependency graph, fails on cycles |
| pg | 8.23.0 | the RLS audit connects directly |
| pnpm | 10.34.5 | `packageManager` field |

Node ≥20.9 locally; Vercel runs Node 24. `@supabase/supabase-js` warns on Node 20 and
will drop it, so use Node 22+ locally if you can.

## Decisions worth knowing

**js-xss, not DOMPurify.** `isomorphic-dompurify` pulls in jsdom, which requires Node
22+ and broke the build on Node 20. js-xss is a pure-JS allow-list parser with no DOM
dependency, so the sanitiser behaves identically on the server, in the browser and on
every Node version this template supports. One implementation, not two.

**The theme is a cookie, not an inline script.** The usual dark-mode trick is a
blocking inline `<script>` that reads `localStorage`. That would need either
`'unsafe-inline'` in `style-src`/`script-src` or nonce plumbing into the document
head. Resolving the theme server-side from a cookie removes the script entirely: no
flash, nothing to allow in the CSP. `system` writes no attribute and lets
`prefers-color-scheme` decide.

**Two wrappers, not a framework.** `route()` and `action()` are the only two entry
points for server code. They enforce order — rate limit, authenticate, authorise,
validate, act — so the order cannot be got wrong by forgetting a line. Everything
else in `src/lib/` is a plain function.

**Ownership is a database default, not application code.** `user_id` defaults to
`auth.uid()` and is excluded from the client's INSERT and UPDATE grants. That makes
"never trust a client user_id" a property Postgres enforces, rather than a convention
every future handler has to remember.

**Helper functions live in a `private` schema.** PostgREST publishes functions in
`public` as RPC endpoints. `private.is_admin()` and the trigger functions are
therefore unreachable over HTTP while still callable from policies. The first
migration also revokes the default grants Supabase hands to `anon`/`authenticated`,
so a table whose RLS was forgotten fails loudly instead of leaking.

**`SECURITY DEFINER` on `is_admin()`.** A policy on `profiles` that queries `profiles`
would recurse. Definer rights break the loop, and the function is pinned with
`set search_path = ''`.

**RLS is enabled *and* forced.** `enable` alone still lets the table owner bypass
policies. `force` closes that. `check:rls` fails on a table that has one without the
other.

**No realtime.** `supabase-js` builds a RealtimeClient inside `createClient()`,
which needs a global `WebSocket` that Node 20 does not have, so `createClient()`
throws before a single query runs. Every client that does not subscribe to
anything passes a stub as `realtime.transport` (`src/lib/supabase/no-realtime.ts`),
which skips the lookup entirely. Deleting the stub and running Node 22+ is all it
takes to enable realtime later.

**The rate limiter is one interface, two implementations.** In-memory by default,
Upstash over REST when the two env vars are present — no SDK, just two pipelined
Redis commands. The Upstash path fails **closed**: an unreachable limiter must not
become an open door.

**Generic errors, with a trace id.** `ApiError` carries messages written to be read by
users. Everything else becomes one generic 500. The client gets a short trace id that
correlates to the real error in the server log, so support is still possible without
leaking anything.

**Tokens, not utilities, carry the theme.** Components use semantic roles
(`bg-raised`, `fg-muted`, `accent-soft`) that are redefined once for dark mode. No
component writes a `dark:` utility, so there is exactly one place to change a colour.

## Request lifecycle

```
browser
  ↓
proxy.ts                      nonce + CSP, security headers, session refresh,
                              redirect if unauthenticated on a protected prefix
  ↓
(app)/layout.tsx              requireProfile() — the second lock
  ↓
page.tsx / route.ts           route() or action(): rate limit → auth → authorise
                              → Zod → handler
  ↓
src/lib/db/*.ts               query helper, re-checks ownership in the WHERE clause
  ↓
Postgres                      RLS policy: the decision that actually matters
```

Four independent layers say no. Remove any one and the other three still hold.

## Environments

| | Supabase project | Vercel environment |
| --- | --- | --- |
| local | `hackathon-base-dev` | `.env.local` |
| preview | `hackathon-base-dev` | Preview + Development |
| production | `hackathon-base-dev` | Production |

Production and preview currently share one database, because the Supabase free
tier allows two active projects per owner and both slots are spoken for. This is a
deliberate, recorded compromise, not an oversight. Nothing in the code assumes a
single project: splitting them is three environment variables and a `pnpm db:push`.

`NEXT_PUBLIC_SITE_URL` is set for Production only. Preview and Development fall
through to the deployment's own URL (`src/lib/site-url.ts`), so a preview's
confirmation email returns to that preview rather than to production. Supabase's
redirect allow-list needs a wildcard entry for this to work; the README has it.

Deployment protection is on for previews and off for production, so the demo URL is
publicly reachable while preview builds still require a Vercel login.

## What is generated, and by what

| file | command | committed? |
| --- | --- | --- |
| `src/types/database.ts` | `pnpm types` | yes — so no agent reads a migration for a column name |
| `REPOMAP.md` | `pnpm map` + `pnpm graph` | yes — it is the repo index |
| `pnpm-lock.yaml` | pnpm | yes |
| the eight files from `pnpm new:resource` | scaffolder | yes, after you edit the migration |

Regenerate types and the map in the same commit as the change that made them stale.
