import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  Boxes,
  Building2,
  Check,
  CreditCard,
  FileSpreadsheet,
  FileText,
  Laptop,
  Printer,
  QrCode,
  ReceiptText,
  Settings,
  ShieldCheck,
  Store,
  Truck,
  Upload,
  Users,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { ScrollReveal } from "@/components/marketing/scroll-reveal";
import { ServicesHeroShowcase } from "@/components/marketing/services-hero-showcase";
import { APP_ROUTES } from "@/lib/routes";
import { serviceListSchema } from "@/lib/jsonld";

export const metadata: Metadata = {
  title: "Services & Operational Modules | MiniHisab",
  description:
    "Explore MiniHisab services: POS counter billing, master carton inventory, customer khata credit recovery, GST tax invoices, and multi-outlet management.",
  alternates: { canonical: "/services" },
};

const serviceGroups = [
  {
    title: "Point-of-Sale & Rapid Counter Billing",
    text: "Sub-second barcode checkout, 80mm thermal receipt printing, split tender across Cash and UPI QR, and keyboard shortcut driven cashier flow.",
    icon: ReceiptText,
    badge: "Counter Speed",
    href: APP_ROUTES.FEATURES,
    deliverables: [
      "0.8s barcode scanning with beep audio feedback",
      "Split tender: collect cash + balance via UPI QR",
      "Direct ESC/POS thermal printing with cash drawer trigger",
      "Full keyboard navigation without touching the mouse",
    ],
  },
  {
    title: "Multi-Outlet & Central Godown Stock Control",
    text: "Master carton to loose unit conversions, inter-branch stock transfer challans, real-time inventory sync, and low-stock replenishment alerts.",
    icon: Boxes,
    badge: "Inventory Management",
    href: APP_ROUTES.FEATURES,
    deliverables: [
      "Master carton to piece conversion factors per product",
      "Low stock alerts across retail shelves and warehouses",
      "Inter-outlet stock transfer requests with digital challans",
      "Bulk CSV/Excel catalog import in under 30 seconds",
    ],
  },
  {
    title: "Customer Udhar Khata & Credit Ledger",
    text: "Replace paper notebooks with digital running ledgers. Monitor customer credit balances, set credit limits, and record partial and full payment collections.",
    icon: CreditCard,
    badge: "Credit & Accounts",
    href: APP_ROUTES.FEATURES,
    deliverables: [
      "Real-time customer running balances with credit limit alarms",
      "Record partial or full payment collections (Cash, UPI, Card, Bank)",
      "Complete transaction logs with bill reference numbers",
      "Printable ledger statements and credit sale histories",
    ],
  },
  {
    title: "GST Tax Invoices & E-Way Compliance",
    text: "Create GST-compliant A4/A5 tax invoices and compact 80mm thermal receipts with auto-calculated CGST, SGST, IGST, and HSN tax summaries.",
    icon: FileSpreadsheet,
    badge: "Tax & Compliance",
    href: APP_ROUTES.FEATURES,
    deliverables: [
      "A4/A5 laser tax invoices with vehicle number and transporter ID",
      "Auto-calculated HSN summaries ready for GSTR-1 filing",
      "Buyer GSTIN format verification before bill printing",
      "Monthly tax breakdown exportable directly for your CA",
    ],
  },
  {
    title: "Daily Register Closing & Profit Intelligence",
    text: "Reconcile counter cash against daily billings, track cashier shifts, review wholesale vs retail gross margins, and balance books at evening close.",
    icon: BarChart3,
    badge: "Store Analytics",
    href: APP_ROUTES.DASHBOARD,
    deliverables: [
      "End-of-day register closing report per counter",
      "Tender breakdown: Cash, UPI, Card, and Credit sales",
      "Gross profit margin reports per category and brand",
      "Cashier reconciliation preventing drawer shortages",
    ],
  },
  {
    title: "Role-Based Staff Access & Security Controls",
    text: "Granular permissions for cashiers, managers, and business owners. Hide cost prices from staff, require manager approval for voids, and view audit logs.",
    icon: ShieldCheck,
    badge: "Security & Roles",
    href: APP_ROUTES.DASHBOARD,
    deliverables: [
      "Fast PIN-based login for counter cashiers",
      "Purchase cost prices and profit margins hidden from staff",
      "Tamper-proof audit logs for bill voids and discounts",
      "Multi-counter registers managed under one subscription",
    ],
  },
];

const onboardingSteps = [
  {
    step: "01",
    title: "Import Your Product Catalog",
    description:
      "Upload your existing item list, selling prices, wholesale rates, and opening stock quantities using our simple Excel or CSV template in minutes.",
  },
  {
    step: "02",
    title: "Connect Your POS Hardware",
    description:
      "Plug in your existing TVS/Epson thermal receipt printer, USB or wireless barcode scanner, and launch MiniHisab in any modern browser. Zero driver hassles.",
  },
  {
    step: "03",
    title: "Configure Staff PINs & Outlets",
    description:
      "Add your cashier accounts, assign individual PIN numbers, set store addresses, and customize your thermal receipt header and footer details.",
  },
  {
    step: "04",
    title: "Start Ringing Up Sales",
    description:
      "Begin counter billing immediately. Scan barcodes, accept UPI QR payments, dispatch wholesale cartons, and monitor daily revenue in real-time.",
  },
];

