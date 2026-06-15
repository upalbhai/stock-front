"use client";

import React, { useState, useEffect } from "react";
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
        <p className="truncate text-sm font-medium leading-tight">{item.name}</p>
        <p className="text-xs text-muted-foreground">
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
          className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted hover:bg-muted/80"
          aria-label="Decrease quantity"
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
              onUpdateQty(val);
            }
          }}
          onBlur={() => {
            const val = parseInt(qtyInput, 10);
            if (isNaN(val) || val <= 0) {
              setQtyInput(item.qty.toString());
            }
          }}
          className="w-10 bg-transparent text-center text-sm font-semibold outline-none focus:ring-1 focus:ring-primary rounded py-1 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
        />
        <button
          type="button"
          onClick={() => onUpdateQty(item.qty + 1)}
          className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted hover:bg-muted/80"
          aria-label="Increase quantity"
        >
          <Plus className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={onRemove}
          className="flex h-9 w-9 items-center justify-center rounded-lg text-destructive hover:bg-destructive/10"
          aria-label="Remove item"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>

      <span className="shrink-0 text-sm font-bold">{formatCurrency(lineTotal)}</span>
    </div>
  );
}
