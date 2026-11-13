import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, CreditCard, Check, ArrowLeft, Send, ShieldCheck, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { APP_ROUTES } from "@/lib/routes";
import { serviceListSchema } from "@/lib/jsonld";
import { CustomerKhataPreview } from "@/components/marketing/feature-previews";

export const metadata: Metadata = {
  title: "Digital Customer Khata & Credit Ledger Software - MiniHisab",
  description:
    "Digital udhar bahi khata for retail shops and wholesale buyers: track customer balances, apply 30-day credit terms, record partial payments, and send WhatsApp reminders.",
  alternates: { canonical: "/features/customer-khata" },
};

export default function CustomerKhataFeaturePage() {
  const jsonLd = serviceListSchema([
    {
      title: "Digital Udhar Ledger",
      text: "Track customer credit sales, repayments, and outstanding balances with zero paper errors.",
    },
    {
      title: "Payment Reminders",
      text: "Send structured ledger balance statements directly to customers via WhatsApp or SMS.",
    },
    {
      title: "Credit Risk Limits",
      text: "Set maximum credit caps and payment term durations per customer profile.",
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
              { name: "Customer Khata", url: "/features/customer-khata" },
            ]}
          />

          <div className="mt-8 grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
            {/* Left Content (6 cols) */}
            <div className="lg:col-span-6">
              <span className="inline-flex items-center rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                Digital Udhar Khata
              </span>

              <h1 className="mt-4 font-heading text-3xl font-extrabold tracking-tight sm:text-4xl lg:text-5xl text-foreground">
                Digital customer ledgers with credit terms.
              </h1>

              <p className="mt-4 text-base leading-relaxed text-muted-foreground sm:text-lg">
                Eliminate lost receipts and manual ledger math. Track running customer balances, configure 15 or 30-day credit terms, record partial payments, and share verified statement summaries.
              </p>

              <div className="mt-7 flex flex-wrap gap-3">
                <Button asChild size="lg" className="rounded-md font-semibold shadow-xs h-11">
                  <Link href={APP_ROUTES.DASHBOARD}>
                    View Khata Dashboard <ArrowRight className="ml-1.5 h-4 w-4" />
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
                  <Check className="h-3.5 w-3.5 text-primary shrink-0" /> Automated debit/credit entries
                </span>
                <span className="flex items-center gap-1.5">
                  <Check className="h-3.5 w-3.5 text-primary shrink-0" /> 1-click WhatsApp statement
                </span>
                <span className="flex items-center gap-1.5">
                  <Check className="h-3.5 w-3.5 text-primary shrink-0" /> Credit limits per customer
                </span>
                <span className="flex items-center gap-1.5">
                  <Check className="h-3.5 w-3.5 text-primary shrink-0" /> Partial UPI &amp; Cash payments
                </span>
              </div>
            </div>

            {/* Right Live Simulation (6 cols) */}
            <div className="lg:col-span-6">
              <CustomerKhataPreview />
            </div>
          </div>
        </div>
      </section>

      {/* ── CORE CAPABILITIES BREAKDOWN ───────────────────────────────────── */}
      <section className="py-16 md:py-20 bg-muted/20 border-b border-border/70">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl">
            <h2 className="font-heading text-2xl font-bold tracking-tight sm:text-3xl text-foreground">
              Clear credit records for retail and B2B buyers
            </h2>
            <p className="mt-3 text-base text-muted-foreground">
              Whether offering flexible credit to local neighborhood shoppers or managing structured trade credit for wholesale distributors.
            </p>
          </div>

          <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="rounded-xl border border-border bg-card p-6 shadow-xs space-y-3">
              <div className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Clock className="h-5 w-5" />
              </div>
              <h3 className="font-heading text-lg font-bold text-foreground">Payment Aging &amp; Due Dates</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                See overdue balances grouped by aging brackets (e.g. 0-15 days, 16-30 days, 30+ days). Know exactly when to follow up before extending further credit.
              </p>
            </div>

            <div className="rounded-xl border border-border bg-card p-6 shadow-xs space-y-3">
              <div className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Send className="h-5 w-5" />
              </div>
              <h3 className="font-heading text-lg font-bold text-foreground">WhatsApp Statement Sharing</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Send professional statement summaries with invoice numbers, payment receipts, and net due balances directly to the customer's phone in one click.
              </p>
            </div>

            <div className="rounded-xl border border-border bg-card p-6 shadow-xs space-y-3">
              <div className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <h3 className="font-heading text-lg font-bold text-foreground">Credit Caps &amp; Guardrails</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Set individual credit caps. If an outstanding balance exceeds the assigned ceiling, the billing counter alerts the cashier before completing the sale.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── FOOTER CTA ───────────────────────────────────────────────────── */}
      <section className="border-t border-border/70 bg-muted/30 py-16 text-center">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="font-heading text-2xl font-bold tracking-tight sm:text-3xl text-foreground">
            Digitize your customer ledgers
          </h2>
          <p className="mt-3 text-base text-muted-foreground max-w-xl mx-auto">
            Experience how automated credit tracking works inside the MiniHisab dashboard.
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
