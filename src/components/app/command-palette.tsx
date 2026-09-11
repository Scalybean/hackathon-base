/**
 * Command palette. One shortcut that searches your notes and jumps anywhere.
 * Hand-rolled rather than pulling in a combobox library: it is a list, an
 * input and four key handlers, and the template stays one dependency lighter.
 */
'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { CornerDownLeft, FileText, Loader2, Search, SearchX } from 'lucide-react';

import { searchNotesAction } from '@/app/(app)/notes/actions';
import { ADMIN, MAIN, type NavItem } from '@/components/app/nav-items';
import { cn } from '@/lib/cn';
import type { Note } from '@/lib/db/notes';

/** Long enough that holding a key down cannot outrun the read rate limit. */
const DEBOUNCE_MS = 250;
const MIN_TERM = 2;

type Item =
  | { kind: 'page'; id: string; label: string; href: string; icon: NavItem['icon'] }
  | { kind: 'note'; id: string; label: string; href: string; hint: string };

export function CommandPalette({ isAdmin }: { isAdmin: boolean }) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState('');
  const [notes, setNotes] = React.useState<Note[]>([]);
  const [searching, setSearching] = React.useState(false);
  const [limited, setLimited] = React.useState(false);
  const [active, setActive] = React.useState(0);

  const pages = React.useMemo<Item[]>(() => {
    const source = isAdmin ? [...MAIN, ...ADMIN] : MAIN;
    return source.map((item) => ({
      kind: 'page',
      id: `page:${item.href}`,
      label: item.label,
      href: item.href,
      icon: item.icon,
    }));
  }, [isAdmin]);

  const items = React.useMemo<Item[]>(() => {
    const term = query.trim().toLowerCase();
    const matchingPages = term
      ? pages.filter((page) => page.label.toLowerCase().includes(term))
      : pages;

    const noteItems: Item[] = notes.map((note) => ({
      kind: 'note',
      id: `note:${note.id}`,
      label: note.title,
      href: `/notes/${note.id}`,
      hint: note.body.slice(0, 80),
    }));

    return [...matchingPages, ...noteItems];
  }, [pages, notes, query]);

  // ⌘K / Ctrl+K from anywhere.
  React.useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key.toLowerCase() === 'k' && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        setOpen((current) => !current);
      }
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  /**
   * Everything that reacts to typing is set here rather than in the effect
   * below: a synchronous setState inside an effect body causes a cascading
   * render, and react-hooks/set-state-in-effect rightly refuses it.
   */
  function onQueryChange(value: string) {
    setQuery(value);
    setActive(0);

    if (value.trim().length < MIN_TERM) {
      setNotes([]);
      setSearching(false);
      setLimited(false);
    } else {
      setSearching(true);
    }
  }

  // Debounced search. The abort flag stops a slow response overwriting a newer one.
  React.useEffect(() => {
    const term = query.trim();
    if (term.length < MIN_TERM) return;

    let cancelled = false;

    const timer = setTimeout(async () => {
      const result = await searchNotesAction({ term });
      if (cancelled) return;

      setSearching(false);
      if (result.ok) {
        setNotes(result.data);
        setLimited(false);
      } else {
        setNotes([]);
        setLimited(result.code === 'rate_limited');
      }
    }, DEBOUNCE_MS);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [query]);

  // Clamped rather than reset by an effect, so a shrinking list cannot leave
  // the highlight pointing past the end.
  const activeIndex = items.length === 0 ? 0 : Math.min(active, items.length - 1);

  function reset() {
    setQuery('');
    setNotes([]);
    setActive(0);
    setLimited(false);
  }

  function go(item: Item) {
    setOpen(false);
    reset();
    router.push(item.href);
  }

  function onInputKeyDown(event: React.KeyboardEvent) {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActive((current) => (items.length === 0 ? 0 : (current + 1) % items.length));
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActive((current) => (items.length === 0 ? 0 : (current - 1 + items.length) % items.length));
    } else if (event.key === 'Enter') {
      event.preventDefault();
      const item = items[activeIndex];
      if (item) go(item);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn(
          'flex items-center gap-2 rounded-[var(--radius-md)] border border-border-strong',
          'bg-bg-raised px-2.5 py-1.5 text-xs text-fg-subtle',
          'hover:border-[var(--fg-subtle)] hover:text-fg-muted',
        )}
      >
        <Search aria-hidden className="size-3.5" strokeWidth={1.75} />
        <span className="hidden sm:inline">Search</span>
        <kbd className="hidden rounded border border-border bg-bg-inset px-1 font-mono text-2xs sm:inline">
          ⌘K
        </kbd>
      </button>

      <DialogPrimitive.Root
        open={open}
        onOpenChange={(next) => {
          setOpen(next);
          if (!next) reset();
        }}
      >
        <DialogPrimitive.Portal>
          <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-[rgb(26_23_20_/_0.45)] backdrop-blur-[2px]" />
          <DialogPrimitive.Content
            aria-label="Search"
            className={cn(
              'fixed left-1/2 top-[12vh] z-50 w-[calc(100vw-2rem)] max-w-lg -translate-x-1/2',
              'overflow-hidden rounded-[var(--radius-lg)] border border-border bg-bg-raised',
              'shadow-[var(--shadow-lg)] focus:outline-none',
            )}
          >
            <DialogPrimitive.Title className="sr-only">Search</DialogPrimitive.Title>

            <div className="flex items-center gap-2.5 border-b border-border px-4">
              {searching ? (
                <Loader2 aria-hidden className="size-4 animate-spin text-fg-subtle" />
              ) : (
                <Search aria-hidden className="size-4 text-fg-subtle" strokeWidth={1.75} />
              )}
              <input
                autoFocus
                value={query}
                onChange={(event) => onQueryChange(event.target.value)}
                onKeyDown={onInputKeyDown}
                placeholder="Search notes, or jump to a page"
                aria-label="Search notes, or jump to a page"
                className="h-12 flex-1 bg-transparent text-sm text-fg outline-none placeholder:text-fg-subtle"
              />
            </div>

            <ul className="max-h-[min(24rem,60vh)] overflow-y-auto p-1.5">
              {items.map((item, index) => (
                <li key={item.id}>
                  <Link
                    href={item.href}
                    onClick={() => {
                      setOpen(false);
                      reset();
                    }}
                    onMouseEnter={() => setActive(index)}
                    aria-current={index === activeIndex ? 'true' : undefined}
                    className={cn(
                      'flex items-center gap-2.5 rounded-[var(--radius-sm)] px-2.5 py-2 text-sm',
                      index === activeIndex ? 'bg-bg-hover text-fg' : 'text-fg-muted',
                    )}
                  >
                    {item.kind === 'page' ? (
                      <item.icon aria-hidden className="size-4 shrink-0 text-fg-subtle" strokeWidth={1.75} />
                    ) : (
                      <FileText aria-hidden className="size-4 shrink-0 text-fg-subtle" strokeWidth={1.75} />
                    )}
                    <span className="min-w-0 flex-1 truncate">{item.label}</span>
                    {item.kind === 'note' && item.hint ? (
                      <span className="hidden min-w-0 max-w-[45%] truncate text-xs text-fg-subtle sm:block">
                        {item.hint}
                      </span>
                    ) : null}
                    {index === activeIndex ? (
                      <CornerDownLeft aria-hidden className="size-3 shrink-0 text-fg-subtle" />
                    ) : null}
                  </Link>
                </li>
              ))}

              {items.length === 0 ? (
                <li className="flex items-center gap-2.5 px-2.5 py-6 text-sm text-fg-subtle">
                  <SearchX aria-hidden className="size-4" strokeWidth={1.75} />
                  {limited
                    ? 'Too many searches just now. Try again in a moment.'
                    : query.trim().length < MIN_TERM
                      ? 'Keep typing to search your notes.'
                      : `Nothing matches "${query.trim()}".`}
                </li>
              ) : null}
            </ul>
          </DialogPrimitive.Content>
        </DialogPrimitive.Portal>
      </DialogPrimitive.Root>
    </>
  );
}
