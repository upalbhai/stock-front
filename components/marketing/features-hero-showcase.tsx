"use client";

import * as React from "react";
import {
  ReceiptText,
  Boxes,
  CreditCard,
  FileSpreadsheet,
  Building2,
  Check,
  ArrowRight,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

const modules = [
  {
    id: "billing",
    label: "POS Billing",
    icon: ReceiptText,
    badge: "0.8s Scan",
    title: "High-Speed Counter Register",
    role: "Counter Cashiers",
    hardware: "USB/Bluetooth 80mm ESC/POS, 1D/2D Barcode Gun",
    points: [
      "Auto-detects barcode scanners without configuration",
      "Instant 80mm thermal receipt with cash drawer trigger",
      "Split tender: Cash + UPI QR + Store Credit in one bill",
    ],
    anchor: "#billing",
  },
  {
    id: "inventory",
    label: "Inventory",
    icon: Boxes,
    badge: "Carton & Unit",
    title: "Dual-Unit Warehouse Stock",
    role: "Godown & Stock Managers",
    hardware: "Any PC, Laptop, or Tablet Browser",
    points: [
      "Master carton to loose piece conversion factor per SKU",
      "Low-stock alerts before shelves run empty",
      "Batch, manufacturing, and expiry date management",
    ],
    anchor: "#inventory",
  },
  {
    id: "khata",
    label: "Customer Khata",
    icon: CreditCard,
    badge: "Credit Caps",
    title: "Digital Customer Udhar Ledger",
    role: "Store Owners & Accounts",
    hardware: "Web Browser & Mobile Screens",
    points: [
      "Real-time customer running balances and credit limits",
      "Full transaction logs: credit sales and collections",
      "Filter transactions by date range and print statements",
    ],
    anchor: "#customer-khata",
  },
  {
    id: "gst",
    label: "GST Invoices",
    icon: FileSpreadsheet,
    badge: "100% Compliant",
    title: "A4 B2B Tax Invoices & E-Way",
    role: "Wholesale Dispatch & Accountants",
    hardware: "Standard A4/A5 Laser or Inkjet Printers",
    points: [
      "Buyer GSTIN verification and auto-filled tax rates",
      "Auto-calculated HSN summaries for GSTR-1 preparation",
      "Transport vehicle numbers and delivery dispatch notes",
    ],
    anchor: "#gst-invoices",
  },
  {
    id: "multi-outlet",
    label: "Multi-Outlet",
    icon: Building2,
    badge: "Live Sync",
    title: "Multi-Branch & Godown Sync",
    role: "Business Owners & Regional Heads",
    hardware: "Cloud Centralized Across All Outlets",
    points: [
      "Central godown to retail store stock transfer challans",
      "Transfer confirmation workflows preventing stock loss",
      "Consolidated sales reports across all branches combined",
    ],
    anchor: "#multi-outlet",
  },
];

export function FeaturesHeroShowcase() {
  return (
    <Tabs
      defaultValue="billing"
      className="rounded-xl border border-border bg-card shadow-xs overflow-hidden text-xs"
    >
      {/* ── TOP SWITCHER TABS ────────────────────────────────────────────── */}
      <div className="border-b border-border bg-muted/40 p-1.5 overflow-x-auto">
        <TabsList className="w-full flex gap-1 bg-transparent border-0 p-0 h-auto rounded-none min-w-[340px]">
          {modules.map((m) => {
            const Icon = m.icon;
            return (
              <TabsTrigger
                key={m.id}
                value={m.id}
                className="flex-1 flex items-center justify-center gap-1.5 rounded-lg py-2 px-2.5 text-[11px] font-semibold data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-xs data-[state=active]:border data-[state=active]:border-border/80 text-muted-foreground hover:text-foreground cursor-pointer transition-all"
              >
                <Icon className="h-3.5 w-3.5 text-primary shrink-0" />
                <span className="truncate">{m.label}</span>
              </TabsTrigger>
            );
          })}
        </TabsList>
      </div>

      {/* ── STATUS HEADER BAR ────────────────────────────────────────────── */}
      <div className="flex h-8 items-center justify-between border-b border-border bg-muted/20 px-3.5 text-[11px]">
        <div className="flex items-center gap-2">
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
          </span>
          <span className="font-semibold text-foreground text-[11px]">
            Feature Matrix Explorer
          </span>
          <span className="text-muted-foreground font-mono">•</span>
          <span className="text-muted-foreground text-[11px] font-mono">
            Interactive Tour
          </span>
        </div>

        <span className="text-primary font-medium text-[10px] font-mono hidden sm:inline">
          5 Core Engines
        </span>
      </div>

      {/* ── PANEL CONTENT ────────────────────────────────────────────────── */}
      <div className="p-4 space-y-3">
        {modules.map((m) => (
          <TabsContent key={m.id} value={m.id} className="mt-0 outline-none space-y-3">
            {/* Header with Title and Badge */}
            <div className="flex items-start justify-between gap-2">
              <div>
                <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-primary uppercase tracking-wider">
                  {m.badge}
                </span>
                <h3 className="font-heading text-sm font-bold text-foreground mt-0.5">
                  {m.title}
                </h3>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-muted/50 border border-border/80 text-muted-foreground shrink-0">
                {m.role}
              </span>
            </div>

            {/* Checklist */}
            <div className="rounded-lg border border-border bg-muted/20 p-3 space-y-1.5">
              {m.points.map((pt, idx) => (
                <div key={idx} className="flex items-start gap-2 text-xs text-foreground/90">
                  <Check className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5 stroke-[2.5]" />
                  <span className="leading-snug">{pt}</span>
                </div>
              ))}
            </div>

            {/* Hardware requirement badge */}
            <div className="flex items-center justify-between text-[11px] pt-1">
              <span className="text-muted-foreground text-[10px] truncate max-w-[220px]">
                Hardware: <strong className="text-foreground font-normal">{m.hardware}</strong>
              </span>
              <a
                href={m.anchor}
                className="inline-flex items-center text-xs font-semibold text-primary hover:underline shrink-0"
              >
                Jump to Specs <ArrowRight className="h-3 w-3 ml-1" />
              </a>
            </div>
          </TabsContent>
        ))}

        {/* Bottom Hardware Tag Strip */}
        <div className="pt-2 border-t border-border/70 flex items-center justify-between text-[10px] text-muted-foreground">
          <span className="flex items-center gap-1">
            <Check className="h-3 w-3 text-emerald-500 stroke-[3]" /> Zero driver installation required
          </span>
          <span className="font-mono text-primary font-medium">
            Web &amp; Desktop Ready
          </span>
        </div>
      </div>
    </Tabs>
  );
}
