import { Skeleton } from "@/components/ui/skeleton";

export default function AgentPerformanceLoading() {
  return (
    <div className="space-y-4 animate-pulse">
      {/* Compact Section Header & Metric Strip Skeleton */}
      <div className="flex flex-col gap-3 rounded-xl border border-border/80 bg-card p-3.5 shadow-2xs">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Skeleton className="h-6 w-60 rounded-md" />
              <Skeleton className="h-5 w-24 rounded-md" />
            </div>
            <Skeleton className="h-3 w-80" />
          </div>
          <Skeleton className="h-8 w-24 rounded-lg" />
        </div>

        {/* Metric Chips Skeleton */}
        <div className="flex flex-wrap items-center gap-2 border-t border-border/60 pt-2.5">
          <Skeleton className="h-8 w-28 rounded-lg" />
          <Skeleton className="h-8 w-36 rounded-lg" />
          <Skeleton className="h-8 w-44 rounded-lg" />
          <Skeleton className="h-8 w-48 rounded-lg ml-auto" />
        </div>
      </div>

      {/* Table Skeleton */}
      <div className="rounded-xl border border-border bg-card overflow-hidden shadow-xs">
        <div className="grid grid-cols-6 gap-4 px-4 py-3 border-b border-border bg-muted/40">
          {["w-36", "w-20", "w-28", "w-32", "w-28", "w-28"].map((w, i) => (
            <Skeleton key={i} className={`h-3.5 ${w}`} />
          ))}
        </div>

        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className="grid grid-cols-6 gap-4 px-4 py-4 border-b border-border/50 last:border-0 items-center"
          >
            <div className="flex items-center gap-3">
              <Skeleton className="h-8 w-8 rounded-lg shrink-0" />
              <div className="space-y-1 min-w-0 flex-1">
                <Skeleton className="h-3.5 w-28" />
                <Skeleton className="h-2.5 w-36" />
              </div>
            </div>
            <Skeleton className="h-6 w-16 rounded-full" />
            <Skeleton className="h-6 w-12 rounded-full ml-auto" />
            <Skeleton className="h-4 w-20 ml-auto" />
            <Skeleton className="h-4 w-20 ml-auto" />
            <Skeleton className="h-4 w-20 ml-auto" />
          </div>
        ))}
      </div>
    </div>
  );
}
