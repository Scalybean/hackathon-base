/**
 * The one command. Runs every gate in cheapest-first order and stops at the
 * first failure, printing that step's output and where to go to fix it.
 */
import { spawnSync } from 'node:child_process';

type Step = {
  name: string;
  command: string;
  args: string[];
  /** Where the reader should look when this step fails. */
  fix: string;
  /** Skip (with a note) instead of failing when this returns a reason. */
  skipIf?: () => string | null;
};

const STEPS: Step[] = [
  {
    name: 'typecheck',
    command: 'tsc',
    args: ['--noEmit'],
    fix: 'If a column name is wrong, run `pnpm types`. src/types/database.ts is the source of truth.',
  },
  {
    name: 'lint',
    command: 'eslint',
    args: ['--max-warnings', '0'],
    fix: 'Security rules live in eslint.config.mjs; each maps to a rule in CLAUDE.md.',
  },
  {
    name: 'test',
    command: 'vitest',
    args: ['run', '--reporter', 'dot'],
    fix: 'Tests in tests/ guard security invariants. A failure here is a real hole.',
  },
  {
    name: 'rls',
    command: 'tsx',
    args: ['scripts/check-rls.ts'],
    fix: 'Add a migration under supabase/migrations/ and `pnpm db:push`. See PATTERNS.md §1.',
    skipIf: () => (process.env.SUPABASE_DB_URL ? null : 'SUPABASE_DB_URL not set'),
  },
  {
    name: 'build',
    command: 'next',
    args: ['build'],
    fix: 'A build error is a deploy blocker. Read the first error only; the rest cascade.',
  },
  {
    name: 'leak',
    command: 'tsx',
    args: ['scripts/check-service-role-leak.ts'],
    fix: 'A server-only value reached the browser. See CLAUDE.md rule 8.',
  },
];

function run(step: Step): { ok: boolean; output: string; ms: number } {
  const started = Date.now();
  const result = spawnSync(step.command, step.args, {
    encoding: 'utf8',
    shell: process.platform === 'win32',
    env: process.env,
  });
  const output = `${result.stdout ?? ''}${result.stderr ?? ''}`;
  return { ok: result.status === 0, output, ms: Date.now() - started };
}

const skipped: string[] = [];

for (const step of STEPS) {
  const skip = step.skipIf?.();
  if (skip) {
    skipped.push(`${step.name} (${skip})`);
    console.log(`skip  ${step.name.padEnd(10)} ${skip}`);
    continue;
  }

  const { ok, output, ms } = run(step);
  const seconds = `${(ms / 1000).toFixed(1)}s`;

  if (!ok) {
    console.error(`FAIL  ${step.name.padEnd(10)} ${seconds}`);
    console.error(output.trimEnd());
    console.error(`\n  → ${step.fix}`);
    process.exit(1);
  }

  console.log(`ok    ${step.name.padEnd(10)} ${seconds}`);
}

console.log(skipped.length > 0 ? `\nverify passed (skipped: ${skipped.join(', ')})` : '\nverify passed');
