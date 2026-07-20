"use client";

import * as React from "react";
import {
  Search,
  ChevronRight,
  ChevronLeft,
  RefreshCw,
  ScanLine,
  Check,
} from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import AsyncSelect from "@/components/ui/async-select";
import { Pagination } from "@/components/ui/pagination";
import { formatCurrency } from "@/lib/format";
import { getProductUnitLabel, getWholesalePriceHint, getActivePackagingUnits } from "@/lib/productUtils";
import { cn } from "@/lib/utils";
import type { Product, Category } from "@/lib/types";
import type { LineItem } from "@/store/billingSlice";
import { useAuth } from "@/components/auth/auth-provider";
import { categoryService } from "@/services/category.service";

type BillingProductPanelProps = {
  search: string;
  onSearchChange: (value: string) => void;
  onSearchEnter: () => void;
  onOpenScanner: () => void;
  selectedCategoryOption: any;
  onSelectCategoryOption: (opt: any) => void;
  prodIsRefetching: boolean;
  prodCooldownSeconds: number;
  onRefetch: () => void;
  products: Product[];
  productsFetching: boolean;
  prodMeta?: { page: number; totalPages: number };
  prodPage: number;
  prodLimit: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  cartItems: LineItem[];
  isWholesale: boolean;
  onAddProduct: (product: Product) => void;
  mobileBottomPadding?: boolean;
};

