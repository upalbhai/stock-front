"use client";

import * as React from "react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/format";
import { getProductUnitLabel, getActivePackagingUnits, getUnitDisplayLabel } from "@/lib/productUtils";
import type { Product, Unit } from "@/lib/types";

export type UnitPickOption = {
  key: string;
  label: string;
  unitDetail?: string;
  soldUnit: string;
  conversionFactor: number;
  packagingUnitId?: string;
  price: number;
  description: string;
};

function buildUnitOptions(product: Product): UnitPickOption[] {
  const baseUnitMeta =
    typeof product.unitId === "object" && product.unitId
      ? getUnitDisplayLabel(product.unitId, product.unit || "pcs")
      : { label: product.unit || "pcs", detail: undefined };
  const baseUnit = baseUnitMeta.label;

  const options: UnitPickOption[] = [
    {
      key: "base",
      label: baseUnit,
      unitDetail: baseUnitMeta.detail,
      soldUnit: baseUnit,
      conversionFactor: 1,
      price: product.price,
      description: `Loose — ${formatCurrency(product.price)} per ${baseUnit}`
    }
  ];

  for (const pkg of getActivePackagingUnits(product)) {
    const unit = typeof pkg.unitId === "object" ? (pkg.unitId as Unit) : null;
    const { label: abbr, detail: unitDetail } = getUnitDisplayLabel(unit, "unit");
    const price = pkg.price ?? product.price * pkg.qtyPerUnit;
    const cost = pkg.costPrice ?? (product.costPrice ?? 0) * pkg.qtyPerUnit;
    const margin = price - cost;
    const costNote = cost > 0 ? ` · cost ${formatCurrency(cost)}` : "";
    const marginNote = cost > 0 ? ` · margin ${formatCurrency(margin)}` : "";
    options.push({
      key: typeof pkg.unitId === "object" ? pkg.unitId._id : String(pkg.unitId),
      label: abbr,
      unitDetail,
      soldUnit: abbr,
      conversionFactor: pkg.qtyPerUnit,
      packagingUnitId: typeof pkg.unitId === "object" ? pkg.unitId._id : pkg.unitId,
      price,
      description: `1 ${abbr} = ${pkg.qtyPerUnit} ${baseUnit} — ${formatCurrency(price)}${costNote}${marginNote}`
    });
  }

  return options;
}

type UnitPickerModalProps = {
  open: boolean;
  product: Product | null;
  onClose: () => void;
  onConfirm: (option: UnitPickOption, qty: number) => void;
};

export function UnitPickerModal({ open, product, onClose, onConfirm }: UnitPickerModalProps) {
  const [selected, setSelected] = React.useState<UnitPickOption | null>(null);
  const [qty, setQty] = React.useState("1");

  const options = React.useMemo(() => (product ? buildUnitOptions(product) : []), [product]);
  const baseUnit = product ? getProductUnitLabel(product) : "pcs";
  const qtyNum = Math.max(1, Number(qty) || 1);
  const baseNeeded = selected ? qtyNum * selected.conversionFactor : 0;
  const stockOk = product ? baseNeeded <= product.onHandQty : true;
  const lineTotal = selected ? selected.price * qtyNum : 0;

  React.useEffect(() => {
    if (open && options.length) {
      setSelected(options[0]);
      setQty("1");
    }
  }, [open, product, options]);

  if (!product) return null;

  return (
    <Modal open={open} onClose={onClose} title={`Sell: ${product.name}`} size="md">
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-surface/60 px-3 py-2">
          <p className="text-xs text-muted">
            Stock: <span className="font-semibold text-text">{product.onHandQty} {baseUnit}</span>
          </p>
          {product.onHandQty <= product.lowStockThreshold && (
            <Badge variant="warning" className="text-[10px]">Low stock</Badge>
          )}
        </div>

        <p className="text-sm text-muted">Choose unit and quantity</p>
        <div className="space-y-2">
          {options.map((opt) => (
            <button
              key={opt.key}
              type="button"
              onClick={() => setSelected(opt)}
              className={`w-full rounded-xl border p-3 text-left transition ${
                selected?.key === opt.key
                  ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                  : "border-border hover:border-primary/40"
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <p className="font-semibold capitalize">{opt.unitDetail}</p>

              </div>
              <p className="text-xs text-muted mt-0.5">{opt.description}</p>
            </button>
          ))}
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-muted">
            Quantity ({selected?.soldUnit ?? baseUnit})
          </label>
          <Input
            type="number"
            min={1}
            value={qty}
            onChange={(e) => setQty(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && selected && qtyNum >= 1 && stockOk) {
                onConfirm(selected, qtyNum);
                onClose();
              }
            }}
          />
        </div>

        {selected && (
          <div className="rounded-xl border border-border/60 bg-surface/40 p-3 space-y-1.5 text-xs">
            <div className="flex justify-between text-muted">
              <span>Base qty needed</span>
              <span>{baseNeeded} {baseUnit}</span>
            </div>
            <div className="flex justify-between font-bold text-text">
              <span>Line total</span>
              <span className="text-primary">{formatCurrency(lineTotal)}</span>
            </div>
            {!stockOk && (
              <p className="text-[11px] text-danger pt-1">
                Not enough stock — need {baseNeeded} {baseUnit}, only {product.onHandQty} available
              </p>
            )}
          </div>
        )}

        <div className="flex gap-2 pt-1">
          <Button variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
          <Button
            className="flex-1"
            disabled={!selected || qtyNum < 1 || !stockOk}
            onClick={() => {
              if (selected) onConfirm(selected, qtyNum);
              onClose();
            }}
          >
            Add to cart
          </Button>
        </div>
      </div>
    </Modal>
  );
}

export { buildUnitOptions };
