# Activity log

Append-only record of prompts and the actions taken on them.

---

## 2026-09-10 — Session `015Q23zy` — build the hackathon base template

### Prompt

> I had this prompt going then accidentally erased the session. I answered all the
> questions already, just continue

Followed by the original brief, recovered from the erased session:

> **Context** — Building a reusable base template for a hackathon. On the day the
> product will be built on top of this repo very fast, with an AI agent, under time
> pressure, with a red team actively trying to break the app. Build the boring,
> dangerous, slow parts now.
>
> Two goals rank above everything else: **security** (assume a competent attacker
> with the source and the public anon key) and **agent efficiency** (on the day, an
> agent must add a feature by reading ~200 lines of docs instead of exploring).
>
> Four questions to answer first: project name; accent colour and vibe (not purple);
> email+password vs magic link vs OAuth; link real Supabase/Vercel projects or
> scaffold with placeholders. Then propose a build plan, then work in reviewable
> commits.
>
> Stack, no substitutions: Next.js App Router + TypeScript strict, Tailwind,
> Supabase (Postgres/Auth/RLS/Storage), `@supabase/ssr` not auth-helpers, Vercel,
> pnpm with committed lockfile, Zod for all input validation, Vitest only where it
> protects security invariants. Pin current stable versions and record them in
> ARCHITECTURE.md.
>
> **Part 1 — Security invariants.** RLS on every public table, no exceptions.
> Default deny, per-operation policies, never `USING (true)`. Ownership always from
> `auth.uid()`, never a client-supplied `user_id`. A test or SQL check that fails if
> any table has RLS off or a permissive policy, wired into `pnpm verify`. All schema
> changes through migration files. Service-role key server-only, with a build-time
> check that greps the client bundle. `.env.local` gitignored, `.env.example`
> committed. Third-party keys called only from server routes. Every route handler and
> server action: authenticate, authorise, validate with Zod, then act, through one
> shared helper. No IDOR: every `[id]` route re-checks ownership server-side. Rate
> limiting on every mutating and expensive route, behind one swappable interface. No
> `dangerouslySetInnerHTML`; one sanitiser utility. Security headers including a
> report-only CSP documented for tightening. Storage buckets private, signed URLs
> only. Generic error messages. `.gitignore` covering `.env*`, `.vercel`,
> `node_modules`, `supabase/.temp`. SECURITY.md describing what a red team would try
> and where each attack is blocked.
>
> **Part 2 — Auth and user management, complete.** Sign up, log in, log out, password
> reset, email verification. `@supabase/ssr` middleware sessions with correct cookie
> refresh. `profiles` table keyed to `auth.users.id`, created by a signup trigger,
> with RLS. Protected route group and public group. A `requireUser()` helper as the
> single way server code gets the user. A `role` column plus an `isAdmin` helper, an
> example admin-only page and an admin-only RLS policy. Account settings with display
> name, avatar upload to a private bucket, and account deletion with real cascade. A
> seed script creating one admin, two normal users and cross-user data.
>
> **Part 3 — Design foundation that must not look AI-generated.** Tokens in one CSS
> file for colour, spacing, radius, shadow and type. A distinct typeface pairing via
> `next/font`, not Inter. Explicitly avoid purple-blue gradients, a centred card on a
> grey page, emoji as icons, shadows on everything, and untouched shadcn spacing. A
> small primitive set: Button, Input, Label, Card, Dialog, Dropdown, Toast, Table,
> Badge, Skeleton, EmptyState. An app shell with sidebar, user menu, breadcrumb and
> page header, plus a dashboard using all of it. Dark mode through tokens. A
> `/styleguide` page rendering every primitive in every variant and state.
>
> **Part 4 — Token efficiency as a first-class feature.** CLAUDE.md under ~120 lines
> with stack, hard rules, commands, a directory map and a "where do I add X?" table.
> A generated REPOMAP.md via `pnpm map`, one line per file. A dependency graph via
> `pnpm graph` that fails on cycles. PATTERNS.md with self-contained recipes.
> `pnpm new:resource <name>` generating migration, policies, types, route and page
> deterministically. `pnpm types` output committed. One `pnpm verify` command.
> Small single-purpose files with a docblock at the top. PROMPTS.md with pre-written
> prompts. Everything installed, lockfile committed.
>
> **Part 5 — Ship it.** Working local dev with a README a tired person can follow.
> Deploy to Vercel and confirm signup → verify → login → create → cross-user
> isolation. Two Supabase projects, dev and prod, documented. GitHub push protection
> enabled and noted in the README.
>
> **Definition of done** — a final report with the full file tree, every security
> invariant and how it is enforced, the output of `pnpm verify`, proof of user
> isolation actually run, and anything assumed or deferred listed explicitly.
> Do not claim something is done that has not been run.

