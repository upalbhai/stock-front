/** Client-side tax calc matching backend taxCalculator.js */

export type SupplyType = "intra" | "inter";

function round2(n: number) {
  return Math.round(n * 100) / 100;
}

export function extractStateCodeFromGstin(gstin?: string | null): string | null {
  if (!gstin || typeof gstin !== "string") return null;
  const code = gstin.trim().substring(0, 2);
  return /^\d{2}$/.test(code) ? code : null;
}

export function resolveSupplyType(
  sellerGstin?: string | null,
  buyerGstin?: string | null
): SupplyType {
  const sellerState = extractStateCodeFromGstin(sellerGstin);
  const buyerState = extractStateCodeFromGstin(buyerGstin);
  if (!sellerState || !buyerState) return "intra";
  return sellerState === buyerState ? "intra" : "inter";
}

export function splitGstTax(taxTotal: number, supplyType: SupplyType = "intra") {
  const tax = round2(taxTotal || 0);
  if (supplyType === "inter") {
    return { cgst: 0, sgst: 0, igst: tax };
  }
  const half = round2(tax / 2);
  return { cgst: half, sgst: round2(tax - half), igst: 0 };
}

export function calculateLineTax({
  qty,
  unitPrice,
  taxRatePercent = 0,
  taxMode = "exclusive" as "exclusive" | "inclusive",
  taxEnabled = true,
  supplyType = "intra" as SupplyType
}: {
  qty: number;
  unitPrice: number;
  taxRatePercent?: number;
  taxMode?: "exclusive" | "inclusive";
  taxEnabled?: boolean;
  supplyType?: SupplyType;
}) {
  if (!taxEnabled || !taxRatePercent) {
    const gross = qty * unitPrice;
    return { taxableAmount: gross, taxTotal: 0, lineTotal: gross, cgst: 0, sgst: 0, igst: 0 };
  }

  const rate = taxRatePercent / 100;
  const gross = qty * unitPrice;

  let taxable: number;
  let tax: number;
  let lineTotal: number;

  if (taxMode === "inclusive") {
    taxable = rate > 0 ? gross / (1 + rate) : gross;
    tax = gross - taxable;
    lineTotal = gross;
  } else {
    taxable = gross;
    tax = taxable * rate;
    lineTotal = taxable + tax;
  }

  const split = splitGstTax(tax, supplyType);
  return {
    taxableAmount: round2(taxable),
    taxTotal: round2(tax),
    lineTotal: round2(lineTotal),
    ...split
  };
}

export function calculateCartTotals(
  items: { qty: number; price: number; taxRate: number; soldQty?: number }[],
  opts: {
    taxEnabled: boolean;
    taxRate: number;
    taxMode: "exclusive" | "inclusive";
    discount: number;
    supplyType?: SupplyType;
  }
) {
  const supplyType = opts.supplyType ?? "intra";
  let subtotal = 0;
  let tax = 0;
  let taxableAmount = 0;
  let cgst = 0;
  let sgst = 0;
  let igst = 0;

  for (const item of items) {
    const qty = item.soldQty ?? item.qty;
    const rate = item.taxRate || opts.taxRate;
    const line = calculateLineTax({
      qty,
      unitPrice: item.price,
      taxRatePercent: rate,
      taxMode: opts.taxMode,
      taxEnabled: opts.taxEnabled,
      supplyType
    });
    subtotal += opts.taxMode === "inclusive" ? line.lineTotal : line.taxableAmount;
    tax += line.taxTotal;
    taxableAmount += line.taxableAmount;
    cgst += line.cgst;
    sgst += line.sgst;
    igst += line.igst;
  }

  const total = Math.max(0, subtotal + (opts.taxMode === "exclusive" ? tax : 0) - opts.discount);

  return { subtotal, tax, taxableAmount, cgst, sgst, igst, total, supplyType };
}
