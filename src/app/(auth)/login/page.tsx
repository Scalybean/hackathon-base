/** Sign-in page. Public. Signed-in visitors are bounced by proxy.ts. */
import Link from 'next/link';

import { LoginForm } from './login-form';

export const metadata = { title: 'Sign in' };

export default async function LoginPage(props: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const { next, error } = await props.searchParams;

  return (
    <div>
      <h1 className="text-3xl">Sign in</h1>
      <p className="mt-2 text-sm text-fg-muted">
        New here?{' '}
        <Link href="/signup" className="text-accent underline underline-offset-4">
          Create an account
        </Link>
      </p>

      <div className="mt-8">
        <LoginForm next={next} linkError={error === 'link'} />
      </div>
    </div>
  );
}
