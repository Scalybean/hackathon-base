/** Sign-in form. Canonical example of the form pattern: see PATTERNS.md §5. */
'use client';

import Link from 'next/link';
import { useActionState } from 'react';

import { signInAction } from '@/app/(auth)/actions';
import { FormError } from '@/components/form/form-error';
import { fieldError, formError, toFormAction } from '@/components/form/form-state';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Field } from '@/components/ui/label';

export function LoginForm({ next, linkError }: { next?: string; linkError?: boolean }) {
  const [state, formAction, pending] = useActionState(toFormAction(signInAction), null);

  return (
    <form action={formAction} className="space-y-5" noValidate>
      <FormError
        message={
          formError(state) ??
          (linkError ? 'That link has expired or has already been used. Sign in instead.' : undefined)
        }
      />

      <input type="hidden" name="next" value={next ?? ''} />

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

      <Field label="Password" htmlFor="password" error={fieldError(state, 'password')}>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          aria-invalid={Boolean(fieldError(state, 'password'))}
        />
      </Field>

      <Button type="submit" size="lg" loading={pending} className="w-full">
        Sign in
      </Button>

      <p className="text-center text-xs text-fg-subtle">
        <Link href="/forgot-password" className="hover:text-fg">
          Forgot your password?
        </Link>
      </p>
    </form>
  );
}
