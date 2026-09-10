/**
 * Adapter between our ActionResult contract and React's useActionState.
 * Every form in the app uses this pair, so error rendering is identical.
 */
'use client';

import type { ActionResult } from '@/lib/api/action';

export type FormState<T> = ActionResult<T> | null;

export function toFormAction<T>(run: (formData: FormData) => Promise<ActionResult<T>>) {
  return async (_previous: FormState<T>, formData: FormData): Promise<FormState<T>> =>
    run(formData);
}

/** Field-level message for a given input name, if the server rejected it. */
export function fieldError<T>(state: FormState<T>, name: string): string | undefined {
  if (!state || state.ok) return undefined;
  return state.fields?.[name]?.[0];
}

/** Form-level message: shown only when no field owns the failure. */
export function formError<T>(state: FormState<T>): string | undefined {
  if (!state || state.ok) return undefined;
  if (state.fields && Object.keys(state.fields).length > 0) return undefined;
  return state.message;
}
