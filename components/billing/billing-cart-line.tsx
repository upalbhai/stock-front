"use client";

import * as React from "react";
import { toast } from "react-hot-toast";
import { Plus, Minus, Trash2, Edit2, AlertCircle } from "lucide-react";
import { formatCurrency } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { LineItem } from "@/store/billingSlice";

type BillingCartLineProps = {
  item: LineItem;
  isWholesale: boolean;
  isEditing: boolean;
  editPriceValue: string;
  onEditPriceValue: (value: string) => void;
  onStartEdit: () => void;
  onCommitEdit: (price: number) => void;
  onCancelEdit: () => void;
  onUpdateQty: (qty: number) => void;
  onRemove: () => void;
};

export function BillingCartLine({
  item,
  isWholesale,
  isEditing,
  editPriceValue,
  onEditPriceValue,
  onStartEdit,
  onCommitEdit,
  onCancelEdit,
  onUpdateQty,
  onRemove,
}: BillingCartLineProps) {
  const lineQty = item.soldQty ?? item.qty;
  const lineTotal = item.price * lineQty;

  const [qtyInput, setQtyInput] = React.useState(item.qty.toString());

  React.useEffect(() => {
    setQtyInput(item.qty.toString());
  }, [item.qty]);

  const isMaxStockReached = item.onHandQty !== undefined && item.qty >= item.onHandQty;

  return (
    <div className="group relative flex flex-col gap-2 rounded-xl border border-border/70 bg-card p-2.5 shadow-2xs transition-all duration-150 hover:border-border hover:shadow-xs">
      {/* Top Row: Product Name & Delete */}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p
            className="text-xs font-bold leading-snug text-foreground/90 group-hover:text-foreground line-clamp-2 break-words"
            title={item.name}
          >
            {item.name}
          </p>
          <div className="mt-0.5 flex items-center gap-1.5 text-[11px] text-muted-foreground">
            {isWholesale && isEditing ? (
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  min={0}
                  step="0.01"
                  autoFocus
                  value={editPriceValue}
                  onChange={(e) => onEditPriceValue(e.target.value)}
                  onBlur={() => onCommitEdit(Number(editPriceValue) || item.price)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") onCommitEdit(Number(editPriceValue) || item.price);
                    if (e.key === "Escape") onCancelEdit();
                  }}
                  className="w-20 rounded-md border border-primary bg-background px-1.5 py-0.5 text-xs font-semibold text-foreground focus:outline-hidden"
                />
                <span className="text-[10px] text-muted-foreground">/{item.soldUnit ?? item.unit}</span>
              </div>
            ) : (
              <button
                type="button"
                className={cn(
                  "flex items-center gap-1 text-[11px] font-medium transition-colors cursor-pointer",
                  isWholesale
                    ? "text-primary hover:underline hover:text-primary/80"
                    : "text-muted-foreground"
                )}
                onClick={() => {
                  if (!isWholesale) return;
                  onStartEdit();
                }}
                title={isWholesale ? "Click to edit unit price" : undefined}
              >
                <span>
                  {formatCurrency(item.price)}/{item.soldUnit ?? item.unit}
                </span>
                {item.priceOverride && (
                  <span className="rounded bg-amber-500/10 px-1 text-[9px] font-bold text-amber-600">
                    custom
                  </span>
                )}
                {isWholesale && <Edit2 className="h-2.5 w-2.5 text-muted-foreground" />}
              </button>
            )}
          </div>
        </div>

        {/* Remove Button */}
        <button
          type="button"
          onClick={onRemove}
          className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors cursor-pointer shrink-0"
          title="Remove item"
          aria-label="Remove item"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Bottom Row: Quantity Stepper & Line Total */}
      <div className="flex items-center justify-between border-t border-border/40 pt-2">
        {/* Quantity Controls */}
        <div className="flex items-center gap-1 rounded-lg border border-border/60 bg-muted/30 p-0.5">
          <button
            type="button"
            onClick={() => onUpdateQty(item.qty - 1)}
            className="flex h-7 w-7 items-center justify-center rounded-md bg-card hover:bg-muted active:scale-95 text-foreground transition-all cursor-pointer shadow-2xs"
            aria-label="Decrease quantity"
          >
            <Minus className="h-3 w-3" />
          </button>

          <input
            type="number"
            min={1}
            value={qtyInput}
            onChange={(e) => {
              setQtyInput(e.target.value);
              const val = parseInt(e.target.value, 10);
              if (!isNaN(val) && val > 0) {
                if (item.onHandQty !== undefined && val > item.onHandQty) {
                  onUpdateQty(item.onHandQty);
                  setQtyInput(item.onHandQty.toString());
                  toast.error(`Only ${item.onHandQty} available in stock`, { id: "stock-limit" });
                } else {
                  onUpdateQty(val);
                }
              }
            }}
            onBlur={() => {
              const val = parseInt(qtyInput, 10);
              if (isNaN(val) || val <= 0) {
                setQtyInput(item.qty.toString());
              } else if (item.onHandQty !== undefined && val > item.onHandQty) {
                setQtyInput(item.onHandQty.toString());
              }
            }}
            className="h-7 w-9 bg-transparent text-center font-mono text-xs font-bold text-foreground outline-hidden [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            aria-label="Quantity"
          />

          <button
            type="button"
            disabled={isMaxStockReached}
            onClick={() => {
              if (isMaxStockReached) {
                toast.error(`Only ${item.onHandQty} available in stock`, { id: "stock-limit" });
              } else {
                onUpdateQty(item.qty + 1);
              }
            }}
            className={cn(
              "flex h-7 w-7 items-center justify-center rounded-md bg-card text-foreground transition-all shadow-2xs",
              isMaxStockReached
                ? "opacity-40 cursor-not-allowed"
                : "hover:bg-muted active:scale-95 cursor-pointer"
            )}
            aria-label="Increase quantity"
          >
            <Plus className="h-3 w-3" />
          </button>
        </div>

        {/* Line Total */}
        <div className="text-right">
          <span className="font-mono text-sm font-black tracking-tight text-foreground">
            {formatCurrency(lineTotal)}
          </span>
        </div>
      </div>
    </div>
  );
}
