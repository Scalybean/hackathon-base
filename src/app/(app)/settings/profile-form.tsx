/** Display name form. */
'use client';

import { useActionState, useEffect } from 'react';

import { updateProfileAction } from '@/app/(app)/settings/actions';
import { FormError } from '@/components/form/form-error';
import { fieldError, formError, toFormAction } from '@/components/form/form-state';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Field } from '@/components/ui/label';
import { toast } from '@/components/ui/toast';

export function ProfileForm({ displayName }: { displayName: string }) {
  const [state, formAction, pending] = useActionState(toFormAction(updateProfileAction), null);

  useEffect(() => {
    if (state?.ok) toast.success('Profile updated');
  }, [state]);

  return (
    <form action={formAction} className="space-y-4" noValidate>
      <FormError message={formError(state)} />

      <Field label="Display name" htmlFor="displayName" error={fieldError(state, 'displayName')}>
        <Input
          id="displayName"
          name="displayName"
          defaultValue={displayName}
          required
          maxLength={60}
          aria-invalid={Boolean(fieldError(state, 'displayName'))}
        />
      </Field>

      <Button type="submit" loading={pending}>
        Save
      </Button>
    </form>
  );
}
