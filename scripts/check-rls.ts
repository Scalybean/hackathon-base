/**
 * Fails if the database's row-level security posture has drifted.
 * Run against any environment: `SUPABASE_DB_URL=... pnpm check:rls`.
 * This is the test that stops "we'll add RLS later" from ever happening.
 */
import { config } from 'dotenv';
import { Client } from 'pg';

config({ path: '.env.local', quiet: true });

type Violation = { rule: string; detail: string };

const QUERIES: { rule: string; sql: string; describe: (row: Record<string, unknown>) => string }[] = [
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
    sql: `select schemaname, tablename, policyname, qual, with_check
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
    describe: (r) => `public.${r.table_name}.${r.column_name} is ${r.privilege_type}-able by ${'the client'}; revoke it so ownership comes from auth.uid()`,
  },
];

async function main() {
  const connectionString = process.env.SUPABASE_DB_URL;
  if (!connectionString) {
    console.error('check:rls  SKIPPED — SUPABASE_DB_URL is not set (see .env.example)');
    process.exit(1);
  }

  const client = new Client({ connectionString, ssl: { rejectUnauthorized: false } });
  await client.connect();

  const violations: Violation[] = [];
  let tableCount = 0;
  let policyCount = 0;

  try {
    const counts = await client.query(
      `select
         (select count(*) from pg_class c join pg_namespace n on n.oid = c.relnamespace
          where n.nspname = 'public' and c.relkind = 'r') as tables,
         (select count(*) from pg_policies where schemaname = 'public') as policies`,
    );
    tableCount = Number(counts.rows[0].tables);
    policyCount = Number(counts.rows[0].policies);

    for (const query of QUERIES) {
      const { rows } = await client.query(query.sql);
      for (const row of rows) violations.push({ rule: query.rule, detail: query.describe(row) });
    }

    // A table with RLS on and no policies is deny-all, which is safe but almost
    // always a mistake. Report it separately so it is a decision, not a surprise.
    const { rows: unpolicied } = await client.query(
      `select c.relname as name
       from pg_class c
       join pg_namespace n on n.oid = c.relnamespace
       where n.nspname = 'public' and c.relkind = 'r'
         and not exists (select 1 from pg_policies p where p.schemaname = 'public' and p.tablename = c.relname)`,
    );
    for (const row of unpolicied) {
      console.warn(`check:rls  note  public.${row.name} has no policies at all (denies everything)`);
    }
  } finally {
    await client.end();
  }

  if (violations.length > 0) {
    console.error(`check:rls  FAIL  ${violations.length} violation(s)`);
    for (const v of violations) console.error(`  [${v.rule}] ${v.detail}`);
    console.error('  Fix in a new file under supabase/migrations/, never in the dashboard.');
    process.exit(1);
  }

  console.log(`check:rls  ok    ${tableCount} table(s), ${policyCount} policies, 0 violations`);
}

main().catch((error) => {
  console.error('check:rls  ERROR', error instanceof Error ? error.message : error);
  process.exit(1);
});
