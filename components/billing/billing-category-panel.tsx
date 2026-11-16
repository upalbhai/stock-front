"use client";

import * as React from "react";
import { Search, Layers, X, FolderTree, Tag } from "lucide-react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useAuth } from "@/components/auth/auth-provider";
import { categoryService } from "@/services/category.service";

type CategoryOption = {
  _id?: string;
  id?: string;
  name: string;
  [k: string]: any;
};

type BillingCategoryPanelProps = {
  selectedCategoryIds: string[];
  onSelectCategory: (id: string | null, option: CategoryOption | null) => void;
};

export function BillingCategoryPanel({
  selectedCategoryIds,
  onSelectCategory,
}: BillingCategoryPanelProps) {
  const { token } = useAuth();

  const [search, setSearch] = React.useState("");
  const [debouncedSearch, setDebouncedSearch] = React.useState("");

  const scrollRef = React.useRef<HTMLDivElement>(null);
  const desktopSentinelRef = React.useRef<HTMLDivElement>(null);
  const mobileSentinelRef = React.useRef<HTMLDivElement>(null);
  const PAGE_SIZE = 30;

  // Debounce search
  React.useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  // Reactive infinite query for categories
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
  } = useInfiniteQuery({
    queryKey: ["categories", "billing-panel", debouncedSearch],
    queryFn: async ({ pageParam = 1 }) => {
      const res = await categoryService.getCategoriesWithMeta(token, {
        flat: "true",
        page: pageParam,
        limit: PAGE_SIZE,
        search: debouncedSearch || undefined,
      });
      return res;
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      const meta = lastPage?.meta?.pagination;
      if (!meta) return undefined;
      return meta.page < meta.totalPages ? meta.page + 1 : undefined;
    },
    staleTime: 5_000,
    refetchOnMount: "always",
    enabled: Boolean(token),
  });

  const categories = React.useMemo(() => {
    if (!data?.pages) return [];
    return data.pages.flatMap((page) => (Array.isArray(page?.data) ? page.data : []));
  }, [data]);

  // Infinite scroll via IntersectionObserver
  React.useEffect(() => {
    const desktopSentinel = desktopSentinelRef.current;
    const mobileSentinel = mobileSentinelRef.current;
    if (!desktopSentinel && !mobileSentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const isIntersecting = entries.some((entry) => entry.isIntersecting);
        if (isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { root: null, rootMargin: "100px" }
    );

    if (desktopSentinel) observer.observe(desktopSentinel);
    if (mobileSentinel) observer.observe(mobileSentinel);

    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const isAllSelected = selectedCategoryIds.length === 0;

  return (
    <>
      {/* ─── DESKTOP: Vertical sidebar panel ─── */}
      <aside className="hidden lg:flex w-[220px] shrink-0 flex-col rounded-xl border border-border/70 bg-card shadow-xs overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border/60 px-3.5 py-2.5 bg-muted/20">
          <div className="flex items-center gap-1.5">
            <FolderTree className="h-4 w-4 text-primary" />
            <span className="text-xs font-bold tracking-tight text-foreground">Categories</span>
          </div>
          {categories.length > 0 && (
            <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
              {categories.length}
            </span>
          )}
        </div>

        {/* Search */}
        <div className="p-2.5 border-b border-border/50">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="h-8.5 pl-8 pr-7 text-xs bg-background/80 rounded-lg border-border/80 focus:border-primary"
              placeholder="Filter categories..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer p-0.5"
                aria-label="Clear category search"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>
        </div>

        {/* Category list */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-1.5 space-y-1 scrollbar-thin">
          {/* All Categories */}
          <button
            type="button"
            onClick={() => onSelectCategory(null, null)}
            className={cn(
              "group relative flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-xs font-semibold rounded-lg transition-all duration-150 cursor-pointer",
              isAllSelected
                ? "bg-primary text-primary-foreground shadow-xs font-bold"
                : "text-foreground/80 hover:bg-muted/80 hover:text-foreground"
            )}
          >
            <div className="flex items-center gap-2 min-w-0">
              <Layers className={cn("h-3.5 w-3.5 shrink-0", isAllSelected ? "text-primary-foreground" : "text-muted-foreground group-hover:text-foreground")} />
              <span className="truncate">All Products</span>
            </div>
            {isAllSelected && (
              <span className="h-1.5 w-1.5 rounded-full bg-primary-foreground" />
            )}
          </button>

          {/* Individual categories */}
          {categories.map((cat) => {
            const catId = cat._id || (cat as any).id || "";
            const isActive = selectedCategoryIds.includes(catId);
            return (
              <button
                key={catId}
                type="button"
                onClick={() =>
                  onSelectCategory(catId, { ...cat, id: catId })
                }
                title={cat.name}
                className={cn(
                  "group relative flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-xs font-medium rounded-lg transition-all duration-150 cursor-pointer",
                  isActive
                    ? "bg-primary text-primary-foreground shadow-xs font-bold"
                    : "text-foreground/80 hover:bg-muted/80 hover:text-foreground"
                )}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <Tag className={cn("h-3 w-3 shrink-0", isActive ? "text-primary-foreground" : "text-muted-foreground/60 group-hover:text-foreground")} />
                  <span className="truncate">{cat.name}</span>
                </div>
                {isActive && (
                  <span className="h-1.5 w-1.5 rounded-full bg-primary-foreground shrink-0" />
                )}
              </button>
            );
          })}

          {/* Loading indicator */}
          {(isLoading || isFetchingNextPage) && (
            <div className="flex justify-center py-3">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            </div>
          )}

          {/* Sentinel for infinite scroll */}
          <div ref={desktopSentinelRef} className="h-1" />

          {/* Empty state */}
          {!isLoading && categories.length === 0 && (
            <div className="px-3 py-6 text-center text-xs text-muted-foreground">
              No categories found
            </div>
          )}
        </div>
      </aside>

      {/* ─── MOBILE/TABLET: Horizontal pill bar ─── */}
      <div className="flex lg:hidden shrink-0 gap-1.5 overflow-x-auto p-1.5 scrollbar-none items-center">
        {/* All pill */}
        <button
          type="button"
          onClick={() => onSelectCategory(null, null)}
          className={cn(
            "shrink-0 rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all duration-150 whitespace-nowrap cursor-pointer",
            isAllSelected
              ? "bg-primary text-primary-foreground shadow-xs"
              : "bg-muted/80 text-foreground/80 border border-border/60 hover:bg-muted hover:text-foreground"
          )}
        >
          All Items
        </button>

        {/* Category pills */}
        {categories.map((cat) => {
          const catId = cat._id || (cat as any).id || "";
          const isActive = selectedCategoryIds.includes(catId);
          return (
            <button
              key={catId}
              type="button"
              onClick={() =>
                onSelectCategory(catId, { ...cat, id: catId })
              }
              className={cn(
                "shrink-0 rounded-full px-3.5 py-1.5 text-xs font-medium transition-all duration-150 whitespace-nowrap cursor-pointer",
                isActive
                  ? "bg-primary text-primary-foreground shadow-xs font-semibold"
                  : "bg-muted/80 text-foreground/80 border border-border/60 hover:bg-muted hover:text-foreground"
              )}
            >
              {cat.name}
            </button>
          );
        })}

        {/* Load more sentinel for mobile */}
        {hasNextPage && <div ref={mobileSentinelRef} className="w-1 shrink-0" />}
      </div>
    </>
  );
}
