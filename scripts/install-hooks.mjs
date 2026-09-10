/**
 * Points git at .githooks so a fresh clone gets the pre-push secret scan.
 * Runs from `pnpm prepare`, which also runs on CI and on Vercel, where there
 * is no git directory — so this exits quietly rather than failing the install.
 */
import { spawnSync } from 'node:child_process';

const inRepo = spawnSync('git', ['rev-parse', '--git-dir'], { stdio: 'ignore' }).status === 0;

if (!inRepo) {
  console.log('hooks  skip  not a git checkout');
  process.exit(0);
}

const result = spawnSync('git', ['config', 'core.hooksPath', '.githooks'], { stdio: 'inherit' });

if (result.status !== 0) {
  console.log('hooks  skip  could not set core.hooksPath');
  process.exit(0);
}

console.log('hooks  ok    pre-push secret scan enabled');
