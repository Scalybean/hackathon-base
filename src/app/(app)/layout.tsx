/**
 * Protected shell. Every page under (app) is behind requireProfile(), so a
 * page in this group never has to check for a session itself.
 * proxy.ts also redirects here; this is the second of the two locks.
 */
import { MobileNav } from '@/components/app/mobile-nav';
import { Sidebar } from '@/components/app/sidebar';
import { Topbar } from '@/components/app/topbar';
import { requireProfile } from '@/lib/auth/require-user';
import { signedAvatarUrl } from '@/lib/storage/avatars';
import { getTheme } from '@/lib/theme';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, profile, supabase } = await requireProfile();
  const [avatarUrl, theme] = await Promise.all([
    signedAvatarUrl(supabase, profile.avatar_path),
    getTheme(),
  ]);

  const isAdmin = profile.role === 'admin';

  return (
    <div className="flex min-h-dvh">
      <Sidebar isAdmin={isAdmin} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar
          crumbs={[{ label: 'Base', href: '/dashboard' }]}
          theme={theme}
          isAdmin={isAdmin}
          user={{
            displayName: profile.display_name,
            email: user.email ?? '',
            avatarUrl,
            isAdmin,
          }}
        />
        {/* Bottom padding clears the mobile tab bar, which is fixed. */}
        <main className="mx-auto w-full max-w-[var(--content-max)] flex-1 px-5 py-8 pb-28 lg:px-8 md:pb-8">
          {children}
        </main>
      </div>
      <MobileNav isAdmin={isAdmin} />
    </div>
  );
}
