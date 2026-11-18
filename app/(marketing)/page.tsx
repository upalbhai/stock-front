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
  Clock,
  Sparkles,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { organizationSchema, websiteSchema, softwareApplicationSchema } from "@/lib/jsonld";
import { APP_ROUTES } from "@/lib/routes";
import { HeroShowcase } from "@/components/marketing/hero-showcase";
import { ScrollReveal } from "@/components/marketing/scroll-reveal";
import { FeatureShowroom } from "@/components/marketing/feature-showroom";
import { StoreSegments } from "@/components/marketing/store-segments";
import { RoiCalculator } from "@/components/marketing/roi-calculator";
import {
  MultiOutletPreview,
  ReportsPreview,
} from "@/components/marketing/feature-previews";
import { WhyChooseUs } from "@/components/marketing/why-choose-us";

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

const coreHeadaches = [
  {
    icon: ReceiptText,
    badge: "Counter Speed",
    title: "Zero Billing Lag During Evening Rush",
    description:
      "Long lines lose customers. Scan barcodes, pick frequently sold items with one touch, and print 80mm thermal receipts in under two seconds. Keyboard shortcuts allow cashiers to fly without touching a mouse.",
    accent: "text-blue-600 dark:text-blue-400",
    bg: "bg-blue-500/10 border-blue-500/20",
  },
  {
    icon: Boxes,
    badge: "Inventory Sync",
    title: "Cartons & Loose Units in One System",
    description:
      "Stop recounting stock manually. Buy in bulk master cartons from suppliers, dispatch wholesale carton orders, and sell single pieces on counter shelves. MiniHisab auto-converts units so inventory stays accurate.",
    accent: "text-emerald-600 dark:text-emerald-400",
    bg: "bg-emerald-500/10 border-emerald-500/20",
  },
  {
    icon: CreditCard,
    badge: "Credit Ledger",
    title: "Digital Customer Khata & Balances",
    description:
      "Say goodbye to missing paper diaries and untracked balances. Maintain clear running ledgers with credit limit alerts, complete transaction logs, and partial or full payment collections.",
    accent: "text-amber-600 dark:text-amber-400",
    bg: "bg-amber-500/10 border-amber-500/20",
  },
];

const dailyWorkflows = [
  {
    phase: "Morning",
    title: "Opening & Stock Check",
    summary:
      "Review low-stock alerts before opening, receive incoming cartons from suppliers, and verify opening cash balances.",
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
      "Scan barcodes for retail walk-in customers or create wholesale B2B orders with carton rates and delivery challans.",
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
    title: "Closing & Cash Reconciliation",
    summary:
      "Reconcile counter sales against cash in drawer, review wholesale vs retail profit margins, and export tax summaries.",
    items: [
      "End-of-day register closing report per counter",
      "Sales categorized by retail and wholesale B2B channels",
      "GST breakdown (CGST, SGST, IGST) with HSN summaries",
    ],
  },
];

