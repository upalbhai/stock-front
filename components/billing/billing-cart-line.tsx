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
    <div className="flex items-center gap-2 rounded-xl border border-border/60 bg-card/60 p-2.5">
      <div className="min-w-0 flex-1">
        <p className="truncate text-[15px] font-semibold leading-tight text-foreground/90">{item.name}</p>
        <p className="text-[13px] font-medium text-muted-foreground/70 mt-0.5">
          {lineQty} {item.soldUnit ?? item.unit}
          {item.conversionFactor && item.conversionFactor > 1
            ? ` (${item.baseQty ?? item.qty * item.conversionFactor} base)`
            : ""}
        </p>
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
            className="mt-1 w-28 rounded-lg border border-primary bg-card px-2 py-1.5 text-xs"
          />
        ) : (
          <button
            type="button"
            className={cn(
              "mt-0.5 text-xs text-muted-foreground",
              isWholesale && "underline decoration-dotted hover:text-primary"
            )}
            onClick={() => {
              if (!isWholesale) return;
              onStartEdit();
            }}
          >
            {formatCurrency(item.price)} / {item.soldUnit ?? item.unit}
            {item.priceOverride && " *"}
          </button>
        )}
      </div>

      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => onUpdateQty(item.qty - 1)}
          className="flex h-[42px] w-[42px] items-center justify-center rounded-lg bg-muted hover:bg-muted/80 active:scale-95 transition-all"
          aria-label="Decrease quantity"
        >
          <Minus className="h-5 w-5" />
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
                toast.error(`Only ${item.onHandQty} available in stock`, { id: 'stock-limit' });
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
          className="h-[42px] w-12 bg-transparent text-center text-[15px] font-bold outline-none focus:ring-2 focus:ring-primary/50 rounded-lg [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none transition-all"
        />
        <button
          type="button"
          disabled={item.onHandQty !== undefined && item.qty >= item.onHandQty}
          onClick={() => {
            if (item.onHandQty !== undefined && item.qty >= item.onHandQty) {
              toast.error(`Only ${item.onHandQty} available in stock`, { id: 'stock-limit' });
            } else {
              onUpdateQty(item.qty + 1);
            }
          }}
          className={cn(
            "flex h-[42px] w-[42px] items-center justify-center rounded-lg bg-muted transition-all",
            item.onHandQty !== undefined && item.qty >= item.onHandQty 
              ? "opacity-50 cursor-not-allowed" 
              : "hover:bg-muted/80 active:scale-95"
          )}
          aria-label="Increase quantity"
        >
          <Plus className="h-5 w-5" />
        </button>
        <button
          type="button"
          onClick={onRemove}
          className="flex h-[42px] w-[42px] items-center justify-center rounded-lg text-destructive hover:bg-destructive/10 active:scale-95 transition-all"
          aria-label="Remove item"
        >
          <Trash2 className="h-5 w-5" />
        </button>
      </div>

      <span className="shrink-0 text-sm font-bold">{formatCurrency(lineTotal)}</span>
    </div>
  );
}
