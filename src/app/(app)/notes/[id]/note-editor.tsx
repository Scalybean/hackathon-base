/** Edit form for one note. The id travels in a hidden field and is re-checked. */
'use client';

import { useActionState, useEffect } from 'react';

import { updateNoteAction } from '@/app/(app)/notes/actions';
import { FormError } from '@/components/form/form-error';
import { fieldError, formError, toFormAction } from '@/components/form/form-state';
import { Button } from '@/components/ui/button';
import { Card, CardBody, CardFooter } from '@/components/ui/card';
import { Input, Textarea } from '@/components/ui/input';
import { Field } from '@/components/ui/label';
import { toast } from '@/components/ui/toast';
import type { Note } from '@/lib/db/notes';

export function NoteEditor({ note }: { note: Note }) {
  const [state, formAction, pending] = useActionState(toFormAction(updateNoteAction), null);

  useEffect(() => {
    if (state?.ok) toast.success('Saved');
  }, [state]);

  return (
    <Card className="max-w-2xl">
      <form action={formAction} noValidate>
        <CardBody className="space-y-4">
          <FormError message={formError(state)} />
          <input type="hidden" name="id" value={note.id} />

          <Field label="Title" htmlFor="title" error={fieldError(state, 'title')}>
            <Input
              id="title"
              name="title"
              defaultValue={note.title}
              required
              maxLength={200}
              aria-invalid={Boolean(fieldError(state, 'title'))}
            />
          </Field>

          <Field label="Body" htmlFor="body" error={fieldError(state, 'body')}>
            <Textarea id="body" name="body" defaultValue={note.body} rows={10} maxLength={10000} />
          </Field>
        </CardBody>
        <CardFooter>
          <Button type="submit" loading={pending}>
            Save changes
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
