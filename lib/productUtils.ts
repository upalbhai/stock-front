import type { Product, Unit } from "@/lib/types";
import { formatCurrency } from "@/lib/format";

export function getProductUnitLabel(product: Product): string {
  if (typeof product.unitId === "object" && product.unitId) {
    return product.unitId.abbreviation || product.unitId.name || product.unit || "pcs";
  }
  return product.unit || "pcs";
}

export function getActivePackagingUnits(product: Product) {
  return (product.packagingUnits ?? []).filter((p) => p.isActive !== false);
}

export function getWholesalePriceHint(product: Product): string | null {
  const pkgs = getActivePackagingUnits(product);
  if (!pkgs.length) return null;
  const base = getProductUnitLabel(product);
  const parts = pkgs.map((pkg) => {
    const unit = typeof pkg.unitId === "object" ? (pkg.unitId as Unit) : null;
    const abbr = unit?.abbreviation || unit?.name || "unit";
    const price = pkg.price ?? product.price * pkg.qtyPerUnit;
    return `${formatCurrency(price)}/${abbr} (${pkg.qtyPerUnit} ${base})`;
  });
  return parts.join(" · ");
}

export type StockUnitOption = {
  key: string;
  label: string;
  soldUnit: string;
  conversionFactor: number;
  packagingUnitId?: string;
};

export function buildStockUnitOptions(product: Product): StockUnitOption[] {
  const base = getProductUnitLabel(product);
  const options: StockUnitOption[] = [{
    key: "base",
    label: base,
    soldUnit: base,
    conversionFactor: 1
  }];

  for (const pkg of getActivePackagingUnits(product)) {
    const unit = typeof pkg.unitId === "object" ? (pkg.unitId as Unit) : null;
    const abbr = unit?.abbreviation || unit?.name || "unit";
    const unitId = typeof pkg.unitId === "object" ? pkg.unitId._id : String(pkg.unitId);
    options.push({
      key: unitId,
      label: `${abbr} (${pkg.qtyPerUnit} ${base})`,
      soldUnit: abbr,
      conversionFactor: pkg.qtyPerUnit,
      packagingUnitId: unitId
    });
  }

  return options;
}

export function formatStockMovementQty(entry: {
  qty: number;
  soldQty?: number;
  soldUnit?: string;
  baseUnit?: string;
  productUnit?: string;
}) {
  const base = entry.baseUnit || entry.productUnit || "pcs";
  const absBase = Math.abs(entry.qty);
  if (entry.soldQty && entry.soldUnit && entry.soldUnit !== base) {
    const sign = entry.qty >= 0 ? "+" : "-";
    return `${sign}${absBase} ${base} (${Math.abs(entry.soldQty)} ${entry.soldUnit})`;
  }
  return `${entry.qty >= 0 ? "+" : ""}${entry.qty} ${base}`;
}
