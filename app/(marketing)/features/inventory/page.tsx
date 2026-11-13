import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Boxes, Check, ArrowLeft, AlertTriangle, Layers, RefreshCw, Barcode } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { APP_ROUTES } from "@/lib/routes";
import { serviceListSchema } from "@/lib/jsonld";
import { InventoryPreview } from "@/components/marketing/feature-previews";

export const metadata: Metadata = {
  title: "Retail & Wholesale Inventory Management Software - MiniHisab",
  description:
    "Track stock across retail counters and wholesale godowns. Manage master cartons, single units, automated low-stock reorder alerts, and batch numbers.",
  alternates: { canonical: "/features/inventory" },
};

export default function InventoryFeaturePage() {
  const jsonLd = serviceListSchema([
    {
      title: "Real-time Stock Tracking",
      text: "Automatic stock deduction upon bill finalization, preventing double-selling across retail counters and online channels.",
    },
    {
      title: "Master Carton & Unit Measurement",
      text: "Track bulk cartons, rolls, and loose individual units with automatic multi-unit conversion math.",
    },
    {
      title: "Low Stock Reorder Alerts",
      text: "Automated warnings when inventory dips below minimum safety thresholds to prevent stock-outs.",
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
              { name: "Inventory", url: "/features/inventory" },
            ]}
          />

          <div className="mt-8 grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
            {/* Left Content (6 cols) */}
            <div className="lg:col-span-6">
              <span className="inline-flex items-center rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                Stock &amp; Carton Control
              </span>

              <h1 className="mt-4 font-heading text-3xl font-extrabold tracking-tight sm:text-4xl lg:text-5xl text-foreground">
                Stock control for loose units and wholesale cartons.
              </h1>

              <p className="mt-4 text-base leading-relaxed text-muted-foreground sm:text-lg">
                Stop reconciling physical stock by guesswork. MiniHisab handles multi-unit conversions (master cartons to loose units), low-stock reorder thresholds, and multi-location godown balances in real time.
              </p>

              <div className="mt-7 flex flex-wrap gap-3">
                <Button asChild size="lg" className="rounded-md font-semibold shadow-xs h-11">
                  <Link href={APP_ROUTES.DASHBOARD}>
                    Manage Stock <ArrowRight className="ml-1.5 h-4 w-4" />
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
                  <Check className="h-3.5 w-3.5 text-primary shrink-0" /> Master carton conversion math
                </span>
                <span className="flex items-center gap-1.5">
                  <Check className="h-3.5 w-3.5 text-primary shrink-0" /> Reorder threshold alerts
                </span>
                <span className="flex items-center gap-1.5">
                  <Check className="h-3.5 w-3.5 text-primary shrink-0" /> CSV stock bulk import
                </span>
                <span className="flex items-center gap-1.5">
                  <Check className="h-3.5 w-3.5 text-primary shrink-0" /> Batch &amp; expiry tracking
                </span>
              </div>
            </div>

            {/* Right Live Simulation (6 cols) */}
            <div className="lg:col-span-6">
              <InventoryPreview />
            </div>
          </div>
        </div>
      </section>

      {/* ── CORE CAPABILITIES BREAKDOWN ───────────────────────────────────── */}
      <section className="py-16 md:py-20 bg-muted/20 border-b border-border/70">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl">
            <h2 className="font-heading text-2xl font-bold tracking-tight sm:text-3xl text-foreground">
              Built for retail shops with wholesale godowns
            </h2>
            <p className="mt-3 text-base text-muted-foreground">
              Handle the dual reality of selling individual pieces at the retail counter while receiving full supplier pallets at the warehouse.
            </p>
          </div>

          <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="rounded-xl border border-border bg-card p-6 shadow-xs space-y-3">
              <div className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Layers className="h-5 w-5" />
              </div>
              <h3 className="font-heading text-lg font-bold text-foreground">Multi-Unit Conversion</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Define custom unit hierarchies: 1 Master Carton = 40 Rolls = 2,000 meters. Sell in any unit, and MiniHisab recalculates available master stock automatically.
              </p>
            </div>

            <div className="rounded-xl border border-border bg-card p-6 shadow-xs space-y-3">
              <div className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <h3 className="font-heading text-lg font-bold text-foreground">Automated Safety Thresholds</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Set minimum stock limits per SKU. Get instant dashboard warnings before fast-moving items run out, avoiding lost sales and counter delays.
              </p>
            </div>

            <div className="rounded-xl border border-border bg-card p-6 shadow-xs space-y-3">
              <div className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <RefreshCw className="h-5 w-5" />
              </div>
              <h3 className="font-heading text-lg font-bold text-foreground">Stock Adjustments &amp; Audits</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Record stock adjustments for breakage, physical audit variance, or vendor returns with mandatory reason notes and user timestamps.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── FOOTER CTA ───────────────────────────────────────────────────── */}
      <section className="border-t border-border/70 bg-muted/30 py-16 text-center">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="font-heading text-2xl font-bold tracking-tight sm:text-3xl text-foreground">
            Get your stock organized
          </h2>
          <p className="mt-3 text-base text-muted-foreground max-w-xl mx-auto">
            Test stock management with your product catalog on the live dashboard.
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
