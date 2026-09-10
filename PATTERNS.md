# PATTERNS

Copy-pasteable recipes. Each section is self-contained: read only the one you need.
A prompt can say "follow PATTERNS.md §4" and nothing else.

Rules that apply to every section: ownership comes from `auth.uid()`, never from a
request body. Every handler is wrapped. Every error to the client is generic.

---

## §1 — New table

**Do not write this by hand.** Run the scaffolder, then edit the columns.

```bash
pnpm new:resource task     # singular; the table becomes "tasks"
```

It writes eight files: the migration with policies, the Zod schemas, the query
helpers, both API routes, the server actions, the page and the composer.

Then, in order:

```bash
# 1. edit supabase/migrations/<stamp>_tasks.sql if the columns are wrong
pnpm db:push        # 2. apply it
pnpm types          # 3. regenerate src/types/database.ts, and commit it
```

Finally add `'/tasks'` to `PROTECTED_PREFIXES` in `src/proxy.ts` and a nav entry to
`MAIN` in `src/components/app/sidebar.tsx`, then `pnpm verify`.

### If you must write the migration yourself

Four things are non-negotiable. `pnpm check:rls` fails the build without them.

```sql
create table public.things (
  id      uuid primary key default gen_random_uuid(),
  -- 1. Ownership is a column default, so the client never supplies it.
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  title   text not null check (char_length(title) between 1 and 200)
);

-- 2. The client cannot write user_id: it is absent from both grants.
revoke all on public.things from anon, authenticated;
grant select on public.things to authenticated;
grant insert (title) on public.things to authenticated;
grant update (title) on public.things to authenticated;
grant delete on public.things to authenticated;

-- 3. RLS enabled AND forced (forced stops the table owner bypassing it).
alter table public.things enable row level security;
alter table public.things force row level security;

-- 4. One policy per operation, always TO authenticated, never USING (true).
create policy things_select_own on public.things
  for select to authenticated using (user_id = (select auth.uid()));
create policy things_insert_own on public.things
  for insert to authenticated with check (user_id = (select auth.uid()));
create policy things_update_own on public.things
  for update to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy things_delete_own on public.things
  for delete to authenticated using (user_id = (select auth.uid()));
```

`(select auth.uid())` rather than bare `auth.uid()`: Postgres evaluates the subquery
once per statement instead of once per row.

For an admin-readable table, add a **separate** policy. Never widen an existing one:

```sql
create policy things_select_admin on public.things
  for select to authenticated using (private.is_admin());
```

`private.is_admin()` is `SECURITY DEFINER` and lives in the `private` schema, so it
cannot recurse into the policies that call it and PostgREST cannot publish it.

### The query helper

One file per table in `src/lib/db/`. Every function re-checks ownership even though
RLS already does. See `src/lib/db/notes.ts` for the full shape.

```ts
export async function getThing(supabase: Client, userId: string, id: string) {
  const { data, error } = await supabase
    .from('things')
    .select('*')
    .eq('id', id)
    .eq('user_id', userId)   // belt and braces: RLS is the belt
    .maybeSingle();

  if (error) throw error;
  if (!data) throw notFoundError();   // same error for missing and not-yours
  return data;
}
```

---

## §2 — New protected page

Put it under `src/app/(app)/`. The group layout already ran `requireProfile()`, and
`proxy.ts` already bounced anyone without a session, so the page body does not
re-check for a session — but it does re-check *ownership* of anything it loads.

```tsx
/** Things list. Protected: it lives under (app). */
import { PageHeader } from '@/components/app/page-header';
import { requireUser } from '@/lib/auth/require-user';
import { listThings } from '@/lib/db/things';

export const metadata = { title: 'Things' };

export default async function ThingsPage() {
  const { user, supabase } = await requireUser();
  const things = await listThings(supabase, user.id);

  return (
    <>
      <PageHeader title="Things" description="Only yours." />
      {/* ... */}
    </>
  );
}
```

Add `'/things'` to `PROTECTED_PREFIXES` in `src/proxy.ts`.

