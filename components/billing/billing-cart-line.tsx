"use client";

import React, { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import { Plus, Minus, Trash2 } from "lucide-react";
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

  const [qtyInput, setQtyInput] = useState(item.qty.toString());

  useEffect(() => {
    setQtyInput(item.qty.toString());
  }, [item.qty]);

  return (
    <div className="flex flex-col gap-2.5 rounded-2xl border border-border/60 bg-card p-3 shadow-sm">
      {/* Top Row: Full Product Name */}
      <div className="w-full">
        <p className="text-[15px] font-bold leading-snug text-foreground/90 line-clamp-2 break-words" title={item.name}>
          {item.name}
        </p>
      </div>

      {/* Bottom Row: Price/Unit & Controls */}
      <div className="flex items-center justify-between mt-0.5">
        {/* Left: Price Per Unit */}
        <div className="flex items-center">
          {isWholesale && isEditing ? (
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
              className="w-20 rounded border border-primary bg-card px-1.5 py-0.5 text-[12px]"
            />
          ) : (
            <button
              type="button"
              className={cn(
                "text-[13px] text-muted-foreground font-medium",
                isWholesale && "underline decoration-dotted hover:text-primary"
              )}
              onClick={() => {
                if (!isWholesale) return;
                onStartEdit();
              }}
            >
              {formatCurrency(item.price)}/{item.soldUnit ?? item.unit}
              {item.priceOverride && "*"}
            </button>
          )}
        </div>

        {/* Right: Controls & Total */}
        <div className="flex shrink-0 items-center gap-2">
          {/* Quantity */}
          <div className="flex items-center gap-0.5">
            <button
              type="button"
              onClick={() => onUpdateQty(item.qty - 1)}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-muted hover:bg-muted/80 active:scale-95 transition-all"
            >
              <Minus className="h-4 w-4" />
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
                    toast.error(`Only ${item.onHandQty} available`, { id: 'stock-limit' });
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
              className="h-8 w-8 bg-transparent text-center text-[15px] font-bold outline-none focus:ring-2 focus:ring-primary/50 rounded-md [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none transition-all"
            />
            <button
              type="button"
              disabled={item.onHandQty !== undefined && item.qty >= item.onHandQty}
              onClick={() => {
                if (item.onHandQty !== undefined && item.qty >= item.onHandQty) {
                  toast.error(`Only ${item.onHandQty} available`, { id: 'stock-limit' });
                } else {
                  onUpdateQty(item.qty + 1);
                }
              }}
              className={cn(
                "flex h-8 w-8 items-center justify-center rounded-full bg-muted transition-all",
                item.onHandQty !== undefined && item.qty >= item.onHandQty 
                  ? "opacity-50 cursor-not-allowed" 
                  : "hover:bg-muted/80 active:scale-95"
              )}
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>

          {/* Line Total */}
          <span className="text-[15px] font-black min-w-[4rem] text-right tracking-tight">
            {formatCurrency(lineTotal)}
          </span>

          {/* Delete Button */}
          <button
            type="button"
            onClick={onRemove}
            className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground/60 border border-muted-foreground/20 hover:text-destructive hover:bg-destructive/10 hover:border-transparent transition-all ml-1"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
