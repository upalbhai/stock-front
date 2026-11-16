"use client";

import * as React from "react";
import { ShoppingBag, Truck, ReceiptText, ShieldCheck, Zap } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type BillingSaleModeTabsProps = {
  showSaleModeTabs: boolean;
  wholesaleOnly: boolean;
  isWholesale: boolean;
  taxEnabled: boolean;
  taxMode: "exclusive" | "inclusive";
  onSaleModeChange: (mode: "retail" | "wholesale") => void;
};

export function BillingSaleModeTabs({
  showSaleModeTabs,
  wholesaleOnly,
  isWholesale,
  taxEnabled,
  taxMode,
  onSaleModeChange,
}: BillingSaleModeTabsProps) {
  if (!showSaleModeTabs && !wholesaleOnly) return null;

  return (
    <div className="flex shrink-0 flex-wrap items-center justify-between gap-2.5 rounded-xl border border-border/70 bg-card/95 px-3 py-2 shadow-xs backdrop-blur-xs">
      {/* Mode Switcher */}
      <div className="flex items-center gap-2">
        {showSaleModeTabs ? (
          <div className="flex rounded-lg border border-border/80 bg-muted/60 p-0.5 shadow-inner">
            <button
              type="button"
              onClick={() => onSaleModeChange("retail")}
              className={cn(
                "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition-all duration-150 cursor-pointer",
                !isWholesale
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <ShoppingBag className="h-3.5 w-3.5" />
              <span>Retail POS</span>
            </button>
            <button
              type="button"
              onClick={() => onSaleModeChange("wholesale")}
              className={cn(
                "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition-all duration-150 cursor-pointer",
                isWholesale
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Truck className="h-3.5 w-3.5" />
              <span>Wholesale B2B</span>
            </button>
          </div>
        ) : (
          <Badge variant="soft" className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold">
            <Truck className="h-3.5 w-3.5 text-primary" />
            Wholesale Terminal
          </Badge>
        )}

        {/* Live operational status dot */}
        <div className="hidden sm:flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-medium text-emerald-700 dark:text-emerald-400">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
          </span>
          <span>Terminal Online</span>
        </div>
      </div>

      {/* Right Deck: GST Status & Keyboard shortcuts legend */}
      <div className="flex items-center gap-2 text-xs">
        {taxEnabled ? (
          <div className="flex items-center gap-1.5 rounded-md border border-border/60 bg-background px-2.5 py-1 text-[11px] font-medium text-muted-foreground shadow-2xs">
            <ReceiptText className="h-3.5 w-3.5 text-primary" />
            <span>GST:</span>
            <span className="font-semibold text-foreground">
              {taxMode === "inclusive" ? "MRP Inclusive" : "Added Extra"}
            </span>
          </div>
        ) : (
          <div className="hidden sm:flex items-center gap-1 text-[11px] text-muted-foreground">
            <ShieldCheck className="h-3.5 w-3.5 text-muted-foreground" />
            <span>Non-GST Bill</span>
          </div>
        )}

        {/* Desktop Quick Shortcuts */}
        <div className="hidden md:flex items-center gap-1.5 border-l border-border/60 pl-2 text-[10px] text-muted-foreground">
          <span className="font-medium">Quick Keys:</span>
          <span className="flex items-center gap-0.5 rounded bg-muted px-1.5 py-0.5 font-mono text-[10px] font-semibold text-foreground">
            F2
          </span>
          <span>Search</span>
          <span className="flex items-center gap-0.5 rounded bg-muted px-1.5 py-0.5 font-mono text-[10px] font-semibold text-foreground ml-1">
            F4
          </span>
          <span>Scan</span>
          <span className="flex items-center gap-0.5 rounded bg-muted px-1.5 py-0.5 font-mono text-[10px] font-semibold text-foreground ml-1">
            F8
          </span>
          <span>Pay</span>
        </div>
      </div>
    </div>
  );
}
