/** Avatar upload. See PATTERNS.md §7 for the private-bucket upload pattern. */
'use client';

import { useActionState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Upload } from 'lucide-react';

import { uploadAvatarAction } from '@/app/(app)/settings/actions';
import { FormError } from '@/components/form/form-error';
import { fieldError, formError, toFormAction } from '@/components/form/form-state';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Field } from '@/components/ui/label';
import { toast } from '@/components/ui/toast';

export function AvatarForm({
  displayName,
  avatarUrl,
}: {
  displayName: string;
  avatarUrl: string | null;
}) {
  const [state, formAction, pending] = useActionState(toFormAction(uploadAvatarAction), null);
  const form = useRef<HTMLFormElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (state?.ok) {
      toast.success('Avatar updated');
      form.current?.reset();
      router.refresh();
    }
  }, [state, router]);

  return (
    <form ref={form} action={formAction} className="flex items-start gap-5" noValidate>
      <Avatar name={displayName} src={avatarUrl} size="lg" />

      <div className="min-w-0 flex-1 space-y-3">
        <FormError message={formError(state)} />

        <Field
          label="New image"
          htmlFor="avatar"
          hint="PNG, JPEG or WebP. 2 MB maximum."
          error={fieldError(state, 'avatar')}
        >
          <input
            id="avatar"
            name="avatar"
            type="file"
            accept="image/png,image/jpeg,image/webp"
            className="block w-full text-sm text-fg-muted file:mr-3 file:rounded-[var(--radius-md)] file:border file:border-border-strong file:bg-bg-raised file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-fg hover:file:bg-bg-hover"
          />
        </Field>

        <Button type="submit" variant="secondary" loading={pending}>
          <Upload aria-hidden className="size-3.5" strokeWidth={1.75} />
          Upload
        </Button>
      </div>
    </form>
  );
}
