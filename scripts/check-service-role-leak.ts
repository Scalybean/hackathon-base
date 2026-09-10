/**
 * Fails if the service-role key (or anything that would carry it) can reach the
 * browser. Two layers: a source scan that always runs, and a bundle scan that
 * greps the built client chunks for the literal key.
 */
import { config } from 'dotenv';
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, relative } from 'node:path';

config({ path: '.env.local', quiet: true });

const ROOT = process.cwd();

/** Modules that must never be pulled into a client component. */
const SERVER_ONLY_IMPORTS = [
  '@/lib/env/server',
  '@/lib/supabase/admin',
  '@/lib/rate-limit',
  '@/lib/log',
];

type Failure = { file: string; reason: string };
const failures: Failure[] = [];

function walk(dir: string, match: RegExp, out: string[] = []): string[] {
  if (!existsSync(dir)) return out;
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      if (entry === 'node_modules' || entry === '.git') continue;
      walk(full, match, out);
    } else if (match.test(entry)) {
      out.push(full);
    }
  }
  return out;
}

// ---------------------------------------------------------------------------
// Layer 1: source scan. Cheap, and catches the mistake at the moment it is made.
// ---------------------------------------------------------------------------
for (const file of walk(join(ROOT, 'src'), /\.(ts|tsx)$/)) {
  const source = readFileSync(file, 'utf8');
  const rel = relative(ROOT, file);
  const isClient = /^\s*(['"])use client\1/m.test(source);

  if (isClient) {
    for (const mod of SERVER_ONLY_IMPORTS) {
      if (source.includes(`from '${mod}'`) || source.includes(`from "${mod}"`)) {
        failures.push({ file: rel, reason: `client component imports server-only module ${mod}` });
      }
    }
    if (source.includes('SUPABASE_SERVICE_ROLE_KEY')) {
      failures.push({ file: rel, reason: 'client component references SUPABASE_SERVICE_ROLE_KEY' });
    }
  }

  if (/NEXT_PUBLIC_[A-Z_]*(SERVICE_ROLE|SECRET|PRIVATE_KEY|_TOKEN)/.test(source)) {
    failures.push({ file: rel, reason: 'a secret-looking value is behind a NEXT_PUBLIC_ prefix' });
  }
}

// The env example must never suggest publishing the service role key.
const envExample = readFileSync(join(ROOT, '.env.example'), 'utf8');
if (/NEXT_PUBLIC_[A-Z_]*SERVICE_ROLE/.test(envExample)) {
  failures.push({ file: '.env.example', reason: 'service role key documented as a public var' });
}

// ---------------------------------------------------------------------------
// Layer 2: bundle scan. The real proof. Requires a build to have run.
// ---------------------------------------------------------------------------
const clientDir = join(ROOT, '.next', 'static');
let scannedChunks = 0;

if (existsSync(clientDir)) {
  const secret = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const needles: { value: string; label: string }[] = [
    { value: 'SUPABASE_SERVICE_ROLE_KEY', label: 'the variable name' },
  ];
  // Only meaningful when the key is actually available to this process.
  if (secret && secret.length >= 20) needles.push({ value: secret, label: 'the literal key' });

  for (const file of walk(clientDir, /\.(js|mjs|css|map)$/)) {
    scannedChunks += 1;
    const contents = readFileSync(file, 'utf8');
    for (const needle of needles) {
      if (contents.includes(needle.value)) {
        failures.push({ file: relative(ROOT, file), reason: `client bundle contains ${needle.label}` });
      }
    }
  }
} else {
  console.warn('check:leak note  .next/static missing — source scan only. Run `pnpm build` for the bundle scan.');
}

if (failures.length > 0) {
  console.error(`check:leak FAIL  ${failures.length} finding(s)`);
  for (const f of failures) console.error(`  ${f.file}: ${f.reason}`);
  process.exit(1);
}

console.log(`check:leak ok    source clean, ${scannedChunks} client chunk(s) clean`);
