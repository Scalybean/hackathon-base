/** Dashboard. Exercises most of the primitive set against real, owned data. */
import Link from 'next/link';
import { FileText, Plus, ShieldCheck, Sparkles } from 'lucide-react';

import { PageHeader } from '@/components/app/page-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { TBody, TD, TH, THead, TR, Table } from '@/components/ui/table';
import { requireProfile } from '@/lib/auth/require-user';
import { listNotes } from '@/lib/db/notes';

export const metadata = { title: 'Dashboard' };

export default async function DashboardPage() {
  const { user, profile, supabase } = await requireProfile();
  const notes = await listNotes(supabase, user.id);

  const latest = notes.slice(0, 5);

  return (
    <>
      <PageHeader
        title={`Good to see you, ${profile.display_name.split(' ')[0]}`}
        description="Everything below is scoped to your account by row-level security, not by a filter in the query."
        actions={
          <Button asChild size="md">
            <Link href="/notes">
              <Plus aria-hidden className="size-3.5" strokeWidth={2} />
              New note
            </Link>
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <Stat label="Your notes" value={String(notes.length)} />
        <Stat label="Role" value={profile.role} tone={profile.role === 'admin' ? 'accent' : 'neutral'} />
        <Stat label="Visible to others" value="0" />
      </div>

      <Card className="mt-8">
        <CardHeader className="flex items-center justify-between">
          <CardTitle>Recent notes</CardTitle>
          <Badge tone="accent">RLS enforced</Badge>
        </CardHeader>
        <CardBody className="p-0">
          {latest.length === 0 ? (
            <div className="p-5">
              <EmptyState
                icon={FileText}
                title="No notes yet"
                description="Create one, then sign in as another seeded user to confirm it is invisible to them."
                action={
                  <Button asChild size="sm" variant="secondary">
                    <Link href="/notes">Go to notes</Link>
                  </Button>
                }
              />
            </div>
          ) : (
            <Table>
              <THead>
                <TR>
                  <TH>Title</TH>
                  <TH>Updated</TH>
                  <TH />
                </TR>
              </THead>
              <TBody>
                {latest.map((note) => (
                  <TR key={note.id}>
                    <TD className="font-medium">{note.title}</TD>
                    <TD className="text-fg-muted">
                      {new Date(note.updated_at).toLocaleDateString(undefined, {
                        day: 'numeric',
                        month: 'short',
                      })}
                    </TD>
                    <TD className="text-right">
                      <Button asChild variant="link" size="sm">
                        <Link href={`/notes/${note.id}`}>Open</Link>
                      </Button>
                    </TD>
                  </TR>
                ))}
              </TBody>
            </Table>
          )}
        </CardBody>
      </Card>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <Callout
          icon={ShieldCheck}
          title="Isolation, verified"
          body="pnpm check:rls fails the build if any table loses RLS, gains a USING (true) policy, or exposes a writable user_id column."
        />
        <Callout
          icon={Sparkles}
          title="Add a feature"
          body="pnpm new:resource <name> writes the migration, policies, types, route and page. Then follow PATTERNS.md."
        />
      </div>
    </>
  );
}

function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: 'neutral' | 'accent';
}) {
  return (
    <div className="rounded-[var(--radius-lg)] border border-border bg-bg-raised px-5 py-4">
      <p className="text-2xs font-semibold uppercase tracking-[0.07em] text-fg-subtle">{label}</p>
      <p
        className={`mt-1.5 font-display text-3xl leading-none ${tone === 'accent' ? 'text-accent' : ''}`}
      >
        {value}
      </p>
    </div>
  );
}

function Callout({
  icon: Icon,
  title,
  body,
}: {
  icon: typeof ShieldCheck;
  title: string;
  body: string;
}) {
  return (
    <div className="rounded-[var(--radius-lg)] border border-border bg-bg-inset px-5 py-4">
      <Icon aria-hidden className="size-4 text-accent" strokeWidth={1.75} />
      <p className="mt-2.5 font-medium">{title}</p>
      <p className="mt-1 text-sm leading-relaxed text-fg-muted">{body}</p>
    </div>
  );
}
