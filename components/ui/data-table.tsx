"use client";

import { cn } from "@/lib/utils";

type Column<T> = {
  key: string;
  header: string;
  render?: (row: T) => React.ReactNode;
  className?: string;
};

type DataTableProps<T> = {
  columns: Column<T>[];
  data: T[];
  keyExtractor: (row: T) => string;
  emptyMessage?: string;
  className?: string;
  loading?: boolean;
};

export function DataTable<T>({ columns, data, keyExtractor, emptyMessage = "No records found.", className, loading }: DataTableProps<T>) {
  if (loading) {
    return (
      <div className="space-y-2">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-12 animate-pulse rounded-2xl bg-border/40" />
        ))}
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-3xl border border-border/60 bg-surface/40 py-16 text-center">
        <p className="text-4xl">📋</p>
        <p className="mt-3 font-medium text-muted">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className={cn("overflow-x-auto rounded-3xl border border-border/60", className)}>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border/60 bg-surface/60">
            {columns.map((col) => (
              <th key={col.key} className={cn("px-4 py-3 text-left font-semibold text-muted", col.className)}>
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border/40">
          {data.map((row) => (
            <tr key={keyExtractor(row)} className="hover:bg-surface/80 transition">
              {columns.map((col) => (
                <td key={col.key} className={cn("px-4 py-3", col.className)}>
                  {col.render
                    ? col.render(row)
                    : String((row as Record<string, unknown>)[col.key] ?? "")}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
