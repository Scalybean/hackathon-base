/** Settings skeleton. Safe to stream: this page never calls notFound(). */
import { PageSkeleton } from '@/components/app/page-skeleton';

export default function Loading() {
  return <PageSkeleton />;
}
