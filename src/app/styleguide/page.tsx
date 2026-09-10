/**
 * Every primitive, every variant, every state, on one page.
 * This is the visual check and the agent's component reference: read this
 * instead of opening component source to find out what exists.
 */
import { Inbox } from 'lucide-react';

import { Breadcrumb } from '@/components/app/breadcrumb';
import { PageHeader } from '@/components/app/page-header';
import { Avatar } from '@/components/ui/avatar';
import { Badge, type BadgeTone } from '@/components/ui/badge';
import { Button, type ButtonVariant } from '@/components/ui/button';
import { Card, CardBody, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { Input, Textarea } from '@/components/ui/input';
import { Field } from '@/components/ui/label';
import { SafeHtml } from '@/components/ui/safe-html';
import { Skeleton } from '@/components/ui/skeleton';
import { TBody, TD, TH, THead, TR, Table } from '@/components/ui/table';

import { DialogDemo, DropdownDemo, ToastDemo } from './demos';

export const metadata = { title: 'Styleguide' };

const BUTTON_VARIANTS: ButtonVariant[] = ['primary', 'secondary', 'ghost', 'danger', 'link'];
const BADGE_TONES: BadgeTone[] = ['neutral', 'accent', 'success', 'warning', 'danger', 'info'];

const SWATCHES = [
  ['bg', 'Page ground'],
  ['bg-raised', 'Cards, inputs'],
  ['bg-sunken', 'Table heads, wells'],
  ['bg-inset', 'Secondary panels'],
  ['accent', 'Clay, the one accent'],
  ['accent-soft', 'Accent tint'],
  ['success', 'Moss'],
  ['warning', 'Amber'],
  ['danger', 'Rust'],
  ['info', 'Slate'],
] as const;

const TYPE_SCALE = [
  ['5xl', 'Display', 'font-display text-5xl'],
  ['4xl', 'Page hero', 'font-display text-4xl'],
  ['3xl', 'Page title', 'font-display text-3xl'],
  ['2xl', 'Section', 'font-display text-2xl'],
  ['xl', 'Subsection', 'font-display text-xl'],
  ['lg', 'Card title', 'text-lg font-semibold'],
  ['base', 'Body', 'text-base'],
  ['sm', 'Secondary', 'text-sm text-fg-muted'],
  ['xs', 'Caption', 'text-xs text-fg-subtle'],
  ['2xs', 'Label', 'text-2xs uppercase tracking-[0.07em] text-fg-subtle'],
] as const;

export default function StyleguidePage() {
  return (
    <div className="mx-auto max-w-4xl px-6 py-12">
      <Breadcrumb items={[{ label: 'Home', href: '/' }, { label: 'Styleguide' }]} />
      <div className="mt-4">
        <PageHeader
          title="Styleguide"
          description="Warm clay and ink. Editorial, grounded, precise. Everything below reads from the tokens in src/styles/tokens.css — change a token here and the whole app moves."
        />
      </div>

      <Section title="Colour" caption="Semantic roles, not raw hues. Components never name a ramp.">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
          {SWATCHES.map(([token, label]) => (
            <div key={token}>
              <div
                className="h-14 rounded-[var(--radius-md)] border border-border"
                style={{ backgroundColor: `var(--${token})` }}
              />
              <p className="mt-1.5 font-mono text-2xs text-fg">--{token}</p>
              <p className="text-2xs text-fg-subtle">{label}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Type" caption="Fraunces for display, Archivo for body, JetBrains Mono for code.">
        <div className="space-y-3">
          {TYPE_SCALE.map(([token, label, className]) => (
            <div key={token} className="flex items-baseline gap-4 border-b border-border pb-3">
              <span className="w-14 shrink-0 font-mono text-2xs text-fg-subtle">{token}</span>
              <span className={className}>{label}</span>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Button" caption="Five variants, four sizes, plus loading and disabled.">
        <div className="space-y-4">
          <Row label="variants">
            {BUTTON_VARIANTS.map((variant) => (
              <Button key={variant} variant={variant}>
                {variant}
              </Button>
            ))}
          </Row>
          <Row label="sizes">
            <Button size="sm">Small</Button>
            <Button size="md">Medium</Button>
            <Button size="lg">Large</Button>
            <Button size="icon" aria-label="Icon">
              <Inbox aria-hidden className="size-4" strokeWidth={1.75} />
            </Button>
          </Row>
          <Row label="states">
            <Button loading>Loading</Button>
            <Button disabled>Disabled</Button>
            <Button variant="secondary" disabled>
              Disabled
            </Button>
          </Row>
        </div>
      </Section>

      <Section title="Input, Textarea, Field" caption="Error state is aria-invalid, never a prop.">
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Default" htmlFor="sg-default" hint="A hint sits here.">
            <Input id="sg-default" placeholder="you@example.com" />
          </Field>
          <Field label="Invalid" htmlFor="sg-invalid" error="Enter a valid email address.">
            <Input id="sg-invalid" defaultValue="not-an-email" aria-invalid />
          </Field>
          <Field label="Disabled" htmlFor="sg-disabled">
            <Input id="sg-disabled" disabled defaultValue="Read only" />
          </Field>
          <Field label="Textarea" htmlFor="sg-textarea">
            <Textarea id="sg-textarea" rows={3} placeholder="Longer text" />
          </Field>
        </div>
      </Section>

      <Section title="Badge" caption="Tones map to the soft token pairs.">
        <Row label="tones">
          {BADGE_TONES.map((tone) => (
            <Badge key={tone} tone={tone}>
              {tone}
            </Badge>
          ))}
        </Row>
      </Section>

      <Section title="Avatar" caption="Falls back to initials on the accent tint.">
        <Row label="sizes">
          <Avatar name="Ada Lovelace" size="sm" />
          <Avatar name="Ada Lovelace" size="md" />
          <Avatar name="Ada Lovelace" size="lg" />
          <Avatar name="Grace" size="md" />
        </Row>
      </Section>

      <Section title="Card">
        <Card>
          <CardHeader>
            <CardTitle>Card title</CardTitle>
            <CardDescription>A description line under the title.</CardDescription>
          </CardHeader>
          <CardBody>
            <p className="text-sm text-fg-muted">
              Body content. Elevation comes from the border and the raised background, not from a
              shadow on everything.
            </p>
          </CardBody>
          <CardFooter>
            <Button variant="secondary" size="sm">
              Cancel
            </Button>
            <Button size="sm">Save</Button>
          </CardFooter>
        </Card>
      </Section>

      <Section title="Table" caption="Rules between rows, tabular figures, no zebra stripes.">
        <div className="overflow-hidden rounded-[var(--radius-lg)] border border-border bg-bg-raised">
          <Table>
            <THead>
              <TR>
                <TH>Name</TH>
                <TH>Role</TH>
                <TH>Rows</TH>
              </TR>
            </THead>
            <TBody>
              <TR>
                <TD className="font-medium">Ada Lovelace</TD>
                <TD>
                  <Badge tone="accent">admin</Badge>
                </TD>
                <TD>1,284</TD>
              </TR>
              <TR>
                <TD className="font-medium">Grace Hopper</TD>
                <TD>
                  <Badge>user</Badge>
                </TD>
                <TD>317</TD>
              </TR>
            </TBody>
          </Table>
        </div>
      </Section>

      <Section title="Dialog, Dropdown, Toast" caption="Radix under the hood; styling is ours.">
        <Row label="overlays">
          <DialogDemo />
          <DropdownDemo />
          <ToastDemo />
        </Row>
      </Section>

      <Section title="Skeleton">
        <div className="space-y-2">
          <Skeleton className="h-7 w-56" />
          <Skeleton className="h-4 w-full max-w-md" />
          <Skeleton className="h-4 w-2/3 max-w-sm" />
        </div>
      </Section>

      <Section title="EmptyState">
        <EmptyState
          icon={Inbox}
          title="Nothing here yet"
          description="One icon, one line, at most one action. Never an emoji."
          action={
            <Button size="sm" variant="secondary">
              Create the first one
            </Button>
          }
        />
      </Section>

      <Section
        title="SafeHtml"
        caption="The only component allowed to render HTML. The script tag below is stripped, not escaped."
      >
        <Card>
          <CardBody>
            <SafeHtml
              className="prose-sm space-y-2 text-sm text-fg-muted [&_a]:text-accent [&_a]:underline"
              html={'<p>Formatting survives: <strong>bold</strong>, <em>italic</em>, <a href="/">a link</a>.</p><script>alert(1)</script><p onclick="alert(1)">Handlers and scripts do not.</p>'}
            />
          </CardBody>
        </Card>
      </Section>
    </div>
  );
}

function Section({
  title,
  caption,
  children,
}: {
  title: string;
  caption?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-14 first:mt-0">
      <h2 className="text-2xl">{title}</h2>
      {caption ? <p className="mt-1 max-w-prose text-sm text-fg-muted">{caption}</p> : null}
      <div className="mt-5">{children}</div>
    </section>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <span className="w-16 shrink-0 font-mono text-2xs text-fg-subtle">{label}</span>
      {children}
    </div>
  );
}
