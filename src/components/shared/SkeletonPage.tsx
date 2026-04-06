import { Skeleton } from '@/components/ui/skeleton';

export function SkeletonPage() {
  return (
    <div className="flex min-h-screen flex-col" aria-busy="true" aria-label="Loading page">
      {/* Top bar skeleton */}
      <div className="h-14 border-b border-neutral-200 bg-white px-4">
        <div className="flex h-full items-center gap-3">
          <Skeleton className="h-8 w-8 rounded-lg" />
          <Skeleton className="h-5 w-32" />
          <div className="ml-auto">
            <Skeleton className="h-8 w-8 rounded-full" />
          </div>
        </div>
      </div>

      {/* Page header skeleton */}
      <div className="px-4 py-6">
        <Skeleton className="h-7 w-48" />
        <Skeleton className="mt-2 h-4 w-64" />
      </div>

      {/* Skeleton cards */}
      <div className="flex flex-col gap-4 px-4">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="rounded-card bg-white p-4 shadow-card"
          >
            <Skeleton className="h-6 w-24" />
            <Skeleton className="mt-3 h-4 w-full" />
            <Skeleton className="mt-2 h-4 w-3/4" />
          </div>
        ))}
      </div>
    </div>
  );
}