**Admin-only page**: swap `requireUser()` for `requireAdmin()`. It renders a 404, not
a 403, so a non-admin cannot confirm the surface exists.

**A `[id]` page** must treat a malformed id as 404, never as a validation error:

```tsx
export default async function ThingPage(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params;            // params is async in Next 16
  const parsed = thingIdSchema.safeParse(id);
  if (!parsed.success) notFound();

  const { user, supabase } = await requireUser();
  try {
    const thing = await getThing(supabase, user.id, parsed.data);
    return <ThingEditor thing={thing} />;
  } catch (error) {
    if (error instanceof ApiError && error.code === 'not_found') notFound();
    throw error;
  }
}
```

---

## §3 — New server action

Every action is wrapped in `action(...)`. It runs rate limit → authenticate →
authorise → Zod → your code, and flattens any throw into a safe serialisable result.

```ts
/** Thing mutations. */
'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';

import { action } from '@/lib/api/action';
import { createThing, deleteThing } from '@/lib/db/things';
import { createThingSchema, thingIdSchema } from '@/lib/schemas/things';

export const createThingAction = action(
  { rateLimit: 'mutation', input: createThingSchema },
  async ({ input, supabase }) => {
    const thing = await createThing(supabase, input);
    revalidatePath('/things');
    return thing;
  },
);

export const deleteThingAction = action(
  { rateLimit: 'mutation', input: z.object({ id: thingIdSchema }) },
  async ({ input, supabase, user }) => {
    await deleteThing(supabase, user.id, input.id);   // ownership re-checked
    revalidatePath('/things');
    return { id: input.id };
  },
);
```

Config options:

| option | meaning |
| --- | --- |
| `rateLimit` | required. `auth` (5/min), `mutation` (30/min), `read` (120/min), `expensive` (10/min) |
| `input` | required. The Zod schema for the FormData or object |
| `auth: false` | public action. Only for login and signup |
| `admin: true` | requires `profiles.role = 'admin'`. Fails as 404, not 403 |

The handler receives `{ input, supabase, user }`. `supabase` is the caller's
RLS-scoped client — use it, not the admin client.

To surface a specific message, throw `ApiError`. Anything else becomes a generic 500
with the detail logged server-side under a trace id.

```ts
throw new ApiError('unauthorized', 'Email or password is incorrect.');
```

---

## §4 — New API route handler

```ts
/** Things collection endpoint. */
import { route } from '@/lib/api/handler';
import { createThing, listThings } from '@/lib/db/things';
import { createThingSchema } from '@/lib/schemas/things';

export const GET = route({ rateLimit: 'read' }, async ({ supabase, user }) =>
  listThings(supabase, user.id),
);

export const POST = route(
  { rateLimit: 'mutation', body: createThingSchema },
  async ({ supabase, body }) => createThing(supabase, body),
);

export const dynamic = 'force-dynamic';
```

`route()` takes the same config as `action()`, plus `body` and `query` Zod schemas.
The handler receives `{ request, supabase, user, body, query, params }`. Bodies over
64 KB are rejected before parsing.

Responses are uniform:

```jsonc
{ "ok": true,  "data": … }
{ "ok": false, "error": { "code": "not_found", "message": "Not found.", "traceId": "a1b2c3d4" } }
```

For a `[id]` route, parse the param and 404 on failure — never `.parse()`, which would
throw a validation error that echoes the input back:

```ts
function thingId(params: Record<string, string>): string {
  const parsed = z.object({ id: thingIdSchema }).safeParse(params);
  if (!parsed.success) throw notFoundError();
  return parsed.data.id;
}
```

---

## §5 — New form

Client component, `useActionState`, and the `toFormAction` adapter. Validation,
pending state, field errors and the toast all come from the same three helpers.

