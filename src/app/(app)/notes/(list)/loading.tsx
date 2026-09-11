/** Notes list skeleton. Scoped to the (list) group so /notes/[id] still 404s. */
import { PageSkeleton } from '@/components/app/page-skeleton';

export default function Loading() {
  return <PageSkeleton />;
}
