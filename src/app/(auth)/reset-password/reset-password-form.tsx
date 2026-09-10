/** New-password form. Confirmation is checked by Zod, not by hand. */
'use client';

import { useActionState } from 'react';

import { resetPasswordAction } from '@/app/(auth)/actions';
import { FormError } from '@/components/form/form-error';
import { fieldError, formError, toFormAction } from '@/components/form/form-state';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Field } from '@/components/ui/label';

export function ResetPasswordForm() {
  const [state, formAction, pending] = useActionState(toFormAction(resetPasswordAction), null);

  return (
    <form action={formAction} className="space-y-5" noValidate>
      <FormError message={formError(state)} />

      <Field
        label="New password"
        htmlFor="password"
        hint="At least 10 characters."
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

      <Field
        label="Confirm password"
        htmlFor="confirmPassword"
        error={fieldError(state, 'confirmPassword')}
      >
        <Input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          autoComplete="new-password"
          required
          aria-invalid={Boolean(fieldError(state, 'confirmPassword'))}
        />
      </Field>

      <Button type="submit" size="lg" loading={pending} className="w-full">
        Set password
      </Button>
    </form>
  );
}
