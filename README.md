# hackathon-base

A Next.js + Supabase base template with the security work already done: RLS on every
table, cookie sessions, rate limiting, a private storage bucket, and a design system
that does not look generated.

**Live:** https://hackathon-base-alons-projects-d6deeccc.vercel.app

**Agents start at [`CLAUDE.md`](CLAUDE.md), then [`PATTERNS.md`](PATTERNS.md).**
Humans start here.

---

## Five-minute setup

You need Node ≥20.9 (22+ preferred) and pnpm 10.

```bash
pnpm install
cp .env.example .env.local
```

Fill in `.env.local`. Every value comes from one Supabase project page:

| variable | where |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Project Settings → Data API → Project URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Project Settings → API Keys → publishable |
| `SUPABASE_SERVICE_ROLE_KEY` | Project Settings → API Keys → secret. **Server only** |
| `SUPABASE_DB_URL` | Project Settings → Database → Connection string (URI) |
| `SUPABASE_PROJECT_REF` | the subdomain in the project URL |
| `SUPABASE_ACCESS_TOKEN` | supabase.com/dashboard/account/tokens, for `pnpm types` |

`NEXT_PUBLIC_SITE_URL` stays `http://localhost:3000` locally.

Then:

```bash
pnpm db:push     # apply the migrations
pnpm seed        # 3 users with cross-user data
pnpm dev         # http://localhost:3000
```

Seeded logins, all with the password `correct-horse-battery`:

| email | role |
| --- | --- |
| `admin@example.com` | admin |
| `alice@example.com` | user, 2 notes |
| `bob@example.com` | user, 1 note |

## Verify isolation in ten seconds

1. Sign in as Alice. `/notes` shows two notes. Copy one id from the URL.
2. Sign in as Bob. `/notes` shows one note, and none of Alice's.
3. As Bob, open `/notes/<alice's id>` → **404**.
4. As Bob, open `/api/notes` → Bob's row only.
5. As Bob, open `/admin` → **404**. As the admin → all three accounts.

## Commands

| command | what it does |
| --- | --- |
| `pnpm dev` | dev server |
| `pnpm verify` | **the one gate**: typecheck, lint, test, RLS audit, build, leak scan |
| `pnpm new:resource <name>` | scaffolds a whole owned resource from templates |
| `pnpm db:push` / `pnpm db:diff` | migrations |
| `pnpm types` | regenerate `src/types/database.ts` (commit it) |
| `pnpm seed` | reset the three demo accounts |
| `pnpm map` / `pnpm graph` | regenerate `REPOMAP.md` |
| `pnpm check:rls` / `pnpm check:leak` | run one gate on its own |

`pnpm verify` stops at the first failure and prints where to look. Run it before you
say anything works.

## Documentation

| file | for |
| --- | --- |
| [`CLAUDE.md`](CLAUDE.md) | the hard rules, the directory map, "where do I add X?" |
| [`PATTERNS.md`](PATTERNS.md) | seven copy-pasteable recipes |
| [`SECURITY.md`](SECURITY.md) | fourteen attacks and where each one is blocked |
| [`ARCHITECTURE.md`](ARCHITECTURE.md) | pinned versions and the decisions behind them |
| [`REPOMAP.md`](REPOMAP.md) | generated index: every file, its job, its exports |
| [`PROMPTS.md`](PROMPTS.md) | prompts to paste on the day |
| `/styleguide` | every UI primitive in every variant and state |

## One Supabase project, for now

| | Supabase project | Vercel environment |
| --- | --- | --- |
| local | `hackathon-base-dev` | `.env.local` |
| preview branches | `hackathon-base-dev` | Preview + Development |
| production | `hackathon-base-dev` | Production |

> **Production and preview share a database.** The Supabase free tier allows two
> active projects per owner and both slots are taken, one of them by an unrelated
> project that matters more than this one. Nothing here is real user data, so the
> risk is a demo trampling its own rows, not a leak.
>
> To split them later: free a slot or upgrade, create `hackathon-base-prod`, run
> `pnpm db:push` against it, and repoint only the Production variables. Nothing in
> the code assumes a single project.

Variables are already set per environment. `NEXT_PUBLIC_SITE_URL` is set for
Production only, on purpose: Preview and Development derive the origin from the
deployment URL, so a preview's confirmation email comes back to that preview
rather than to production. See `src/lib/site-url.ts`.

```bash
vercel env ls                                  # see what is set where
vercel env add NEXT_PUBLIC_SUPABASE_URL production
```

Migrations are applied per project with `pnpm db:push`; there is no automatic
promotion.

### Still to do in the Supabase dashboard

**Authentication → URL Configuration.** Set Site URL to the production URL and add
these Redirect URLs. Until this is done, confirmation and reset emails point at
`localhost:3000`.

```
https://hackathon-base-alons-projects-d6deeccc.vercel.app/**
https://hackathon-base-*-alons-projects-d6deeccc.vercel.app/**
http://localhost:3000/**
```

The wildcard entry is what makes preview deployments able to complete a signup.

## Secret scanning

The repository is **public**, so GitHub's secret scanning and push protection are
enabled and free. A commit carrying a recognised credential is rejected at push
time. `.env.local` has never been committed; the history was audited when the repo
was made public.

There is a second, local layer that does not depend on GitHub. `pnpm prepare`
points git at `.githooks/`, and the `pre-push` hook runs `scripts/scan-secrets.ts`
over the commits being pushed. It blocks Supabase secret keys and access tokens,
service-role JWTs, Postgres URLs carrying a password, GitHub tokens, OpenAI and
Anthropic keys, AWS key ids and private-key blocks. Verified by planting a fake AWS
key and watching the push fail. Run it by hand with `pnpm scan`.

Dependabot alerts and automated security updates are on.

If a push is blocked, by either layer, do not bypass it. Rotate the key in Supabase
first, then rewrite the commit.

**The repo is public, so treat every file as published.** The publishable key in
`.env.example` is safe by design. Nothing else belongs in a tracked file.

## Deploying

```bash
vercel deploy --prod
```

Deployment protection is set to **previews only**: the production URL is public so
it can be demoed, and preview deployments still require a Vercel login. Change it
under Project Settings → Deployment Protection.

Vercel is **not** connected to the GitHub repository, so pushes do not deploy on
their own. Deploy with the CLI, or connect it under Project Settings → Git.

The Content-Security-Policy ships **report-only**. Once the console is clean on
every page, set `CSP_ENFORCE=true` in the Vercel Production environment and
redeploy. See the tightening section in [`SECURITY.md`](SECURITY.md).

For real rate limiting across serverless instances, set `UPSTASH_REDIS_REST_URL`
and `UPSTASH_REDIS_REST_TOKEN`. Without them the limiter is per-process memory.