export default function ServicesPage() {
  return (
    <div>
      {/* Structured SEO Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            serviceListSchema(
              serviceGroups.map((s) => ({ title: s.title, text: s.text }))
            )
          ),
        }}
      />

      {/* ── BALANCED 2-COLUMN HERO (ZERO EMPTY WHITE SPACE) ─────────────── */}
      <section className="border-b border-border/70 bg-muted/20 pt-6 pb-10 md:pt-8 md:pb-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center">
            {/* Left Content Column (7 cols) */}
            <div className="lg:col-span-7 space-y-4">
              <Breadcrumbs items={[{ name: "Services", url: "/services" }]} />

              <div>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                  Full-Stack Store Operations
                </span>
              </div>

              <h1 className="font-heading text-3xl font-extrabold tracking-tight sm:text-4xl lg:text-5xl text-foreground leading-[1.15]">
                Everything you need to run, track, and scale your retail or wholesale store.
              </h1>

              <p className="text-sm sm:text-base leading-relaxed text-muted-foreground max-w-2xl">
                From rapid checkout counter POS and multi-warehouse carton control to customer credit recovery and GST compliance: explore how MiniHisab powers every step of your daily business.
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

              {/* Three Quick Spec Pills */}
              <div className="pt-3 grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs text-muted-foreground border-t border-border/70">
                <span className="flex items-center gap-1.5">
                  <Check className="h-3.5 w-3.5 text-primary shrink-0 stroke-[2.5]" />
                  <span>0.8s barcode billing</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <Check className="h-3.5 w-3.5 text-primary shrink-0 stroke-[2.5]" />
                  <span>Carton &amp; unit sync</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <Check className="h-3.5 w-3.5 text-primary shrink-0 stroke-[2.5]" />
                  <span>Zero hardware lock-in</span>
                </span>
              </div>
            </div>

            {/* Right Interactive Showcase Column (5 cols) */}
            <div className="lg:col-span-5">
              <ServicesHeroShowcase />
            </div>
          </div>
        </div>
      </section>

      {/* ── 6 CORE OPERATIONAL SERVICES ─────────────────────────────────── */}
      <section className="py-12 md:py-16 border-b border-border/70">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <ScrollReveal>
            <div className="max-w-2xl mb-8">
              <span className="text-xs font-bold uppercase tracking-wider text-primary">
                Operational Modules
              </span>
              <h2 className="mt-1.5 font-heading text-2xl font-bold tracking-tight sm:text-3xl text-foreground">
                Engineered for counter speed, inventory precision, and cash flow.
              </h2>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                Each service connects into a unified ledger, ensuring your POS registers, warehouses, and tax records always balance together.
              </p>
            </div>
          </ScrollReveal>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {serviceGroups.map((service, i) => {
              const Icon = service.icon;
              return (
                <ScrollReveal key={service.title} delay={i * 70}>
                  <div className="apple-card-hover rounded-xl border border-border bg-card p-6 shadow-xs h-full flex flex-col justify-between">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-primary/20 bg-primary/10 text-primary">
                          <Icon className="h-5 w-5" />
                        </div>
                        <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full border border-primary/20 bg-primary/5 text-primary">
                          {service.badge}
                        </span>
                      </div>

                      <div>
                        <h2 className="font-heading text-lg font-bold text-foreground leading-snug">
                          {service.title}
                        </h2>
                        <p className="mt-2 text-xs sm:text-sm leading-relaxed text-muted-foreground">
                          {service.text}
                        </p>
                      </div>

                      <div className="space-y-2 pt-3 border-t border-border/70">
                        {service.deliverables.map((item, idx) => (
                          <div key={idx} className="flex items-start gap-2 text-xs text-foreground/85">
                            <Check className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5 stroke-[2.5]" />
                            <span className="leading-snug">{item}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="pt-5 mt-4 border-t border-border/60">
                      <Link
                        href={service.href}
                        className="inline-flex items-center text-xs font-semibold text-primary hover:underline"
                      >
                        Explore Module Details <ArrowRight className="h-3 w-3 ml-1" />
                      </Link>
                    </div>
                  </div>
                </ScrollReveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── 4-STEP ONBOARDING & IMPLEMENTATION ────────────────────────────── */}
      <section className="py-12 md:py-16 bg-muted/20 border-b border-border/70">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <ScrollReveal>
            <div className="text-center max-w-2xl mx-auto mb-10">
              <span className="text-xs font-bold uppercase tracking-wider text-primary">
                Quick Setup
              </span>
              <h2 className="mt-1.5 font-heading text-2xl font-bold tracking-tight sm:text-3xl text-foreground">
                Go live in under ten minutes without business interruption.
              </h2>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                Switching software shouldn't halt your store. Follow our four-step onboarding to import data, configure hardware, and begin billing immediately.
              </p>
            </div>
          </ScrollReveal>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {onboardingSteps.map((item, i) => (
              <ScrollReveal key={item.step} delay={i * 80}>
                <div className="apple-card-hover rounded-xl border border-border bg-card p-6 h-full flex flex-col justify-between">
                  <div className="space-y-3">
                    <span className="font-mono text-2xl font-extrabold text-primary/40">
                      {item.step}
                    </span>
                    <h3 className="font-heading text-base font-bold text-foreground">
                      {item.title}
                    </h3>
                    <p className="text-xs sm:text-sm leading-relaxed text-muted-foreground">
                      {item.description}
                    </p>
                  </div>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── HARDWARE COMPATIBILITY REASSURANCE ───────────────────────────── */}
      <section className="py-12 md:py-16 border-b border-border/70">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <ScrollReveal>
            <div className="rounded-2xl border border-border bg-card p-6 sm:p-8 lg:p-10 shadow-xs">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                <div className="lg:col-span-7 space-y-4">
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                    Zero Hardware Lock-In
                  </span>
                  <h2 className="font-heading text-2xl font-bold tracking-tight sm:text-3xl text-foreground">
                    Runs on the devices &amp; printers you already own.
                  </h2>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    MiniHisab is a lightweight cloud application that operates smoothly across Windows laptops, desktop PCs, iPads, Android tablets, and touchscreen POS terminals. Plug in standard ESC/POS thermal printers and USB/Bluetooth barcode guns without proprietary contracts.
                  </p>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2 text-xs font-medium text-foreground">
                    <div className="p-3 rounded-lg border border-border bg-muted/20">
                      <p className="text-[11px] text-muted-foreground">Thermal Printers</p>
                      <p className="font-bold mt-0.5">58mm &amp; 80mm ESC/POS</p>
                    </div>
                    <div className="p-3 rounded-lg border border-border bg-muted/20">
                      <p className="text-[11px] text-muted-foreground">Barcode Guns</p>
                      <p className="font-bold mt-0.5">1D / 2D USB &amp; Wireless</p>
                    </div>
                    <div className="p-3 rounded-lg border border-border bg-muted/20">
                      <p className="text-[11px] text-muted-foreground">Operating Systems</p>
                      <p className="font-bold mt-0.5">Windows, Mac, Android, iOS</p>
                    </div>
                  </div>
                </div>

                <div className="lg:col-span-5 flex flex-col gap-3 p-5 rounded-xl border border-border bg-muted/20">
                  <div className="flex items-center gap-2.5">
                    <Settings className="h-5 w-5 text-primary shrink-0" />
                    <div>
                      <p className="text-sm font-bold text-foreground">Need Custom Assistance?</p>
                      <p className="text-xs text-muted-foreground">Our team assists with catalog uploads and hardware pairing.</p>
                    </div>
                  </div>
                  <div className="pt-2 flex flex-col sm:flex-row gap-2">
                    <Button asChild size="sm" className="rounded-lg font-semibold">
                      <Link href={APP_ROUTES.CONTACT}>Contact Support</Link>
                    </Button>
                    <Button asChild size="sm" variant="outline" className="rounded-lg font-semibold">
                      <Link href={APP_ROUTES.PRICING}>View Subscriptions</Link>
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* ── BOTTOM CTA ───────────────────────────────────────────────────── */}
      <section className="py-14 md:py-20 bg-card">
        <ScrollReveal distance={26} duration={900}>
          <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center space-y-5">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
              Ready to Upgrade?
            </span>
            <h2 className="font-heading text-3xl font-extrabold tracking-tight sm:text-4xl text-foreground">
              Experience modern billing, stock control, and khata in action.
            </h2>
            <p className="max-w-xl mx-auto text-sm sm:text-base text-muted-foreground leading-relaxed">
              Sign in to your account to open your active store register, or explore our transparent pricing plans.
            </p>

            <div className="pt-1 flex flex-col sm:flex-row justify-center gap-3">
              <Button asChild size="lg" className="rounded-lg font-semibold shadow-xs apple-button-press">
                <Link href={APP_ROUTES.DASHBOARD}>
                  Launch Dashboard POS <ArrowRight className="h-4 w-4 ml-1.5" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="rounded-lg font-semibold apple-button-press">
                <Link href={APP_ROUTES.PRICING}>Compare Pricing Tiers</Link>
              </Button>
            </div>

            <p className="pt-1 text-xs text-muted-foreground">
              Instant access. Works with any standard thermal printer and barcode scanner.
            </p>
          </div>
        </ScrollReveal>
      </section>
    </div>
  );
}
