/**
 * Seeds one admin and two normal users, each with notes, so cross-user
 * isolation can be checked by hand in ten seconds.
 * Refuses to run against anything that looks like production.
 */
import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';

import { noRealtime } from '../src/lib/supabase/no-realtime';

config({ path: '.env.local', quiet: true });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceRole) {
  console.error('seed   FAIL  NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set');
  process.exit(1);
}

// Seeding destroys and recreates accounts. Never point it at prod.
if (process.env.SEED_ALLOW_PROD !== 'true' && /prod/i.test(process.env.SUPABASE_PROJECT_REF ?? '')) {
  console.error('seed   FAIL  SUPABASE_PROJECT_REF looks like production. Set SEED_ALLOW_PROD=true to override.');
  process.exit(1);
}

const admin = createClient(url, serviceRole, {
  auth: { persistSession: false, autoRefreshToken: false },
  ...noRealtime,
});

type SeedUser = {
  email: string;
  password: string;
  displayName: string;
  role: 'user' | 'admin';
  notes: { title: string; body: string }[];
};

const PASSWORD = 'correct-horse-battery';

const USERS: SeedUser[] = [
  {
    email: 'admin@example.com',
    password: PASSWORD,
    displayName: 'Ada Lovelace',
    role: 'admin',
    notes: [
      { title: 'Admin note', body: 'Only Ada owns this row. Admins can also read everyone else.' },
    ],
  },
  {
    email: 'alice@example.com',
    password: PASSWORD,
    displayName: 'Alice Nguyen',
    role: 'user',
    notes: [
      { title: "Alice's private note", body: 'Bob must never see this.' },
      { title: 'Alice second note', body: 'Neither this one.' },
    ],
  },
  {
    email: 'bob@example.com',
    password: PASSWORD,
    displayName: 'Bob Marsh',
    role: 'user',
    notes: [{ title: "Bob's private note", body: 'Alice must never see this.' }],
  },
];

async function findUserByEmail(email: string): Promise<string | null> {
  // listUsers is paginated; the seed set is small enough that one page is plenty.
  const { data, error } = await admin.auth.admin.listUsers({ page: 1, perPage: 200 });
  if (error) throw error;
  return data.users.find((u) => u.email?.toLowerCase() === email.toLowerCase())?.id ?? null;
}

async function main() {
  for (const seed of USERS) {
    const existing = await findUserByEmail(seed.email);
    if (existing) {
      // Cascades to profiles and notes, so every run starts clean.
      await admin.auth.admin.deleteUser(existing);
    }

    const { data, error } = await admin.auth.admin.createUser({
      email: seed.email,
      password: seed.password,
      email_confirm: true,
      user_metadata: { display_name: seed.displayName },
    });
    if (error || !data.user) throw error ?? new Error(`could not create ${seed.email}`);

    const userId = data.user.id;

    if (seed.role === 'admin') {
      // Role is server-controlled: this is a service-role write, and no client
      // code path can reach it.
      const { error: roleError } = await admin
        .from('profiles')
        .update({ role: 'admin' })
        .eq('id', userId);
      if (roleError) throw roleError;
    }

    // Real signups get a welcome note from the trigger. The seed is a fixture
    // for the isolation check, so its counts stay exactly what the README says.
    await admin.from('notes').delete().eq('user_id', userId).eq('title', 'Start here');

    if (seed.notes.length > 0) {
      const { error: notesError } = await admin
        .from('notes')
        .insert(seed.notes.map((note) => ({ ...note, user_id: userId })));
      if (notesError) throw notesError;
    }

    console.log(`  + ${seed.email.padEnd(22)} ${seed.role.padEnd(5)} ${seed.notes.length} note(s)`);
  }

  console.log(`
seed   ok    3 users, password "${PASSWORD}" for all of them

Verify isolation by hand:
  1. Sign in as alice@example.com  -> /notes shows 2 notes. Copy one id.
  2. Sign in as bob@example.com    -> /notes shows 1 note.
  3. Visit /notes/<alice's id> as Bob -> 404.
  4. GET /api/notes as Bob         -> Bob's note only.
  5. Visit /admin as Bob           -> 404. As admin@example.com -> 3 accounts.
`);
}

main().catch((error) => {
  console.error('seed   ERROR', error instanceof Error ? error.message : error);
  process.exit(1);
});
