import { Skeleton } from "@/components/ui/skeleton";

export default function AdminBusinessesLoading() {
  return (
    <div className="space-y-4">
      {/* Stats skeleton - matches the 3 stats cards in admin layout */}
      <div className="grid gap-4 sm:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="rounded-xl border border-border bg-card p-4">
            <Skeleton className="h-3 w-24 mb-3" />
            <Skeleton className="h-8 w-16" />
          </div>
        ))}
      </div>

      {/* DataTable skeleton */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        {/* Search bar */}
        <div className="flex items-center gap-4 p-4 border-b border-border bg-muted">
          <Skeleton className="h-9 flex-1 max-w-sm" />
          <Skeleton className="h-9 w-36" />
          <Skeleton className="h-9 w-20" />
        </div>

        {/* Table header */}
        <div className="grid grid-cols-6 gap-4 px-4 py-3 border-b border-border">
          {["w-24", "w-20", "w-20", "w-28", "w-16", "w-20"].map((w, i) => (
            <Skeleton key={i} className={`h-3 ${w}`} />
          ))}
        </div>

        {/* Table rows */}
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="grid grid-cols-6 gap-4 px-4 py-4 border-b border-border/50 last:border-0">
            <div className="space-y-1.5">
              <Skeleton className="h-3.5 w-28" />
              <Skeleton className="h-2.5 w-36" />
            </div>
            <div className="space-y-1.5">
              <Skeleton className="h-3.5 w-16" />
              <Skeleton className="h-2.5 w-28" />
            </div>
            <Skeleton className="h-3 w-20 self-center" />
            <div className="flex gap-1.5 self-center">
              <Skeleton className="h-5 w-14 rounded-full" />
              <Skeleton className="h-5 w-12 rounded-full" />
            </div>
            <Skeleton className="h-5 w-14 rounded-full self-center" />
            <Skeleton className="h-7 w-7 rounded-md self-center ml-auto" />
          </div>
        ))}

        {/* Pagination footer */}
        <div className="flex items-center justify-between p-4 border-t border-border bg-muted">
          <Skeleton className="h-3 w-32" />
          <div className="flex items-center gap-2">
            <Skeleton className="h-8 w-8" />
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-8 w-8" />
          </div>
        </div>
      </div>
    </div>
  );
}
