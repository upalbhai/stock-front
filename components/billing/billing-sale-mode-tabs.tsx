"use client";

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
    <div className="flex shrink-0 items-center justify-between gap-3 px-2 pt-2 sm:px-0 sm:pt-0">
      {showSaleModeTabs ? (
        <div className="flex w-full max-w-xs rounded-xl border border-border bg-card p-1">
          <button
            type="button"
            onClick={() => onSaleModeChange("retail")}
            className={cn(
              "flex-1 rounded-lg py-2 text-xs font-semibold transition sm:py-1.5",
              !isWholesale ? "bg-primary text-white" : "text-muted-foreground hover:text-foreground"
            )}
          >
            Retail
          </button>
          <button
            type="button"
            onClick={() => onSaleModeChange("wholesale")}
            className={cn(
              "flex-1 rounded-lg py-2 text-xs font-semibold transition sm:py-1.5",
              isWholesale ? "bg-primary text-white" : "text-muted-foreground hover:text-foreground"
            )}
          >
            Wholesale
          </button>
        </div>
      ) : (
        <Badge variant="soft" className="text-xs">
          Wholesale billing
        </Badge>
      )}
      {isWholesale && taxEnabled && (
        <span className="hidden text-xs text-muted-foreground sm:inline">
          GST {taxMode === "inclusive" ? "included in prices" : "added on top"}
        </span>
      )}
    </div>
  );
}
