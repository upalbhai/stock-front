import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  ReceiptText,
  Boxes,
  CreditCard,
  BarChart3,
  Building2,
  ShieldCheck,
  Check,
  FileSpreadsheet,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { ScrollReveal } from "@/components/marketing/scroll-reveal";
import { FeaturesHeroShowcase } from "@/components/marketing/features-hero-showcase";
import { APP_ROUTES } from "@/lib/routes";
import { serviceListSchema } from "@/lib/jsonld";
import {
  BillingPreview,
  InventoryPreview,
  CustomerKhataPreview,
  GstInvoicePreview,
  MultiOutletPreview,
  ReportsPreview,
  StaffRolesPreview,
} from "@/components/marketing/feature-previews";

export const metadata: Metadata = {
  title: "Features | Retail Billing & Wholesale Inventory | MiniHisab",
  description:
    "Explore MiniHisab features: POS barcode counter billing, master carton inventory, customer khata credit ledgers, GST tax invoices, and multi-outlet controls.",
  alternates: { canonical: "/features" },
};

const featureSections = [
  {
    id: "billing",
    tag: "Counter Checkout",
    title: "Fast POS Billing & Receipts",
    description:
      "Speed up checkout with barcode auto-scan, keyboard hotkeys, and instant thermal receipt printing for single items and bulk packs.",
    icon: ReceiptText,
    highlights: [
      "Auto-detect USB and Bluetooth 1D/2D barcode scanners",
      "Print to 58mm and 80mm ESC/POS thermal receipt printers",
      "Accept split payments across Cash, UPI QR, and store credit",
      "Hold active counter carts and resume without losing scanned items",
    ],
    link: "/features/billing",
    linkText: "Explore counter billing features",
    preview: <BillingPreview />,
  },
  {
    id: "inventory",
    tag: "Stock Control",
    title: "Unit & Master Carton Inventory",
    description:
      "Track loose retail units alongside master wholesale cartons with automated stock deductions and low-stock reorder alerts.",
    icon: Boxes,
    highlights: [
      "Master carton conversion (such as 40 rolls per carton or 12 units per box)",
      "Automated stock level deductions as bills are finalized",
      "Reorder warnings before best-selling inventory runs empty",
      "Batch number, manufacturing date, and expiry tracking",
    ],
    link: "/features/inventory",
    linkText: "Explore inventory features",
    preview: <InventoryPreview />,
  },
  {
    id: "customer-khata",
    tag: "Credit Management",
    title: "Customer Khata & Udhar Ledgers",
    description:
      "Replace paper registers with digital customer credit ledgers. Set credit limits, record partial payments, and track overdue balances.",
    icon: CreditCard,
    highlights: [
      "Track running balances (debit and credit) per customer profile",
      "Apply custom credit terms (such as 15-day or 30-day payment windows)",
      "Record partial or full settlements via UPI, Cash, or Bank Transfer",
      "Filter transactions by date range and print customer ledger statements",
    ],
    link: "/features/customer-khata",
    linkText: "Explore customer khata features",
    preview: <CustomerKhataPreview />,
  },
  {
    id: "gst-invoices",
    tag: "Tax Compliance",
    title: "GST Tax Invoices & E-Way Bills",
    description:
      "Generate compliant B2B tax invoices and retail cash memos with automatic CGST, SGST, and IGST rate calculations.",
    icon: FileSpreadsheet,
    highlights: [
      "Automatic HSN and SAC tax slab lookup (0%, 5%, 12%, 18%, 28%)",
      "Support for both tax-inclusive retail pricing and B2B tax-exclusive pricing",
      "Print full A4 tax invoices and export GSTR-1 ready sales reports for filing",
      "Capture buyer GSTIN and generate transportation dispatch details",
    ],
    link: "/features/gst-invoices",
    linkText: "Explore GST invoice features",
    preview: <GstInvoicePreview />,
  },
  {
    id: "multi-outlet",
    tag: "Multi-Location",
    title: "Multi-Outlet & Central Godown Sync",
    description:
      "Manage retail counters and wholesale storage godowns from one interface, with stock transfer challans and branch-wise reporting.",
    icon: Building2,
    highlights: [
      "View live stock levels across retail counters and central godowns",
      "Generate stock transfer dispatch challans between locations",
      "Prevent stock discrepancies with transfer confirmation workflows",
      "Compare counter sales velocity and daily turnover by outlet",
    ],
    preview: <MultiOutletPreview />,
  },
  {
    id: "reports",
    tag: "Financial Clarity",
    title: "Daily Counter Reconciliation & Reports",
    description:
      "Close registers with confidence using opening and closing cash reconciliation, payment mode breakdowns, and item-wise profit margins.",
    icon: BarChart3,
    highlights: [
      "Shift-end till balancing: cash in drawer vs UPI settlement totals",
      "Item-wise profit reports based on actual purchase costs",
      "Tax collection summaries categorized by CGST, SGST, and IGST",
      "Export clean CSV reports for internal bookkeeping and accountant review",
    ],
    preview: <ReportsPreview />,
  },
  {
    id: "staff-roles",
    tag: "Security & Access",
    title: "Staff Roles & Access Controls",
    description:
      "Provide cashiers and store managers the tools they need while shielding sensitive purchase costs and business profit margins.",
    icon: ShieldCheck,
    highlights: [
      "Role tiers for Cashier, Store Manager, and Business Owner",
      "Hide purchase costs and profit margins from counter cashiers",
      "Require manager authorization code to void bills or apply large discounts",
      "Immutable audit logs tracking bill modifications and stock adjustments",
    ],
    preview: <StaffRolesPreview />,
  },
];

