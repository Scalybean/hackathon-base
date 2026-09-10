/**
 * The only sanitiser in the codebase. If user-supplied content is ever
 * rendered as HTML it passes through here first and nowhere else.
 * dangerouslySetInnerHTML is banned by lint everywhere except SafeHtml.
 *
 * js-xss rather than DOMPurify: it is a pure-JS allow-list parser with no
 * jsdom dependency, so it behaves identically on the server, in the browser
 * and on every Node version this template supports.
 */
import { FilterXSS } from 'xss';

/** Conservative allow-list: formatting and links. No media, no attributes that execute. */
const ALLOWED: Record<string, string[]> = {
  a: ['href', 'title', 'target', 'rel'],
  b: [],
  blockquote: [],
  br: [],
  code: [],
  em: [],
  h2: [],
  h3: [],
  h4: [],
  i: [],
  li: [],
  ol: [],
  p: [],
  pre: [],
  strong: [],
  ul: [],
};

/** Only these schemes may appear in an href. Blocks javascript:, data:, vbscript:. */
const SAFE_HREF = /^(?:https?:\/\/|mailto:|#|\/)/i;

const sanitizer = new FilterXSS({
  whiteList: ALLOWED,
  // Drop the contents of dangerous tags entirely rather than leaving the text
  // behind: "<script>alert(1)</script>" must not become "alert(1)".
  stripIgnoreTagBody: ['script', 'style', 'iframe', 'object', 'embed', 'form'],
  // Everything not on the allow-list is escaped rather than rendered.
  onIgnoreTag: () => '',
  onTagAttr(tag, name, value) {
    if (tag === 'a' && name === 'href') {
      return SAFE_HREF.test(value) ? `href="${escapeAttr(value)}"` : '';
    }
    if (tag === 'a' && name === 'target') {
      // A target other than _blank has no legitimate use here.
      return value === '_blank' ? 'target="_blank" rel="noopener noreferrer"' : '';
    }
    return undefined;
  },
});

function escapeAttr(value: string): string {
  return value.replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

export function sanitizeHtml(dirty: string): string {
  return sanitizer.process(dirty);
}

const stripper = new FilterXSS({
  whiteList: {},
  stripIgnoreTag: true,
  stripIgnoreTagBody: ['script', 'style'],
});

/** Strips every tag. Use when plain text is all you ever wanted. */
export function stripHtml(dirty: string): string {
  return stripper.process(dirty);
}
