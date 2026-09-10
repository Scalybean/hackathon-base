/**
 * The ONLY component in the app allowed to render HTML. Input is sanitised here
 * and nowhere else. eslint's react/no-danger is disabled for this file alone.
 */
import { sanitizeHtml } from '@/lib/sanitize';

export function SafeHtml({ html, className }: { html: string; className?: string }) {
  return <div className={className} dangerouslySetInnerHTML={{ __html: sanitizeHtml(html) }} />;
}
