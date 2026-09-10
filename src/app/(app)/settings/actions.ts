/**
 * Account mutations: display name, avatar, account deletion.
 * The only place in the app outside scripts that touches the service-role
 * client, and only after the caller has proved they are the account owner.
 */
'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';

import { action } from '@/lib/api/action';
import { ApiError } from '@/lib/api/errors';
import { deleteAccountSchema, updateProfileSchema } from '@/lib/schemas/auth';
import {
  AVATAR_BUCKET,
  AVATAR_MAX_BYTES,
  AVATAR_MIME_TYPES,
  avatarPath,
} from '@/lib/storage/avatars';
import { createAdminSupabase } from '@/lib/supabase/admin';

export const updateProfileAction = action(
  { rateLimit: 'mutation', input: updateProfileSchema },
  async ({ input, supabase, user }) => {
    // The UPDATE grant covers display_name and avatar_path only, and the
    // profiles_update_own policy pins the row to auth.uid(). This filter is
    // the third lock, not the first.
    const { error } = await supabase
      .from('profiles')
      .update({ display_name: input.displayName })
      .eq('id', user.id);

    if (error) throw new ApiError('internal', 'Could not save your profile. Please try again.');

    revalidatePath('/settings');
    revalidatePath('/dashboard');
    return { displayName: input.displayName };
  },
);

/**
 * File type is checked twice on the server: here by Zod, and again by the
 * bucket's allowed_mime_types. The client-declared MIME is never the only gate.
 */
const avatarSchema = z.object({
  avatar: z
    .instanceof(File, { message: 'Choose an image to upload.' })
    .refine((file) => file.size > 0, 'Choose an image to upload.')
    .refine((file) => file.size <= AVATAR_MAX_BYTES, 'Images must be 2 MB or smaller.')
    .refine(
      (file) => (AVATAR_MIME_TYPES as readonly string[]).includes(file.type),
      'Use a PNG, JPEG or WebP image.',
    ),
});

export const uploadAvatarAction = action(
  { rateLimit: 'expensive', input: avatarSchema },
  async ({ input, supabase, user }) => {
    const extension = input.avatar.type.split('/')[1] ?? 'png';
    const path = avatarPath(user.id, extension);

    // Uploaded with the user's own client, so the storage policy comparing the
    // first path segment to auth.uid() is what authorises the write.
    const { error: uploadError } = await supabase.storage
      .from(AVATAR_BUCKET)
      .upload(path, input.avatar, { upsert: false, contentType: input.avatar.type });

    if (uploadError) throw new ApiError('internal', 'Could not upload that image. Please try again.');

    const { data: previous } = await supabase
      .from('profiles')
      .select('avatar_path')
      .eq('id', user.id)
      .single();

    const { error: profileError } = await supabase
      .from('profiles')
      .update({ avatar_path: path })
      .eq('id', user.id);

    if (profileError) {
      await supabase.storage.from(AVATAR_BUCKET).remove([path]);
      throw new ApiError('internal', 'Could not save that image. Please try again.');
    }

    // Best effort: an orphaned old avatar is untidy, not dangerous.
    if (previous?.avatar_path) {
      await supabase.storage.from(AVATAR_BUCKET).remove([previous.avatar_path]);
    }

    revalidatePath('/settings');
    return { path };
  },
);

/**
 * Deletes the auth user, which cascades to profiles and every owned row.
 * Storage objects are removed explicitly: storage.objects does not cascade.
 */
export const deleteAccountAction = action(
  { rateLimit: 'auth', input: deleteAccountSchema.extend({ password: z.string().min(1).max(128) }) },
  async ({ input, supabase, user }) => {
    // Re-authenticate. A stolen session alone must not be able to delete an
    // account; the attacker also has to know the password.
    const { error: reauthError } = await supabase.auth.signInWithPassword({
      email: user.email ?? '',
      password: input.password,
    });
    if (reauthError) throw new ApiError('unauthorized', 'That password is not correct.');

    const admin = createAdminSupabase();

    const { data: objects } = await admin.storage.from(AVATAR_BUCKET).list(user.id);
    if (objects && objects.length > 0) {
      await admin.storage.from(AVATAR_BUCKET).remove(objects.map((o) => `${user.id}/${o.name}`));
    }

    const { error } = await admin.auth.admin.deleteUser(user.id);
    if (error) throw new ApiError('internal', 'Could not delete the account. Please try again.');

    await supabase.auth.signOut();
    redirect('/');
  },
);
