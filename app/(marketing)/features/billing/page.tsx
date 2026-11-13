import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, ReceiptText, Check, ArrowLeft, Printer, QrCode, Keyboard, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { APP_ROUTES } from "@/lib/routes";
import { serviceListSchema } from "@/lib/jsonld";
import { BillingPreview } from "@/components/marketing/feature-previews";

export const metadata: Metadata = {
  title: "Retail POS Billing Software - Fast Checkout Counter",
  description:
    "Fast counter billing software for retail shops: USB/Bluetooth barcode scanning, 80mm thermal receipt printing, split payment modes, and offline cart recovery.",
  alternates: { canonical: "/features/billing" },
};

export default function BillingFeaturePage() {
  const jsonLd = serviceListSchema([
    {
      title: "Barcode Counter Billing",
      text: "Quickly scan 1D and 2D barcodes to add items instantly to active bills without typing.",
    },
    {
      title: "ESC/POS Thermal Printing",
      text: "Direct printing to 58mm and 80mm thermal receipt printers without preview dialogs.",
    },
    {
      title: "Split Payment Settlement",
      text: "Accept mixed payments across Cash, UPI QR, Debit/Credit Card, and Store Credit.",
    },
  ]);

  return (
    <div>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* ── HEADER & SHOWCASE ────────────────────────────────────────────── */}
      <section className="border-b border-border/70 bg-background pt-12 pb-16 md:pt-16 md:pb-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Breadcrumbs
            items={[
              { name: "Features", url: "/features" },
              { name: "POS Billing", url: "/features/billing" },
            ]}
          />

          <div className="mt-8 grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
            {/* Left Content (6 cols) */}
            <div className="lg:col-span-6">
              <span className="inline-flex items-center rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                Counter POS Billing
              </span>

              <h1 className="mt-4 font-heading text-3xl font-extrabold tracking-tight sm:text-4xl lg:text-5xl text-foreground">
                Rapid barcode billing built for busy counters.
              </h1>

              <p className="mt-4 text-base leading-relaxed text-muted-foreground sm:text-lg">
                Keep counter queues moving. MiniHisab combines barcode auto-scanning, rapid keyboard shortcuts, split payment settlement, and direct ESC/POS thermal printing into a single responsive screen.
              </p>

              <div className="mt-7 flex flex-wrap gap-3">
                <Button asChild size="lg" className="rounded-md font-semibold shadow-xs h-11">
                  <Link href={APP_ROUTES.DASHBOARD}>
                    Try POS Counter <ArrowRight className="ml-1.5 h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg" className="rounded-md font-semibold h-11">
                  <Link href="/features">
                    <ArrowLeft className="mr-1.5 h-4 w-4" /> All Features
                  </Link>
                </Button>
              </div>

              <div className="mt-8 grid grid-cols-2 gap-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <Check className="h-3.5 w-3.5 text-primary shrink-0" /> ESC/POS 58mm &amp; 80mm ready
                </span>
                <span className="flex items-center gap-1.5">
                  <Check className="h-3.5 w-3.5 text-primary shrink-0" /> USB &amp; Bluetooth scanners
                </span>
                <span className="flex items-center gap-1.5">
                  <Check className="h-3.5 w-3.5 text-primary shrink-0" /> Dynamic UPI QR generation
                </span>
                <span className="flex items-center gap-1.5">
                  <Check className="h-3.5 w-3.5 text-primary shrink-0" /> Cart hold and resume
                </span>
              </div>
            </div>

            {/* Right Live Simulation (6 cols) */}
            <div className="lg:col-span-6">
              <BillingPreview />
            </div>
          </div>
        </div>
      </section>

      {/* ── CORE CAPABILITIES BREAKDOWN ───────────────────────────────────── */}
      <section className="py-16 md:py-20 bg-muted/20 border-b border-border/70">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl">
            <h2 className="font-heading text-2xl font-bold tracking-tight sm:text-3xl text-foreground">
              Counter efficiency without complex hardware setup
            </h2>
            <p className="mt-3 text-base text-muted-foreground">
              Every detail is engineered for retail cashiers who need to scan, tender, and print receipts in under 15 seconds per customer.
            </p>
          </div>

          <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="rounded-xl border border-border bg-card p-6 shadow-xs space-y-3">
              <div className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Zap className="h-5 w-5" />
              </div>
              <h3 className="font-heading text-lg font-bold text-foreground">Continuous Barcode Auto-Scan</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Plug in any standard USB or Bluetooth barcode reader. Scanned items automatically add to the cart and increment quantities without requiring mouse clicks.
              </p>
            </div>

            <div className="rounded-xl border border-border bg-card p-6 shadow-xs space-y-3">
              <div className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Printer className="h-5 w-5" />
              </div>
              <h3 className="font-heading text-lg font-bold text-foreground">Direct Thermal Printing</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Connect your 58mm or 80mm thermal receipt printer. Print receipts with store logo, tax breakdown, and return policies with zero print-dialog delays.
              </p>
            </div>

            <div className="rounded-xl border border-border bg-card p-6 shadow-xs space-y-3">
              <div className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <QrCode className="h-5 w-5" />
              </div>
              <h3 className="font-heading text-lg font-bold text-foreground">Dynamic UPI &amp; Split Tender</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Split a bill across multiple payment methods: accept partial cash and generate a dynamic on-screen UPI QR for the exact balance with instant confirmation.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── KEYBOARD SHORTCUTS REFERENCE ─────────────────────────────────── */}
      <section className="py-16 md:py-20 bg-background">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary">
              <Keyboard className="h-4 w-4" /> Keyboard-First Operation
            </div>
            <h2 className="mt-2 font-heading text-2xl font-bold tracking-tight sm:text-3xl text-foreground">
              Designed for speed without reaching for the mouse
            </h2>
            <p className="mt-3 text-base text-muted-foreground">
              Experienced store operators punch bills through hotkeys. MiniHisab maps standard POS keyboard shortcuts:
            </p>
          </div>

          <div className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="rounded-lg border border-border bg-card p-4 text-center space-y-1">
              <kbd className="inline-block rounded border border-border bg-muted px-2.5 py-1 font-mono text-xs font-bold text-foreground">
                F2
              </kbd>
              <p className="text-xs font-semibold text-foreground">Manual Item Search</p>
              <p className="text-[11px] text-muted-foreground">Search by name or category</p>
            </div>

            <div className="rounded-lg border border-border bg-card p-4 text-center space-y-1">
              <kbd className="inline-block rounded border border-border bg-muted px-2.5 py-1 font-mono text-xs font-bold text-foreground">
                F4
              </kbd>
              <p className="text-xs font-semibold text-foreground">Apply Discount</p>
              <p className="text-[11px] text-muted-foreground">Percentage or flat rupee discount</p>
            </div>

            <div className="rounded-lg border border-border bg-card p-4 text-center space-y-1">
              <kbd className="inline-block rounded border border-border bg-muted px-2.5 py-1 font-mono text-xs font-bold text-foreground">
                F8
              </kbd>
              <p className="text-xs font-semibold text-foreground">Hold / Resume Cart</p>
              <p className="text-[11px] text-muted-foreground">Serve next customer without data loss</p>
            </div>

            <div className="rounded-lg border border-border bg-card p-4 text-center space-y-1">
              <kbd className="inline-block rounded border border-border bg-muted px-2.5 py-1 font-mono text-xs font-bold text-primary">
                F9
              </kbd>
              <p className="text-xs font-semibold text-foreground">Print &amp; Close</p>
              <p className="text-[11px] text-muted-foreground">Triggers receipt and opens cash drawer</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── FOOTER CTA ───────────────────────────────────────────────────── */}
      <section className="border-t border-border/70 bg-muted/30 py-16 text-center">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="font-heading text-2xl font-bold tracking-tight sm:text-3xl text-foreground">
            Test the POS counter interface
          </h2>
          <p className="mt-3 text-base text-muted-foreground max-w-xl mx-auto">
            Open the live dashboard and experience how rapid barcode checkout works with your hardware.
          </p>
          <div className="mt-7 flex justify-center gap-3">
            <Button asChild size="lg" className="rounded-md font-semibold h-11">
              <Link href={APP_ROUTES.DASHBOARD}>
                Open Dashboard <ArrowRight className="ml-1.5 h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="rounded-md font-semibold h-11">
              <Link href={APP_ROUTES.PRICING}>
                View Pricing Plans
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
