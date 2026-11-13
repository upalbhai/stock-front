"use client";

import * as React from "react";
import {
  Store,
  Truck,
  Printer,
  FileSpreadsheet,
  Check,
  CreditCard,
  QrCode,
  Building2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Mode = "retail" | "wholesale";

export function HeroShowcase() {
  const [mode, setMode] = React.useState<Mode>("retail");

  return (
    <div className="rounded-xl border border-border bg-card shadow-xs overflow-hidden">
      {/* Mode Switcher Tabs */}
      <div className="flex border-b border-border bg-muted/40 p-1.5 gap-1.5">
        <button
          type="button"
          onClick={() => setMode("retail")}
          className={cn(
            "flex-1 flex items-center justify-center gap-2 rounded-lg py-2 px-3 text-xs font-semibold transition-colors",
            mode === "retail"
              ? "bg-card text-foreground shadow-xs border border-border/80"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <Store className="h-4 w-4 text-primary" />
          <span>Retail Counter (POS)</span>
        </button>

        <button
          type="button"
          onClick={() => setMode("wholesale")}
          className={cn(
            "flex-1 flex items-center justify-center gap-2 rounded-lg py-2 px-3 text-xs font-semibold transition-colors",
            mode === "wholesale"
              ? "bg-card text-foreground shadow-xs border border-border/80"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <Truck className="h-4 w-4 text-primary" />
          <span>Wholesale / B2B Order</span>
        </button>
      </div>

      {mode === "retail" ? (
        /* ── RETAIL POS COUNTER SIMULATION ─────────────────────────────── */
        <div>
          {/* Top terminal bar */}
          <div className="flex h-9 items-center justify-between border-b border-border bg-muted/20 px-4 text-xs">
            <div className="flex items-center gap-2 text-muted-foreground font-mono">
              <span className="font-semibold text-foreground">Main Counter</span>
              <span>•</span>
              <span>Register #01</span>
            </div>
            <div className="flex items-center gap-2.5">
              <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Scanner Connected
              </span>
              <span className="text-muted-foreground hidden sm:inline">ESC/POS 80mm</span>
            </div>
          </div>

          <div className="p-4 sm:p-5 space-y-4">
            {/* Bill Line Items */}
            <div className="space-y-2.5 text-xs font-mono">
              <div className="flex items-center justify-between text-muted-foreground pb-2 border-b border-border text-[11px] uppercase tracking-wider">
                <span>Item</span>
                <div className="flex gap-6 text-right">
                  <span>Qty</span>
                  <span>Rate</span>
                  <span>Total</span>
                </div>
              </div>

              <div className="flex items-center justify-between text-foreground">
                <div className="truncate max-w-[160px] sm:max-w-[200px]">
                  <p className="font-semibold truncate">Wireless 2D Scanner</p>
                  <p className="text-[11px] text-muted-foreground font-sans">HSN: 8471</p>
                </div>
                <div className="flex gap-6 text-right">
                  <span>1</span>
                  <span className="text-muted-foreground">₹1,250</span>
                  <span className="font-semibold">₹1,250.00</span>
                </div>
              </div>

              <div className="flex items-center justify-between text-foreground">
                <div className="truncate max-w-[160px] sm:max-w-[200px]">
                  <p className="font-semibold truncate">Thermal Paper 80mm</p>
                  <p className="text-[11px] text-muted-foreground font-sans">HSN: 4811</p>
                </div>
                <div className="flex gap-6 text-right">
                  <span>5</span>
                  <span className="text-muted-foreground">₹55</span>
                  <span className="font-semibold">₹275.00</span>
                </div>
              </div>

              <div className="flex items-center justify-between text-foreground">
                <div className="truncate max-w-[160px] sm:max-w-[200px]">
                  <p className="font-semibold truncate">USB Drawer Cable</p>
                  <p className="text-[11px] text-muted-foreground font-sans">HSN: 8473</p>
                </div>
                <div className="flex gap-6 text-right">
                  <span>1</span>
                  <span className="text-muted-foreground">₹420</span>
                  <span className="font-semibold">₹420.00</span>
                </div>
              </div>
            </div>

            {/* Tax & Total calculation */}
            <div className="rounded-lg border border-border bg-muted/20 p-3 text-xs font-mono space-y-1.5">
              <div className="flex justify-between text-muted-foreground">
                <span>Subtotal</span>
                <span>₹1,648.31</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>GST (CGST 9% + SGST 9%)</span>
                <span>₹296.69</span>
              </div>
              <div className="pt-2 border-t border-border flex justify-between text-sm font-bold text-foreground">
                <span>Grand Total</span>
                <span className="text-primary">₹1,945.00</span>
              </div>
            </div>

            {/* Payment Method Selector */}
            <div className="space-y-2">
              <div className="grid grid-cols-4 gap-1.5 text-xs text-center font-medium">
                <span className="rounded-md border border-primary bg-primary/10 py-1.5 text-primary font-semibold">
                  UPI QR
                </span>
                <span className="rounded-md border border-border bg-card py-1.5 text-muted-foreground">
                  Cash
                </span>
                <span className="rounded-md border border-border bg-card py-1.5 text-muted-foreground">
                  Card
                </span>
                <span className="rounded-md border border-border bg-card py-1.5 text-muted-foreground">
                  Credit
                </span>
              </div>

              <Button size="sm" className="w-full rounded-md font-semibold">
                <Printer className="h-3.5 w-3.5 mr-1.5" /> Print 80mm Receipt (F9)
              </Button>
            </div>
          </div>
        </div>
      ) : (
        /* ── WHOLESALE / B2B INVOICE SIMULATION ────────────────────────── */
        <div>
          {/* Top warehouse bar */}
          <div className="flex h-9 items-center justify-between border-b border-border bg-muted/20 px-4 text-xs">
            <div className="flex items-center gap-2 text-muted-foreground font-mono">
              <Building2 className="h-3.5 w-3.5 text-primary" />
              <span className="font-semibold text-foreground">Central Godown #2</span>
              <span>•</span>
              <span>B2B Dispatch</span>
            </div>
            <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-medium">
              <Check className="h-3.5 w-3.5" /> Buyer GSTIN Verified
            </div>
          </div>

          <div className="p-4 sm:p-5 space-y-4">
            {/* Buyer & Terms Card */}
            <div className="rounded-lg border border-border bg-muted/20 p-3 text-xs space-y-1">
              <div className="flex justify-between items-baseline">
                <span className="font-bold text-foreground">Balaji Trading Co.</span>
                <span className="font-mono text-[11px] text-muted-foreground">GSTIN: 24AAACB1234F1Z8</span>
              </div>
              <div className="flex justify-between text-muted-foreground pt-1 border-t border-border/60 text-[11px]">
                <span>Payment Terms: 30-Day Credit (Udhar)</span>
                <span className="text-primary font-semibold">Transport: V-Trans Cargo</span>
              </div>
            </div>

            {/* Bulk / Carton Items */}
            <div className="space-y-2.5 text-xs font-mono">
              <div className="flex items-center justify-between text-muted-foreground pb-2 border-b border-border text-[11px] uppercase tracking-wider">
                <span>Bulk Item (Cartons)</span>
                <div className="flex gap-4 text-right">
                  <span>Cartons</span>
                  <span>Wholesale Rate</span>
                  <span>Amount</span>
                </div>
              </div>

              <div className="flex items-center justify-between text-foreground">
                <div className="truncate max-w-[150px] sm:max-w-[190px]">
                  <p className="font-semibold truncate">Cotton Fabric 50m Roll</p>
                  <p className="text-[11px] text-muted-foreground font-sans">40 Rolls per Master Carton</p>
                </div>
                <div className="flex gap-4 text-right">
                  <span>10 ctn</span>
                  <span className="text-muted-foreground">₹8,500</span>
                  <span className="font-semibold">₹85,000.00</span>
                </div>
              </div>

              <div className="flex items-center justify-between text-foreground">
                <div className="truncate max-w-[150px] sm:max-w-[190px]">
                  <p className="font-semibold truncate">Stretch Film 500m Box</p>
                  <p className="text-[11px] text-muted-foreground font-sans">12 Rolls per Box</p>
                </div>
                <div className="flex gap-4 text-right">
                  <span>25 box</span>
                  <span className="text-muted-foreground">₹650</span>
                  <span className="font-semibold">₹16,250.00</span>
                </div>
              </div>
            </div>

            {/* B2B GST Calculation */}
            <div className="rounded-lg border border-border bg-muted/20 p-3 text-xs font-mono space-y-1.5">
              <div className="flex justify-between text-muted-foreground">
                <span>Taxable Amount</span>
                <span>₹1,01,250.00</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Integrated GST (IGST 18%)</span>
                <span>₹18,225.00</span>
              </div>
              <div className="pt-2 border-t border-border flex justify-between text-sm font-bold text-foreground">
                <span>Total Invoice Value</span>
                <span className="text-primary">₹1,19,475.00</span>
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-2">
              <Button size="sm" className="w-full rounded-md font-semibold">
                <FileSpreadsheet className="h-3.5 w-3.5 mr-1.5" /> Generate E-Way Bill &amp; Print A4 Invoice
              </Button>
              <p className="text-center text-[11px] text-muted-foreground">
                Recorded to Customer Khata ledger with 30-day payment reminder
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

