/**
 * Regenerates src/types/database.ts from the live dev database.
 * Run after every migration; the output is committed so no agent ever has to
 * read a migration to learn a column name.
 */
import { config } from 'dotenv';
import { spawnSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';

config({ path: '.env.local', quiet: true });

const OUT = 'src/types/database.ts';

const ref = process.env.SUPABASE_PROJECT_REF;
const dbUrl = process.env.SUPABASE_DB_URL;

const args = ref
  ? ['gen', 'types', 'typescript', '--project-id', ref]
  : dbUrl
    ? ['gen', 'types', 'typescript', '--db-url', dbUrl]
    : null;

if (!args) {
  console.error('types  FAIL  set SUPABASE_PROJECT_REF (needs SUPABASE_ACCESS_TOKEN) or SUPABASE_DB_URL in .env.local');
  process.exit(1);
}

const result = spawnSync('supabase', args, { encoding: 'utf8', env: process.env });

if (result.status !== 0 || !result.stdout.includes('export type Database')) {
  console.error('types  FAIL');
  console.error(result.stderr || result.stdout);
  process.exit(1);
}

const header = `/**
 * GENERATED FILE — do not edit by hand. Run \`pnpm types\` after any migration.
 * Source of truth for every column name and type in the database.
 */
`;

writeFileSync(OUT, header + result.stdout);
console.log(`types  ok    wrote ${OUT}`);
