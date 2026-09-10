/** Reset request form. The confirmation is identical for unknown addresses. */
'use client';

import { useActionState } from 'react';
import { MailCheck } from 'lucide-react';

import { forgotPasswordAction } from '@/app/(auth)/actions';
import { FormError } from '@/components/form/form-error';
import { fieldError, formError, toFormAction } from '@/components/form/form-state';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Field } from '@/components/ui/label';

export function ForgotPasswordForm() {
  const [state, formAction, pending] = useActionState(toFormAction(forgotPasswordAction), null);

  if (state?.ok) {
    return (
      <div className="rounded-[var(--radius-lg)] border border-border bg-bg-inset px-5 py-6">
        <MailCheck aria-hidden className="size-5 text-accent" strokeWidth={1.5} />
        <p className="mt-3 font-display text-lg font-semibold">Check your inbox</p>
        <p className="mt-1.5 text-sm leading-relaxed text-fg-muted">
          If an account exists for{' '}
          <span className="font-medium text-fg">{state.data.email}</span>, a reset link is on
          its way.
        </p>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-5" noValidate>
      <FormError message={formError(state)} />

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

      <Button type="submit" size="lg" loading={pending} className="w-full">
        Send reset link
      </Button>
    </form>
  );
}
