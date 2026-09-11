/**
 * Create form. Validates with the same Zod schema the server uses, so the
 * error a user sees locally is the error the server would have given, and the
 * note can appear in the list before the round trip finishes.
 */
'use client';

import { useRef, useState } from 'react';

import { FormError } from '@/components/form/form-error';
import { Button } from '@/components/ui/button';
import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/card';
import { Input, Textarea } from '@/components/ui/input';
import { Field } from '@/components/ui/label';
import { createNoteSchema } from '@/lib/schemas/notes';

export type NoteComposerProps = {
  onCreate: (title: string, body: string) => void;
  pending: boolean;
};

export function NoteComposer({ onCreate, pending }: NoteComposerProps) {
  const form = useRef<HTMLFormElement>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);

    const parsed = createNoteSchema.safeParse({
      title: data.get('title'),
      body: data.get('body') ?? '',
    });

    if (!parsed.success) {
      const next: Record<string, string> = {};
      for (const issue of parsed.error.issues) next[issue.path.join('.')] ??= issue.message;
      setErrors(next);
      return;
    }

    setErrors({});
    onCreate(parsed.data.title, parsed.data.body);
    form.current?.reset();
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>New note</CardTitle>
      </CardHeader>
      <CardBody>
        <form ref={form} onSubmit={submit} className="space-y-4" noValidate>
          <FormError message={errors._} />

          <Field label="Title" htmlFor="title" error={errors.title}>
            <Input
              id="title"
              name="title"
              required
              maxLength={200}
              aria-invalid={Boolean(errors.title)}
            />
          </Field>

          <Field label="Body" htmlFor="body" error={errors.body}>
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
