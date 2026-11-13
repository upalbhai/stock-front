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
  title: "Features - Retail Billing & Wholesale Inventory",
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
      "Master carton conversion (e.g. 40 rolls per carton, 12 units per box)",
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
      "Apply custom credit terms (e.g. 15-day or 30-day payment windows)",
      "Record partial or full settlements via UPI, Cash, or Bank Transfer",
      "Send payment reminder statements directly via WhatsApp or SMS",
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
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* ── HERO HEADER ─────────────────────────────────────────────────── */}
      <section className="border-b border-border/70 bg-background pt-12 pb-16 md:pt-16 md:pb-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <Breadcrumbs items={[{ name: "Features", url: "/features" }]} />
            
            <div className="mt-4">
              <span className="inline-flex items-center rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                Retail &amp; Wholesale Capabilities
              </span>
            </div>

            <h1 className="mt-4 font-heading text-3xl font-extrabold tracking-tight sm:text-4xl lg:text-5xl text-foreground">
              Built for retail checkout counters and wholesale godowns.
            </h1>

            <p className="mt-4 text-base leading-relaxed text-muted-foreground sm:text-lg">
              MiniHisab replaces fragmented spreadsheets and bulky legacy billing machines with one focused system for barcode billing, carton inventory, customer credit ledgers, and GST tax invoices.
            </p>

            {/* Anchor jump pills */}
            <div className="mt-8 flex flex-wrap gap-2 text-xs">
              {featureSections.map((s) => (
                <a
                  key={s.id}
                  href={`#${s.id}`}
                  className="rounded-md border border-border bg-muted/40 px-3 py-1.5 font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                >
                  {s.title.split(" & ")[0]}
                </a>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── FEATURE DEEP DIVES ───────────────────────────────────────────── */}
      <section className="py-16 md:py-24 bg-muted/20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-20">
            {featureSections.map((section, index) => {
              const isReversed = index % 2 !== 0;

              return (
                <div
                  key={section.id}
                  id={section.id}
                  className={`grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center scroll-mt-20`}
                >
                  {/* Content Column (6 cols) */}
                  <div className={`lg:col-span-6 ${isReversed ? "lg:order-2" : "lg:order-1"}`}>
                    <span className="text-xs font-bold uppercase tracking-wider text-primary">
                      {section.tag}
                    </span>

                    <h2 className="mt-2 font-heading text-2xl font-bold tracking-tight sm:text-3xl text-foreground">
                      {section.title}
                    </h2>

                    <p className="mt-3 text-base text-muted-foreground leading-relaxed">
                      {section.description}
                    </p>

                    <ul className="mt-6 space-y-2.5 text-xs sm:text-sm">
                      {section.highlights.map((highlight) => (
                        <li key={highlight} className="flex items-start gap-2.5 text-foreground">
                          <Check className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                          <span>{highlight}</span>
                        </li>
                      ))}
                    </ul>

                    {section.link && (
                      <div className="mt-7">
                        <Button asChild variant="outline" size="sm" className="rounded-md font-semibold h-9">
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
              );
            })}
          </div>
        </div>
      </section>

      {/* ── PRACTICAL CAPABILITY COMPARISON ───────────────────────────────── */}
      <section className="py-16 md:py-20 border-t border-border/70 bg-background">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl">
            <h2 className="font-heading text-2xl font-bold tracking-tight sm:text-3xl text-foreground">
              Retail Counter vs Wholesale Godown Workflows
            </h2>
            <p className="mt-3 text-base text-muted-foreground">
              See how the same system adapts whether you are punching barcode bills for walk-in retail shoppers or dispatching master cartons on 30-day credit.
            </p>
          </div>

          <div className="mt-10 overflow-hidden rounded-xl border border-border bg-card shadow-xs">
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
                    <td className="py-3.5 px-4 sm:px-6">58mm / 80mm thermal receipt slips</td>
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
                    <td className="py-3.5 px-4 sm:px-6">30-day payment credit ledger (Udhar Khata)</td>
                  </tr>
                  <tr>
                    <td className="py-3.5 px-4 sm:px-6 font-semibold text-foreground">Compliance</td>
                    <td className="py-3.5 px-4 sm:px-6">Summary B2C cash memos with tax slabs</td>
                    <td className="py-3.5 px-4 sm:px-6">Buyer GSTIN validation and E-Way bill recording</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      {/* ── GROUNDED CALL TO ACTION ──────────────────────────────────────── */}
      <section className="border-t border-border/70 bg-muted/30 py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <div className="mx-auto max-w-2xl">
            <h2 className="font-heading text-2xl font-bold tracking-tight sm:text-3xl text-foreground">
              Explore MiniHisab with your own inventory
            </h2>
            <p className="mt-3 text-base text-muted-foreground">
              Open the dashboard to try the counter POS, import your stock items, or review pricing tiers designed for growing stores.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Button asChild size="lg" className="rounded-md font-semibold shadow-xs w-full sm:w-auto h-11">
                <Link href={APP_ROUTES.DASHBOARD}>
                  Open Live Dashboard <ArrowRight className="ml-1.5 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="rounded-md font-semibold w-full sm:w-auto h-11">
                <Link href={APP_ROUTES.PRICING}>
                  View Transparent Pricing
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
