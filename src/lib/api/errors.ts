/**
 * Error taxonomy for route handlers and server actions.
 * The `message` on every one of these is safe to show a user. Anything else
 * that is thrown becomes a generic 500 with no detail.
 */

export type ApiErrorCode =
  | 'unauthorized'
  | 'forbidden'
  | 'not_found'
  | 'invalid_input'
  | 'rate_limited'
  | 'conflict'
  | 'internal';

const STATUS_BY_CODE: Record<ApiErrorCode, number> = {
  unauthorized: 401,
  forbidden: 403,
  not_found: 404,
  invalid_input: 400,
  rate_limited: 429,
  conflict: 409,
  internal: 500,
};

export class ApiError extends Error {
  readonly code: ApiErrorCode;
  readonly status: number;
  readonly fieldErrors?: Record<string, string[]>;

  constructor(code: ApiErrorCode, message: string, fieldErrors?: Record<string, string[]>) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.status = STATUS_BY_CODE[code];
    this.fieldErrors = fieldErrors;
  }
}

/**
 * Deliberately identical for "no such row" and "not yours". Distinguishing them
 * turns any [id] route into an existence oracle.
 */
export const notFoundError = () => new ApiError('not_found', 'Not found.');
export const unauthorizedError = () => new ApiError('unauthorized', 'Please sign in and try again.');
export const forbiddenError = () => new ApiError('forbidden', 'Not found.');
export const rateLimitedError = () =>
  new ApiError('rate_limited', 'Too many requests. Please slow down and try again shortly.');
export const invalidInputError = (fieldErrors?: Record<string, string[]>) =>
  new ApiError('invalid_input', 'Please check the highlighted fields.', fieldErrors);
export const internalError = () =>
  new ApiError('internal', 'Something went wrong. Please try again.');