export function BillingProductPanel({
  search,
  onSearchChange,
  onSearchEnter,
  onOpenScanner,
  selectedCategoryOption,
  onSelectCategoryOption,
  prodIsRefetching,
  prodCooldownSeconds,
  onRefetch,
  products,
  productsFetching,
  prodMeta,
  prodPage,
  prodLimit,
  onPageChange,
  onPageSizeChange,
  cartItems,
  isWholesale,
  onAddProduct,
  mobileBottomPadding = true,
}: BillingProductPanelProps) {
  const { user, token } = useAuth();
  const currency = user?.currency || "INR";
  const qc = useQueryClient();

  const loadCategoryFilterOptions = React.useCallback(
    async (params: { page: number; limit: number; search?: string }) => {
      const res = await qc.fetchQuery({
        queryKey: ["categories", "options", params.page, params.limit, params.search],
        queryFn: () => categoryService.getCategoriesWithMeta(token, params),
        staleTime: 1000 * 60 * 5,
      });
      const meta = res.meta || undefined;
      if (params.page === 1 && !params.search) {
        return {
          ...res,
          data: [{ id: "", _id: "", name: "All Categories", label: "All Categories" }, ...res.data],
          meta
        };
      }
      return { ...res, meta };
    },
    [token, qc]
  );

  return (
    <div
      className={cn(
        "flex min-h-0 flex-1 flex-col gap-2 overflow-hidden",
        mobileBottomPadding && "pb-[calc(4.5rem+env(safe-area-inset-bottom))] lg:pb-0"
      )}
    >
      <div className="flex shrink-0 gap-2 px-2 pt-2 sm:px-0 sm:pt-0">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="product-search"
            className="h-11 pl-9"
            placeholder="Search products or scan..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && search.trim().length > 0) onSearchEnter();
            }}
          />
        </div>
        <Button
          variant="outline"
          size="icon"
          className="h-11 w-11 shrink-0"
          onClick={onOpenScanner}
          title="Scan barcode"
          aria-label="Scan barcode"
        >
          <ScanLine className="h-5 w-5" />
        </Button>
      </div>

      <div className="flex shrink-0 items-center justify-between gap-2 px-2 sm:px-0">
        <div className="w-full sm:w-64 shrink-0">
          <AsyncSelect
            value={selectedCategoryOption}
            onChange={onSelectCategoryOption}
            loadOptions={loadCategoryFilterOptions}
            placeholder="All Categories"
            className="h-9"
          />
        </div>
        
        <div className="flex items-center gap-2">
          {prodMeta && (
            <span className="text-xs text-muted-foreground hidden xs:inline-block">
              Page {prodPage} of {prodMeta.totalPages || 1}
            </span>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={onRefetch}
            disabled={prodIsRefetching}
            className="h-9 gap-1.5"
          >
            <RefreshCw className={cn("h-3.5 w-3.5", prodIsRefetching && "animate-spin")} />
            <span className="hidden xs:inline sm:inline">
              {prodIsRefetching ? `${prodCooldownSeconds}s` : "Refetch"}
            </span>
          </Button>
        </div>
      </div>

      <div className="relative min-h-0 flex-1 overflow-y-auto p-2">
        {productsFetching && products.length === 0 ? (
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="min-h-[7rem] animate-pulse rounded-2xl bg-muted/50" />
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="flex h-full min-h-[14rem] flex-col items-center justify-center text-center">
            <p className="text-4xl">🛍️</p>
            <p className="mt-2 text-sm text-muted-foreground">No products found</p>
            <Button variant="soft" size="sm" className="mt-3" onClick={onOpenScanner}>
              <ScanLine className="mr-2 h-4 w-4" />
              Scan barcode
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
            {products.map((product) => {
              const cartQty = cartItems
                .filter((i) => i.id === product._id)
                .reduce((s, i) => s + (i.soldQty ?? i.qty), 0);
              const unitLabel = getProductUnitLabel(product);
              const packHint = isWholesale ? getWholesalePriceHint(product, currency) : null;
              const hasPackaging = getActivePackagingUnits(product).length > 0;
              const isDisabled = product.onHandQty <= 0 || cartQty >= product.onHandQty;
              return (
                <button
                  key={product._id}
                  type="button"
                  disabled={isDisabled}
                  onClick={() => {
                    onAddProduct(product);
                    toast.success(<span className="text-sm"><span className="font-bold">{product.name}</span> added</span>, {
                      duration: 1200,
                      position: 'bottom-center',
                      style: { borderRadius: '12px', background: 'var(--color-card)', color: 'var(--color-foreground)', border: '1px solid var(--color-border)', boxShadow: '0 8px 30px rgba(0,0,0,0.12)' }
                    });
                  }}
                  className={cn(
                    "group relative flex min-h-[7rem] flex-col rounded-2xl border p-3 text-left transition-all duration-300",
                    isDisabled ? "opacity-50 grayscale cursor-not-allowed" : "active:scale-[0.97]",
                    cartQty > 0
                      ? "border-primary/60 bg-primary/10 shadow-[0_0_15px_rgba(0,136,255,0.15)] ring-1 ring-primary/20"
                      : isDisabled ? "border-border/80 bg-muted/30" : "border-border/80 bg-card hover:border-primary/50 hover:shadow-md hover:-translate-y-[3px]"
                  )}
                >
                  {cartQty > 0 && (
                    <div className="absolute -right-1.5 -top-1.5 z-10 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs font-bold text-white shadow">
                      {cartQty}
                    </div>
                  )}
                  {product.image && (
                    <img
                      src={product.image}
                      alt={product.name}
                      className="mb-2 h-16 w-full rounded-lg object-cover"
                    />
                  )}
                  <div className="flex min-w-0 items-start justify-between gap-1.5">
                    <p className="line-clamp-2 flex-1 text-[14px] font-semibold leading-snug text-foreground/90 group-hover:text-foreground">
                      {cartQty > 0 && <Check className="inline-block h-3.5 w-3.5 text-primary mr-1 -mt-0.5" strokeWidth={3} />}
                      {product.name}
                    </p>
                    {isWholesale && hasPackaging && (
                      <span className="shrink-0 rounded-md bg-primary/10 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-primary">
                        Bulk
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {unitLabel} · {product.onHandQty} in stock
                  </p>
                  <p className="mt-1.5 text-base font-bold leading-none text-primary">
                    {formatCurrency(product.price, currency)}
                    <span className="text-xs font-normal text-muted-foreground">/{unitLabel}</span>
                  </p>
                  {packHint && (
                    <p className="mt-1.5 line-clamp-2 border-t border-border/40 pt-1.5 text-[10px] leading-snug text-muted-foreground">
                      {packHint}
                    </p>
                  )}
                  {product.onHandQty <= product.lowStockThreshold && (
                    <Badge variant="warning" className="mt-1.5 w-fit text-[10px]">
                      Low Stock
                    </Badge>
                  )}
                </button>
              );
            })}
          </div>
        )}

        {productsFetching && products.length > 0 && (
          <div className="pointer-events-none absolute inset-x-0 top-0 flex justify-center pt-2">
            <span className="rounded-full bg-card px-3 py-1 text-xs text-muted-foreground shadow">
              Updating...
            </span>
          </div>
        )}

        {prodMeta && prodMeta.totalPages > 1 && (
          <div className="flex justify-center py-4">
            <Pagination
              page={prodPage}
              totalPages={prodMeta.totalPages}
              pageSize={prodLimit}
              onPageChange={onPageChange}
              onPageSizeChange={(size) => {
                onPageSizeChange(size);
                onPageChange(1);
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
