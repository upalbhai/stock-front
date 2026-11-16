"use client";

import * as React from "react";
import Link from "next/link";
import {
  ReceiptText,
  Boxes,
  CreditCard,
  FileSpreadsheet,
  ArrowRight,
  Check,
  Zap,
  Building2,
  PhoneCall,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  BillingPreview,
  InventoryPreview,
  CustomerKhataPreview,
  GstInvoicePreview,
} from "@/components/marketing/feature-previews";
import { APP_ROUTES } from "@/lib/routes";

const features = [
  {
    id: "billing",
    label: "POS Counter Billing",
    icon: ReceiptText,
    badge: "0.8s Checkout Speed",
    headline: "Built for peak-hour rush counters with zero lag",
    description:
      "When customers are waiting in line, every second matters. Scan 1D or 2D barcodes, pick frequent items with one tap, split payment across cash and UPI QR, and trigger 80mm thermal receipts instantly.",
    highlights: [
      "Barcode scanner auto-adds quantity without clicking",
      "Split tender: collect partial cash and balance via UPI QR",
      "Direct ESC/POS thermal printing with cash drawer trigger",
      "100% keyboard shortcut driven (F2 for search, F9 to pay & print)",
    ],
    ctaHref: APP_ROUTES.FEATURES,
    ctaText: "Explore Counter POS Billing",
    previewComponent: BillingPreview,
  },
  {
    id: "inventory",
    label: "Godown & Multi-Outlet Stock",
    icon: Boxes,
    badge: "Cartons & Loose Units",
    headline: "Track warehouse cartons and counter loose units in one place",
    description:
      "Wholesale businesses buy in master cartons (such as 40 pieces per carton) and sell both full cartons to distributors and single pieces at retail counters. MiniHisab handles auto-conversion and inter-branch stock transfers so shelf counts stay accurate.",
    highlights: [
      "Master carton to single unit conversion factor per SKU",
      "Low stock alerts across retail shelves and godowns",
      "Move stock between branches with printable delivery challans",
      "Bulk inventory updates via CSV import in under 30 seconds",
    ],
    ctaHref: APP_ROUTES.FEATURES,
    ctaText: "Explore Stock Management",
    previewComponent: InventoryPreview,
  },
  {
    id: "khata",
    label: "Customer Udhar Khata",
    icon: CreditCard,
    badge: "Credit Ledger",
    headline: "Digital bahi-khata with running balances & credit limits",
    description:
      "Stop losing revenue to handwritten paper diaries. Maintain a clear running ledger for regular retail customers and 30-day wholesale accounts. Track who owes what, enforce credit limits, and record partial or full payment collections.",
    highlights: [
      "Real-time customer running balances with credit limit warnings",
      "Record partial or full payments via Cash, UPI, Card, or Bank transfer",
      "Complete transaction logs with bill reference numbers",
      "Filter transactions by date range and print ledger statements",
    ],
    ctaHref: APP_ROUTES.FEATURES,
    ctaText: "Explore Customer Khata",
    previewComponent: CustomerKhataPreview,
  },
  {
    id: "gst",
    label: "GST Tax Invoices",
    icon: FileSpreadsheet,
    badge: "100% Tax Compliant",
    headline: "A4 B2B tax invoices and compact 80mm thermal receipts",
    description:
      "Switch seamlessly between consumer thermal receipts and GST-compliant B2B invoices. Auto-calculates CGST, SGST, IGST, and HSN codes, with buyer GSTIN validation and transport details ready for tax filing.",
    highlights: [
      "A4/A5 laser tax invoices with vehicle number and transporter ID",
      "Auto-calculated HSN summaries with CGST, SGST, and IGST breakdowns",
      "Buyer GSTIN format verification before bill creation",
      "End-of-month tax summaries ready for your accountant",
    ],
    ctaHref: APP_ROUTES.FEATURES,
    ctaText: "Explore GST Invoices",
    previewComponent: GstInvoicePreview,
  },
];

export function FeatureShowroom() {
  const [activeTab, setActiveTab] = React.useState("billing");

  return (
    <div className="w-full">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        {/* Navigation Tabs Pill Bar */}
        <div className="flex justify-center mb-8">
          <TabsList className="h-auto p-1.5 bg-muted/60 border border-border/80 rounded-xl grid grid-cols-2 sm:grid-cols-4 gap-1.5 w-full max-w-3xl">
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <TabsTrigger
                  key={feature.id}
                  value={feature.id}
                  className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-xs font-semibold data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-xs data-[state=active]:border data-[state=active]:border-border/80 text-muted-foreground hover:text-foreground transition-all cursor-pointer"
                >
                  <Icon className="h-4 w-4 shrink-0 text-primary" />
                  <span className="truncate">{feature.label}</span>
                </TabsTrigger>
              );
            })}
          </TabsList>
        </div>

        {/* Tab Content Panels */}
        {features.map((feature) => {
          const Preview = feature.previewComponent;
          return (
            <TabsContent
              key={feature.id}
              value={feature.id}
              className="mt-0 outline-none focus-visible:ring-0"
            >
              <div className="rounded-2xl border border-border bg-card/60 p-6 sm:p-8 lg:p-10 shadow-xs">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
                  {/* Left Column: Feature Narrative & Highlights (5 cols) */}
                  <div className="lg:col-span-5 space-y-5">
                    <div>
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                        {feature.badge}
                      </span>
                    </div>

                    <h3 className="font-heading text-2xl font-bold tracking-tight text-foreground sm:text-3xl leading-snug">
                      {feature.headline}
                    </h3>

                    <p className="text-sm leading-relaxed text-muted-foreground">
                      {feature.description}
                    </p>

                    <div className="space-y-2.5 pt-2 border-t border-border/70">
                      {feature.highlights.map((highlight, idx) => (
                        <div key={idx} className="flex items-start gap-2.5 text-xs text-foreground/90">
                          <div className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary">
                            <Check className="h-2.5 w-2.5 stroke-[3]" />
                          </div>
                          <span className="leading-relaxed">{highlight}</span>
                        </div>
                      ))}
                    </div>

                    <div className="pt-3">
                      <Button asChild size="default" className="rounded-lg font-semibold shadow-xs">
                        <Link href={feature.ctaHref}>
                          {feature.ctaText}
                          <ArrowRight className="h-4 w-4 ml-1.5" />
                        </Link>
                      </Button>
                    </div>
                  </div>

                  {/* Right Column: Live Interactive Preview Simulator (7 cols) */}
                  <div className="lg:col-span-7">
                    <Preview />
                  </div>
                </div>
              </div>
            </TabsContent>
          );
        })}
      </Tabs>
    </div>
  );
}
