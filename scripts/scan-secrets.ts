/**
 * Local push protection. GitHub's secret scanning is not available on a free
 * private repo, so this hook is what actually stops a key reaching the remote.
 * Wired up by `pnpm prepare` (git core.hooksPath) and run by .githooks/pre-push.
 */
import { spawnSync } from 'node:child_process';

/** Patterns for the credentials this project actually handles. */
const PATTERNS: { name: string; pattern: RegExp }[] = [
  { name: 'Supabase secret key', pattern: /\bsb_secret_[A-Za-z0-9_-]{16,}/ },
  { name: 'Supabase access token', pattern: /\bsbp_[a-f0-9]{40,}/ },
  // A service_role JWT: header, then a payload whose decoded form says service_role.
  { name: 'service_role JWT', pattern: /\beyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}/ },
  { name: 'Postgres connection string with password', pattern: /postgres(?:ql)?:\/\/[^\s:@]+:[^\s@]+@/ },
  { name: 'GitHub token', pattern: /\bgh[pousr]_[A-Za-z0-9]{30,}/ },
  { name: 'OpenAI key', pattern: /\bsk-[A-Za-z0-9]{20,}/ },
  { name: 'Anthropic key', pattern: /\bsk-ant-[A-Za-z0-9_-]{20,}/ },
  { name: 'AWS access key id', pattern: /\bAKIA[0-9A-Z]{16}\b/ },
  { name: 'Private key block', pattern: /-----BEGIN (?:RSA |EC |OPENSSH |PGP )?PRIVATE KEY-----/ },
];

/** Files where a fake or example value is expected. */
const ALLOWED = [/^\.env\.example$/, /^scripts\/scan-secrets\.ts$/, /^SECURITY\.md$/, /^README\.md$/];

/**
 * Documentation shows the shape of a credential without being one. A match
 * containing any of these is an example, not a leak. Kept deliberately narrow:
 * a real key never contains angle brackets or the word "password".
 */
const PLACEHOLDER = /<|>|\[|\]|\.\.\.|PLACEHOLDER|EXAMPLE|example\.com|YOUR[-_]|:password@|:pass@/i;

const range = process.argv[2] ?? 'HEAD';

const diff = spawnSync('git', ['diff', '--no-color', '-U0', range], { encoding: 'utf8' });
if (diff.status !== 0) {
  console.error('scan   ERROR  could not read the diff');
  process.exit(1);
}

type Finding = { file: string; name: string };
const findings: Finding[] = [];
let file = '';

for (const line of diff.stdout.split('\n')) {
  const header = /^\+\+\+ b\/(.+)$/.exec(line);
  if (header) {
    file = header[1];
    continue;
  }
  if (!line.startsWith('+') || line.startsWith('+++')) continue;
  if (ALLOWED.some((allowed) => allowed.test(file))) continue;

  for (const { name, pattern } of PATTERNS) {
    const match = pattern.exec(line);
    if (match && !PLACEHOLDER.test(match[0])) findings.push({ file, name });
  }
}

if (findings.length > 0) {
  const unique = [...new Map(findings.map((f) => [`${f.file}:${f.name}`, f])).values()];
  console.error(`scan   BLOCKED  ${unique.length} possible secret(s) in the pushed commits`);
  for (const finding of unique) console.error(`  ${finding.file}: ${finding.name}`);
  console.error('\n  Do not bypass this. Rotate the credential first, then rewrite the commit.');
  process.exit(1);
}

console.log('scan   ok    no secrets in the pushed commits');
