import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { cn } from "@/lib/utils";

type PaginationProps = {
  page: number;
  totalPages: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
  pageSizeOptions?: number[];
  className?: string;
  showJump?: boolean;
};

function range(start: number, end: number) {
  const out: number[] = [];
  for (let i = start; i <= end; i++) out.push(i);
  return out;
}

export function Pagination({
  page,
  totalPages,
  pageSize,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 25, 50, 100],
  className,
  showJump = true
}: PaginationProps) {
  const current = Math.max(1, Math.min(page, totalPages || 1));

  const handlePrev = () => onPageChange(Math.max(1, current - 1));
  const handleNext = () => onPageChange(Math.min(totalPages, current + 1));

  const getVisiblePages = () => {
    if (totalPages <= 7) return range(1, totalPages);
    const pages: (number | string)[] = [];
    pages.push(1);
    if (current > 4) pages.push("...");
    const start = Math.max(2, current - 2);
    const end = Math.min(totalPages - 1, current + 2);
    pages.push(...range(start, end));
    if (current < totalPages - 3) pages.push("...");
    pages.push(totalPages);
    return pages;
  };

  const visible = getVisiblePages();

  return (
    <div className={cn("flex flex-wrap items-center justify-center gap-x-4 gap-y-2", className)}>
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={handlePrev} disabled={current === 1} aria-label="Previous page">
          <ChevronLeft className="h-4 w-4" />
        </Button>

        <nav className="flex items-center gap-1">
          {visible.map((p, idx) =>
            typeof p === "number" ? (
              <Button
                key={p}
                size="sm"
                variant={p === current ? "default" : "ghost"}
                onClick={() => onPageChange(p)}
                className={p === current ? "font-semibold" : ""}
              >
                {p}
              </Button>
            ) : (
              <span key={`sep-${idx}`} className="px-2 text-sm text-muted">{p}</span>
            )
          )}
        </nav>

        <Button variant="outline" size="sm" onClick={handleNext} disabled={current >= totalPages} aria-label="Next page">
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex items-center gap-2">
        <div className="text-sm text-muted">Page</div>
        {showJump && (
          <Input
            type="number"
            min={1}
            max={totalPages}
            value={String(current)}
            onChange={(e) => {
              const v = Number(e.target.value || 1);
              if (!Number.isNaN(v)) onPageChange(Math.max(1, Math.min(totalPages, v)));
            }}
            className="w-20"
          />
        )}
      </div>

      {onPageSizeChange && (
        <div className="flex items-center gap-2">
          <div className="text-sm text-muted">Per page</div>
          <Select
            value={String(pageSize)}
            onValueChange={(v) => onPageSizeChange(Number(v))}
            options={pageSizeOptions.map((s) => ({ value: String(s), label: String(s) }))}
          />
        </div>
      )}
    </div>
  );
}

export default Pagination;
