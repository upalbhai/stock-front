"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, RefreshCw, ChevronLeft, ChevronRight, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ColumnDef<T> {
  header: React.ReactNode | string;
  id?: string;
  key?: string; // Legacy compatibility
  accessorKey?: keyof T;
  render?: (row: T) => React.ReactNode;
  className?: string; // Legacy compatibility
}

export interface DataTableProps<T> {
  columns: ColumnDef<T>[];
  data: T[];

  // Legacy compatibility props
  loading?: boolean;
  keyExtractor?: (row: T) => string;
  emptyMessage?: string;
  className?: string;
  error?: boolean;
  errorMessage?: string;

  // New features props
  isLoading?: boolean;
  totalItems?: number;
  page?: number;
  limit?: number;
  onPageChange?: (page: number) => void;
  searchQuery?: string;
  onSearchChange?: (search: string) => void;
  onLimitChange?: (limit: number) => void;
  onRefetch?: () => void;
  refetchIntervalSeconds?: number;
  placeholderText?: string;
  emptyStateText?: string;
  emptyStateIcon?: string | React.ReactNode;
  hidePagination?: boolean;
  onRowClick?: (row: T) => void;
  filters?: React.ReactNode;
  headerActions?: React.ReactNode;
  renderSubComponent?: (row: T) => React.ReactNode;
  expandable?: boolean;
  title?: string;
  description?: string;
}

