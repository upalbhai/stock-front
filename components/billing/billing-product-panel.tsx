"use client";

import * as React from "react";
import {
  Search,
  RefreshCw,
  ScanLine,
  X,
  Package,
  ShoppingCart,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";
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
  const searchInputRef = React.useRef<HTMLInputElement>(null);

  // Keyboard shortcut listener for F2 (search) and F4 (scan)
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "F2") {
        e.preventDefault();
        searchInputRef.current?.focus();
      } else if (e.key === "F4") {
        e.preventDefault();
        onOpenScanner();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onOpenScanner]);

  return (
    <div
      className={cn(
        "flex min-h-0 flex-1 flex-col gap-2.5 overflow-hidden",
        mobileBottomPadding && "pb-[calc(4.5rem+env(safe-area-inset-bottom))] lg:pb-0"
      )}
    >
      {/* Search and Action Toolbar */}
      <div className="flex shrink-0 items-center justify-between gap-2 px-1 pt-1 sm:px-0 sm:pt-0">
        <div className="flex w-full items-center gap-2">
          {/* Search Box */}
          <div className="relative flex-1 lg:max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              ref={searchInputRef}
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") onSearchEnter();
              }}
              placeholder="Search product name, SKU or barcode (F2)..."
              className="h-10 pl-9 pr-9 text-xs sm:text-sm rounded-xl border-border/80 bg-card shadow-2xs focus:border-primary w-full"
            />
            {search && (
              <button
                type="button"
                onClick={() => onSearchChange("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer p-0.5"
                aria-label="Clear search"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Barcode Scanner Trigger Button */}
          <Button
            type="button"
            variant="outline"
            onClick={onOpenScanner}
            className="shrink-0 h-10 px-3 rounded-xl border-border/80 bg-card shadow-2xs hover:bg-muted font-medium text-xs gap-1.5 cursor-pointer"
            title="Scan barcode (F4)"
            aria-label="Scan barcode"
          >
            <ScanLine className="h-4 w-4 text-primary" />
            <span className="hidden sm:inline">Scan</span>
            <kbd className="hidden md:inline rounded bg-muted px-1.5 py-0.5 font-mono text-[9px] text-muted-foreground">
              F4
            </kbd>
          </Button>

          {/* Refresh Catalog Button */}
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={onRefetch}
            disabled={prodIsRefetching}
            className="shrink-0 h-10 w-10 rounded-xl border-border/80 bg-card shadow-2xs hover:bg-muted cursor-pointer"
            title={prodCooldownSeconds > 0 ? `Wait ${prodCooldownSeconds}s` : "Refresh catalog"}
            aria-label="Refresh catalog"
          >
            <RefreshCw className={cn("h-4 w-4 text-muted-foreground", prodIsRefetching && "animate-spin text-primary")} />
          </Button>
        </div>

        {/* Page status info */}
        {prodMeta && prodMeta.totalPages > 1 && (
          <div className="hidden xl:flex shrink-0 items-center gap-1.5 text-xs text-muted-foreground">
            <span>Page</span>
            <span className="font-semibold text-foreground">{prodPage}</span>
            <span>of</span>
            <span className="font-semibold text-foreground">{prodMeta.totalPages}</span>
          </div>
        )}
      </div>

      {/* Product Catalog Grid Container */}
      <div className="relative min-h-0 flex-1 overflow-y-auto px-1 sm:px-0 pt-2">
        {productsFetching && products.length === 0 ? (
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="flex flex-col justify-between min-h-[9.5rem] animate-pulse rounded-2xl border border-border/60 bg-card p-3 shadow-2xs"
              >
                <div className="space-y-2">
                  <div className="h-3 w-3/4 rounded bg-muted/80" />
                  <div className="h-2.5 w-1/2 rounded bg-muted/60" />
                </div>
                <div className="space-y-1.5 pt-4">
                  <div className="h-4 w-1/3 rounded bg-muted/80" />
                  <div className="h-3 w-1/4 rounded bg-muted/60" />
                </div>
              </div>
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="flex h-full min-h-[16rem] flex-col items-center justify-center rounded-2xl border border-dashed border-border/80 bg-card/50 p-6 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted/60 shadow-inner">
              <Package className="h-7 w-7 text-muted-foreground/70" />
            </div>
            <p className="mt-3 text-sm font-semibold text-foreground">No matching products found</p>
            <p className="mt-1 max-w-xs text-xs text-muted-foreground">
              {search
                ? `No products match "${search}". Try searching by another keyword, SKU or barcode.`
                : "No products available in this category or outlet."}
            </p>
            <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
              {search && (
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-xl text-xs"
                  onClick={() => onSearchChange("")}
                >
                  Clear search
                </Button>
              )}
              <Button
                variant="soft"
                size="sm"
                className="rounded-xl text-xs gap-1.5"
                onClick={onOpenScanner}
              >
                <ScanLine className="h-3.5 w-3.5" />
                <span>Scan barcode</span>
              </Button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
            {products.map((product) => {
              const cartQty = cartItems
                .filter((i) => i.id === product._id)
                .reduce((s, i) => s + (i.soldQty ?? i.qty), 0);
              const unitLabel = getProductUnitLabel(product);
              const packHint = isWholesale ? getWholesalePriceHint(product, currency) : null;
              const hasPackaging = getActivePackagingUnits(product).length > 0;
              const isDisabled = product.onHandQty <= 0;
              const isLowStock = product.onHandQty > 0 && product.onHandQty <= (product.lowStockThreshold || 10);
              const inCart = cartQty > 0;

              return (
                <button
                  key={product._id}
                  type="button"
                  disabled={isDisabled}
                  onClick={() => onAddProduct(product)}
                  className={cn(
                    "group relative flex flex-col justify-between rounded-2xl border p-3 text-left transition-all duration-150 cursor-pointer select-none",
                    inCart
                      ? "border-primary bg-primary/[0.04] shadow-xs ring-1 ring-primary/40 hover:border-primary hover:bg-primary/[0.07]"
                      : "border-border/80 bg-card shadow-2xs hover:border-primary/50 hover:shadow-xs",
                    isDisabled && "opacity-50 grayscale cursor-not-allowed hover:border-border/80 hover:shadow-none"
                  )}
                >
                  {/* Quantity In Cart Badge */}
                  {inCart && (
                    <div className="absolute -right-1.5 -top-1.5 z-10 flex items-center gap-1 rounded-full bg-primary px-2 py-0.5 text-[11px] font-black text-primary-foreground shadow-sm">
                      <ShoppingCart className="h-3 w-3" />
                      <span>{cartQty}</span>
                    </div>
                  )}

                  {/* Top: Product Image or Icon placeholder & Title */}
                  <div className="w-full space-y-2">
                    {product.image ? (
                      <div className="relative h-18 w-full overflow-hidden rounded-xl border border-border/50 bg-muted/30">
                        <img
                          src={product.image}
                          alt={product.name}
                          className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105"
                          loading="lazy"
                        />
                      </div>
                    ) : null}

                    <div>
                      <div className="flex items-start justify-between gap-1">
                        <p
                          className="line-clamp-2 text-xs sm:text-[13px] font-bold leading-snug text-foreground/90 group-hover:text-foreground"
                          title={product.name}
                        >
                          {product.name}
                        </p>
                        {isWholesale && hasPackaging && (
                          <span className="shrink-0 rounded-md bg-primary/10 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-primary">
                            Bulk
                          </span>
                        )}
                      </div>

                      {/* Barcode / SKU if available */}
                      {product.barcode && (
                        <p className="mt-0.5 font-mono text-[10px] text-muted-foreground/70 truncate">
                          {product.barcode}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Bottom: Stock Status & Price */}
                  <div className="mt-2.5 w-full space-y-1.5 border-t border-border/50 pt-2">
                    {/* Stock pill */}
                    <div className="flex items-center justify-between text-[11px]">
                      {isDisabled ? (
                        <span className="font-semibold text-destructive flex items-center gap-1">
                          <AlertTriangle className="h-3 w-3" />
                          Out of Stock
                        </span>
                      ) : isLowStock ? (
                        <span className="font-semibold text-amber-600 dark:text-amber-400 flex items-center gap-1">
                          <AlertTriangle className="h-3 w-3" />
                          {product.onHandQty} {unitLabel} left
                        </span>
                      ) : (
                        <span className="text-muted-foreground font-medium">
                          {product.onHandQty} {unitLabel} in stock
                        </span>
                      )}
                    </div>

                    {/* Price display */}
                    <div className="flex items-baseline justify-between gap-1">
                      <p className="text-sm sm:text-base font-black tracking-tight text-foreground">
                        {formatCurrency(product.price, currency)}
                        <span className="text-[11px] font-medium text-muted-foreground ml-0.5">
                          /{unitLabel}
                        </span>
                      </p>
                    </div>

                    {/* Wholesale packaging hint */}
                    {packHint && (
                      <p className="line-clamp-1 text-[10px] text-muted-foreground/90 font-medium">
                        {packHint}
                      </p>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {/* Live refetching pill */}
        {productsFetching && products.length > 0 && (
          <div className="pointer-events-none sticky top-2 flex justify-center z-20">
            <span className="flex items-center gap-1.5 rounded-full border border-border/80 bg-card/95 px-3 py-1 text-xs font-semibold text-foreground shadow-md backdrop-blur-xs">
              <RefreshCw className="h-3.5 w-3.5 animate-spin text-primary" />
              Updating catalog...
            </span>
          </div>
        )}

        {/* Desktop Pagination */}
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
