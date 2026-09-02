import { Skeleton } from "@edn/site-themes/components/ui/skeleton";

/**
 * The studio's loading state. Shaped like the gallery it precedes, so the page
 * settles into place rather than jumping.
 */
export default function StudioLoading() {
  return (
    <div className="mx-auto w-full max-w-360 px-6 py-10">
      <Skeleton className="h-3 w-28" />
      <Skeleton className="mt-3 h-7 w-96 max-w-full" />
      <Skeleton className="mt-3 h-4 w-full max-w-2xl" />

      <Skeleton className="mt-8 h-9 w-48" />

      <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, index) => (
          <div key={index} className="overflow-hidden rounded-xl border">
            <Skeleton className="aspect-16/10 rounded-none" />
            <div className="space-y-2 p-4">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
              <Skeleton className="mt-3 h-8 w-full" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
