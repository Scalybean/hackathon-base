/** Sign-up form. On success it shows the same confirmation for every address. */
'use client';

import { useActionState } from 'react';
import { MailCheck } from 'lucide-react';

import { signUpAction } from '@/app/(auth)/actions';
import { FormError } from '@/components/form/form-error';
import { fieldError, formError, toFormAction } from '@/components/form/form-state';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Field } from '@/components/ui/label';

export function SignupForm() {
  const [state, formAction, pending] = useActionState(toFormAction(signUpAction), null);

  if (state?.ok) {
    return (
      <div className="rounded-[var(--radius-lg)] border border-border bg-bg-inset px-5 py-6">
        <MailCheck aria-hidden className="size-5 text-accent" strokeWidth={1.5} />
        <p className="mt-3 font-display text-lg font-semibold">Check your inbox</p>
        <p className="mt-1.5 text-sm leading-relaxed text-fg-muted">
          A confirmation link is on its way to{' '}
          <span className="font-medium text-fg">{state.data.email}</span>. It expires in an
          hour.
        </p>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-5" noValidate>
      <FormError message={formError(state)} />

      <Field label="Display name" htmlFor="displayName" error={fieldError(state, 'displayName')}>
        <Input
          id="displayName"
          name="displayName"
          autoComplete="name"
          required
          maxLength={60}
          aria-invalid={Boolean(fieldError(state, 'displayName'))}
        />
      </Field>

      <Field label="Email" htmlFor="email" error={fieldError(state, 'email')}>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          aria-invalid={Boolean(fieldError(state, 'email'))}
        />
      </Field>

      <Field
        label="Password"
        htmlFor="password"
        hint="At least 10 characters. Length beats punctuation."
        error={fieldError(state, 'password')}
      >
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          minLength={10}
          aria-invalid={Boolean(fieldError(state, 'password'))}
        />
      </Field>

      <Button type="submit" size="lg" loading={pending} className="w-full">
        Create account
      </Button>
    </form>
  );
}