const hardwareSpecs = [
  {
    category: "Thermal & Laser Printers",
    description:
      "Standard ESC/POS thermal printers (58mm and 80mm roll width) over USB, Ethernet, or Bluetooth, plus standard A4 and A5 laser printers for wholesale invoices.",
    devices: "TVS, Epson, NGX, Everycom, HP, Canon",
  },
  {
    category: "Barcode Scanners",
    description:
      "Any standard 1D or 2D barcode scanner (USB plug-and-play, wireless 2.4GHz dongle, or Bluetooth handheld).",
    devices: "Honeywell, Zebra, TVS, Syble, Datalogic",
  },
  {
    category: "Supported Devices",
    description:
      "Runs in modern web browsers across Windows desktop PCs, laptops, Macs, Android tablets, iPads, and touch POS terminals.",
    devices: "Windows 10/11, macOS, Android, iOS",
  },
  {
    category: "Data Export & Security",
    description:
      "Export sales records, stock inventories, customer ledgers, and tax summaries to Excel and CSV anytime with complete role-based staff PIN protection.",
    devices: "Instant Excel, CSV, PDF downloads",
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

      {/* ── 1. HERO SECTION (RETAIL COUNTER + WHOLESALE ENGINE) ───────────── */}
      <section className="border-b border-border/70 bg-background pt-10 pb-16 md:pt-16 md:pb-24 overflow-hidden">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
            {/* Left Content Column (7 cols) */}
            <div className="lg:col-span-7 space-y-5">
              <div className="animate-apple-rise">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                  Retail POS &amp; Wholesale Godown Suite
                </span>
              </div>

              <h1 className="animate-apple-rise animation-delay-100 font-heading text-3xl font-extrabold tracking-tight sm:text-4xl lg:text-5xl text-foreground leading-[1.15]">
                Fast barcode billing, stock control, and GST for shops &amp; distributors.
              </h1>

              <p className="animate-apple-rise animation-delay-200 max-w-2xl text-sm sm:text-base leading-relaxed text-muted-foreground">
                Built for peak retail counter speed and high-volume wholesale dispatch. Barcode scanning without lag, carton and loose piece stock tracking, digital customer khata, and instant tax invoices from one place.
              </p>

              {/* Clear, focused Action CTAs */}
              <div className="animate-apple-rise animation-delay-300 pt-2 flex flex-col sm:flex-row sm:items-center gap-3">
                <Button asChild size="lg" className="rounded-lg font-semibold shadow-xs apple-button-press">
                  <Link href={APP_ROUTES.DASHBOARD}>
                    Open Live Dashboard <ArrowRight className="h-4 w-4 ml-1.5" />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="rounded-lg font-semibold apple-button-press">
                  <Link href={APP_ROUTES.PRICING}>View Pricing Plans</Link>
                </Button>
              </div>

              {/* Four Trust & Capability Badges */}
              <div className="animate-apple-rise animation-delay-400 pt-4 grid grid-cols-1 sm:grid-cols-2 gap-y-2.5 gap-x-4 text-xs text-muted-foreground border-t border-border/70">
                <span className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-primary shrink-0 stroke-[2.5]" />
                  <span>0.8s barcode scan &amp; 80mm thermal receipt</span>
                </span>
                <span className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-primary shrink-0 stroke-[2.5]" />
                  <span>Master cartons &amp; single piece unit sync</span>
                </span>
                <span className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-primary shrink-0 stroke-[2.5]" />
                  <span>Multi-outlet &amp; central warehouse sync</span>
                </span>
                <span className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-primary shrink-0 stroke-[2.5]" />
                  <span>Customer udhar khata &amp; credit limits</span>
                </span>
              </div>
            </div>

            {/* Right Interactive Showcase Column (5 cols) */}
            <div className="animate-apple-hero animation-delay-200 lg:col-span-5">
              <HeroShowcase />
            </div>
          </div>
        </div>
      </section>

      {/* ── 2. THREE CORE HEADACHES ELIMINATED ────────────────────────────── */}
      <section className="py-16 md:py-20 border-b border-border/70 bg-muted/20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <ScrollReveal>
            <div className="max-w-2xl">
              <span className="text-xs font-bold uppercase tracking-wider text-primary">
                Why Shop Owners Switch
              </span>
              <h2 className="mt-2 font-heading text-2xl font-bold tracking-tight sm:text-3xl text-foreground">
                Built to solve the three biggest daily store bottlenecks.
              </h2>
              <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
                Generic accounting software slows down checkout lines. MiniHisab is tuned specifically for retail counters and wholesale supply yards.
              </p>
            </div>
          </ScrollReveal>

          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {coreHeadaches.map((item, i) => {
              const Icon = item.icon;
              return (
                <ScrollReveal key={item.title} delay={i * 80}>
                  <div className="apple-card-hover rounded-xl border border-border bg-card p-6 shadow-xs h-full flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-primary/20 bg-primary/10 text-primary">
                          <Icon className="h-5 w-5" />
                        </div>
                        <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${item.bg} ${item.accent}`}>
                          {item.badge}
                        </span>
                      </div>
                      <h3 className="mt-4 font-heading text-lg font-bold text-foreground leading-snug">
                        {item.title}
                      </h3>
                      <p className="mt-2.5 text-xs sm:text-sm leading-relaxed text-muted-foreground">
                        {item.description}
                      </p>
                    </div>
                  </div>
                </ScrollReveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── 3. INTERACTIVE FEATURE SHOWROOM ───────────────────────────────── */}
      <section className="py-16 md:py-24 border-b border-border/70">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <ScrollReveal>
            <div className="text-center max-w-3xl mx-auto mb-10">
              <span className="text-xs font-bold uppercase tracking-wider text-primary">
                Explore the Software
              </span>
              <h2 className="mt-2 font-heading text-2xl font-bold tracking-tight sm:text-3xl lg:text-4xl text-foreground">
                Everything your counter, godown, and back-office needs.
              </h2>
              <p className="mt-3 text-sm sm:text-base text-muted-foreground">
                Click across the tabs below to test live interactive previews of our billing terminal, stock registry, customer ledger, and GST tax invoice layout.
              </p>
            </div>
          </ScrollReveal>

          <ScrollReveal delay={100}>
            <FeatureShowroom />
          </ScrollReveal>
        </div>
      </section>

      {/* ── 4. WHY CHOOSE MINIHISAB OVER TRADITIONAL METHODS ─── */}
      <WhyChooseUs />

      {/* ── 5. MULTI-OUTLET & GODOWN SYNCHRONIZATION ───────────────────────── */}
      <section className="py-16 md:py-20 border-b border-border/70 bg-muted/20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            {/* Narrative Left Column */}
            <div className="lg:col-span-6 space-y-4">
              <ScrollReveal>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                  Multi-Location Operations
                </span>
                <h2 className="mt-3 font-heading text-2xl font-bold tracking-tight sm:text-3xl text-foreground">
                  Running multiple shops or godowns? Keep them in sync in real-time.
                </h2>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  Never guess whether stock is lying at the retail branch or central godown. Dispatch stock with delivery challans, check live availability from any counter, and monitor overall business turnover from your phone.
                </p>

                <div className="space-y-2.5 pt-2">
                  <div className="flex items-start gap-2.5 text-xs text-foreground/90">
                    <div className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary">
                      <Check className="h-2.5 w-2.5 stroke-[3]" />
                    </div>
                    <span>Inter-outlet stock transfer requests with digital dispatch challans</span>
                  </div>
                  <div className="flex items-start gap-2.5 text-xs text-foreground/90">
                    <div className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary">
                      <Check className="h-2.5 w-2.5 stroke-[3]" />
                    </div>
                    <span>Granular staff permissions: cashiers cannot view cost prices or margins</span>
                  </div>
                  <div className="flex items-start gap-2.5 text-xs text-foreground/90">
                    <div className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary">
                      <Check className="h-2.5 w-2.5 stroke-[3]" />
                    </div>
                    <span>Consolidated profit and sales reports across all branches combined</span>
                  </div>
                </div>

                <div className="pt-2">
                  <Button asChild variant="outline" className="font-semibold shadow-xs">
                    <Link href={APP_ROUTES.SERVICES}>
                      View Multi-Branch Features <ArrowRight className="h-4 w-4 ml-1.5" />
                    </Link>
                  </Button>
                </div>
              </ScrollReveal>
            </div>

            {/* Interactive Preview Right Column */}
            <div className="lg:col-span-6">
              <ScrollReveal delay={120}>
                <MultiOutletPreview />
              </ScrollReveal>
            </div>
          </div>
        </div>
      </section>

      {/* ── 5. TAILORED FOR YOUR SPECIFIC TRADE ───────────────────────────── */}
      <section className="py-16 md:py-24 border-b border-border/70">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <ScrollReveal>
            <div className="max-w-2xl mb-8">
              <span className="text-xs font-bold uppercase tracking-wider text-primary">
                Industry Specifics
              </span>
              <h2 className="mt-2 font-heading text-2xl font-bold tracking-tight sm:text-3xl text-foreground">
                Tailored for the reality of your specific retail or wholesale trade.
              </h2>
              <p className="mt-3 text-sm text-muted-foreground">
                From fast-scanning grocery items to clothing size matrices and hardware unit conversions, MiniHisab adjusts to how you sell.
              </p>
            </div>
          </ScrollReveal>

          <ScrollReveal delay={80}>
            <StoreSegments />
          </ScrollReveal>
        </div>
      </section>

      {/* ── 6. A DAY IN YOUR STORE / GODOWN ───────────────────────────────── */}
      <section className="py-16 md:py-24 bg-muted/20 border-b border-border/70">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <ScrollReveal>
            <div className="max-w-2xl">
              <span className="text-xs font-bold uppercase tracking-wider text-primary">
                Operational Routine
              </span>
              <h2 className="mt-2 font-heading text-2xl font-bold tracking-tight sm:text-3xl text-foreground">
                How MiniHisab fits your daily operations from opening to closing.
              </h2>
              <p className="mt-3 text-sm text-muted-foreground">
                From morning inward stock counts to all-day retail checkout, wholesale dispatch, and evening cash reconciliation, each step keeps your business organized.
              </p>
            </div>
          </ScrollReveal>

          <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {dailyWorkflows.map((step, i) => (
              <ScrollReveal key={step.phase} delay={i * 80}>
                <div className="apple-card-hover rounded-xl border border-border bg-card p-5 h-full flex flex-col justify-between">
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
                    {step.items.map((item, idx) => (
                      <div key={idx} className="flex items-start gap-1.5 text-xs text-foreground/80">
                        <span className="text-primary font-bold">•</span>
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── 7. TIME & EFFICIENCY CALCULATOR ───────────────────────────────── */}
      <section className="py-16 md:py-20 border-b border-border/70">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <ScrollReveal>
            <RoiCalculator />
          </ScrollReveal>
        </div>
      </section>

      {/* ── 8. PLUG-AND-PLAY HARDWARE COMPATIBILITY ───────────────────────── */}
      <section className="py-16 md:py-24 border-b border-border/70 bg-muted/20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <ScrollReveal>
            <div className="max-w-2xl">
              <span className="text-xs font-bold uppercase tracking-wider text-primary">
                Hardware Freedom
              </span>
              <h2 className="mt-2 font-heading text-2xl font-bold tracking-tight sm:text-3xl text-foreground">
                Works with the printers, scanners, and screens you already own.
              </h2>
              <p className="mt-3 text-sm text-muted-foreground">
                No expensive proprietary terminals or hardware vendor locks. MiniHisab runs on any standard web browser and supports everyday POS peripherals out of the box.
              </p>
            </div>
          </ScrollReveal>

          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {hardwareSpecs.map((spec, i) => (
              <ScrollReveal key={spec.category} delay={i * 80}>
                <div className="apple-card-hover rounded-xl border border-border bg-card p-5 h-full flex flex-col justify-between">
                  <div>
                    <h3 className="font-heading text-sm font-bold text-foreground">
                      {spec.category}
                    </h3>
                    <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                      {spec.description}
                    </p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-border/60">
                    <p className="text-[11px] text-primary font-mono font-medium">
                      {spec.devices}
                    </p>
                  </div>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── 9. GETTING STARTED CTA ────────────────────────────────────────── */}
      <section className="py-16 md:py-24 bg-card">
        <ScrollReveal distance={26} duration={900}>
          <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center space-y-5">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
              Instant Setup
            </span>
            <h2 className="font-heading text-3xl font-extrabold tracking-tight sm:text-4xl text-foreground">
              Ready to speed up your billing counter and organize your stock?
            </h2>
            <p className="max-w-xl mx-auto text-sm sm:text-base text-muted-foreground leading-relaxed">
              Launch your counter register in under two minutes. Test the live POS, import your inventory via CSV, and invite your staff members with custom PIN access.
            </p>

            <div className="pt-2 flex flex-col sm:flex-row justify-center gap-3">
              <Button asChild size="lg" className="rounded-lg font-semibold shadow-xs apple-button-press">
                <Link href={APP_ROUTES.LOGIN}>
                  Sign In to Account <ArrowRight className="h-4 w-4 ml-1.5" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="rounded-lg font-semibold apple-button-press">
                <Link href={APP_ROUTES.PRICING}>View Pricing Plans</Link>
              </Button>
            </div>

            <p className="pt-2 text-xs text-muted-foreground">
              Runs in Chrome, Edge, Safari, and Firefox. Works across Windows, Mac, Android, and iOS.
            </p>
          </div>
        </ScrollReveal>
      </section>
    </div>
  );
}
