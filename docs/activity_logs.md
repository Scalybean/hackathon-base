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
