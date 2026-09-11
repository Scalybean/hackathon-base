/** Account settings: display name, avatar, and account deletion. */
import { PageHeader } from '@/components/app/page-header';
import { Badge } from '@/components/ui/badge';
import { Card, CardBody, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { requireProfile } from '@/lib/auth/require-user';
import { signedAvatarUrl } from '@/lib/storage/avatars';

import { AvatarForm } from './avatar-form';
import { DangerZone } from './danger-zone';
import { ProfileForm } from './profile-form';

export const metadata = { title: 'Account settings' };

export default async function SettingsPage() {
  const { user, profile, supabase } = await requireProfile();
  const avatarUrl = await signedAvatarUrl(supabase, profile.avatar_path);

  return (
    <>
      <PageHeader title="Account settings" description="Your profile, and how to leave." />

      <div className="max-w-2xl space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Profile</CardTitle>
            <CardDescription>
              Signed in as <span className="text-fg">{user.email}</span>
              <Badge tone={profile.role === 'admin' ? 'accent' : 'neutral'} className="ml-2">
                {profile.role}
              </Badge>
            </CardDescription>
          </CardHeader>
          <CardBody>
            <ProfileForm displayName={profile.display_name} />
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Avatar</CardTitle>
            <CardDescription>Shown next to your name.</CardDescription>
          </CardHeader>
          <CardBody>
            <AvatarForm displayName={profile.display_name} avatarUrl={avatarUrl} />
          </CardBody>
        </Card>

        <Card className="border-danger-soft">
          <CardHeader className="border-danger-soft">
            <CardTitle className="text-danger-fg">Delete account</CardTitle>
            <CardDescription>
              Removes your account and everything in it. There is no undo.
            </CardDescription>
          </CardHeader>
          <CardBody>
            <DangerZone />
          </CardBody>
        </Card>
      </div>
    </>
  );
}
