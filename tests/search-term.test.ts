/**
 * The search term is the one place user input is concatenated into a PostgREST
 * filter string. PostgREST parses commas, parentheses, dots and quotes as
 * structure, so an unescaped term could rewrite the query to select rows the
 * caller does not own. LIKE wildcards are a smaller problem with the same shape.
 */
import { describe, expect, it } from 'vitest';

import { escapeSearchTerm } from '@/lib/db/notes';

/** The filter string the query helper builds from an escaped term. */
function filterFor(term: string): string {
  const safe = escapeSearchTerm(term);
  return `title.ilike.%${safe}%,body.ilike.%${safe}%`;
}

describe('escapeSearchTerm', () => {
  it('leaves ordinary words alone', () => {
    expect(escapeSearchTerm('shopping list')).toBe('shopping list');
    expect(escapeSearchTerm('  spaced   out  ')).toBe('spaced out');
  });

  it.each([
    ['comma, the filter separator', 'a,b'],
    ['an or() group', 'x),or(user_id.neq.null'],
    ['a quoted value', 'a"b'],
    ['a column path', 'user_id.eq.1'],
    ['a select-all', 'a*b'],
    ['a backslash', 'a\\b'],
    ['a colon', 'a:b'],
  ])('strips %s', (_label, term) => {
    const safe = escapeSearchTerm(term);
    for (const character of [',', '(', ')', '"', '.', '*', '\\', ':']) {
      expect(safe).not.toContain(character);
    }
  });

  it('cannot inject a second filter clause', () => {
    // Without escaping this would close the ilike and add an unrelated filter.
    const filter = filterFor('x,user_id.neq.00000000-0000-0000-0000-000000000000');
    expect(filter.split(',')).toHaveLength(2);
    expect(filter).not.toContain('user_id');
  });

  it('neutralises LIKE wildcards so they cannot match everything', () => {
    expect(escapeSearchTerm('%')).toBe('');
    expect(escapeSearchTerm('_')).toBe('');
    expect(escapeSearchTerm('a%b_c')).toBe('a b c');
  });

  it('returns empty for input that is only punctuation', () => {
    expect(escapeSearchTerm(',,,')).toBe('');
    expect(escapeSearchTerm('   ')).toBe('');
    expect(escapeSearchTerm('')).toBe('');
  });

  it('caps the length so a huge term cannot be used to burn database time', () => {
    expect(escapeSearchTerm('a'.repeat(5000)).length).toBeLessThanOrEqual(100);
  });

  it('keeps letters, digits and accents that people actually search for', () => {
    expect(escapeSearchTerm('café 2026')).toBe('café 2026');
    expect(escapeSearchTerm("O'Brien")).toBe("O'Brien");
    expect(escapeSearchTerm('re-order')).toBe('re-order');
  });
});
