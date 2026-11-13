import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, FileSpreadsheet, Check, ArrowLeft, Printer, Shield, Download, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { APP_ROUTES } from "@/lib/routes";
import { serviceListSchema } from "@/lib/jsonld";
import { GstInvoicePreview } from "@/components/marketing/feature-previews";

export const metadata: Metadata = {
  title: "GST Invoice Generator & Tax Compliance Software - MiniHisab",
  description:
    "Generate compliant B2B GST tax invoices, retail cash memos, HSN/SAC code breakdowns, and GSTR-ready sales reports with automatic tax calculation.",
  alternates: { canonical: "/features/gst-invoices" },
};

export default function GSTInvoiceFeaturePage() {
  const jsonLd = serviceListSchema([
    {
      title: "Automatic GST Rate Calculation",
      text: "Applies 0%, 5%, 12%, 18%, and 28% tax slabs automatically with split CGST/SGST and inter-state IGST calculations.",
    },
    {
      title: "Compliant Tax Invoices",
      text: "Print professional A4 invoices and 80mm thermal receipts with verified Seller and Buyer GSTIN.",
    },
    {
      title: "GSTR Sales Reports",
      text: "Export monthly sales register formatted for CA review and GSTR-1 return filing.",
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
              { name: "GST Invoices", url: "/features/gst-invoices" },
            ]}
          />

          <div className="mt-8 grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
            {/* Left Content (6 cols) */}
            <div className="lg:col-span-6">
              <span className="inline-flex items-center rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                Tax Invoices &amp; Compliance
              </span>

              <h1 className="mt-4 font-heading text-3xl font-extrabold tracking-tight sm:text-4xl lg:text-5xl text-foreground">
                GST tax invoices and filing reports made simple.
              </h1>

              <p className="mt-4 text-base leading-relaxed text-muted-foreground sm:text-lg">
                Eliminate manual tax math errors. MiniHisab handles automatic HSN code lookups, split CGST/SGST and IGST rules, buyer GSTIN verification, and one-click monthly GSTR sales exports.
              </p>

              <div className="mt-7 flex flex-wrap gap-3">
                <Button asChild size="lg" className="rounded-md font-semibold shadow-xs h-11">
                  <Link href={APP_ROUTES.DASHBOARD}>
                    Create GST Invoice <ArrowRight className="ml-1.5 h-4 w-4" />
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
                  <Check className="h-3.5 w-3.5 text-primary shrink-0" /> Intra-state CGST &amp; SGST split
                </span>
                <span className="flex items-center gap-1.5">
                  <Check className="h-3.5 w-3.5 text-primary shrink-0" /> Inter-state IGST calculation
                </span>
                <span className="flex items-center gap-1.5">
                  <Check className="h-3.5 w-3.5 text-primary shrink-0" /> Full A4 &amp; 80mm formats
                </span>
                <span className="flex items-center gap-1.5">
                  <Check className="h-3.5 w-3.5 text-primary shrink-0" /> GSTR-1 ready CSV reports
                </span>
              </div>
            </div>

            {/* Right Live Simulation (6 cols) */}
            <div className="lg:col-span-6">
              <GstInvoicePreview />
            </div>
          </div>
        </div>
      </section>

      {/* ── CORE CAPABILITIES BREAKDOWN ───────────────────────────────────── */}
      <section className="py-16 md:py-20 bg-muted/20 border-b border-border/70">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl">
            <h2 className="font-heading text-2xl font-bold tracking-tight sm:text-3xl text-foreground">
              Compliant documentation for B2C counters and B2B wholesale
            </h2>
            <p className="mt-3 text-base text-muted-foreground">
              Everything required by Indian tax regulations, whether issuing simplified thermal retail slips or multi-item B2B dispatch invoices.
            </p>
          </div>

          <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="rounded-xl border border-border bg-card p-6 shadow-xs space-y-3">
              <div className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Shield className="h-5 w-5" />
              </div>
              <h3 className="font-heading text-lg font-bold text-foreground">HSN/SAC Code Hierarchy</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Assign 4-digit, 6-digit, or 8-digit HSN codes per product. Taxes compute accurately regardless of item categories or varying GST slabs.
              </p>
            </div>

            <div className="rounded-xl border border-border bg-card p-6 shadow-xs space-y-3">
              <div className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <FileText className="h-5 w-5" />
              </div>
              <h3 className="font-heading text-lg font-bold text-foreground">B2B Tax Invoices with E-Way Bill</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Include buyer trade name, verified GSTIN, state code (place of supply), transporter name, vehicle number, and E-Way bill number on standard A4 prints.
              </p>
            </div>

            <div className="rounded-xl border border-border bg-card p-6 shadow-xs space-y-3">
              <div className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Download className="h-5 w-5" />
              </div>
              <h3 className="font-heading text-lg font-bold text-foreground">GSTR-1 Monthly Export</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Provide your chartered accountant with pre-formatted GSTR-1 sales registers with taxable values, tax slab breakdowns, and invoice series sequences.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── FOOTER CTA ───────────────────────────────────────────────────── */}
      <section className="border-t border-border/70 bg-muted/30 py-16 text-center">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="font-heading text-2xl font-bold tracking-tight sm:text-3xl text-foreground">
            Generate compliant invoices today
          </h2>
          <p className="mt-3 text-base text-muted-foreground max-w-xl mx-auto">
            Test GST invoice generation directly with your company tax details on the live dashboard.
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
