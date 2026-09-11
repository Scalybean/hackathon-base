@AGENTS.md

# hackathon-base

Read `PATTERNS.md` for recipes and `REPOMAP.md` for the file index. Do not explore the repo.

## Stack (pinned; do not substitute)

Next 16.3.4 App Router · React 19.2.8 · TypeScript 5.9.3 strict · Tailwind 4.3.3 ·
`@supabase/ssr` 0.12.7 + `@supabase/supabase-js` 2.116.0 · Zod 4.6.1 · Vitest 5.0.0 ·
Radix primitives · js-xss 1.0.15 · pnpm 10.34.5 · Node ≥20.9 (Vercel runs 24).

Next 16 renamed `middleware.ts` to `proxy.ts`. `cookies()`, `headers()`, `params` and
`searchParams` are async. `next lint` is gone. Turbopack is the default builder.

## Hard rules — never violate

1. **RLS on every table in `public`**, `enable` and `force`. No exceptions.
2. **Default deny.** One policy per operation. Never `USING (true)`. Never `FOR ALL`.
   Always `TO authenticated`, never `TO public` or `TO anon`.
3. **Ownership comes from `auth.uid()`**, inside the policy and via the column default.
   Never accept a `user_id` from a client, in any code path. Do not grant
   INSERT/UPDATE on a `user_id` column.
4. **Schema changes only via `supabase/migrations/`.** Never the dashboard.
   After a migration: `pnpm db:push` then `pnpm types`.
5. **Every route handler is `route(...)`; every server action is `action(...)`.**
   Order is fixed: rate limit → authenticate → authorise → Zod → act.
   If you write a handler without the wrapper, you have made a mistake.
6. **Re-check ownership in the query.** Every `[id]` path filters on `user_id` as
   well as `id`, even though RLS also blocks it. Use the helpers in `src/lib/db/`.
   Deletes are soft: every read also filters `deleted_at is null`.
7. **Rate limit everything that writes or costs money.** Pick a name from
   `RATE_LIMITS`: `auth`, `mutation`, `read`, `expensive`. There is no unlimited route.
8. **`SUPABASE_SERVICE_ROLE_KEY` is server-only.** Never in a client component, never
   behind `NEXT_PUBLIC_`. `@/lib/supabase/admin` only after auth *and* authorisation.
   Third-party API keys are called from server route handlers only.
9. **No `dangerouslySetInnerHTML`.** `SafeHtml` is the one exception; it sanitises.
   Lint enforces this.
10. **Generic errors to the client.** No stack traces, no Postgres messages, no
    "user not found" vs "wrong password". Missing and forbidden both return 404.
11. **`auth.getUser()`, never `auth.getSession()`** for any access decision.
    `getSession()` trusts a cookie the client controls. Lint enforces this.
12. **Storage buckets are private.** Reads go through server-minted signed URLs.
    Object keys start with the owner's user id.
13. **The service worker caches build artefacts only.** Never HTML, never
    `/api/*`, never anything credentialed. A cache is shared by everyone on the
    device. Edit `public/sw.js` only with `tests/sw-cache-policy.test.ts` open.

## Commands

| command | what it does |
| --- | --- |
| `pnpm dev` | dev server on :3000 |
| `pnpm verify` | **the one gate**: typecheck, lint, test, RLS audit, build, leak scan |
| `pnpm new:resource <name>` | scaffolds migration + RLS + schema + db + API + actions + page |
| `pnpm db:push` | apply migrations to the linked project |
| `pnpm types` | regenerate `src/types/database.ts` (commit it) |
| `pnpm map` / `pnpm graph` | regenerate REPOMAP.md and the dependency graph |
| `pnpm seed` | 3 users with cross-user data, for isolation checks |

## Directory map

| path | one line |
| --- | --- |
| `src/app/(auth)/` | public: login, signup, forgot-password, reset-password |
| `src/app/(app)/` | protected: everything here is behind `requireProfile()` |
| `src/app/api/` | route handlers; every export wrapped in `route(...)` |
| `src/app/auth/confirm/` | landing point for every emailed auth link |
| `src/components/ui/` | primitives; see `/styleguide` for all variants |
| `src/components/app/` | app shell: sidebar, topbar, breadcrumb, page header |
| `src/components/form/` | `useActionState` adapter and the error banner |
| `src/lib/api/` | `route()`, `action()`, the error taxonomy, client IP |
| `src/lib/auth/` | `requireUser`, `requireProfile`, `requireAdmin`, `isAdmin` |
| `src/lib/db/` | one query-helper file per table; ownership re-checked here |
| `src/lib/schemas/` | one Zod file per resource; no `user_id` fields, ever |
| `src/lib/supabase/` | `browser`, `server`, `proxy`, `admin` clients |
| `src/lib/pwa/` | service worker registration and cache teardown |
| `src/lib/rate-limit/` | limiter interface, memory and Upstash implementations |
| `src/lib/security/` | the CSP builder |
| `src/lib/storage/` | private-bucket paths and signed URLs |
| `src/styles/tokens.css` | every design token; nothing downstream uses a raw value |
| `src/types/database.ts` | **generated**. The source of truth for column names |
| `scripts/` | verify, RLS audit, leak scan, scaffolder, seed, map, graph |
| `supabase/migrations/` | the only place schema changes live |
| `tests/` | security invariants only, not coverage |

## Where do I add X?

| I want to add… | do this |
| --- | --- |
| a new table | `pnpm new:resource <name>` → `pnpm db:push` → `pnpm types`. PATTERNS.md §1 |
| a protected page | a folder under `src/app/(app)/`. PATTERNS.md §2 |
| a server action | `src/app/(app)/<area>/actions.ts`, wrapped in `action()`. PATTERNS.md §3 |
| an API route | `src/app/api/<name>/route.ts`, wrapped in `route()`. PATTERNS.md §4 |
| a form | client component + `useActionState` + `toFormAction`. PATTERNS.md §5 |
| a UI primitive | `src/components/ui/`, tokens only, add it to `/styleguide`. PATTERNS.md §6 |
| a file upload | private bucket + signed URL. PATTERNS.md §7 |
| an env var | `.env.example` **and** the Zod schema in `src/lib/env/{client,server}.ts` |
| a nav entry | `MAIN` in `src/components/app/nav-items.ts` (sidebar and tab bar share it) |
| a PWA icon or name | `src/app/manifest.ts`, icons via `python3 scripts/generate-icons.py` |
| a protected prefix | `PROTECTED_PREFIXES` in `src/proxy.ts` |

## House style

One job per file, with a 1–3 line docblock at the top saying what that job is.
No barrel files. No 600-line modules. Comments explain *why*, never *what*.
Run `pnpm verify` before you claim anything works.