export default function FeaturesPage() {
  const jsonLd = serviceListSchema(
    featureSections.map((section) => ({
      title: section.title,
      text: section.description,
    }))
  );

  return (
    <div>
      {/* Structured SEO Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* ── BALANCED 2-COLUMN HERO (NO WHITE VOID) ───────────────────────── */}
      <section className="border-b border-border/70 bg-background pt-8 pb-10 md:pt-10 md:pb-14">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center">
            {/* Left Content Column (7 cols) */}
            <div className="lg:col-span-7 space-y-4">
              <Breadcrumbs items={[{ name: "Features", url: "/features" }]} />

              <div>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                  Retail &amp; Wholesale Operations Engine
                </span>
              </div>

              <h1 className="font-heading text-3xl font-extrabold tracking-tight sm:text-4xl lg:text-5xl text-foreground leading-[1.15]">
                Built for fast retail checkout counters and wholesale godowns.
              </h1>

              <p className="text-sm sm:text-base leading-relaxed text-muted-foreground max-w-2xl">
                MiniHisab replaces fragmented spreadsheets and bulky legacy billing machines with one focused system for barcode billing, carton inventory, customer credit ledgers, and GST tax invoices.
              </p>

              <div className="pt-1 flex flex-col sm:flex-row gap-3">
                <Button asChild size="lg" className="rounded-lg font-semibold shadow-xs apple-button-press">
                  <Link href={APP_ROUTES.DASHBOARD}>
                    Open Live Dashboard <ArrowRight className="h-4 w-4 ml-1.5" />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="rounded-lg font-semibold apple-button-press">
                  <Link href={APP_ROUTES.PRICING}>View Pricing Plans</Link>
                </Button>
              </div>

              {/* Anchor Jump Navigation Bar */}
              <div className="pt-3 border-t border-border/70">
                <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                  Jump to Feature Engine:
                </p>
                <div className="flex flex-wrap gap-1.5 text-xs">
                  {featureSections.map((s) => (
                    <a
                      key={s.id}
                      href={`#${s.id}`}
                      className="rounded-lg border border-border/80 bg-muted/30 px-2.5 py-1 text-[11px] font-medium text-muted-foreground hover:bg-card hover:text-foreground hover:border-border hover:shadow-xs transition-all"
                    >
                      {s.tag}
                    </a>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Interactive Feature Matrix Showcase (5 cols) */}
            <div className="lg:col-span-5">
              <FeaturesHeroShowcase />
            </div>
          </div>
        </div>
      </section>

      {/* ── FEATURE DEEP DIVES ───────────────────────────────────────────── */}
      <section className="py-12 md:py-16 bg-muted/20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-14 md:gap-16">
            {featureSections.map((section, index) => {
              const isReversed = index % 2 !== 0;

              return (
                <ScrollReveal key={section.id} delay={40}>
                  <div
                    id={section.id}
                    className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center scroll-mt-20 p-6 sm:p-8 rounded-2xl border border-border/80 bg-card/60 shadow-xs"
                  >
                    {/* Content Column (6 cols) */}
                    <div className={`lg:col-span-6 space-y-4 ${isReversed ? "lg:order-2" : "lg:order-1"}`}>
                      <div>
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                          {section.tag}
                        </span>
                      </div>

                      <h2 className="font-heading text-2xl font-bold tracking-tight sm:text-3xl text-foreground">
                        {section.title}
                      </h2>

                      <p className="text-sm leading-relaxed text-muted-foreground">
                        {section.description}
                      </p>

                      <div className="space-y-2 pt-2 border-t border-border/70">
                        {section.highlights.map((highlight) => (
                          <div key={highlight} className="flex items-start gap-2 text-xs sm:text-sm text-foreground/90">
                            <Check className="h-4 w-4 text-primary shrink-0 mt-0.5 stroke-[2.5]" />
                            <span className="leading-snug">{highlight}</span>
                          </div>
                        ))}
                      </div>

                      {section.link && (
                        <div className="pt-2">
                          <Button asChild variant="outline" size="sm" className="rounded-lg font-semibold h-9">
                            <Link href={section.link}>
                              {section.linkText} <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                            </Link>
                          </Button>
                        </div>
                      )}
                    </div>

                    {/* Interactive UI Simulation Preview Column (6 cols) */}
                    <div className={`lg:col-span-6 ${isReversed ? "lg:order-1" : "lg:order-2"}`}>
                      {section.preview}
                    </div>
                  </div>
                </ScrollReveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── PRACTICAL CAPABILITY COMPARISON ───────────────────────────────── */}
      <section className="py-12 md:py-16 border-t border-border/70 bg-background">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <ScrollReveal>
            <div className="max-w-2xl mb-8">
              <span className="text-xs font-bold uppercase tracking-wider text-primary">
                Side-by-Side Comparison
              </span>
              <h2 className="mt-1.5 font-heading text-2xl font-bold tracking-tight sm:text-3xl text-foreground">
                Retail Counter vs Wholesale Godown Workflows
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">
                See how MiniHisab adapts whether you are punching barcode bills for walk-in retail shoppers or dispatching master cartons on trade credit.
              </p>
            </div>
          </ScrollReveal>

          <ScrollReveal delay={80}>
            <div className="overflow-hidden rounded-xl border border-border bg-card shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs sm:text-sm">
                  <thead className="border-b border-border bg-muted/40 font-semibold text-foreground">
                    <tr>
                      <th className="py-3 px-4 sm:px-6">Operational Need</th>
                      <th className="py-3 px-4 sm:px-6">Retail Store Counter</th>
                      <th className="py-3 px-4 sm:px-6">Wholesale &amp; Godown</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border text-muted-foreground">
                    <tr>
                      <td className="py-3.5 px-4 sm:px-6 font-semibold text-foreground">Billing Speed</td>
                      <td className="py-3.5 px-4 sm:px-6">Instant barcode auto-scan and split tender</td>
                      <td className="py-3.5 px-4 sm:px-6">Bulk carton entry with pre-negotiated trade rates</td>
                    </tr>
                    <tr>
                      <td className="py-3.5 px-4 sm:px-6 font-semibold text-foreground">Receipt / Invoice</td>
                      <td className="py-3.5 px-4 sm:px-6">58mm &amp; 80mm thermal receipt slips</td>
                      <td className="py-3.5 px-4 sm:px-6">Full A4 GST tax invoices with transport details</td>
                    </tr>
                    <tr>
                      <td className="py-3.5 px-4 sm:px-6 font-semibold text-foreground">Stock Measurement</td>
                      <td className="py-3.5 px-4 sm:px-6">Loose units, pieces, kilograms, meters</td>
                      <td className="py-3.5 px-4 sm:px-6">Master cartons, boxes, wholesale rolls</td>
                    </tr>
                    <tr>
                      <td className="py-3.5 px-4 sm:px-6 font-semibold text-foreground">Payment Terms</td>
                      <td className="py-3.5 px-4 sm:px-6">Immediate Cash, UPI QR, or Card settlement</td>
                      <td className="py-3.5 px-4 sm:px-6">Payment credit ledger with custom credit limits</td>
                    </tr>
                    <tr>
                      <td className="py-3.5 px-4 sm:px-6 font-semibold text-foreground">Compliance</td>
                      <td className="py-3.5 px-4 sm:px-6">Summary B2C cash memos with tax slabs</td>
                      <td className="py-3.5 px-4 sm:px-6">Buyer GSTIN validation and dispatch recording</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* ── GROUNDED CALL TO ACTION ──────────────────────────────────────── */}
      <section className="border-t border-border/70 bg-card py-14 md:py-20">
        <ScrollReveal distance={26} duration={900}>
          <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center space-y-4">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
              Ready to Upgrade?
            </span>
            <h2 className="font-heading text-3xl font-extrabold tracking-tight sm:text-4xl text-foreground">
              Explore MiniHisab with your own inventory
            </h2>
            <p className="max-w-xl mx-auto text-sm sm:text-base text-muted-foreground leading-relaxed">
              Open the dashboard to try the counter POS, import your stock items via CSV, or review pricing tiers designed for growing stores.
            </p>
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Button asChild size="lg" className="rounded-lg font-semibold shadow-xs apple-button-press">
                <Link href={APP_ROUTES.DASHBOARD}>
                  Open Live Dashboard <ArrowRight className="ml-1.5 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="rounded-lg font-semibold apple-button-press">
                <Link href={APP_ROUTES.PRICING}>View Transparent Pricing</Link>
              </Button>
            </div>
            <p className="pt-1 text-xs text-muted-foreground">
              Works across Windows, Mac, Android, and iOS. Zero driver installation.
            </p>
          </div>
        </ScrollReveal>
      </section>
    </div>
  );
}
