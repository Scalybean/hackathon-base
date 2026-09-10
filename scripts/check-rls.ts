/**
 * Fails if the database's row-level security posture has drifted.
 * This is the check that stops "we'll add RLS later" from ever happening.
 *
 * Two transports, whichever is configured:
 *   SUPABASE_ACCESS_TOKEN + SUPABASE_PROJECT_REF  -> Management API (easiest)
 *   SUPABASE_DB_URL                               -> direct Postgres
 */
import { config } from 'dotenv';
import { Client } from 'pg';

config({ path: '.env.local', quiet: true });

type Row = Record<string, unknown>;
type Runner = { name: string; query: (sql: string) => Promise<Row[]>; close: () => Promise<void> };

// ---------------------------------------------------------------------------
// The rules. Each one returns rows only when something is wrong.
// ---------------------------------------------------------------------------
const RULES: { rule: string; sql: string; describe: (row: Row) => string }[] = [
  {
    rule: 'RLS disabled',
    sql: `select c.relname as name
          from pg_class c
          join pg_namespace n on n.oid = c.relnamespace
          where n.nspname = 'public' and c.relkind = 'r' and c.relrowsecurity = false`,
    describe: (r) => `public.${r.name} has RLS disabled`,
  },
  {
    rule: 'RLS not forced',
    sql: `select c.relname as name
          from pg_class c
          join pg_namespace n on n.oid = c.relnamespace
          where n.nspname = 'public' and c.relkind = 'r'
            and c.relrowsecurity = true and c.relforcerowsecurity = false`,
    describe: (r) => `public.${r.name} does not FORCE row level security (the table owner bypasses RLS)`,
  },
  {
    rule: 'Permissive true policy',
    sql: `select schemaname, tablename, policyname
          from pg_policies
          where schemaname in ('public', 'storage')
            and (btrim(coalesce(qual, '')) = 'true' or btrim(coalesce(with_check, '')) = 'true')`,
    describe: (r) => `${r.schemaname}.${r.tablename} policy "${r.policyname}" uses USING/WITH CHECK (true)`,
  },
  {
    rule: 'Policy not per-operation',
    sql: `select schemaname, tablename, policyname
          from pg_policies
          where schemaname in ('public', 'storage') and cmd = 'ALL'`,
    describe: (r) => `${r.schemaname}.${r.tablename} policy "${r.policyname}" is FOR ALL; write one policy per operation`,
  },
  {
    rule: 'Policy targets an unrestricted role',
    sql: `select schemaname, tablename, policyname, roles::text as roles
          from pg_policies
          where schemaname in ('public', 'storage')
            and (roles::text like '%public%' or roles::text like '%anon%')`,
    describe: (r) => `${r.schemaname}.${r.tablename} policy "${r.policyname}" applies to ${r.roles}; target "authenticated" explicitly`,
  },
  {
    rule: 'Public storage bucket',
    sql: `select id from storage.buckets where public = true`,
    describe: (r) => `storage bucket "${r.id}" is public; buckets must be private and read via signed URLs`,
  },
  {
    rule: 'Client-writable ownership column',
    sql: `select table_name, column_name, privilege_type
          from information_schema.column_privileges
          where table_schema = 'public'
            and column_name = 'user_id'
            and grantee in ('anon', 'authenticated')
            and privilege_type in ('INSERT', 'UPDATE')`,
    describe: (r) => `public.${r.table_name}.${r.column_name} is ${r.privilege_type}-able by the client; revoke it so ownership comes from auth.uid()`,
  },
];

const COUNTS_SQL = `select
  (select count(*) from pg_class c join pg_namespace n on n.oid = c.relnamespace
   where n.nspname = 'public' and c.relkind = 'r') as tables,
  (select count(*) from pg_policies where schemaname = 'public') as policies`;

const UNPOLICIED_SQL = `select c.relname as name
  from pg_class c
  join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'public' and c.relkind = 'r'
    and not exists (select 1 from pg_policies p where p.schemaname = 'public' and p.tablename = c.relname)`;

