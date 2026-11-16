import { Skeleton } from "@/components/ui/skeleton";

export default function AdminUsersLoading() {
  return (
    <div className="space-y-4 animate-pulse">
      {/* Compact Section Header & Metric Strip Skeleton */}
      <div className="flex flex-col gap-3 rounded-xl border border-border/80 bg-card p-3.5 shadow-2xs">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Skeleton className="h-6 w-44 rounded-md" />
              <Skeleton className="h-5 w-20 rounded-md" />
            </div>
            <Skeleton className="h-3 w-80" />
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-8 w-24 rounded-lg" />
            <Skeleton className="h-8 w-32 rounded-lg" />
            <Skeleton className="h-8 w-36 rounded-lg" />
          </div>
        </div>

        {/* Metric Chips Skeleton */}
        <div className="flex flex-wrap items-center gap-2 border-t border-border/60 pt-2.5">
          <Skeleton className="h-8 w-28 rounded-lg" />
          <Skeleton className="h-8 w-28 rounded-lg" />
          <Skeleton className="h-8 w-32 rounded-lg" />
          <Skeleton className="h-8 w-36 rounded-lg" />
        </div>
      </div>

      {/* DataTable Skeleton */}
      <div className="rounded-xl border border-border bg-card overflow-hidden shadow-xs">
        {/* Search & Filter Toolbar */}
        <div className="flex flex-col gap-3 p-4 border-b border-border bg-muted/30 sm:flex-row sm:items-center sm:justify-between">
          <Skeleton className="h-9 w-full sm:w-72 rounded-lg" />
          <div className="flex items-center gap-2">
            <Skeleton className="h-9 w-24 rounded-lg" />
          </div>
        </div>

        {/* Table Header */}
        <div className="grid grid-cols-5 gap-4 px-4 py-3 border-b border-border bg-muted/40">
          {["w-32", "w-24", "w-28", "w-16", "w-20"].map((w, i) => (
            <Skeleton key={i} className={`h-3.5 ${w}`} />
          ))}
        </div>

        {/* Table Rows */}
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="grid grid-cols-5 gap-4 px-4 py-4 border-b border-border/50 last:border-0 items-center">
            <div className="flex items-center gap-3">
              <Skeleton className="h-10 w-10 rounded-xl shrink-0" />
              <div className="space-y-1.5 min-w-0 flex-1">
                <Skeleton className="h-3.5 w-32" />
                <Skeleton className="h-2.5 w-40" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Skeleton className="h-5 w-20 rounded-md" />
              <Skeleton className="h-2.5 w-16" />
            </div>
            <Skeleton className="h-3.5 w-28" />
            <Skeleton className="h-6 w-16 rounded-full" />
            <div className="flex justify-end gap-2">
              <Skeleton className="h-8 w-20 rounded-lg" />
              <Skeleton className="h-8 w-16 rounded-lg" />
            </div>
          </div>
        ))}

        {/* Pagination Footer */}
        <div className="flex items-center justify-between p-4 border-t border-border bg-muted/20">
          <Skeleton className="h-3.5 w-36" />
          <div className="flex items-center gap-2">
            <Skeleton className="h-8 w-8 rounded-lg" />
            <Skeleton className="h-3.5 w-20" />
            <Skeleton className="h-8 w-8 rounded-lg" />
          </div>
        </div>
      </div>
    </div>
  );
}
