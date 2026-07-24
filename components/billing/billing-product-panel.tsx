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
import { toast } from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Pagination } from "@/components/ui/pagination";
import { formatCurrency } from "@/lib/format";
import { getProductUnitLabel, getWholesalePriceHint, getActivePackagingUnits } from "@/lib/productUtils";
import { cn } from "@/lib/utils";
import type { Product } from "@/lib/types";
import type { LineItem } from "@/store/billingSlice";
import { useAuth } from "@/components/auth/auth-provider";

type BillingProductPanelProps = {
  search: string;
  onSearchChange: (value: string) => void;
  onSearchEnter: () => void;
  onOpenScanner: () => void;
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
  const { user } = useAuth();
  const currency = user?.currency || "INR";

  return (
    <div
      className={cn(
        "flex min-h-0 flex-1 flex-col gap-2 overflow-hidden",
        mobileBottomPadding && "pb-[calc(4.5rem+env(safe-area-inset-bottom))] lg:pb-0"
      )}
    >
      <div className="flex shrink-0 gap-2 px-2 pt-2 sm:px-0 sm:pt-0 items-center justify-between">
        <div className="flex w-full items-center gap-2">
          <div className="relative flex-1 lg:max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") onSearchEnter();
              }}
              placeholder="Search or scan..."
              className="h-10 pl-9 text-sm rounded-lg w-full"
            />
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={onOpenScanner}
            className="shrink-0 h-10 w-10 rounded-lg"
            title="Scan barcode"
            aria-label="Scan barcode"
          >
            <ScanLine className="h-5 w-5" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={onRefetch}
            disabled={prodIsRefetching}
            className="shrink-0 h-10 w-10 rounded-lg"
            title="Refetch products"
            aria-label="Refetch products"
          >
            <RefreshCw className={cn("h-5 w-5", prodIsRefetching && "animate-spin")} />
          </Button>
        </div>
      </div>
      
      {/* Pagination info row, if needed, can go below or be removed. Since it's infinite scroll, I'll hide it on small screens and show it elegantly on desktop */}
      {prodMeta && (
        <div className="hidden sm:flex justify-end px-2 sm:px-0">
          <span className="text-[11px] text-muted-foreground">
            Page {prodPage} of {prodMeta.totalPages || 1}
          </span>
        </div>
      )}

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
              const isDisabled = product.onHandQty <= 0;
              return (
                <button
                  key={product._id}
                  type="button"
                  disabled={isDisabled}
                  onClick={() => onAddProduct(product)}
                  className={cn(
                    "group relative flex flex-col items-start rounded-xl border bg-card p-3 text-left transition-all hover:border-foreground/30 active:scale-[0.98]",
                    cartQty > 0
                      ? "border-foreground/50 shadow-sm bg-accent/30"
                      : "border-border shadow-sm hover:shadow-md",
                    isDisabled && "opacity-50 grayscale cursor-not-allowed"
                  )}
                >
                  {cartQty > 0 && (
                    <div className="absolute -right-2 -top-2 z-10 flex h-6 w-6 items-center justify-center rounded-full bg-foreground text-xs font-bold text-background shadow-md">
                      {cartQty}
                    </div>
                  )}
                  {product.image && (
                    <img
                      src={product.image}
                      alt={product.name}
                      className="mb-2 h-14 w-full rounded-md object-cover"
                    />
                  )}
                  <div className="flex min-w-0 items-start justify-between gap-1.5 w-full">
                    <p className="line-clamp-2 flex-1 text-[13px] font-semibold leading-tight text-foreground/90 group-hover:text-foreground">
                      {product.name}
                    </p>
                    {isWholesale && hasPackaging && (
                      <span className="shrink-0 rounded-md bg-primary/10 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-primary">
                        Bulk
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-[11px] text-foreground/70 font-medium">
                    {product.onHandQty} {unitLabel} in stock
                  </p>
                  <p className="mt-1.5 text-[15px] font-bold leading-none text-foreground">
                    {formatCurrency(product.price, currency)}
                    <span className="text-[11px] font-medium text-foreground/60">/{unitLabel}</span>
                  </p>
                  {packHint && (
                    <p className="mt-1.5 line-clamp-2 border-t border-border/40 pt-1.5 text-[10px] leading-snug text-muted-foreground">
                      {packHint}
                    </p>
                  )}
                  {product.onHandQty <= (product.lowStockThreshold || 10) && (
                    <Badge variant="warning" className="mt-2 w-fit px-1.5 py-0 text-[9px] uppercase tracking-wider font-bold">
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
