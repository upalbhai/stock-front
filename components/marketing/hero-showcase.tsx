"use client";

import * as React from "react";
import {
  Store,
  Truck,
  Printer,
  FileSpreadsheet,
  Check,
  Building2,
  QrCode,
  Banknote,
  CreditCard,
  Clock,
  BadgeCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

type PaymentMethod = "upi" | "cash" | "card" | "credit";

export function HeroShowcase() {
  const [paymentMethod, setPaymentMethod] = React.useState<PaymentMethod>("upi");
  const [isPrinted, setIsPrinted] = React.useState(false);
  const [isDispatched, setIsDispatched] = React.useState(false);

  const handlePrint = () => {
    setIsPrinted(true);
    setTimeout(() => setIsPrinted(false), 2400);
  };

  const handleDispatch = () => {
    setIsDispatched(true);
    setTimeout(() => setIsDispatched(false), 2400);
  };

  return (
    <Tabs defaultValue="retail" className="rounded-xl border border-border bg-card shadow-xs overflow-hidden">
      {/* Mode Switcher Tabs */}
      <div className="border-b border-border bg-muted/40 p-1.5">
        <TabsList className="w-full bg-transparent border-0 p-0 gap-1.5 rounded-none">
          <TabsTrigger
            value="retail"
            className="flex items-center justify-center gap-2 rounded-lg py-2 px-3 text-xs font-semibold data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-xs data-[state=active]:border data-[state=active]:border-border/80 text-muted-foreground hover:text-foreground"
          >
            <Store className="h-4 w-4 text-primary" />
            <span>Retail Counter (POS)</span>
          </TabsTrigger>

          <TabsTrigger
            value="wholesale"
            className="flex items-center justify-center gap-2 rounded-lg py-2 px-3 text-xs font-semibold data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-xs data-[state=active]:border data-[state=active]:border-border/80 text-muted-foreground hover:text-foreground"
          >
            <Truck className="h-4 w-4 text-primary" />
            <span>Wholesale / B2B Order</span>
          </TabsTrigger>
        </TabsList>
      </div>

      {/* ── RETAIL POS COUNTER SIMULATION ─────────────────────────────── */}
      <TabsContent value="retail" className="mt-0 outline-none">
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

            {/* Payment Method Selector & POS Action */}
            <div className="space-y-2.5 pt-1">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between px-0.5 text-[11px] text-muted-foreground font-medium">
                  <span>Payment Method</span>
                  <span className="font-mono text-[10px] text-primary">Tendered: ₹1,945</span>
                </div>

                <div className="grid grid-cols-4 gap-1 p-1 rounded-lg bg-muted/40 border border-border/70">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod("upi")}
                    className={cn(
                      "flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-md text-xs font-semibold transition-all cursor-pointer",
                      paymentMethod === "upi"
                        ? "bg-card text-foreground shadow-xs border border-border"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <QrCode className="h-3.5 w-3.5 text-primary shrink-0" />
                    <span>UPI QR</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod("cash")}
                    className={cn(
                      "flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-md text-xs font-semibold transition-all cursor-pointer",
                      paymentMethod === "cash"
                        ? "bg-card text-foreground shadow-xs border border-border"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <Banknote className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <span>Cash</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod("card")}
                    className={cn(
                      "flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-md text-xs font-semibold transition-all cursor-pointer",
                      paymentMethod === "card"
                        ? "bg-card text-foreground shadow-xs border border-border"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <CreditCard className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
                    <span>Card</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod("credit")}
                    className={cn(
                      "flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-md text-xs font-semibold transition-all cursor-pointer",
                      paymentMethod === "credit"
                        ? "bg-card text-foreground shadow-xs border border-border"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <Clock className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
                    <span>Khata</span>
                  </button>
                </div>
              </div>

              {/* Contextual live payment drawer */}
              {paymentMethod === "upi" && (
                <div className="flex items-center justify-between text-[11px] px-2.5 py-1.5 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-300">
                  <span className="flex items-center gap-1.5">
                    <QrCode className="h-3.5 w-3.5 shrink-0" /> Dynamic QR on Soundbox Screen
                  </span>
                  <span className="font-mono font-medium text-[10px] bg-emerald-500/20 px-1.5 py-0.5 rounded">
                    Verified
                  </span>
                </div>
              )}

              {paymentMethod === "cash" && (
                <div className="flex items-center justify-between text-[11px] px-2.5 py-1.5 rounded-md bg-muted/40 border border-border/70 text-muted-foreground">
                  <span>Received: <strong className="text-foreground font-mono">₹2,000.00</strong></span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                    Change: <strong className="font-mono font-semibold">₹55.00</strong>
                  </span>
                </div>
              )}

              {paymentMethod === "card" && (
                <div className="flex items-center justify-between text-[11px] px-2.5 py-1.5 rounded-md bg-muted/40 border border-border/70 text-muted-foreground">
                  <span>PineLabs EDC Machine</span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-medium">Device Ready</span>
                </div>
              )}

              {paymentMethod === "credit" && (
                <div className="flex items-center justify-between text-[11px] px-2.5 py-1.5 rounded-md bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-300">
                  <span>Debited to Customer Udhar Khata</span>
                  <span className="font-mono text-[10px] bg-amber-500/20 px-1.5 py-0.5 rounded font-medium">
                    15-Day Terms
                  </span>
                </div>
              )}

              {/* POS Charge & Print Button */}
              <Button
                type="button"
                onClick={handlePrint}
                className={cn(
                  "w-full h-10 rounded-lg font-semibold text-xs transition-all shadow-xs flex items-center justify-between px-3.5 cursor-pointer",
                  isPrinted
                    ? "bg-emerald-600 hover:bg-emerald-600 text-white"
                    : "bg-primary text-primary-foreground hover:bg-primary/90"
                )}
              >
                <div className="flex items-center gap-2">
                  {isPrinted ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <Printer className="h-4 w-4" />
                  )}
                  <span>
                    {isPrinted
                      ? "Receipt Printed & Cash Drawer Opened!"
                      : "Charge ₹1,945 & Print 80mm Receipt"}
                  </span>
                </div>
                <div className="flex items-center gap-2 font-mono">
                  <kbd className="hidden sm:inline-block rounded bg-black/20 dark:bg-white/20 px-1.5 py-0.5 text-[10px] font-mono font-bold tracking-wider">
                    F9
                  </kbd>
                </div>
              </Button>
            </div>
          </div>
      </TabsContent>

      {/* ── WHOLESALE / B2B INVOICE SIMULATION ────────────────────────── */}
      <TabsContent value="wholesale" className="mt-0 outline-none">
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

            {/* Wholesale Dispatch & Tax Invoice Actions */}
            <div className="space-y-2.5 pt-1">
              <Button
                type="button"
                onClick={handleDispatch}
                className={cn(
                  "w-full h-10 rounded-lg font-semibold text-xs transition-all shadow-xs flex items-center justify-between px-3.5 cursor-pointer",
                  isDispatched
                    ? "bg-emerald-600 hover:bg-emerald-600 text-white"
                    : "bg-primary text-primary-foreground hover:bg-primary/90"
                )}
              >
                <div className="flex items-center gap-2">
                  {isDispatched ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <FileSpreadsheet className="h-4 w-4" />
                  )}
                  <span>
                    {isDispatched
                      ? "E-Way Bill #241088921 Generated & Dispatched!"
                      : "Generate E-Way Bill & Print A4 Invoice"}
                  </span>
                </div>
                <div className="flex items-center gap-2 font-mono">
                  <kbd className="hidden sm:inline-block rounded bg-black/20 dark:bg-white/20 px-1.5 py-0.5 text-[10px] font-mono font-bold tracking-wider">
                    Ctrl+↵
                  </kbd>
                </div>
              </Button>

              <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-0.5 px-0.5">
                <span className="flex items-center gap-1.5">
                  <BadgeCheck className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  Real-time GSTN e-Invoice Sync
                </span>
                <span className="font-mono text-foreground font-medium text-[11px]">
                  30-Day Credit (Udhar)
                </span>
              </div>
            </div>
          </div>
      </TabsContent>
    </Tabs>
  );
}

