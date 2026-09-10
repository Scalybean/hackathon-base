/** The page header pattern: eyebrow rule, title, optional description and actions. */
import * as React from 'react';

export type PageHeaderProps = {
  title: string;
  description?: string;
  actions?: React.ReactNode;
};

export function PageHeader({ title, description, actions }: PageHeaderProps) {
  return (
    <header className="mb-7">
      <div className="rule-accent mb-4 w-full" />
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-3xl">{title}</h1>
          {description ? (
            <p className="mt-1.5 max-w-prose text-sm text-fg-muted">{description}</p>
          ) : null}
        </div>
        {actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
      </div>
    </header>
  );
}
