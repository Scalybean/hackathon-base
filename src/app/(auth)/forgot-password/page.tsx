/** Password reset request page. Public. */
import Link from 'next/link';

import { ForgotPasswordForm } from './forgot-password-form';

export const metadata = { title: 'Reset your password' };

export default function ForgotPasswordPage() {
  return (
    <div>
      <h1 className="text-3xl">Reset your password</h1>
      <p className="mt-2 text-sm text-fg-muted">
        We will email you a single-use link.{' '}
        <Link href="/login" className="text-accent underline underline-offset-4">
          Back to sign in
        </Link>
      </p>

      <div className="mt-8">
        <ForgotPasswordForm />
      </div>
    </div>
  );
}