// ---------------------------------------------------------------------------
// Transports.
// ---------------------------------------------------------------------------
function managementApiRunner(token: string, ref: string): Runner {
  return {
    name: `Management API (${ref})`,
    async query(sql) {
      const response = await fetch(`https://api.supabase.com/v1/projects/${ref}/database/query`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: sql }),
      });

      if (!response.ok) {
        const detail = await response.text();
        throw new Error(`Management API returned ${response.status}: ${detail.slice(0, 300)}`);
      }
      return (await response.json()) as Row[];
    },
    async close() {},
  };
}

function postgresRunner(connectionString: string): Runner {
  const client = new Client({ connectionString, ssl: { rejectUnauthorized: false } });
  let connected = false;

  return {
    name: 'direct Postgres',
    async query(sql) {
      if (!connected) {
        await client.connect();
        connected = true;
      }
      return (await client.query(sql)).rows as Row[];
    },
    async close() {
      if (connected) await client.end();
    },
  };
}

/** Chooses a transport, or explains precisely what is missing and where to get it. */
function pickRunner(): Runner {
  const token = process.env.SUPABASE_ACCESS_TOKEN;
  const ref = process.env.SUPABASE_PROJECT_REF;
  const dbUrl = process.env.SUPABASE_DB_URL;

  if (token && ref) return managementApiRunner(token, ref);

  if (dbUrl) {
    // The commonest mistake is pasting the project URL here. Say so, rather
    // than failing later with an opaque connection error.
    if (!/^postgres(ql)?:\/\//.test(dbUrl)) {
      fail(
        `SUPABASE_DB_URL is not a Postgres connection string (it starts with "${dbUrl.slice(0, 8)}…").`,
        'It must look like postgresql://postgres:<password>@db.<ref>.supabase.co:5432/postgres',
        'Dashboard -> Project Settings -> Database -> Connection string -> URI.',
      );
    }
    if (/:\[?(YOUR-|PASSWORD|password)\]?@/.test(dbUrl)) {
      fail('SUPABASE_DB_URL still contains the placeholder password from the dashboard.');
    }
    return postgresRunner(dbUrl);
  }

  fail(
    'No way to reach the database.',
    'Set either:',
    '  SUPABASE_ACCESS_TOKEN (supabase.com/dashboard/account/tokens) plus SUPABASE_PROJECT_REF, or',
    '  SUPABASE_DB_URL (Project Settings -> Database -> Connection string -> URI).',
  );
}

function fail(...lines: string[]): never {
  console.error(`check:rls  FAIL  ${lines[0]}`);
  for (const line of lines.slice(1)) console.error(`  ${line}`);
  process.exit(1);
}

// ---------------------------------------------------------------------------
async function main() {
  const runner = pickRunner();
  const violations: { rule: string; detail: string }[] = [];

  try {
    const [counts] = await runner.query(COUNTS_SQL);

    for (const { rule, sql, describe } of RULES) {
      for (const row of await runner.query(sql)) violations.push({ rule, detail: describe(row) });
    }

    // RLS on with no policies denies everything. Safe, but almost always a
    // mistake, so surface it as a note rather than a silent pass.
    for (const row of await runner.query(UNPOLICIED_SQL)) {
      console.warn(`check:rls  note  public.${row.name} has no policies at all (denies everything)`);
    }

    if (violations.length > 0) {
      console.error(`check:rls  FAIL  ${violations.length} violation(s) via ${runner.name}`);
      for (const v of violations) console.error(`  [${v.rule}] ${v.detail}`);
      console.error('  Fix in a new file under supabase/migrations/, never in the dashboard.');
      process.exit(1);
    }

    console.log(
      `check:rls  ok    ${counts.tables} table(s), ${counts.policies} policies, 0 violations (${runner.name})`,
    );
  } finally {
    await runner.close();
  }
}

main().catch((error) => {
  const message = error instanceof Error && error.message ? error.message : String(error);
  console.error(`check:rls  ERROR ${message}`);
  process.exit(1);
});
