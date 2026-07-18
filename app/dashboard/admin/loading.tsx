import { Skeleton } from "@/components/ui/skeleton";

export default function AdminLoading() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Skeleton className="h-8 w-64 mb-2" />
        <Skeleton className="h-4 w-96" />
      </div>

      {/* Stats cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="rounded-xl border border-border bg-card p-5">
            <Skeleton className="h-3 w-28 mb-3" />
            <Skeleton className="h-9 w-12" />
          </div>
        ))}
      </div>

      {/* Content area placeholder */}
      <div className="rounded-xl border border-border bg-card p-6">
        <div className="space-y-3">
          <Skeleton className="h-9 w-full max-w-md" />
          <Skeleton className="h-48 w-full" />
        </div>
      </div>
    </div>
  );
}
