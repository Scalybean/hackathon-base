/** Sign-up page. Public. */
import Link from 'next/link';

import { SignupForm } from './signup-form';

export const metadata = { title: 'Create an account' };

export default function SignupPage() {
  return (
    <div>
      <h1 className="text-3xl">Create an account</h1>
      <p className="mt-2 text-sm text-fg-muted">
        Already have one?{' '}
        <Link href="/login" className="text-accent underline underline-offset-4">
          Sign in
        </Link>
      </p>

      <div className="mt-8">
        <SignupForm />
      </div>
    </div>
  );
}
