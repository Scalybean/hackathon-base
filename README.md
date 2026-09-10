# hackathon-base

A Next.js + Supabase base template with the security work already done: RLS on every
table, cookie sessions, rate limiting, a private storage bucket, and a design system
that does not look generated.

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

## Two Supabase projects

Previews must never touch production data.

| | Supabase project | Vercel environment |
| --- | --- | --- |
| local | `hackathon-base-dev` | `.env.local` |
| preview branches | `hackathon-base-dev` | Preview + Development |
| production | `hackathon-base-prod` | Production |

Set them per environment, not globally:

```bash
vercel env add NEXT_PUBLIC_SUPABASE_URL production      # prod project URL
vercel env add NEXT_PUBLIC_SUPABASE_URL preview         # dev project URL
vercel env add NEXT_PUBLIC_SUPABASE_URL development     # dev project URL
```

Repeat for `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SERVICE_ROLE_KEY` and
`NEXT_PUBLIC_SITE_URL`. Check with `vercel env ls`. Migrations are applied to each
project separately with `pnpm db:push`; there is no automatic promotion.

In the Supabase dashboard, set **Authentication → URL Configuration → Site URL** and
add the Vercel URLs to **Redirect URLs**, for both projects. Without this the emailed
confirmation link comes back to `localhost`.

## Secret scanning

Push protection and secret scanning are enabled on the GitHub repository, so a
committed key is rejected at push time rather than found later. To confirm or
re-enable: **Settings → Code security → Secret protection**, then turn on *Secret
scanning* and *Push protection*.

If a push is ever blocked, do not bypass it. Rotate the key in Supabase first, then
rewrite the commit.

## Deploying

```bash
vercel link
# set the environment variables per environment, as above
vercel deploy --prod
```

The Content-Security-Policy ships **report-only**. Once the console is clean on every
page, set `CSP_ENFORCE=true` in the Vercel Production environment and redeploy. See
the tightening section in [`SECURITY.md`](SECURITY.md).

For real rate limiting across serverless instances, set `UPSTASH_REDIS_REST_URL` and
`UPSTASH_REDIS_REST_TOKEN`. Without them the limiter is per-process memory.
