/**
 * Scaffolds a complete owned resource from templates: migration with RLS
 * policies, Zod schemas, query helpers, API routes, server actions and a
 * protected page. Deterministic — no model has to write any of it.
 *
 *   pnpm new:resource task       (singular; the table becomes "tasks")
 */
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';

const ROOT = process.cwd();
const TEMPLATES = join(ROOT, 'scripts', 'templates', 'resource');

const raw = process.argv[2];

if (!raw) {
  console.error('new:resource  FAIL  usage: pnpm new:resource <singular-name>   e.g. pnpm new:resource task');
  process.exit(1);
}

if (!/^[a-z][a-z0-9-]{1,40}$/.test(raw)) {
  console.error(`new:resource  FAIL  "${raw}" must be lowercase letters, digits and hyphens, starting with a letter`);
  process.exit(1);
}

// --------------------------------------------------------------------------
// Naming. One input, every casing derived, so nothing drifts between files.
// --------------------------------------------------------------------------
const words = raw.split('-').filter(Boolean);

/** Crude but predictable pluraliser. Rename the files if it guesses wrong. */
function pluralise(word: string): string {
  if (/(s|x|z|ch|sh)$/.test(word)) return `${word}es`;
  if (/[^aeiou]y$/.test(word)) return `${word.slice(0, -1)}ies`;
  return `${word}s`;
}

const pascal = (parts: string[]) => parts.map((w) => w[0].toUpperCase() + w.slice(1)).join('');
const camel = (parts: string[]) => {
  const p = pascal(parts);
  return p[0].toLowerCase() + p.slice(1);
};

const singularWords = words;
const pluralWords = [...words.slice(0, -1), pluralise(words[words.length - 1])];

const table = pluralWords.join('_');
const entity = camel(singularWords);
const Entity = pascal(singularWords);
const entities = camel(pluralWords);
const Entities = pascal(pluralWords);
const Title = pluralWords.map((w) => w[0].toUpperCase() + w.slice(1)).join(' ');

const stamp = new Date().toISOString().replace(/[-:T]/g, '').slice(0, 14);

const TOKENS: Record<string, string> = {
  __table__: table,
  __Entities__: Entities,
  __entities__: entities,
  __Entity__: Entity,
  __entity__: entity,
  __Title__: Title,
};

function render(templateName: string): string {
  let content = readFileSync(join(TEMPLATES, templateName), 'utf8');
  // Longest token first so __entities__ is never eaten by __entity__.
  for (const key of Object.keys(TOKENS).sort((a, b) => b.length - a.length)) {
    content = content.split(key).join(TOKENS[key]);
  }
  return content;
}

const OUTPUTS: { template: string; path: string }[] = [
  { template: 'migration.sql', path: `supabase/migrations/${stamp}_${table}.sql` },
  { template: 'schema.ts.txt', path: `src/lib/schemas/${table}.ts` },
  { template: 'db.ts.txt', path: `src/lib/db/${table}.ts` },
  { template: 'api-collection.ts.txt', path: `src/app/api/${table}/route.ts` },
  { template: 'api-item.ts.txt', path: `src/app/api/${table}/[id]/route.ts` },
  { template: 'actions.ts.txt', path: `src/app/(app)/${table}/actions.ts` },
  { template: 'page.tsx.txt', path: `src/app/(app)/${table}/page.tsx` },
  { template: 'composer.tsx.txt', path: `src/app/(app)/${table}/${entity}-composer.tsx` },
];

// --------------------------------------------------------------------------
// Refuse to clobber. A half-overwritten resource is worse than no resource.
// --------------------------------------------------------------------------
const existing = OUTPUTS.filter((o) => existsSync(join(ROOT, o.path))).map((o) => o.path);
const migrationClash = readdirSync(join(ROOT, 'supabase', 'migrations')).some((f) =>
  f.endsWith(`_${table}.sql`),
);

if (existing.length > 0 || migrationClash) {
  console.error(`new:resource  FAIL  "${table}" already exists`);
  for (const path of existing) console.error(`  ${path}`);
  if (migrationClash) console.error(`  supabase/migrations/*_${table}.sql`);
  process.exit(1);
}

for (const { template, path } of OUTPUTS) {
  const full = join(ROOT, path);
  mkdirSync(dirname(full), { recursive: true });
  writeFileSync(full, render(template));
  console.log(`  + ${path}`);
}

console.log(`
new:resource  ok    ${OUTPUTS.length} files for "${table}"

Next, in order:
  1. Edit supabase/migrations/${stamp}_${table}.sql if the columns are wrong.
  2. pnpm db:push          apply the migration
  3. pnpm types            regenerate src/types/database.ts
  4. Add '/${table}' to PROTECTED_PREFIXES in src/proxy.ts
  5. Add a nav entry to MAIN in src/components/app/sidebar.tsx
  6. pnpm verify
`);