export function DataTable<T>({
  columns,
  data = [],
  loading,
  keyExtractor,
  emptyMessage = "No records found.",
  className,
  error,
  errorMessage,

  isLoading: newIsLoading,
  totalItems = data.length,
  page = 1,
  limit = 10,
  onPageChange,
  onLimitChange,
  searchQuery = "",
  onSearchChange,
  onRefetch,
  refetchIntervalSeconds = 15,
  placeholderText = "Search...",
  emptyStateText,
  emptyStateIcon = "📋", // Default legacy icon
  hidePagination: newHidePagination,
  onRowClick,
  filters,
  headerActions,
  renderSubComponent,
  expandable = false,
  title,
  description,
}: DataTableProps<T>) {
  // Normalize legacy props
  const finalIsLoading = newIsLoading ?? loading;
  const finalEmptyText = emptyStateText ?? emptyMessage;
  const finalHidePagination = newHidePagination ?? (!onPageChange);

  const [localSearch, setLocalSearch] = useState(searchQuery);
  const [countdown, setCountdown] = useState(0);
  const [expandedRows, setExpandedRows] = useState<Set<string | number>>(new Set());
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setLocalSearch(searchQuery);
  }, [searchQuery]);

  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setInterval(() => setCountdown((prev) => prev - 1), 1000);
    return () => clearInterval(timer);
  }, [countdown]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setLocalSearch(val);
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    debounceTimerRef.current = setTimeout(() => {
      onSearchChange?.(val);
      onPageChange?.(1);
    }, 400);
  };

  const handleManualRefetch = () => {
    onRefetch?.();
    setCountdown(refetchIntervalSeconds);
  };

  const toggleRow = (e: React.MouseEvent, key: string | number) => {
    e.stopPropagation();
    setExpandedRows(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const totalPages = Math.max(1, Math.ceil(totalItems / limit));

  // Legacy error state
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-danger/40 bg-danger/5 py-16 text-center">
        <p className="text-4xl">⚠️</p>
        <p className="mt-3 font-medium text-danger">{errorMessage || "Failed to load data."}</p>
      </div>
    );
  }

  // Determine if header with search/refetch should be shown
  const showTopBar = title || description || onSearchChange || onRefetch || filters || headerActions;

  return (
    <div className={cn("w-full bg-card border border-border rounded-xl overflow-hidden shadow-sm", className)}>
      {/* Top Header Bar */}
      {showTopBar && (
        <div className="p-3 sm:p-4 border-b border-border bg-surface/30 space-y-3">
          {/* Header Row: Title / Description and Refetch/Actions (if no search/filters) */}
          {(title || description || (!onSearchChange && !filters && (onRefetch || headerActions))) && (
            <div className="flex items-center justify-between gap-4">
              <div className="min-w-0">
                {title && <h3 className="text-sm font-semibold tracking-tight text-foreground">{title}</h3>}
                {description && <p className="text-[11px] text-muted-foreground mt-0.5">{description}</p>}
              </div>
              {/* Actions align to right when no search/filters exist */}
              {!onSearchChange && !filters && (onRefetch || headerActions) && (
                <div className="flex items-center gap-2 shrink-0">
                  {headerActions}
                  {onRefetch && (
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={handleManualRefetch}
                      disabled={finalIsLoading || countdown > 0}
                      className="h-8 w-8 active:scale-[0.96] disabled:opacity-50 disabled:cursor-not-allowed"
                      title={countdown > 0 ? `Refetch (${countdown}s)` : "Refetch list"}
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${finalIsLoading ? "animate-spin" : ""}`} />
                    </Button>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Search & Actions Row (only if search/filters exist) */}
          {(onSearchChange || filters) && (
            <div className={cn("flex gap-2.5 sm:items-center justify-between", filters ? "flex-col sm:flex-row" : "flex-row")}>
              {/* Row 1 on Mobile / Left Group on Desktop: Search & Mobile Refetch */}
              <div className="flex items-center gap-2 flex-grow min-w-0">
                {onSearchChange && (
                  <div className="relative flex-grow min-w-0">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4 pointer-events-none" />
                    <Input
                      className="pl-9 h-9 text-sm bg-background border-border focus-visible:ring-offset-0 w-full"
                      placeholder={placeholderText}
                      value={localSearch}
                      onChange={handleSearchChange}
                    />
                  </div>
                )}
                {/* Mobile-only refetch: inline next to search input when filters are present */}
                {filters && (onRefetch || headerActions) && (
                  <div className="flex items-center gap-2 shrink-0 sm:hidden">
                    {headerActions}
                    {onRefetch && (
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={handleManualRefetch}
                        disabled={finalIsLoading || countdown > 0}
                        className="h-9 w-9 active:scale-[0.96] disabled:opacity-50 disabled:cursor-not-allowed"
                        title={countdown > 0 ? `Refetch (${countdown}s)` : "Refetch list"}
                      >
                        <RefreshCw className={`w-4 h-4 ${finalIsLoading ? "animate-spin" : ""}`} />
                      </Button>
                    )}
                  </div>
                )}
              </div>

              {/* Row 2 on Mobile: Filters & Desktop Refetch */}
              <div className={cn("flex items-center justify-between sm:justify-start gap-2 sm:w-auto", filters ? "w-full" : "w-auto")}>
                {filters && <div className="flex-1 sm:flex-initial">{filters}</div>}

                {/* Desktop/Tablet refetch, or if no filters exist (always inline) */}
                {(onRefetch || headerActions) && (
                  <div className={cn("items-center gap-2 shrink-0", filters ? "hidden sm:flex" : "flex")}>
                    {headerActions}
                    {onRefetch && (
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={handleManualRefetch}
                        disabled={finalIsLoading || countdown > 0}
                        className="h-9 w-9 active:scale-[0.96] disabled:opacity-50 disabled:cursor-not-allowed"
                        title={countdown > 0 ? `Refetch (${countdown}s)` : "Refetch list"}
                      >
                        <RefreshCw className={`w-4 h-4 ${finalIsLoading ? "animate-spin" : ""}`} />
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Table Content */}
      <div className="overflow-x-auto w-full">
        <Table>
          <TableHeader className="bg-surface/60">
            <TableRow className="border-border/60 hover:bg-transparent">
              {expandable && <TableHead className="w-10 px-2" />}
              {columns.map((col, idx) => {
                const cellKey = col.key || col.id || col.accessorKey?.toString() || idx.toString();
                return (
                  <TableHead key={cellKey} className={cn("font-semibold text-muted", col.className)}>
                    {col.header}
                  </TableHead>
                );
              })}
            </TableRow>
          </TableHeader>
          <TableBody className="divide-y divide-border/40">
            {finalIsLoading ? (
              <TableRow className="border-border/60">
                <TableCell colSpan={expandable ? columns.length + 1 : columns.length} className="text-center py-16 text-muted-foreground">
                  <div className="flex flex-col items-center gap-3">
                    <RefreshCw className="w-8 h-8 animate-spin text-muted" />
                    <span className="text-sm font-medium">Loading data...</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : data.length === 0 ? (
              <TableRow className="border-border/60">
                <TableCell colSpan={expandable ? columns.length + 1 : columns.length} className="text-center py-16 text-muted-foreground">
                  <div className="flex flex-col items-center justify-center gap-3">
                    {typeof emptyStateIcon === "string" ? (
                      <span className="text-4xl">{emptyStateIcon}</span>
                    ) : (
                      emptyStateIcon
                    )}
                    <span className="text-sm font-medium">{finalEmptyText}</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              data.map((row, rowIdx) => {
                const rowKey = keyExtractor ? keyExtractor(row) : rowIdx;
                const isExpanded = expandedRows.has(rowKey);
                return (
                  <React.Fragment key={rowKey}>
                    <TableRow
                      className={cn("border-border/60 hover:bg-surface/80 transition-colors", onRowClick && "cursor-pointer")}
                      onClick={() => onRowClick?.(row)}
                    >
                      {expandable && (
                        <TableCell className="w-10 px-2 py-3 text-center">
                          {renderSubComponent && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className={cn("h-6 w-6 text-muted hover:text-foreground transition-transform", isExpanded && "rotate-180")}
                              onClick={(e) => toggleRow(e, rowKey)}
                            >
                              <ChevronDown className="h-4 w-4" />
                            </Button>
                          )}
                        </TableCell>
                      )}
                      {columns.map((col, colIdx) => {
                        const cellKey = col.key || col.id || col.accessorKey?.toString() || colIdx.toString();
                        return (
                          <TableCell key={cellKey} className={cn("py-3", col.className)}>
                            {col.render
                              ? col.render(row)
                              : col.accessorKey
                                ? String((row as Record<string, unknown>)[col.accessorKey as string] ?? "")
                                : col.key
                                  ? String((row as Record<string, unknown>)[col.key] ?? "")
                                  : null}
                          </TableCell>
                        );
                      })}
                    </TableRow>
                    {renderSubComponent && isExpanded && (
                      <TableRow className="border-none bg-surface/30 hover:bg-surface/30">
                        <TableCell colSpan={expandable ? columns.length + 1 : columns.length} className="p-0 border-b border-border/60">
                          {renderSubComponent(row)}
                        </TableCell>
                      </TableRow>
                    )}
                  </React.Fragment>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination Footer */}
      {!finalHidePagination && (
        <div className="flex items-center justify-between p-3 sm:p-4 border-t border-border bg-surface/30 gap-3 text-xs">
          {/* Left: Entry count + page size (page size hidden on mobile) */}
          <div className="text-muted-foreground flex items-center gap-3 min-w-0">
            <span className="whitespace-nowrap">
              <span className="font-semibold text-foreground">{data.length}</span>
              <span className="hidden sm:inline"> of <span className="font-semibold text-foreground">{totalItems}</span></span>
              {" "}entries
            </span>
            {onLimitChange && (
              <div className="hidden sm:flex items-center gap-1.5">
                <span>·</span>
                <select
                  value={limit}
                  onChange={(e) => {
                    onLimitChange(Number(e.target.value));
                    onPageChange?.(1);
                  }}
                  className="px-1.5 py-0.5 rounded-md border border-border bg-background text-foreground text-xs outline-none focus:border-ring transition cursor-pointer"
                >
                  {[10, 25, 50, 100].map((v) => (
                    <option key={v} value={v}>{v}/page</option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Right: Prev/Next + page indicator */}
          <div className="flex items-center gap-1.5 shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange?.(page - 1)}
              disabled={page <= 1 || finalIsLoading}
              className="border-border hover:bg-accent disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer h-7 w-7 p-0"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <div className="px-2 py-1 font-medium text-muted-foreground select-none whitespace-nowrap">
              <span className="text-foreground">{page}</span>/<span className="text-foreground">{totalPages}</span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange?.(page + 1)}
              disabled={page >= totalPages || finalIsLoading}
              className="border-border hover:bg-accent disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer h-7 w-7 p-0"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
