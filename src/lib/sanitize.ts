/**
 * The only sanitiser in the codebase. If user-supplied content ever needs to
 * be rendered as HTML, it passes through here first and nowhere else.
 * dangerouslySetInnerHTML is banned by lint everywhere except SafeHtml.
 */
import DOMPurify from 'isomorphic-dompurify';

/** Conservative allow-list: formatting and links, no media, no attributes that execute. */
const ALLOWED_TAGS = [
  'a',
  'b',
  'blockquote',
  'br',
  'code',
  'em',
  'h2',
  'h3',
  'h4',
  'i',
  'li',
  'ol',
  'p',
  'pre',
  'strong',
  'ul',
];

const ALLOWED_ATTR = ['href', 'title', 'target', 'rel'];

export function sanitizeHtml(dirty: string): string {
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS,
    ALLOWED_ATTR,
    // Blocks javascript:, data: and vbscript: URLs on href.
    ALLOWED_URI_REGEXP: /^(?:https?:|mailto:|#|\/)/i,
    FORBID_TAGS: ['style', 'script', 'iframe', 'object', 'embed', 'form', 'input'],
    FORBID_ATTR: ['style', 'srcset', 'formaction'],
    RETURN_TRUSTED_TYPE: false,
  });
}

/** Strips every tag. Use when plain text is all you ever wanted. */
export function stripHtml(dirty: string): string {
  return DOMPurify.sanitize(dirty, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] });
}
