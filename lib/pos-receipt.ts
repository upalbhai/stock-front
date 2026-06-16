/**
 * pos-receipt.ts
 * Builds ESC/POS receipt bytes using @point-of-sale/receipt-printer-encoder.
 * Supports 58 mm (32 col) and 80 mm (48 col) paper widths.
 */

import ReceiptPrinterEncoder from "@point-of-sale/receipt-printer-encoder";
import type { PaperWidth } from "./printer-storage";

// ── Public types ──────────────────────────────────────────────────────────────

export type { PaperWidth };

export interface ReceiptItem {
  name: string;
  qty: number;
  unit?: string;
  price: number;
  lineTotal: number;
}

export interface ReceiptData {
  businessName: string;
  outletName?: string;
  businessPhone?: string;
  businessAddress?: string;
  businessGst?: string;
  orderNumber: string;
  createdAt: string;
  customerName?: string;
  customerPhone?: string;
  items: ReceiptItem[];
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  paymentMethod: string;
  amountPaid: number;
  amountDue: number;
  isWholesale: boolean;
  paperWidth: PaperWidth;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Format a number to 2 decimal places */
function fmt(n: number): string {
  return n.toFixed(2);
}

/** Format ISO date string as "DD/MM/YY HH:MM" */
function fmtDate(iso: string): string {
  const d = new Date(iso);
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yy = String(d.getFullYear()).slice(-2);
  const hh = String(d.getHours()).padStart(2, "0");
  const mi = String(d.getMinutes()).padStart(2, "0");
  return `${dd}/${mm}/${yy} ${hh}:${mi}`;
}

/**
 * Two-column text line: left text + right text filling `width` total chars.
 * Used for summary lines like "Subtotal:      Rs.200.00"
 */
function twoCol(left: string, right: string, width: number): string {
  const maxL = width - right.length;
  const l = left.length > maxL ? left.slice(0, maxL) : left;
  return l + " ".repeat(width - l.length - right.length) + right;
}

// ── Column definitions ────────────────────────────────────────────────────────

type ColDef = { width: number; align: "left" | "right" | "center" };

/** Item table columns for 80 mm (48 chars): Name | Qty | Rate | Amt */
const ITEM_COLS_80: ColDef[] = [
  { width: 20, align: "left" },
  { width: 8, align: "right" },
  { width: 10, align: "right" },
  { width: 10, align: "right" },
];

/** Item table columns for 58 mm (32 chars): Name | Qty | Amt */
const ITEM_COLS_58: ColDef[] = [
  { width: 15, align: "left" },
  { width: 8, align: "right" },
  { width: 9, align: "right" },
];

// ── Main builder ──────────────────────────────────────────────────────────────

/**
 * Build a Uint8Array of ESC/POS commands ready to send to a thermal printer.
 */
export function buildReceiptBytes(data: ReceiptData): Uint8Array {
  const W = data.paperWidth === 58 ? 32 : 48;
  const SEP = "-".repeat(W); // thin separator
  const DBL = "=".repeat(W); // thick separator
  const cols = W === 48 ? ITEM_COLS_80 : ITEM_COLS_58;

  const enc = new ReceiptPrinterEncoder({ columns: W });

  // ── Initialize ─────────────────────────────────────────────────────────
  enc.initialize();

  // ── Business name — double-size, centered ──────────────────────────────
  enc
    .align("center")
    .bold(true)
    .size(2, 2)
    .line(data.businessName.slice(0, Math.floor(W / 2)))
    .size(1, 1)
    .bold(false);

  if (data.outletName && data.outletName !== data.businessName) {
    enc.line(data.outletName.slice(0, W));
  }
  if (data.businessPhone) enc.line(`Ph: ${data.businessPhone}`.slice(0, W));
  if (data.businessAddress) enc.line(data.businessAddress.slice(0, W));
  if (data.businessGst) enc.line(`GSTIN: ${data.businessGst}`.slice(0, W));

  // ── Bill type header ───────────────────────────────────────────────────
  enc
    .align("left")
    .line(DBL)
    .align("center")
    .bold(true)
    .line(data.isWholesale ? "WHOLESALE BILL" : "RETAIL BILL")
    .bold(false)
    .align("left")
    .line(DBL);

  // ── Order info ─────────────────────────────────────────────────────────
  enc.line(twoCol(`Bill: ${data.orderNumber}`, fmtDate(data.createdAt), W));

  if (data.customerName) {
    enc.line(`Cust: ${data.customerName}`.slice(0, W));
    if (data.customerPhone) {
      enc.line(`Ph:   ${data.customerPhone}`.slice(0, W));
    }
  }

  enc.line(SEP);

  // ── Items table ────────────────────────────────────────────────────────
  const headerRow =
    W === 48 ? ["Item", "Qty", "Rate", "Amt"] : ["Item", "Qty", "Amt"];

  const itemRows = data.items.map((item) => {
    const qtyStr = item.unit
      ? `${item.qty} ${item.unit.slice(0, 4)}`
      : String(item.qty);

    return W === 48
      ? [item.name, qtyStr, fmt(item.price), fmt(item.lineTotal)]
      : [item.name, qtyStr, fmt(item.lineTotal)];
  });

  // Bold header row, then normal item rows
  enc.bold(true).table(cols, [headerRow]).bold(false);
  enc.line(SEP);
  enc.table(cols, itemRows);
  enc.line(DBL);

  // ── Totals ─────────────────────────────────────────────────────────────
  enc.line(twoCol("Subtotal:", `Rs.${fmt(data.subtotal)}`, W));

  if (data.discount > 0) {
    enc.line(twoCol("Discount:", `-Rs.${fmt(data.discount)}`, W));
  }
  if (data.tax > 0) {
    enc.line(twoCol("GST:", `Rs.${fmt(data.tax)}`, W));
  }

  enc
    .bold(true)
    .line(twoCol("TOTAL:", `Rs.${fmt(data.total)}`, W))
    .bold(false)
    .line(SEP);

  // ── Payment ────────────────────────────────────────────────────────────
  const methodLabel =
    data.paymentMethod === "credit"
      ? "KHATA/CREDIT"
      : data.paymentMethod.toUpperCase();

  enc.line(twoCol("Payment:", methodLabel, W));
  enc.line(twoCol("Paid:", `Rs.${fmt(data.amountPaid)}`, W));

  if (data.amountDue > 0.005) {
    enc.line(twoCol("Due:", `Rs.${fmt(data.amountDue)}`, W));
  }

  const change = data.amountPaid - data.total;
  if (change > 0.005 && data.paymentMethod === "cash") {
    enc.line(twoCol("Change:", `Rs.${fmt(change)}`, W));
  }

  // ── Footer ─────────────────────────────────────────────────────────────
  enc
    .line(DBL)
    .align("center")
    .line("Thank you! Visit again.")
    .newline()
    .newline()
    .cut();

  return enc.encode();
}
