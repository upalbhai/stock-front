"use client";

import * as React from "react";
import Image from "next/image";
import {
  ReceiptText,
  Boxes,
  CreditCard,
  FileSpreadsheet,
  Store,
  Building2,
  Check,
  Printer,
  QrCode,
  ArrowRight,
  TrendingUp,
  AlertTriangle,
  Shield,
  Search,
  SlidersHorizontal,
  Clock,
  Send,
  Lock,
  Eye,
  Laptop,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

/**
 * 1. Billing POS Terminal Simulation & Hardware Mockup
 */
export function BillingPreview() {
  const [view, setView] = React.useState<"mockup" | "terminal">("mockup");
  const [activePayment, setActivePayment] = React.useState<"upi" | "cash" | "card" | "credit">("upi");

  return (
    <div className="rounded-xl border border-border bg-card shadow-xs overflow-hidden text-xs">
      {/* Top Switcher Bar */}
      <div className="flex h-10 items-center justify-between border-b border-border bg-muted/40 px-3.5">
        <div className="flex items-center gap-1.5 font-semibold text-foreground">
          <Store className="h-3.5 w-3.5 text-primary" />
          <span>Counter Register</span>
        </div>

        {/* View toggle pills */}
        <div className="flex items-center rounded-lg border border-border/80 bg-background/80 p-0.5 text-[11px] font-medium">
          <button
            type="button"
            onClick={() => setView("mockup")}
            className={cn(
              "flex items-center gap-1 rounded-md px-2.5 py-1 transition-colors",
              view === "mockup"
                ? "bg-primary text-primary-foreground font-semibold shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Eye className="h-3 w-3" />
            <span>Hardware View</span>
          </button>
          <button
            type="button"
            onClick={() => setView("terminal")}
            className={cn(
              "flex items-center gap-1 rounded-md px-2.5 py-1 transition-colors",
              view === "terminal"
                ? "bg-primary text-primary-foreground font-semibold shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Laptop className="h-3 w-3" />
            <span>Interactive POS</span>
          </button>
        </div>
      </div>

      {view === "mockup" ? (
        <div className="relative aspect-[4/3] w-full overflow-hidden bg-muted/30">
          <Image
            src="/features/billing.webp"
            alt="MiniHisab POS billing counter touchscreen terminal, barcode scanner and thermal receipt printer"
            fill
            sizes="(max-width: 768px) 100vw, 50vw"
            className="object-cover transition-transform duration-300 hover:scale-[1.02]"
            priority
          />
          <div className="absolute bottom-2.5 left-3 right-3 flex items-center justify-between rounded-lg border border-border/80 bg-background/90 px-3 py-1.5 backdrop-blur-xs text-[11px]">
            <span className="font-semibold text-foreground">Complete POS Counter Setup</span>
            <span className="text-emerald-600 dark:text-emerald-400 font-mono text-[10px] font-semibold flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" /> 80mm ESC/POS Ready
            </span>
          </div>
        </div>
      ) : (
        /* Bill Items Terminal */
        <div className="p-3.5 sm:p-4 space-y-3">
          <div className="space-y-2 font-mono">
            <div className="flex justify-between pb-1.5 border-b border-border text-[10px] uppercase tracking-wider text-muted-foreground">
              <span>Item Description</span>
              <div className="flex gap-4 sm:gap-6 text-right">
                <span>Qty</span>
                <span>Rate</span>
                <span>Total</span>
              </div>
            </div>

            <div className="flex justify-between items-center text-foreground">
              <div className="truncate max-w-[150px] sm:max-w-[200px]">
                <p className="font-semibold truncate">Wireless 2D Scanner</p>
                <p className="text-[10px] text-muted-foreground font-sans">HSN 8471 • Tax 18%</p>
              </div>
              <div className="flex gap-4 sm:gap-6 text-right font-medium">
                <span>1</span>
                <span className="text-muted-foreground">₹1,250</span>
                <span className="font-semibold">₹1,250.00</span>
              </div>
            </div>

            <div className="flex justify-between items-center text-foreground">
              <div className="truncate max-w-[150px] sm:max-w-[200px]">
                <p className="font-semibold truncate">Thermal Paper 80mm Roll</p>
                <p className="text-[10px] text-muted-foreground font-sans">HSN 4811 • Tax 12%</p>
              </div>
              <div className="flex gap-4 sm:gap-6 text-right font-medium">
                <span>5</span>
                <span className="text-muted-foreground">₹55</span>
                <span className="font-semibold">₹275.00</span>
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-border bg-muted/20 p-2.5 font-mono space-y-1">
            <div className="flex justify-between text-muted-foreground text-[11px]">
              <span>Subtotal</span>
              <span>₹1,525.00</span>
            </div>
            <div className="flex justify-between text-muted-foreground text-[11px]">
              <span>Taxes (CGST + SGST)</span>
              <span>₹258.00</span>
            </div>
            <div className="pt-1.5 border-t border-border flex justify-between font-bold text-sm text-foreground">
              <span>Bill Total</span>
              <span className="text-primary font-mono">₹1,783.00</span>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-1.5 text-center font-medium">
            {(["upi", "cash", "card", "credit"] as const).map((method) => (
              <button
                key={method}
                type="button"
                onClick={() => setActivePayment(method)}
                className={cn(
                  "py-1.5 rounded-md border text-[11px] capitalize transition-colors",
                  activePayment === method
                    ? "border-primary bg-primary/10 text-primary font-semibold"
                    : "border-border bg-card text-muted-foreground hover:text-foreground"
                )}
              >
                {method === "upi" ? "UPI QR" : method}
              </button>
            ))}
          </div>

          <div className="flex items-center justify-between pt-1 border-t border-border/70 text-[10px] text-muted-foreground font-mono">
            <span>[F2] Search</span>
            <span>[F4] Discount</span>
            <span className="font-semibold text-primary">[F9] Print &amp; Close</span>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * 2. Retail & Wholesale Inventory Simulation & Graphic
 */
export function InventoryPreview() {
  const [view, setView] = React.useState<"mockup" | "registry">("mockup");

  return (
    <div className="rounded-xl border border-border bg-card shadow-xs overflow-hidden text-xs">
      <div className="flex h-10 items-center justify-between border-b border-border bg-muted/40 px-3.5">
        <div className="flex items-center gap-2 font-semibold text-foreground">
          <Boxes className="h-3.5 w-3.5 text-primary" />
          <span>Warehouse &amp; Stock Control</span>
        </div>

        <div className="flex items-center rounded-lg border border-border/80 bg-background/80 p-0.5 text-[11px] font-medium">
          <button
            type="button"
            onClick={() => setView("mockup")}
            className={cn(
              "flex items-center gap-1 rounded-md px-2.5 py-1 transition-colors",
              view === "mockup"
                ? "bg-primary text-primary-foreground font-semibold shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Eye className="h-3 w-3" />
            <span>Warehouse View</span>
          </button>
          <button
            type="button"
            onClick={() => setView("registry")}
            className={cn(
              "flex items-center gap-1 rounded-md px-2.5 py-1 transition-colors",
              view === "registry"
                ? "bg-primary text-primary-foreground font-semibold shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Laptop className="h-3 w-3" />
            <span>Stock Registry</span>
          </button>
        </div>
      </div>

      {view === "mockup" ? (
        <div className="relative aspect-[4/3] w-full overflow-hidden bg-muted/30">
          <Image
            src="/features/inventory.webp"
            alt="MiniHisab warehouse stock control with master cartons, barcode scanner, and digital inventory dashboard"
            fill
            sizes="(max-width: 768px) 100vw, 50vw"
            className="object-cover transition-transform duration-300 hover:scale-[1.02]"
          />
          <div className="absolute bottom-2.5 left-3 right-3 flex items-center justify-between rounded-lg border border-border/80 bg-background/90 px-3 py-1.5 backdrop-blur-xs text-[11px]">
            <span className="font-semibold text-foreground">Master Cartons &amp; Godown Shelves</span>
            <span className="text-primary font-mono text-[10px] font-semibold">Real-time Barcode Sync</span>
          </div>
        </div>
      ) : (
        <div className="p-3.5 sm:p-4 space-y-3">
          <div className="flex items-center justify-between rounded-md border border-border bg-muted/20 px-2.5 py-1.5 text-muted-foreground">
            <div className="flex items-center gap-1.5 text-[11px]">
              <Search className="h-3 w-3 text-muted-foreground" />
              <span>Search SKU, barcode, or carton size...</span>
            </div>
            <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-mono">Ctrl + K</span>
          </div>

          <div className="divide-y divide-border rounded-lg border border-border overflow-hidden">
            <div className="p-2.5 bg-card space-y-1">
              <div className="flex items-center justify-between">
                <div className="font-semibold text-foreground truncate max-w-[180px]">
                  Cotton Drill Fabric 50m Roll
                </div>
                <span className="font-mono text-emerald-600 dark:text-emerald-400 font-semibold">
                  18 Cartons In Stock
                </span>
              </div>
              <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                <span>SKU: CTN-DRL-50 • 40 Rolls/Ctn</span>
                <span className="font-mono">Central Godown #2</span>
              </div>
            </div>

            <div className="p-2.5 bg-amber-500/5 space-y-1">
              <div className="flex items-center justify-between">
                <div className="font-semibold text-foreground truncate max-w-[180px] flex items-center gap-1.5">
                  <AlertTriangle className="h-3 w-3 text-amber-500 shrink-0" />
                  <span>Thermal Rolls 80mm</span>
                </div>
                <span className="font-mono text-amber-600 dark:text-amber-400 font-semibold">
                  4 Rolls Remaining
                </span>
              </div>
              <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                <span>SKU: PPR-80 • Min Level: 20 Rolls</span>
                <span className="text-primary font-medium hover:underline cursor-pointer">
                  + Create PO
                </span>
              </div>
            </div>

            <div className="p-2.5 bg-card space-y-1">
              <div className="flex items-center justify-between">
                <div className="font-semibold text-foreground truncate max-w-[180px]">
                  USB Cash Drawer Trigger
                </div>
                <span className="font-mono text-foreground font-semibold">
                  24 Units
                </span>
              </div>
              <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                <span>SKU: CBL-CD-USB • Shelf B-03</span>
                <span className="font-mono">Counter Store</span>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-1 text-[11px] text-muted-foreground">
            <span>Barcode scanning auto-adjusts quantities</span>
            <span className="font-mono text-primary font-semibold">Sync: Active</span>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * 3. Customer Khata Simulation & Graphic
 */
export function CustomerKhataPreview() {
  const [view, setView] = React.useState<"mockup" | "ledger">("mockup");

  return (
    <div className="rounded-xl border border-border bg-card shadow-xs overflow-hidden text-xs">
      <div className="flex h-10 items-center justify-between border-b border-border bg-muted/40 px-3.5">
        <div className="flex items-center gap-2 font-semibold text-foreground">
          <CreditCard className="h-3.5 w-3.5 text-primary" />
          <span>Customer Khata Ledger</span>
        </div>

        <div className="flex items-center rounded-lg border border-border/80 bg-background/80 p-0.5 text-[11px] font-medium">
          <button
            type="button"
            onClick={() => setView("mockup")}
            className={cn(
              "flex items-center gap-1 rounded-md px-2.5 py-1 transition-colors",
              view === "mockup"
                ? "bg-primary text-primary-foreground font-semibold shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Eye className="h-3 w-3" />
            <span>Tablet View</span>
          </button>
          <button
            type="button"
            onClick={() => setView("ledger")}
            className={cn(
              "flex items-center gap-1 rounded-md px-2.5 py-1 transition-colors",
              view === "ledger"
                ? "bg-primary text-primary-foreground font-semibold shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Laptop className="h-3 w-3" />
            <span>Ledger Entries</span>
          </button>
        </div>
      </div>

      {view === "mockup" ? (
        <div className="relative aspect-[4/3] w-full overflow-hidden bg-muted/30">
          <Image
            src="/features/customer-khata.webp"
            alt="MiniHisab digital customer khata ledger on tablet with payment history and balance"
            fill
            sizes="(max-width: 768px) 100vw, 50vw"
            className="object-cover transition-transform duration-300 hover:scale-[1.02]"
          />
          <div className="absolute bottom-2.5 left-3 right-3 flex items-center justify-between rounded-lg border border-border/80 bg-background/90 px-3 py-1.5 backdrop-blur-xs text-[11px]">
            <span className="font-semibold text-foreground">Digital Udhar Bahi Khata</span>
            <span className="text-emerald-600 dark:text-emerald-400 font-mono text-[10px] font-semibold">1-Click WhatsApp Reminders</span>
          </div>
        </div>
      ) : (
        <div className="p-3.5 sm:p-4 space-y-3">
          <div className="rounded-lg border border-border bg-muted/20 p-3 space-y-1.5">
            <div className="flex justify-between items-baseline">
              <span className="font-semibold text-foreground">Outstanding Credit (Udhar)</span>
              <span className="font-mono text-base font-bold text-red-600 dark:text-red-400">
                ₹45,200.00
              </span>
            </div>
            <div className="flex justify-between text-[11px] text-muted-foreground pt-1 border-t border-border/60">
              <span>Agreed Terms: 30-Day Credit</span>
              <span className="font-medium text-amber-600 dark:text-amber-400">Due in 14 days</span>
            </div>
          </div>

          <div className="space-y-1.5 font-mono text-[11px]">
            <div className="flex justify-between pb-1 border-b border-border text-[10px] uppercase text-muted-foreground">
              <span>Date &amp; Details</span>
              <span>Debit / Credit</span>
            </div>

            <div className="flex justify-between items-center py-1 border-b border-border/50">
              <div>
                <p className="font-semibold text-foreground">B2B Order #INV-8821</p>
                <p className="text-[10px] text-muted-foreground font-sans">10 ctn fabric dispatch</p>
              </div>
              <div className="text-right">
                <span className="text-red-600 dark:text-red-400 font-semibold">+₹85,000.00</span>
                <p className="text-[10px] text-muted-foreground">Debit</p>
              </div>
            </div>

            <div className="flex justify-between items-center py-1">
              <div>
                <p className="font-semibold text-foreground">NEFT Payment Recd</p>
                <p className="text-[10px] text-muted-foreground font-sans">Bank Ref: HDFC9901</p>
              </div>
              <div className="text-right">
                <span className="text-emerald-600 dark:text-emerald-400 font-semibold">-₹39,800.00</span>
                <p className="text-[10px] text-muted-foreground">Credit</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-1">
            <Button size="sm" variant="outline" className="h-8 text-[11px] font-semibold">
              <Send className="h-3 w-3 mr-1" /> WhatsApp Summary
            </Button>
            <Button size="sm" className="h-8 text-[11px] font-semibold">
              + Record Payment
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * 4. GST Invoices Simulation & Official Graphic
 */
export function GstInvoicePreview() {
  const [view, setView] = React.useState<"mockup" | "details">("mockup");

  return (
    <div className="rounded-xl border border-border bg-card shadow-xs overflow-hidden text-xs">
      <div className="flex h-10 items-center justify-between border-b border-border bg-muted/40 px-3.5">
        <div className="flex items-center gap-2 font-semibold text-foreground">
          <FileSpreadsheet className="h-3.5 w-3.5 text-primary" />
          <span>GST Invoices &amp; E-Way Bills</span>
        </div>

        <div className="flex items-center rounded-lg border border-border/80 bg-background/80 p-0.5 text-[11px] font-medium">
          <button
            type="button"
            onClick={() => setView("mockup")}
            className={cn(
              "flex items-center gap-1 rounded-md px-2.5 py-1 transition-colors",
              view === "mockup"
                ? "bg-primary text-primary-foreground font-semibold shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Eye className="h-3 w-3" />
            <span>Invoice Document</span>
          </button>
          <button
            type="button"
            onClick={() => setView("details")}
            className={cn(
              "flex items-center gap-1 rounded-md px-2.5 py-1 transition-colors",
              view === "details"
                ? "bg-primary text-primary-foreground font-semibold shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Laptop className="h-3 w-3" />
            <span>Tax Slabs</span>
          </button>
        </div>
      </div>

      {view === "mockup" ? (
        <div className="relative aspect-[4/3] w-full overflow-hidden bg-muted/30">
          <Image
            src="/features/gst-invoices.webp"
            alt="Official A4 GST Tax Invoice and E-Way bill layout with QR code and vehicle dispatch details"
            fill
            sizes="(max-width: 768px) 100vw, 50vw"
            className="object-cover transition-transform duration-300 hover:scale-[1.02]"
          />
          <div className="absolute bottom-2.5 left-3 right-3 flex items-center justify-between rounded-lg border border-border/80 bg-background/90 px-3 py-1.5 backdrop-blur-xs text-[11px]">
            <span className="font-semibold text-foreground">A4 B2B Tax Invoice &amp; Dispatch</span>
            <span className="text-primary font-mono text-[10px] font-semibold">HSN &amp; E-Way Compliant</span>
          </div>
        </div>
      ) : (
        <div className="p-3.5 sm:p-4 space-y-3 font-mono">
          <div className="grid grid-cols-2 gap-2 text-[11px] rounded-lg border border-border bg-muted/20 p-2.5">
            <div>
              <p className="text-[10px] text-muted-foreground uppercase font-sans">Supplier (Seller)</p>
              <p className="font-semibold text-foreground font-sans truncate">MiniHisab Central Hub</p>
              <p className="text-muted-foreground">GSTIN: 24AAACH8821F1ZX</p>
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground uppercase font-sans">Buyer (B2B)</p>
              <p className="font-semibold text-foreground font-sans truncate">Rajesh Electronics</p>
              <p className="text-muted-foreground">GSTIN: 24AAACR1234F1Z1</p>
            </div>
          </div>

          <div className="space-y-1.5 text-[11px]">
            <div className="flex justify-between pb-1 border-b border-border text-[10px] uppercase text-muted-foreground">
              <span>HSN / Item</span>
              <div className="flex gap-4 text-right">
                <span>Taxable</span>
                <span>GST</span>
                <span>Total</span>
              </div>
            </div>

            <div className="flex justify-between items-center text-foreground">
              <span className="truncate max-w-[130px] font-sans">8471 • 2D Scanners (10 pcs)</span>
              <div className="flex gap-4 text-right">
                <span>₹12,500</span>
                <span className="text-muted-foreground">18%</span>
                <span className="font-semibold">₹14,750</span>
              </div>
            </div>

            <div className="flex justify-between items-center text-foreground">
              <span className="truncate max-w-[130px] font-sans">4811 • Thermal Roll (50 pcs)</span>
              <div className="flex gap-4 text-right">
                <span>₹2,750</span>
                <span className="text-muted-foreground">12%</span>
                <span className="font-semibold">₹3,080</span>
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-border bg-muted/20 p-2 text-[11px] space-y-1">
            <div className="flex justify-between text-muted-foreground">
              <span>Total Taxable Value</span>
              <span>₹15,250.00</span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>CGST (₹1,290.00) + SGST (₹1,290.00)</span>
              <span>₹2,580.00</span>
            </div>
            <div className="pt-1 border-t border-border flex justify-between font-bold text-foreground text-xs">
              <span>Invoice Value (INR)</span>
              <span className="text-primary">₹17,830.00</span>
            </div>
          </div>

          <div className="flex gap-2 pt-1 font-sans">
            <Button size="sm" variant="outline" className="flex-1 h-8 text-[11px] font-semibold">
              <Printer className="h-3 w-3 mr-1" /> 80mm Thermal
            </Button>
            <Button size="sm" className="flex-1 h-8 text-[11px] font-semibold">
              <FileSpreadsheet className="h-3 w-3 mr-1" /> A4 GST Invoice
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * 5. Multi-Outlet & Godown Preview
 */
export function MultiOutletPreview() {
  return (
    <div className="rounded-xl border border-border bg-card shadow-xs overflow-hidden text-xs">
      <div className="flex h-10 items-center justify-between border-b border-border bg-muted/40 px-3.5">
        <div className="flex items-center gap-2 font-semibold text-foreground">
          <Building2 className="h-3.5 w-3.5 text-primary" />
          <span>Multi-Location Synchronization</span>
        </div>
        <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
          Real-time Sync Active
        </span>
      </div>

      <div className="p-3.5 sm:p-4 space-y-3">
        <div className="grid grid-cols-2 gap-2">
          {/* Branch 1 */}
          <div className="rounded-lg border border-border bg-muted/20 p-2.5 space-y-1">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-foreground">Main Retail Counter</span>
              <Badge variant="outline" className="text-[10px] font-mono">Store #01</Badge>
            </div>
            <p className="text-[11px] text-muted-foreground">14 units on shelf</p>
            <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">Sales open today</p>
          </div>

          {/* Branch 2 */}
          <div className="rounded-lg border border-border bg-muted/20 p-2.5 space-y-1">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-foreground">Central Godown #2</span>
              <Badge variant="outline" className="text-[10px] font-mono">Wholesale</Badge>
            </div>
            <p className="text-[11px] text-muted-foreground">120 master cartons</p>
            <p className="text-[10px] text-primary font-medium">Dispatch active</p>
          </div>
        </div>

        {/* Transfer Challan */}
        <div className="rounded-lg border border-border p-2.5 bg-card space-y-1.5">
          <div className="flex justify-between items-center text-[11px]">
            <span className="font-semibold text-foreground">Stock Transfer in Transit</span>
            <span className="font-mono text-muted-foreground text-[10px]">Challan #ST-442</span>
          </div>
          <div className="flex justify-between text-muted-foreground text-[11px]">
            <span>15 Master Cartons</span>
            <span className="text-foreground font-mono">Godown #2 → Store #01</span>
          </div>
        </div>

        <Button size="sm" variant="outline" className="w-full h-8 text-[11px] font-semibold">
          + Initiate Stock Transfer Request
        </Button>
      </div>
    </div>
  );
}

/**
 * 6. Daily Reconciliation & Reports Preview
 */
export function ReportsPreview() {
  return (
    <div className="rounded-xl border border-border bg-card shadow-xs overflow-hidden text-xs">
      <div className="flex h-10 items-center justify-between border-b border-border bg-muted/40 px-3.5">
        <div className="flex items-center gap-2 font-semibold text-foreground">
          <TrendingUp className="h-3.5 w-3.5 text-primary" />
          <span>Daily Closing Reconciliation</span>
        </div>
        <span className="font-mono text-[10px] text-muted-foreground">Today's Shift</span>
      </div>

      <div className="p-3.5 sm:p-4 space-y-3 font-mono">
        <div className="grid grid-cols-2 gap-2 text-center">
          <div className="rounded-lg border border-border bg-muted/20 p-2">
            <p className="text-[10px] text-muted-foreground uppercase font-sans">Gross Turn-over</p>
            <p className="text-base font-bold text-foreground">₹48,650.00</p>
          </div>
          <div className="rounded-lg border border-border bg-muted/20 p-2">
            <p className="text-[10px] text-muted-foreground uppercase font-sans">Gross Margin</p>
            <p className="text-base font-bold text-emerald-600 dark:text-emerald-400">28.4%</p>
          </div>
        </div>

        <div className="rounded-lg border border-border p-2.5 space-y-1.5 text-[11px]">
          <div className="flex justify-between text-muted-foreground">
            <span>Cash in Till</span>
            <span className="text-foreground font-semibold">₹16,400.00</span>
          </div>
          <div className="flex justify-between text-muted-foreground">
            <span>UPI Instant Settlements</span>
            <span className="text-foreground font-semibold">₹28,250.00</span>
          </div>
          <div className="flex justify-between text-muted-foreground">
            <span>Card Swipes</span>
            <span className="text-foreground font-semibold">₹4,000.00</span>
          </div>
        </div>

        <div className="flex justify-between items-center text-[11px] font-sans text-muted-foreground pt-1 border-t border-border/60">
          <span>Counter reconciled by cashier</span>
          <span className="font-mono font-semibold text-foreground">Balanced</span>
        </div>
      </div>
    </div>
  );
}

/**
 * 7. Staff Roles & Permission Matrix Preview
 */
export function StaffRolesPreview() {
  return (
    <div className="rounded-xl border border-border bg-card shadow-xs overflow-hidden text-xs">
      <div className="flex h-10 items-center justify-between border-b border-border bg-muted/40 px-3.5">
        <div className="flex items-center gap-2 font-semibold text-foreground">
          <Shield className="h-3.5 w-3.5 text-primary" />
          <span>Role &amp; Staff Access Controls</span>
        </div>
        <Badge variant="outline" className="text-[10px] font-mono">Protected</Badge>
      </div>

      <div className="p-3.5 sm:p-4 space-y-2.5">
        <div className="space-y-2">
          {/* Cashier */}
          <div className="flex items-center justify-between p-2 rounded-lg border border-border bg-muted/20">
            <div>
              <p className="font-semibold text-foreground">Counter Cashier</p>
              <p className="text-[11px] text-muted-foreground">POS checkout, barcode scan, cash collection</p>
            </div>
            <div className="flex items-center gap-1.5 text-[10px] text-amber-600 dark:text-amber-400">
              <Lock className="h-3 w-3" /> Cost Hidden
            </div>
          </div>

          {/* Store Manager */}
          <div className="flex items-center justify-between p-2 rounded-lg border border-border bg-card">
            <div>
              <p className="font-semibold text-foreground">Store Manager</p>
              <p className="text-[11px] text-muted-foreground">Discounts, stock adjustments, void bills</p>
            </div>
            <div className="flex items-center gap-1.5 text-[10px] text-emerald-600 dark:text-emerald-400">
              <Check className="h-3 w-3" /> Full Counter Access
            </div>
          </div>

          {/* Business Owner */}
          <div className="flex items-center justify-between p-2 rounded-lg border border-primary/30 bg-primary/5">
            <div>
              <p className="font-semibold text-foreground">Business Owner</p>
              <p className="text-[11px] text-muted-foreground">P&amp;L reports, tax returns, multi-outlet config</p>
            </div>
            <span className="text-[10px] font-bold text-primary uppercase font-mono">Admin</span>
          </div>
        </div>

        <p className="text-[11px] text-muted-foreground text-center pt-1">
          Every sensitive action is recorded to the audit log.
        </p>
      </div>
    </div>
  );
}
