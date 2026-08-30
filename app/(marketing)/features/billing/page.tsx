import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, ReceiptText, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { APP_ROUTES } from "@/lib/routes";
import { serviceListSchema } from "@/lib/jsonld";

export const metadata: Metadata = {
  title: "Retail Billing Software | Fast POS System",
  description: "MiniHisab's retail billing software helps you manage your shop counter efficiently. Generate instant receipts, handle barcodes, and streamline checkout.",
  alternates: { canonical: "/features/billing" },
};

export default function BillingFeaturePage() {
  const jsonLd = serviceListSchema([
    {
      title: "Fast POS Billing",
      text: "Quickly scan barcodes, search items, and add to cart for a smooth checkout experience.",
    },
    {
      title: "Customizable Receipts",
      text: "Print professional receipts with your shop logo, terms, and tax details.",
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
          <Breadcrumbs items={[{ name: "Features", url: "/features" }, { name: "Billing", url: "/features/billing" }]} />
          <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-primary">Core Feature</p>
          <h1 className="mt-3 font-heading text-4xl font-extrabold tracking-tight sm:text-5xl">
            Retail Billing Software Designed for Speed
          </h1>
          <p className="mt-5 text-lg leading-8 text-muted-foreground">
            Don't keep your customers waiting. Our Point of Sale (POS) system is built for the Indian retail environment, allowing you to punch bills faster than ever before.
          </p>
          <div className="mt-8 flex gap-4">
            <Button asChild size="lg" className="rounded-[8px]">
              <Link href={APP_ROUTES.REGISTER}>
                Start Billing Now <ArrowRight className="ml-2 h-4 w-4" />
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
                <ReceiptText className="h-6 w-6" />
              </div>
              <h2 className="mt-6 font-heading text-3xl font-bold">Everything you need at the counter</h2>
              <ul className="mt-8 space-y-4">
                {[
                  "Barcode scanner integration for instant item lookup",
                  "Hold bills during checkout and resume them later",
                  "Apply discounts on total bill or individual items",
                  "Split payment methods (Cash, UPI, Card)",
                  "Custom receipt printing sizes (2 inch, 3 inch, A4)",
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
              <p className="text-muted-foreground font-medium">Interactive POS Preview</p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