```tsx
'use client';

import { useActionState, useEffect, useRef } from 'react';

import { createThingAction } from '@/app/(app)/things/actions';
import { FormError } from '@/components/form/form-error';
import { fieldError, formError, toFormAction } from '@/components/form/form-state';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Field } from '@/components/ui/label';
import { toast } from '@/components/ui/toast';

export function ThingComposer() {
  const [state, formAction, pending] = useActionState(toFormAction(createThingAction), null);
  const form = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.ok) {
      toast.success('Created');
      form.current?.reset();
    }
  }, [state]);

  return (
    <form ref={form} action={formAction} className="space-y-4" noValidate>
      <FormError message={formError(state)} />

      <Field label="Title" htmlFor="title" error={fieldError(state, 'title')}>
        <Input id="title" name="title" required aria-invalid={Boolean(fieldError(state, 'title'))} />
      </Field>

      <Button type="submit" loading={pending}>Create</Button>
    </form>
  );
}
```

- `formError(state)` returns the form-level message only when no field owns the failure.
- `fieldError(state, name)` returns the first message for that input.
- `noValidate` hands validation to Zod, so the browser and the server never disagree.
- Never render `state.message` for a success case; it does not exist.

---

## §6 — New UI primitive

Tokens only. No hex, no `px`, no `dark:` utilities — the semantic roles already flip.

```tsx
/** Callout primitive. One line saying what this file is for. */
import * as React from 'react';

import { cn } from '@/lib/cn';

export type CalloutTone = 'info' | 'warning';

const TONES: Record<CalloutTone, string> = {
  info: 'bg-info-soft text-info-fg',
  warning: 'bg-warning-soft text-warning-fg',
};

export function Callout({
  className,
  tone = 'info',
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { tone?: CalloutTone }) {
  return (
    <div
      className={cn('rounded-[var(--radius-md)] border border-border px-4 py-3 text-sm', TONES[tone], className)}
      {...props}
    />
  );
}
```

Rules: variants are a closed `Record<Variant, string>`, never string concatenation.
Radius and shadow come from `var(--radius-*)` and `var(--shadow-*)`. Accept
`className` last so a caller can override. Then **add it to `/styleguide`** — that
page is how the next agent learns the component exists.

Avoid: purple-blue gradients, a centred card on a grey page, emoji as icons (use
`lucide-react`), a shadow on everything, and untouched default spacing rhythm.

---

## §7 — File upload to a private bucket

The bucket is private; `check:rls` fails the build if any bucket is public. Reads are
short-lived signed URLs minted on the server. Object keys start with the owner's user
id, which is what the storage policy matches on.

**Storage policy** (one migration per bucket, four policies):

```sql
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('docs', 'docs', false, 5242880, array['application/pdf'])
on conflict (id) do update set public = false;

create policy docs_insert_own on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'docs'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );
-- repeat for select, update, delete
```

**The action.** File type and size are validated by Zod *and* by the bucket, because
the client-declared MIME type is not trustworthy on its own.

```ts
const uploadSchema = z.object({
  file: z
    .instanceof(File, { message: 'Choose a file.' })
    .refine((f) => f.size > 0 && f.size <= 5 * 1024 * 1024, 'Files must be 5 MB or smaller.')
    .refine((f) => f.type === 'application/pdf', 'PDF only.'),
});

export const uploadDocAction = action(
  { rateLimit: 'expensive', input: uploadSchema },
  async ({ input, supabase, user }) => {
    const path = `${user.id}/${Date.now()}.pdf`;   // owner prefix is the ACL

    // Uploaded with the caller's own client, so the storage policy authorises it.
    const { error } = await supabase.storage
      .from('docs')
      .upload(path, input.file, { upsert: false, contentType: input.file.type });
    if (error) throw new ApiError('internal', 'Could not upload that file.');

    await supabase.from('docs').update({ path }).eq('id', user.id);
    return { path };
  },
);
```

**Reading it back** — always server-side, always expiring:

```ts
const { data } = await supabase.storage.from('docs').createSignedUrl(path, 600);
```

Never make the bucket public. Never hand the client a raw storage path and let it
construct a URL. `src/lib/storage/avatars.ts` is the worked example.
