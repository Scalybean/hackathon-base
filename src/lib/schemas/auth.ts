/** Zod schemas for every auth form. Shared by client forms and server actions. */
import { z } from 'zod';

/**
 * 10 characters minimum. Length beats composition rules: it resists offline
 * cracking without pushing users toward "Password1!".
 */
export const passwordSchema = z
  .string()
  .min(10, 'Use at least 10 characters.')
  .max(128, 'Use at most 128 characters.');

/**
 * Trim and case-fold BEFORE validating. Doing it the other way round rejects a
 * pasted address with a trailing space and blames the user for it.
 */
export const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .pipe(z.email('Enter a valid email address.').max(254));

export const displayNameSchema = z
  .string()
  .trim()
  .min(1, 'Enter a display name.')
  .max(60, 'Use at most 60 characters.')
  // No control characters: they break rendering and hide content in logs.
  .regex(/^[^\p{Cc}\p{Cf}]+$/u, 'Remove any special control characters.');

export const signUpSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  displayName: displayNameSchema,
});

export const signInSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Enter your password.').max(128),
});

export const forgotPasswordSchema = z.object({
  email: emailSchema,
});

export const resetPasswordSchema = z
  .object({
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((value) => value.password === value.confirmPassword, {
    message: 'Passwords do not match.',
    path: ['confirmPassword'],
  });

export const updateProfileSchema = z.object({
  displayName: displayNameSchema,
});

export const deleteAccountSchema = z.object({
  confirmation: z.literal('DELETE', {
    message: 'Type DELETE to confirm.',
  }),
});

export type SignUpInput = z.infer<typeof signUpSchema>;
export type SignInInput = z.infer<typeof signInSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
