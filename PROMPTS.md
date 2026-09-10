# PROMPTS

Paste these verbatim on the day. They are written to be self-contained so the agent
loads three files instead of exploring the repo.

---

## 1. Security review this diff

Run as a subagent so the review does not inherit the context that wrote the code.

```
Use a subagent to security-review the current diff.

Give the subagent this task:

  Read CLAUDE.md (the twelve hard rules) and SECURITY.md (the attack table).
  Then run `git diff main...HEAD` and review only what changed.

  For each of these, state PASS or FAIL with the file and line:
  1. Every new table in public has RLS enabled AND forced.
  2. Every policy is per-operation, TO authenticated, and never USING (true).
  3. No user_id is accepted from client input anywhere, and no INSERT/UPDATE
     grant includes a user_id column.
  4. Every new route handler is wrapped in route(); every new server action is
     wrapped in action(). None of them skips the wrapper.
  5. Every mutating or expensive path names a rate limit.
  6. Every [id] path re-checks ownership in the query, not only via RLS.
  7. SUPABASE_SERVICE_ROLE_KEY appears in no client component and behind no
     NEXT_PUBLIC_ prefix.
  8. No dangerouslySetInnerHTML outside SafeHtml.
  9. No auth.getSession() used for an access decision.
  10. No error message reaches the client carrying a stack trace, a Postgres
      message, or a distinction between "not found" and "forbidden".

  Report only failures, each as: file:line, which rule, and the one-line fix.
  If everything passes, say so in one sentence. Do not fix anything.

Then run `pnpm verify` and report the result.
```

---

## 2. Add feature X

```
Add <FEATURE> to this app.

Read CLAUDE.md and PATTERNS.md first. Do not explore the repo — REPOMAP.md has a
one-line summary of every file if you need to locate something.

Follow the patterns exactly:
- New table: PATTERNS.md §1. Start with `pnpm new:resource <name>`, then edit the
  generated migration. Do not hand-write the policies.
- Protected page: §2.  Server action: §3.  API route: §4.  Form: §5.
- New primitive: §6, and add it to /styleguide.
- File upload: §7.

Non-negotiable: ownership comes from auth.uid(), every handler is wrapped, every
mutation names a rate limit, every error to the client is generic.

When the schema changes: `pnpm db:push` then `pnpm types`, and commit the generated
types. Add the new route to PROTECTED_PREFIXES in src/proxy.ts and to MAIN in
src/components/app/sidebar.tsx.

Finish with `pnpm verify` and paste its output. Do not tell me it works until that
command has passed.
```

---

## 3. Pre-demo checklist

```
Run the pre-demo checklist and report each item as PASS or FAIL with evidence.
Do not fix anything unless I say so; just report.

1. `pnpm verify` passes end to end. Paste the output.
2. `pnpm seed`, then confirm isolation by hand:
   - Sign in as alice@example.com. Note the count and copy one note id.
   - Sign in as bob@example.com. Confirm Alice's notes are absent.
   - As Bob, open /notes/<alice's id>. Expect 404.
   - As Bob, GET /api/notes. Expect Bob's rows only.
   - As Bob, open /admin. Expect 404. As admin@example.com, expect all accounts.
3. The production deployment answers on its own URL, and signup → email
   confirmation → login → create a record works there, not only locally.
4. Vercel Preview and Development environments point at the DEV Supabase
   project. Production points at the PROD project. Confirm with `vercel env ls`.
5. `git status` is clean and everything is pushed.
6. No secret in the repo: `git grep -nE "sb_secret_|service_role|SUPABASE_SERVICE"`
   returns hits only in .env.example, docs, and scripts that read process.env.
7. The browser console is clean on /, /login, /dashboard, /notes, /settings and
   /styleguide, in both light and dark. Note any CSP report-only violations.
8. `pnpm audit --prod` has no high or critical findings.
```

---

## 4. Something broke, find it fast

```
`pnpm verify` is failing. Read only the first failing step's output — later
failures usually cascade from it.

Do not start exploring. The step names map to a fix:
- typecheck → a column name is wrong. Check src/types/database.ts, and run
  `pnpm types` if a migration was applied without regenerating.
- lint → a security rule fired. eslint.config.mjs says which rule and why.
- test  → a security invariant broke. The test name says which one. Fix the
  code, never the test, unless the test is provably wrong.
- rls   → the database drifted. Fix it in a NEW migration, never the dashboard.
- build → read the first error only.
- leak  → a server-only value reached the browser. Stop and treat it as an
  incident, not a build error.

Report the root cause in one sentence before you change anything.
```
