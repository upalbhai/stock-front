"use client";

import * as React from "react";
import { Search, Layers, X } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
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
  const qc = useQueryClient();

  const [search, setSearch] = React.useState("");
  const [debouncedSearch, setDebouncedSearch] = React.useState("");
  const [categories, setCategories] = React.useState<CategoryOption[]>([]);
  const [page, setPage] = React.useState(1);
  const [hasMore, setHasMore] = React.useState(true);
  const [loading, setLoading] = React.useState(false);
  const [initialLoaded, setInitialLoaded] = React.useState(false);

  const scrollRef = React.useRef<HTMLDivElement>(null);
  const desktopSentinelRef = React.useRef<HTMLDivElement>(null);
  const mobileSentinelRef = React.useRef<HTMLDivElement>(null);
  const PAGE_SIZE = 30;

  // Debounce search
  React.useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  // Reset list when search changes
  React.useEffect(() => {
    setCategories([]);
    setPage(1);
    setHasMore(true);
    setInitialLoaded(false);
  }, [debouncedSearch]);

  // Fetch categories
  const fetchCategories = React.useCallback(
    async (pageNum: number) => {
      if (loading) return;
      setLoading(true);
      try {
        const res = await qc.fetchQuery({
          queryKey: ["categories", "billing-panel", pageNum, PAGE_SIZE, debouncedSearch],
          queryFn: () =>
            categoryService.getCategoriesWithMeta(token, {
              flat: "true",
              page: pageNum,
              limit: PAGE_SIZE,
              search: debouncedSearch || undefined,
            }),
          staleTime: 1000 * 60 * 5,
        });

        // res.data is a flat Category[] when flat=true is passed
        const rawData = res.data;
        const newItems: CategoryOption[] = Array.isArray(rawData) ? rawData : [];
        const meta = res.meta?.pagination;
        const totalPages = meta?.totalPages || 1;

        setCategories((prev) => (pageNum === 1 ? newItems : [...prev, ...newItems]));
        setHasMore(pageNum < totalPages);
        setPage(pageNum);
        setInitialLoaded(true);
      } catch (err) {
        console.error("Failed to load categories", err);
      } finally {
        setLoading(false);
      }
    },
    [loading, debouncedSearch, token, qc]
  );

  // Load first page
  React.useEffect(() => {
    if (!initialLoaded) {
      fetchCategories(1);
    }
  }, [initialLoaded, fetchCategories]);

  // Infinite scroll via IntersectionObserver
  React.useEffect(() => {
    const desktopSentinel = desktopSentinelRef.current;
    const mobileSentinel = mobileSentinelRef.current;
    if (!desktopSentinel && !mobileSentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const isIntersecting = entries.some((entry) => entry.isIntersecting);
        if (isIntersecting && hasMore && !loading) {
          fetchCategories(page + 1);
        }
      },
      { root: null, rootMargin: "100px" } // Use viewport as root for both mobile and desktop
    );

    if (desktopSentinel) observer.observe(desktopSentinel);
    if (mobileSentinel) observer.observe(mobileSentinel);

    return () => observer.disconnect();
  }, [hasMore, loading, page, fetchCategories]);

  const isAllSelected = selectedCategoryIds.length === 0;

  return (
    <>
      {/* ─── DESKTOP: Vertical sidebar panel ─── */}
      <div className="hidden lg:flex w-[210px] shrink-0 flex-col rounded-lg border border-border bg-card shadow-sm overflow-hidden">
        {/* Search */}
        <div className="p-3 border-b border-border/50">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="h-8 pl-8 pr-7 text-xs"
              placeholder="Search categories..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>
        </div>

        {/* Category list */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto scrollbar-thin p-1.5 space-y-0.5">
          {/* All Categories */}
          <button
            type="button"
            onClick={() => onSelectCategory(null, null)}
            className={cn(
              "flex w-full items-center gap-2 px-3 py-2 text-left text-[13px] font-medium transition-all rounded-md",
              isAllSelected
                ? "bg-primary text-primary-foreground font-semibold shadow-sm"
                : "text-foreground/80 hover:bg-accent hover:text-foreground"
            )}
          >
            <Layers className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">All Categories</span>
          </button>

          {/* Individual categories */}
          {categories.map((cat) => {
            const catId = cat._id || cat.id || "";
            const isActive = selectedCategoryIds.includes(catId);
            return (
              <button
                key={catId}
                type="button"
                onClick={() =>
                  onSelectCategory(catId, { ...cat, id: catId })
                }
                className={cn(
                  "flex w-full items-center gap-2 px-3 py-2 text-left text-[13px] font-medium transition-all rounded-md",
                  isActive
                    ? "bg-primary text-primary-foreground font-semibold shadow-sm"
                    : "text-foreground/80 hover:bg-accent hover:text-foreground"
                )}
              >
                <span className="truncate">{cat.name}</span>
              </button>
            );
          })}

          {/* Loading indicator */}
          {loading && (
            <div className="flex justify-center py-3">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            </div>
          )}

          {/* Sentinel for infinite scroll */}
          <div ref={desktopSentinelRef} className="h-1" />

          {/* Empty state */}
          {!loading && initialLoaded && categories.length === 0 && (
            <div className="px-3 py-6 text-center text-xs text-muted-foreground">
              No categories found
            </div>
          )}
        </div>
      </div>

      {/* ─── MOBILE/TABLET: Horizontal pill bar ─── */}
      <div className="flex lg:hidden shrink-0 gap-2 overflow-x-auto p-1 scrollbar-none">
        {/* All pill */}
        <button
          type="button"
          onClick={() => onSelectCategory(null, null)}
          className={cn(
            "shrink-0 rounded-full px-4 py-1.5 text-xs font-semibold transition-all whitespace-nowrap",
            isAllSelected
              ? "bg-primary text-primary-foreground shadow-sm"
              : "bg-muted text-foreground/70 hover:bg-accent hover:text-foreground"
          )}
        >
          All
        </button>

        {/* Category pills */}
        {categories.map((cat) => {
          const catId = cat._id || cat.id || "";
          const isActive = selectedCategoryIds.includes(catId);
          return (
            <button
              key={catId}
              type="button"
              onClick={() =>
                onSelectCategory(catId, { ...cat, id: catId })
              }
              className={cn(
                "shrink-0 rounded-full px-4 py-1.5 text-xs font-semibold transition-all whitespace-nowrap",
                isActive
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "bg-muted text-foreground/70 hover:bg-accent hover:text-foreground"
              )}
            >
              {cat.name}
            </button>
          );
        })}

        {/* Load more sentinel for mobile */}
        {hasMore && <div ref={mobileSentinelRef} className="w-1 shrink-0" />}
      </div>
    </>
  );
}
