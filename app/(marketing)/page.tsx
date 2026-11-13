import * as React from "react";
import Link from "next/link";
import type { Metadata } from "next";
import {
  ArrowRight,
  BarChart3,
  Boxes,
  Check,
  CreditCard,
  FileText,
  Printer,
  ReceiptText,
  ShieldCheck,
  Store,
  Truck,
  Building2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { organizationSchema, websiteSchema, softwareApplicationSchema } from "@/lib/jsonld";
import { APP_ROUTES } from "@/lib/routes";
import { HeroShowcase } from "@/components/marketing/hero-showcase";

export const metadata: Metadata = {
  title: "MiniHisab | Retail & Wholesale Billing, Inventory & POS Software",
  description:
    "A service-first platform for retail shop owners and wholesale distributors who need fast barcode billing, B2B tax invoices, carton and unit inventory, customer credit ledgers, and GST reports.",
  keywords: [
    "retail billing software",
    "wholesale inventory management",
    "b2b invoice software",
    "pos billing counter",
    "gst invoice software",
    "customer khata ledger",
    "multi outlet inventory",
    "thermal receipt printer software",
  ],
  alternates: { canonical: "/" },
  openGraph: {
    title: "MiniHisab | Retail & Wholesale Billing, Inventory & POS Software",
    description:
      "Fast barcode billing, wholesale B2B invoices, multi-warehouse stock control, customer credit ledgers, and GST compliance.",
    url: "/",
    siteName: "MiniHisab",
    type: "website",
  },
};

const dailyWorkflows = [
  {
    phase: "Morning",
    title: "Opening & Stock Check",
    summary:
      "Review low-stock alerts before opening, receive incoming cartons from suppliers, and verify opening cash and bank balances.",
    items: [
      "Low-stock alerts across retail shelves and godowns",
      "Bulk inventory updates via CSV or manual inward entry",
      "Opening cash balance logged per outlet or counter",
    ],
  },
  {
    phase: "All Day",
    title: "Counter Billing & B2B Dispatch",
    summary:
      "Scan barcodes for retail walk-in customers or create wholesale B2B orders with carton rates, buyer GSTINs, and delivery challans.",
    items: [
      "Retail: Rapid barcode scanning & 80mm thermal receipts",
      "Wholesale: Tiered bulk pricing & A4 GST tax invoices",
      "Split tender: Cash, UPI QR, Card, and Store Credit",
    ],
  },
  {
    phase: "On Demand",
    title: "Customer Khata & Wholesale Credit",
    summary:
      "Maintain a clear running balance for regular shop customers and wholesale buyers with 15 or 30-day payment cycles.",
    items: [
      "Customer ledger with running balances and payment history",
      "Credit limit warnings before dispatching large wholesale orders",
      "Clear receipts for partial and full payment collections",
    ],
  },
  {
    phase: "Evening",
    title: "Closing & Tax Reporting",
    summary:
      "Reconcile counter sales against cash in drawer, review wholesale vs retail profit margins, and view GST tax summaries ready for filing.",
    items: [
      "End-of-day register closing report per counter",
      "Sales categorized by retail and wholesale B2B channels",
      "GST breakdown (CGST, SGST, IGST) with HSN summaries",
    ],
  },
];

const capabilities = [
  {
    icon: ReceiptText,
    title: "Fast Counter POS Billing",
    description:
      "Built for retail checkout counters. Supports barcode scanning, custom item pricing, quick SKU search, and instant thermal receipt printing.",
  },
  {
    icon: Truck,
    title: "Wholesale & B2B Invoicing",
    description:
      "Create high-volume wholesale invoices with buyer GSTIN, master carton quantities, volume-tiered rates, and transport details.",
  },
  {
    icon: Boxes,
    title: "Multi-Outlet & Godown Stock",
    description:
      "Track inventory across retail shops, godowns, and warehouses. Move stock between branches, monitor unit counts, and avoid stockouts.",
  },
  {
    icon: CreditCard,
    title: "Customer Credit (Udhar) Ledger",
    description:
      "Track customer balances and wholesale credit terms without paper notebooks. Record partial payments and print statement summaries.",
  },
  {
    icon: FileText,
    title: "GST Tax Invoices & Thermal Bills",
    description:
      "Generate standard A4/A5 tax invoices with auto-calculated GST and HSN codes, or compact thermal receipts for quick counter sales.",
  },
  {
    icon: BarChart3,
    title: "Daily Sales & Margin Analytics",
    description:
      "View total retail and wholesale sales, payment breakdown, profit margins, and fast-moving items from any device.",
  },
];

const hardwareSpecs = [
  {
    category: "Receipt & Laser Printers",
    description: "Standard ESC/POS thermal printers (58mm & 80mm roll width) over USB, Ethernet, or Bluetooth, plus standard A4/A5 laser and inkjet printers for wholesale invoices.",
  },
  {
    category: "Barcode Scanners",
    description: "Any standard 1D or 2D barcode scanner (USB plug-and-play, wireless 2.4GHz dongle, or Bluetooth).",
  },
  {
    category: "Supported Devices",
    description: "Runs in modern web browsers across Windows PCs, Macs, POS terminals, Android tablets, and iPads.",
  },
  {
    category: "Data Export & Backup",
    description: "Export sales records, stock inventories, customer ledgers, and tax summaries to Excel and CSV anytime.",
  },
];

export default function LandingPage() {
  return (
    <div>
      {/* Structured SEO Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify([
            organizationSchema(),
            websiteSchema(),
            softwareApplicationSchema(),
          ]),
        }}
      />

      {/* ── 2-COLUMN HERO (RETAIL & WHOLESALE BALANCED) ─────────────────── */}
      <section className="border-b border-border/70 bg-background pt-12 pb-16 md:pt-16 md:pb-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
            {/* Left Content Column (7 cols) */}
            <div className="lg:col-span-7">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                Retail &amp; Wholesale Operations
              </span>

              <h1 className="mt-4 font-heading text-3xl font-extrabold tracking-tight sm:text-4xl lg:text-5xl text-foreground">
                Billing, stock control, and GST for retail and wholesale.
              </h1>

              <p className="mt-4 max-w-2xl text-base leading-relaxed text-muted-foreground">
                Whether you run a fast-paced retail counter or manage bulk wholesale orders, MiniHisab gives you barcode billing, B2B tax invoices, carton and unit stock tracking, and customer credit ledgers from one place.
              </p>

              <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:items-center">
                <Button asChild size="lg" className="rounded-md font-semibold shadow-xs">
                  <Link href={APP_ROUTES.DASHBOARD}>
                    Open Dashboard <ArrowRight className="h-4 w-4 ml-1.5" />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="rounded-md font-semibold">
                  <Link href={APP_ROUTES.SERVICES}>Explore Services</Link>
                </Button>
                <Button asChild size="lg" variant="ghost" className="rounded-md text-muted-foreground">
                  <Link href={APP_ROUTES.PRICING}>View Pricing</Link>
                </Button>
              </div>

              <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-y-2.5 gap-x-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <Check className="h-3.5 w-3.5 text-primary shrink-0" /> Thermal POS (58mm/80mm) &amp; A4 GST
                </span>
                <span className="flex items-center gap-1.5">
                  <Check className="h-3.5 w-3.5 text-primary shrink-0" /> Master cartons &amp; single unit stock
                </span>
                <span className="flex items-center gap-1.5">
                  <Check className="h-3.5 w-3.5 text-primary shrink-0" /> Multi-outlet &amp; central warehouse sync
                </span>
                <span className="flex items-center gap-1.5">
                  <Check className="h-3.5 w-3.5 text-primary shrink-0" /> Customer khata &amp; B2B credit terms
                </span>
              </div>
            </div>

            {/* Right Interactive Showcase Column (5 cols) */}
            <div className="lg:col-span-5">
              <HeroShowcase />
            </div>
          </div>
        </div>
      </section>

      {/* ── CORE CAPABILITIES ─────────────────────────────────────────────── */}
      <section className="py-16 md:py-24 border-b border-border/70">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl">
            <h2 className="font-heading text-2xl font-bold tracking-tight sm:text-3xl text-foreground">
              Built for retail counters and wholesale warehouses.
            </h2>
            <p className="mt-3 text-base text-muted-foreground">
              Traditional software forces you into either a simple cash register or a complex accounting suite. MiniHisab gives you both: speed at the retail counter and control over wholesale bulk orders.
            </p>
          </div>

          <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {capabilities.map((cap) => {
              const Icon = cap.icon;
              return (
                <div
                  key={cap.title}
                  className="rounded-xl border border-border bg-card p-6 shadow-xs"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-primary/20 bg-primary/10 text-primary">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="mt-4 font-heading text-lg font-bold text-foreground">
                    {cap.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {cap.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── A DAY IN YOUR STORE / GODOWN ──────────────────────────────────── */}
      <section className="py-16 md:py-24 bg-muted/20 border-b border-border/70">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl">
            <h2 className="font-heading text-2xl font-bold tracking-tight sm:text-3xl text-foreground">
              How MiniHisab fits your daily operations.
            </h2>
            <p className="mt-3 text-base text-muted-foreground">
              From morning inward stock counts to all-day retail checkout, wholesale dispatch, and evening cash reconciliation, each step keeps your business organized.
            </p>
          </div>

          <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {dailyWorkflows.map((step) => (
              <div
                key={step.phase}
                className="rounded-xl border border-border bg-card p-5 flex flex-col justify-between"
              >
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-primary">
                    {step.phase}
                  </span>
                  <h3 className="mt-1 font-heading text-base font-bold text-foreground">
                    {step.title}
                  </h3>
                  <p className="mt-2.5 text-xs leading-relaxed text-muted-foreground">
                    {step.summary}
                  </p>
                </div>

                <div className="mt-5 pt-3 border-t border-border/60 space-y-1.5">
                  {step.items.map((item, i) => (
                    <div key={i} className="flex items-start gap-1.5 text-xs text-foreground/80">
                      <span className="text-primary font-bold">•</span>
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HARDWARE & ENVIRONMENT COMPATIBILITY ──────────────────────────── */}
      <section className="py-16 md:py-24 border-b border-border/70">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl">
            <h2 className="font-heading text-2xl font-bold tracking-tight sm:text-3xl text-foreground">
              Hardware compatibility &amp; deployment.
            </h2>
            <p className="mt-3 text-base text-muted-foreground">
              No proprietary terminals or expensive hardware locks. MiniHisab runs on the devices, barcode scanners, and printers you already own.
            </p>
          </div>

          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {hardwareSpecs.map((spec) => (
              <div key={spec.category} className="rounded-xl border border-border bg-card p-5">
                <h3 className="font-heading text-sm font-bold text-foreground">
                  {spec.category}
                </h3>
                <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                  {spec.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── GETTING STARTED CTA ───────────────────────────────────────────── */}
      <section className="py-16 md:py-20 bg-card">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="font-heading text-2xl font-bold tracking-tight sm:text-3xl text-foreground">
            Get started with your retail and wholesale operations.
          </h2>
          <p className="mt-3 max-w-xl mx-auto text-sm text-muted-foreground">
            Sign in to access your dashboard, or review our features and pricing plans before setting up your outlets and warehouses.
          </p>

          <div className="mt-6 flex flex-col sm:flex-row justify-center gap-3">
            <Button asChild size="lg" className="rounded-md font-semibold shadow-xs">
              <Link href={APP_ROUTES.LOGIN}>
                Sign In to Account <ArrowRight className="h-4 w-4 ml-1.5" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="rounded-md font-semibold">
              <Link href={APP_ROUTES.PRICING}>View Pricing Plans</Link>
            </Button>
          </div>

          <p className="mt-5 text-xs text-muted-foreground">
            Supported in Chrome, Edge, Safari, and Firefox. Runs on Windows, Mac, Android, and iOS.
          </p>
        </div>
      </section>
    </div>
  );
}
