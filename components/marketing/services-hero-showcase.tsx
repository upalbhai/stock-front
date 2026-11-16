"use client";

import * as React from "react";
import {
  Store,
  Boxes,
  CreditCard,
  FileSpreadsheet,
  Check,
  Printer,
  Building2,
  Clock,
  ShieldCheck,
  Activity,
  Layers,
} from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

const operationalModules = [
  {
    icon: Printer,
    category: "POS Counter",
    title: "Fast Barcode Billing",
    desc: "80mm thermal receipts & split tender (Cash, UPI, Card)",
    status: "Active Register",
    statusColor: "text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
  },
  {
    icon: Boxes,
    category: "Inventory",
    title: "Carton & Unit Stock",
    desc: "Auto-converts master cartons into counter loose units",
    status: "Godown Synced",
    statusColor: "text-primary bg-primary/10 border-primary/20",
  },
  {
    icon: CreditCard,
    category: "Customer Ledger",
    title: "Digital Udhar Khata",
    desc: "Running customer balances, credit limits, and collections",
    status: "Zero Paper Diaries",
    statusColor: "text-amber-600 dark:text-amber-400 bg-amber-500/10 border-amber-500/20",
  },
  {
    icon: FileSpreadsheet,
    category: "Compliance",
    title: "GST Tax Invoices",
    desc: "A4 B2B invoices with auto-calculated HSN summaries",
    status: "CA-Ready Reports",
    statusColor: "text-blue-600 dark:text-blue-400 bg-blue-500/10 border-blue-500/20",
  },
];

const liveEvents = [
  {
    time: "Counter #01",
    icon: Store,
    title: "POS Bill Printed (80mm)",
    detail: "Fast barcode checkout with UPI QR payment verification",
    badge: "Completed",
    badgeColor: "text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
  },
  {
    time: "Godown #02",
    icon: Building2,
    title: "Stock Transfer Dispatched",
    detail: "15 master cartons moved from central warehouse to shop counter",
    badge: "In Transit",
    badgeColor: "text-blue-600 dark:text-blue-400 bg-blue-500/10 border-blue-500/20",
  },
  {
    time: "Khata Ledger",
    icon: CreditCard,
    title: "Customer Credit Payment",
    detail: "Payment recorded against running balance with instant receipt update",
    badge: "Settled",
    badgeColor: "text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
  },
];

export function ServicesHeroShowcase() {
  return (
    <Tabs
      defaultValue="modules"
      className="rounded-xl border border-border bg-card shadow-xs overflow-hidden text-xs"
    >
      {/* ── TOP TABS BAR (FULL WIDTH, NO WRAPPING OR CLIPPING) ─────────── */}
      <div className="border-b border-border bg-muted/40 p-1.5">
        <TabsList className="w-full grid grid-cols-2 gap-1.5 bg-transparent border-0 p-0 h-auto rounded-none">
          <TabsTrigger
            value="modules"
            className="flex items-center justify-center gap-2 rounded-lg py-2 px-3 text-xs font-semibold data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-xs data-[state=active]:border data-[state=active]:border-border/80 text-muted-foreground hover:text-foreground cursor-pointer transition-all"
          >
            <Layers className="h-3.5 w-3.5 text-primary shrink-0" />
            <span className="truncate">Core Store Modules</span>
          </TabsTrigger>

          <TabsTrigger
            value="stream"
            className="flex items-center justify-center gap-2 rounded-lg py-2 px-3 text-xs font-semibold data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-xs data-[state=active]:border data-[state=active]:border-border/80 text-muted-foreground hover:text-foreground cursor-pointer transition-all"
          >
            <Activity className="h-3.5 w-3.5 text-primary shrink-0" />
            <span className="truncate">Live Store Activity</span>
          </TabsTrigger>
        </TabsList>
      </div>

      {/* ── STATUS STRIP ─────────────────────────────────────────────────── */}
      <div className="flex h-8 items-center justify-between border-b border-border bg-muted/20 px-3.5 text-[11px]">
        <div className="flex items-center gap-2">
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
          </span>
          <span className="font-semibold text-foreground text-[11px]">
            Store Operations Console
          </span>
          <span className="text-muted-foreground font-mono">•</span>
          <span className="text-muted-foreground text-[11px] font-mono">
            All Systems Online
          </span>
        </div>

        <span className="text-emerald-600 dark:text-emerald-400 font-medium text-[10px] font-mono hidden sm:inline">
          Sync Active
        </span>
      </div>

      {/* ── PANEL CONTENT ────────────────────────────────────────────────── */}
      <div className="p-4 space-y-3">
        {/* Core Modules Tab */}
        <TabsContent value="modules" className="mt-0 outline-none">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {operationalModules.map((item, idx) => {
              const Icon = item.icon;
              return (
                <div
                  key={idx}
                  className="p-3 rounded-lg border border-border bg-muted/20 space-y-1.5 flex flex-col justify-between"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase font-bold text-muted-foreground">
                      {item.category}
                    </span>
                    <Icon className="h-3.5 w-3.5 text-primary" />
                  </div>
                  <div>
                    <p className="font-heading text-xs font-bold text-foreground">
                      {item.title}
                    </p>
                    <p className="text-[11px] text-muted-foreground leading-snug mt-0.5">
                      {item.desc}
                    </p>
                  </div>
                  <div className="pt-1">
                    <span
                      className={cn(
                        "inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full border",
                        item.statusColor
                      )}
                    >
                      <Check className="h-2.5 w-2.5 stroke-[3]" /> {item.status}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </TabsContent>

        {/* Workflow View Tab */}
        <TabsContent value="stream" className="mt-0 outline-none space-y-2">
          {liveEvents.map((evt, idx) => {
            const Icon = evt.icon;
            return (
              <div
                key={idx}
                className="p-2.5 rounded-lg border border-border bg-muted/20 space-y-1"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Icon className="h-3.5 w-3.5 text-primary shrink-0" />
                    <span className="font-semibold text-foreground text-[11px]">
                      {evt.title}
                    </span>
                  </div>
                  <span
                    className={cn(
                      "text-[10px] font-medium px-1.5 py-0.2 rounded border",
                      evt.badgeColor
                    )}
                  >
                    {evt.badge}
                  </span>
                </div>
                <p className="text-[11px] text-muted-foreground leading-snug">
                  {evt.detail}
                </p>
                <div className="text-[10px] font-mono text-muted-foreground pt-0.5">
                  Location: {evt.time}
                </div>
              </div>
            );
          })}
        </TabsContent>

        {/* Bottom Hardware Tag Strip */}
        <div className="pt-2 border-t border-border/70 flex items-center justify-between text-[10px] text-muted-foreground">
          <span className="flex items-center gap-1">
            <Check className="h-3 w-3 text-emerald-500 stroke-[3]" /> 100% offline-ready counter backup
          </span>
          <span className="font-mono text-primary font-medium">
            Thermal ESC/POS Ready
          </span>
        </div>
      </div>
    </Tabs>
  );
}
