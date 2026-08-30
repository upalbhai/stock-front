import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Boxes, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { APP_ROUTES } from "@/lib/routes";
import { serviceListSchema } from "@/lib/jsonld";

export const metadata: Metadata = {
  title: "Retail Inventory Management Software",
  description: "Take control of your shop's stock with our inventory management software. Get real-time alerts, track variations, and prevent stock-outs.",
  alternates: { canonical: "/features/inventory" },
};

export default function InventoryFeaturePage() {
  const jsonLd = serviceListSchema([
    {
      title: "Real-time Stock Tracking",
      text: "Stock is automatically deducted as soon as a sale is made, keeping your inventory numbers accurate.",
    },
    {
      title: "Low Stock Alerts",
      text: "Never run out of your best-selling items. Get notified before stock goes empty.",
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
          <Breadcrumbs items={[{ name: "Features", url: "/features" }, { name: "Inventory", url: "/features/inventory" }]} />
          <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-primary">Core Feature</p>
          <h1 className="mt-3 font-heading text-4xl font-extrabold tracking-tight sm:text-5xl">
            Smarter Retail Inventory Management
          </h1>
          <p className="mt-5 text-lg leading-8 text-muted-foreground">
            Stop guessing what's in your store. MiniHisab gives you complete visibility over your stock levels, variants, and purchase history.
          </p>
          <div className="mt-8 flex gap-4">
            <Button asChild size="lg" className="rounded-[8px]">
              <Link href={APP_ROUTES.REGISTER}>
                Organize Your Stock <ArrowRight className="ml-2 h-4 w-4" />
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
                <Boxes className="h-6 w-6" />
              </div>
              <h2 className="mt-6 font-heading text-3xl font-bold">Prevent shrinkage and stock-outs</h2>
              <ul className="mt-8 space-y-4">
                {[
                  "Automatic stock deductions upon billing",
                  "Support for variants (size, color, etc.)",
                  "Bulk import inventory via Excel/CSV",
                  "Track supplier details and purchase orders",
                  "Get daily low stock reports",
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
              <p className="text-muted-foreground font-medium">Inventory Dashboard Preview</p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
