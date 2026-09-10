/** Breadcrumb. Last entry is the current page and is not a link. */
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';

export type Crumb = { label: string; href?: string };

export function Breadcrumb({ items }: { items: Crumb[] }) {
  return (
    <nav aria-label="Breadcrumb">
      <ol className="flex items-center gap-1.5 text-xs text-fg-subtle">
        {items.map((item, index) => (
          <li key={item.label} className="flex items-center gap-1.5">
            {index > 0 ? <ChevronRight aria-hidden className="size-3" /> : null}
            {item.href ? (
              <Link href={item.href} className="hover:text-fg">
                {item.label}
              </Link>
            ) : (
              <span aria-current="page" className="text-fg-muted">
                {item.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
