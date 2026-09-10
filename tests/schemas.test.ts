/**
 * The Zod layer is where a forged request body dies. These tests assert what
 * the schemas refuse, especially the absence of a client-settable user_id.
 */
import { describe, expect, it } from 'vitest';

import { signUpSchema, updateProfileSchema } from '@/lib/schemas/auth';
import { createNoteSchema, updateNoteSchema } from '@/lib/schemas/notes';

describe('note schemas', () => {
  it('strips a client-supplied user_id', () => {
    const parsed = createNoteSchema.parse({
      title: 'Mine',
      body: '',
      user_id: '00000000-0000-0000-0000-000000000000',
    });
    expect(parsed).not.toHaveProperty('user_id');
  });

  it('strips a client-supplied id on update', () => {
    const parsed = updateNoteSchema.parse({ title: 'x', body: '', id: 'anything' });
    expect(parsed).not.toHaveProperty('id');
  });

  it('rejects an empty title', () => {
    expect(createNoteSchema.safeParse({ title: '   ', body: '' }).success).toBe(false);
  });

  it('rejects an oversized title and body', () => {
    expect(createNoteSchema.safeParse({ title: 'a'.repeat(201), body: '' }).success).toBe(false);
    expect(createNoteSchema.safeParse({ title: 'ok', body: 'b'.repeat(10_001) }).success).toBe(false);
  });

  it('defaults an absent body rather than failing open', () => {
    expect(createNoteSchema.parse({ title: 'ok' }).body).toBe('');
  });
});

describe('auth schemas', () => {
  it('strips a client-supplied role', () => {
    const parsed = signUpSchema.parse({
      email: 'A@Example.COM',
      password: 'a-long-enough-password',
      displayName: 'Ada',
      role: 'admin',
    });
    expect(parsed).not.toHaveProperty('role');
  });

  it('lower-cases and trims the email', () => {
    const parsed = signUpSchema.parse({
      email: '  Ada@Example.COM ',
      password: 'a-long-enough-password',
      displayName: 'Ada',
    });
    expect(parsed.email).toBe('ada@example.com');
  });

  it('requires at least ten password characters', () => {
    const base = { email: 'a@b.com', displayName: 'Ada' };
    expect(signUpSchema.safeParse({ ...base, password: 'short' }).success).toBe(false);
    expect(signUpSchema.safeParse({ ...base, password: '0123456789' }).success).toBe(true);
  });

  it('accepts an ordinary display name', () => {
    expect(updateProfileSchema.safeParse({ displayName: 'Ada Lovelace' }).success).toBe(true);
  });

  it.each([
    ['right-to-left override', '\u202E'],
    ['zero-width joiner', '\u200D'],
    ['null', '\u0000'],
    ['newline', '\n'],
    ['bell', '\u0007'],
  ])('rejects a display name containing a %s', (_label, character) => {
    const result = updateProfileSchema.safeParse({ displayName: `Ada${character}Lovelace` });
    expect(result.success).toBe(false);
  });
});
