/** Create-note form. Pending state, field errors and a toast on success. */
'use client';

import { useActionState, useEffect, useRef } from 'react';

import { createNoteAction } from '@/app/(app)/notes/actions';
import { FormError } from '@/components/form/form-error';
import { fieldError, formError, toFormAction } from '@/components/form/form-state';
import { Button } from '@/components/ui/button';
import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/card';
import { Input, Textarea } from '@/components/ui/input';
import { Field } from '@/components/ui/label';
import { toast } from '@/components/ui/toast';

export function NoteComposer() {
  const [state, formAction, pending] = useActionState(toFormAction(createNoteAction), null);
  const form = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.ok) {
      toast.success('Note created');
      form.current?.reset();
    }
  }, [state]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>New note</CardTitle>
      </CardHeader>
      <CardBody>
        <form ref={form} action={formAction} className="space-y-4" noValidate>
          <FormError message={formError(state)} />

          <Field label="Title" htmlFor="title" error={fieldError(state, 'title')}>
            <Input
              id="title"
              name="title"
              required
              maxLength={200}
              aria-invalid={Boolean(fieldError(state, 'title'))}
            />
          </Field>

          <Field label="Body" htmlFor="body" error={fieldError(state, 'body')}>
            <Textarea id="body" name="body" maxLength={10000} rows={5} />
          </Field>

          <Button type="submit" loading={pending} className="w-full">
            Create note
          </Button>
        </form>
      </CardBody>
    </Card>
  );
}
