import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, CreditCard, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { APP_ROUTES } from "@/lib/routes";
import { serviceListSchema } from "@/lib/jsonld";

export const metadata: Metadata = {
  title: "Digital Customer Khata & Credit Management",
  description: "Replace your physical udhar bahi khata with MiniHisab's digital customer ledger. Track pending balances, send reminders, and manage credit sales easily.",
  alternates: { canonical: "/features/customer-khata" },
};

export default function CustomerKhataFeaturePage() {
  const jsonLd = serviceListSchema([
    {
      title: "Digital Udhar Khata",
      text: "Record credit sales against customer profiles automatically during billing.",
    },
    {
      title: "Payment Tracking",
      text: "Accept partial or full payments and update customer balances instantly.",
    },
  ]);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="max-w-3xl">
          <Breadcrumbs items={[{ name: "Features", url: "/features" }, { name: "Customer Khata", url: "/features/customer-khata" }]} />
          <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-primary">Core Feature</p>
          <h1 className="mt-3 font-heading text-4xl font-extrabold tracking-tight sm:text-5xl">
            Digital Customer Khata & Credit Management
          </h1>
          <p className="mt-5 text-lg leading-8 text-muted-foreground">
            Lose the notebook. MiniHisab's digital udhar khata helps you track customer balances, record payments, and manage credit risk without the manual math errors.
          </p>
          <div className="mt-8 flex gap-4">
            <Button asChild size="lg" className="rounded-[8px]">
              <Link href={APP_ROUTES.REGISTER}>
                Digitize Your Khata <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="border-y border-border bg-muted/25 py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
            <div>
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <CreditCard className="h-6 w-6" />
              </div>
              <h2 className="mt-6 font-heading text-3xl font-bold">Never lose track of pending payments</h2>
              <ul className="mt-8 space-y-4">
                {[
                  "Create detailed customer profiles with contact info",
                  "Auto-update balances when processing credit sales",
                  "Record partial or full payments seamlessly",
                  "View complete purchase and payment history",
                  "Identify your top customers and outstanding dues",
                ].map((feature) => (
                  <li key={feature} className="flex items-start">
                    <CheckCircle2 className="mr-3 h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                    <span className="text-muted-foreground">{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="relative aspect-square w-full rounded-2xl bg-card border border-border shadow-sm overflow-hidden flex items-center justify-center">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent pointer-events-none" />
              <p className="text-muted-foreground font-medium">Customer Ledger Preview</p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
