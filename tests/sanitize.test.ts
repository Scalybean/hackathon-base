/** The sanitiser is the only thing between user HTML and the DOM. Prove it. */
import { describe, expect, it } from 'vitest';

import { sanitizeHtml, stripHtml } from '@/lib/sanitize';

describe('sanitizeHtml', () => {
  it('keeps the allowed formatting tags', () => {
    const html = '<p>Hello <strong>world</strong> and <em>friends</em></p>';
    expect(sanitizeHtml(html)).toBe(html);
  });

  it('removes script tags and their contents', () => {
    const result = sanitizeHtml('<p>ok</p><script>alert(1)</script>');
    expect(result).not.toContain('script');
    expect(result).not.toContain('alert(1)');
  });

  it.each([
    '<img src=x onerror=alert(1)>',
    '<svg/onload=alert(1)>',
    '<iframe src="https://evil.example"></iframe>',
    '<body onload=alert(1)>',
    '<div style="background:url(javascript:alert(1))">x</div>',
    '<form action="https://evil.example"><input name="p"></form>',
    '<math><mtext><table><mglyph><style><img src=x onerror=alert(1)>',
  ])('neutralises %s', (payload) => {
    const result = sanitizeHtml(payload);
    expect(result).not.toMatch(/<(script|iframe|img|svg|form|style|input)\b/i);
    expect(result).not.toMatch(/on[a-z]+\s*=/i);
  });

  it.each([
    'javascript:alert(1)',
    'JaVaScRiPt:alert(1)',
    'data:text/html;base64,PHNjcmlwdD5hbGVydCgxKTwvc2NyaXB0Pg==',
    'vbscript:msgbox(1)',
  ])('drops the href %s', (href) => {
    const result = sanitizeHtml(`<a href="${href}">click</a>`);
    expect(result).not.toContain('href=');
  });

  it('keeps safe hrefs', () => {
    expect(sanitizeHtml('<a href="https://example.com">x</a>')).toContain('href="https://example.com"');
    expect(sanitizeHtml('<a href="/notes">x</a>')).toContain('href="/notes"');
    expect(sanitizeHtml('<a href="mailto:a@b.com">x</a>')).toContain('href="mailto:a@b.com"');
  });

  it('adds noopener to target=_blank', () => {
    expect(sanitizeHtml('<a href="https://example.com" target="_blank">x</a>')).toContain(
      'rel="noopener noreferrer"',
    );
  });
});

describe('stripHtml', () => {
  it('removes every tag but keeps visible text', () => {
    expect(stripHtml('<p>Hello <b>world</b></p>')).toBe('Hello world');
  });

  it('does not leave script contents behind as text', () => {
    expect(stripHtml('<script>alert(1)</script>safe')).not.toContain('alert(1)');
  });
});
