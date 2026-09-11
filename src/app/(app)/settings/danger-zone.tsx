/** Account deletion. Requires the password and a typed confirmation. */
'use client';

import { useActionState } from 'react';

import { deleteAccountAction } from '@/app/(app)/settings/actions';
import { FormError } from '@/components/form/form-error';
import { fieldError, formError, toFormAction } from '@/components/form/form-state';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Field } from '@/components/ui/label';

export function DangerZone() {
  const [state, formAction, pending] = useActionState(toFormAction(deleteAccountAction), null);

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="danger">Delete my account</Button>
      </DialogTrigger>
      <DialogContent>
        <form action={formAction} noValidate>
          <DialogHeader>
            <DialogTitle>Delete your account</DialogTitle>
            <DialogDescription>
              Your account, your notes and your uploads are removed immediately.
            </DialogDescription>
          </DialogHeader>

          <DialogBody className="space-y-4">
            <FormError message={formError(state)} />

            <Field
              label="Current password"
              htmlFor="password"
              error={fieldError(state, 'password')}
            >
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                aria-invalid={Boolean(fieldError(state, 'password'))}
              />
            </Field>

            <Field
              label="Type DELETE to confirm"
              htmlFor="confirmation"
              error={fieldError(state, 'confirmation')}
            >
              <Input
                id="confirmation"
                name="confirmation"
                autoComplete="off"
                required
                aria-invalid={Boolean(fieldError(state, 'confirmation'))}
              />
            </Field>
          </DialogBody>

          <DialogFooter>
            <Button type="submit" variant="danger" loading={pending}>
              Delete permanently
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
