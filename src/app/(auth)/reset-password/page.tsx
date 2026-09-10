/**
 * Sets a new password. Reached only from a recovery link, which /auth/confirm
 * has already exchanged for a session. No session, no page.
 */
import { requireUser } from '@/lib/auth/require-user';

import { ResetPasswordForm } from './reset-password-form';

export const metadata = { title: 'Choose a new password' };

export default async function ResetPasswordPage() {
  await requireUser();

  return (
    <div>
      <h1 className="text-3xl">Choose a new password</h1>
      <p className="mt-2 text-sm text-fg-muted">
        Setting a new password signs out every other device.
      </p>

      <div className="mt-8">
        <ResetPasswordForm />
      </div>
    </div>
  );
}