### Session recovery

The erased session left no notes. Recovered from the repo and the connected
accounts: package name `hackathon-base`; email+password auth (the Zod schemas for
signup, signin, forgot and reset were already written); a real Supabase project
`hackathon-base-dev` with all four migrations already applied. Two answers were not
recoverable and were re-asked: the accent colour and vibe (answered: warm clay and
ink, editorial/grounded/precise) and which infrastructure to provision (answered:
prod Supabase project, GitHub repo with push protection, Vercel project and deploy).

### Actions

1. **Dependencies and tooling.** Installed and pinned the full stack, committed the
   lockfile, wrote `proxy.ts` (Next 16's renamed middleware) with a nonce CSP and
   session refresh, static security headers in `next.config.ts`, the RLS audit
   script, the service-role leak scanner, security lint rules, and `pnpm verify`.
2. **Design system and auth.** Tokens, the Fraunces/Archivo/JetBrains Mono pairing,
   fourteen primitives, the app shell, `/styleguide`, and the complete auth surface
   including account settings and admin gating.
3. **Agent-efficiency layer.** CLAUDE.md, PATTERNS.md, SECURITY.md, ARCHITECTURE.md,
   PROMPTS.md, README.md, generated REPOMAP.md, the `pnpm new:resource` scaffolder
   and the seed script.
4. **Local push protection**, because GitHub refuses secret scanning on a free
   private repository.
5. **Vercel project linked**, public environment variables set for all three
   environments.
6. **End-to-end verification** against the dev project and the running app.

### Bugs found and fixed

- The email schema validated before trimming, rejecting a pasted address with a
  trailing space.
- `isomorphic-dompurify` pulled in jsdom, which requires Node 22 and broke the build
  on Node 20. Replaced with js-xss.
- `Button` with `asChild` passed two children to Radix `Slot`, 500-ing every page
  with a Button-as-Link, including the landing page.
- The `profiles` role guard rejected service-role writes, which would have made
  `pnpm seed` fail on its first admin.
- The four migration filenames did not match the versions recorded in the database,
  so `pnpm db:push` would have tried to re-apply all of them.
- `react-hooks/error-boundaries` correctly refused JSX inside a try/catch on the note
  detail page; PATTERNS.md documented the same wrong shape.
- The `eslint-disable` in `Avatar` sat above the wrong line, so it was both unused
  and ineffective.
- madge ships no types, so the graph script was implicitly `any`.
- `vercel link` appended a blanket `.env*` to `.gitignore` after the
  `!.env.example` negation.

### Blocked, awaiting the user

- `SUPABASE_SERVICE_ROLE_KEY` and `SUPABASE_DB_URL` are not available to this
  session, so `pnpm seed`, `pnpm check:rls` and the Vercel deploy could not be run.
- `hackathon-base-prod` could not be created: the Supabase free tier allows two
  active projects and both slots are in use.
- Vercel could not connect to the GitHub repository; its GitHub app needs access to
  the new private repo.

---

## 2026-09-10 (later) — same session — unblocking and deployment

### Prompts

> Done, made repo public instead of adding permissions

> I didn't add another supabase active project because rochbia is too important,
> more than this project

### Actions

1. **Audited the now-public repository.** `.env.local` was never committed and no
   credential appears anywhere in history. The only pattern hits were the grep
   string inside PROMPTS.md itself.
2. **Enabled GitHub secret scanning and push protection**, which a public repo gets
   for free and a free private repo cannot have. Dependabot was already on.
3. **Accepted one Supabase project.** `rochbia-tracker` stays untouched. Production
   and preview share `hackathon-base-dev`. Recorded in README and ARCHITECTURE as a
   deliberate compromise with the three steps to undo it.
4. **Deployed to production** and verified isolation against the live URL.
5. **Set deployment protection to previews only**, so the production URL is publicly
   reachable for a demo while preview builds still require a Vercel login.

### Bugs found and fixed in this stretch

- `SUPABASE_DB_URL` had been given the project URL rather than a Postgres
  connection string, and `check:rls` reported an empty error. The script now
  accepts `SUPABASE_ACCESS_TOKEN` + `SUPABASE_PROJECT_REF` through the Management
  API as an alternative transport, so the database password is no longer required,
  and it names the exact problem when the URL is the wrong shape.
- `pnpm seed` could not construct a Supabase client on Node 20: supabase-js builds
  a RealtimeClient eagerly and needs a global WebSocket. Added a stub transport in
  `src/lib/supabase/no-realtime.ts`, used by both the seed script and the admin
  client.
- `pnpm seed` then failed with "permission denied for schema private": the trigger
  functions on `profiles` run SECURITY INVOKER and `service_role` had no USAGE on
  that schema. Fixed in a migration.
- The Vercel build failed at `pnpm install` because `prepare` ran
  `git config core.hooksPath` where there is no git directory. Replaced with
  `scripts/install-hooks.mjs`, which exits quietly outside a checkout.
- Auth emails would have pointed at a single hard-coded origin. `src/lib/site-url.ts`
  now falls back to the deployment URL, so preview signups confirm against that
  preview.

### Verified on the live deployment

Public routes 200, protected routes redirect with the path preserved, Alice and Bob
see only their own notes, Bob gets 404 on Alice's note from both the page and the
API, `/admin` is 404 for Bob and 200 for the admin, sign-out is POST-only, a forged
confirmation token returns one generic failure, all security headers present, and
the styleguide XSS payload renders with zero occurrences of `alert(1)`.

### Still open

- Supabase **Authentication → URL Configuration** needs the production and wildcard
  preview redirect URLs, otherwise confirmation emails point at localhost.
- `pnpm check:rls` still skips locally because neither `SUPABASE_ACCESS_TOKEN` nor a
  valid `SUPABASE_DB_URL` is set. The same seven queries were run against the dev
  database out of band and returned zero violations.
- Vercel is not connected to the GitHub repository, so pushes do not deploy.

---

## 2026-09-11 — same session — make the app a PWA

### Prompt

> Make the app into a PWA

### Actions

1. **Icons** generated from the design tokens by `scripts/generate-icons.py`,
   rather than committed as binaries nobody can regenerate. Clay ground, cream
   rule and full stop, echoing the wordmark. 192, 512, maskable 512 and a
   180px Apple touch icon.
2. **`src/app/manifest.ts`** with standalone display, the clay theme colour,
   `start_url` of `/dashboard`, and shortcuts to Notes and Settings.
3. **`public/sw.js`**, written by hand rather than pulled from Serwist or
   next-pwa. Those default to caching pages and API responses, which is right
   for a content site and a cross-user data leak for an authenticated one.
4. **`public/offline.html`**, a static self-contained fallback. A Next route
   would mean caching a server-rendered page, which is the thing to avoid.
5. **`tests/sw-cache-policy.test.ts`**, 31 assertions evaluated against the
   shipped `public/sw.js` rather than a copy, so the policy cannot drift.
6. Sign-out now clears every cache as defence in depth.
7. `/sw.js` is served no-store with its own tighter CSP and a root
   `Service-Worker-Allowed` scope, and registered with `updateViaCache: 'none'`,
   so a stale worker cannot pin itself in place.
8. The proxy matcher now skips `sw.js`, `offline.html` and the manifest, so
   fetching them costs no session refresh.

### Security notes

Two new entries in SECURITY.md: reading the previous user's data out of the
service worker cache, and pinning a stale worker. A thirteenth hard rule in
CLAUDE.md: the worker caches build artefacts only.

Registration is production-only, so `pnpm dev` never serves a stale chunk.
