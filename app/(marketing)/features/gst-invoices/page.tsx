import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, ReceiptText, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { APP_ROUTES } from "@/lib/routes";
import { serviceListSchema } from "@/lib/jsonld";

export const metadata: Metadata = {
  title: "GST Invoice Generator Software",
  description: "Generate compliant GST invoices in seconds. MiniHisab handles tax calculations, HSN codes, and professional receipt formatting automatically.",
  alternates: { canonical: "/features/gst-invoices" },
};

export default function GSTInvoiceFeaturePage() {
  const jsonLd = serviceListSchema([
    {
      title: "Automatic GST Calculation",
      text: "Set tax slabs per item and let the software calculate CGST, SGST, and IGST automatically.",
    },
    {
      title: "GST Return Reports",
      text: "Download detailed tax reports ready for your CA to file GST returns.",
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
          <Breadcrumbs items={[{ name: "Features", url: "/features" }, { name: "GST Invoices", url: "/features/gst-invoices" }]} />
          <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-primary">Core Feature</p>
          <h1 className="mt-3 font-heading text-4xl font-extrabold tracking-tight sm:text-5xl">
            Compliant GST Invoice Generator
          </h1>
          <p className="mt-5 text-lg leading-8 text-muted-foreground">
            Make tax compliance easy. MiniHisab automatically calculates taxes, includes HSN codes, and generates professional GST invoices your customers will trust.
          </p>
          <div className="mt-8 flex gap-4">
            <Button asChild size="lg" className="rounded-[8px]">
              <Link href={APP_ROUTES.REGISTER}>
                Create GST Invoice <ArrowRight className="ml-2 h-4 w-4" />
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
              <h2 className="mt-6 font-heading text-3xl font-bold">Simplify your tax compliance</h2>
              <ul className="mt-8 space-y-4">
                {[
                  "Auto-calculation of CGST, SGST, and IGST",
                  "Support for both inclusive and exclusive tax pricing",
                  "Include HSN/SAC codes on printed invoices",
                  "Generate GSTR-ready sales reports for your CA",
                  "Customizable invoice prefix and numbering",
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
              <p className="text-muted-foreground font-medium">GST Invoice Preview</p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
