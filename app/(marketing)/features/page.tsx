import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, ReceiptText, Boxes, CreditCard, BarChart3, Building2, ShieldCheck, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { APP_ROUTES } from "@/lib/routes";
import { serviceListSchema } from "@/lib/jsonld";

export const metadata: Metadata = {
  title: "Features - Retail Billing & Inventory",
  description: "Explore the comprehensive features of MiniHisab including POS billing, GST invoices, inventory management, customer khata, and daily reports.",
  alternates: { canonical: "/features" },
};

const featureSections = [
  {
    id: "billing",
    title: "Fast POS Billing & Invoices",
    description: "Speed up your checkout counter with quick item entry, barcode support, and instant receipt generation.",
    icon: ReceiptText,
    highlights: ["Quick search and barcode scanning", "Customizable GST and non-GST invoices", "Print receipts instantly", "Hold and resume carts"],
    link: "/features/billing",
  },
  {
    id: "inventory",
    title: "Real-time Inventory Management",
    description: "Keep track of every item in your store. Get low-stock alerts and manage multiple units of measurement.",
    icon: Boxes,
    highlights: ["Automatic stock deduction on sale", "Low stock alerts", "Stock adjustments and history", "Category and brand organization"],
    link: "/features/inventory",
  },
  {
    id: "customers",
    title: "Customer Khata & Credit",
    description: "Replace your physical notebook with digital customer ledgers. Track credit sales and payments easily.",
    icon: CreditCard,
    highlights: ["Digital customer ledger (Khata)", "Track pending balances", "Record partial or full payments", "Customer purchase history"],
    link: "/features/customer-khata",
  },
  {
    id: "gst-invoices",
    title: "GST Invoices & Tax Compliance",
    description: "Automatically calculate taxes and generate GST-ready invoices with HSN/SAC codes.",
    icon: ReceiptText,
    highlights: ["Auto CGST/SGST/IGST calculations", "Inclusive and exclusive tax pricing", "GSTR-ready sales reports", "Custom invoice formats"],
    link: "/features/gst-invoices",
  },
  {
    id: "reports",
    title: "Reports & Profit Tracking",
    description: "Understand your business health with daily summaries, sales reports, and profit margins.",
    icon: BarChart3,
    highlights: ["Daily, weekly, and monthly sales summaries", "Item-wise profit reports", "GST reports for filing", "Expense tracking"],
  },
  {
    id: "outlets",
    title: "Multi-Outlet Controls",
    description: "Manage multiple store locations from a single dashboard. Track stock and sales across all your branches.",
    icon: Building2,
    highlights: ["Centralized dashboard", "Outlet-wise stock tracking", "Stock transfers between branches", "Compare outlet performance"],
  },
  {
    id: "staff",
    title: "Staff Roles & Permissions",
    description: "Give your team the access they need while protecting sensitive business data like profit margins.",
    icon: ShieldCheck,
    highlights: ["Owner, manager, and cashier roles", "Restrict access to purchase prices", "Track sales by staff member", "Detailed audit logs"],
  },
];

export default function FeaturesPage() {
  const jsonLd = serviceListSchema(
    featureSections.map((section) => ({
      title: section.title,
      text: section.description,
    }))
  );

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="max-w-3xl">
          <Breadcrumbs items={[{ name: "Features", url: "/features" }]} />
          <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-primary">Features</p>
          <h1 className="mt-3 font-heading text-4xl font-extrabold tracking-tight sm:text-5xl">
            Everything you need to run your retail shop efficiently.
          </h1>
          <p className="mt-5 text-base leading-7 text-muted-foreground">
            From the billing counter to the back office, MiniHisab provides the tools to manage your entire operation smoothly.
          </p>
        </div>
      </section>

      <section className="border-t border-border bg-muted/25">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-16">
            {featureSections.map((section, index) => {
              const Icon = section.icon;
              const isEven = index % 2 === 0;
              
              return (
                <div key={section.id} id={section.id} className={`flex flex-col gap-8 md:flex-row md:items-center ${isEven ? '' : 'md:flex-row-reverse'}`}>
                  <div className="flex-1 space-y-4">
                    <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <Icon className="h-6 w-6" />
                    </div>
                    <h2 className="font-heading text-3xl font-bold">{section.title}</h2>
                    <p className="text-lg text-muted-foreground">{section.description}</p>
                    <ul className="mt-6 space-y-3">
                      {section.highlights.map((highlight) => (
                        <li key={highlight} className="flex items-start">
                          <CheckCircle2 className="mr-3 h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                          <span className="text-foreground">{highlight}</span>
                        </li>
                      ))}
                    </ul>
                    {section.link && (
                      <div className="mt-6">
                        <Link href={section.link} className="text-sm font-semibold text-primary hover:underline inline-flex items-center">
                          Learn more about {section.title.split(' ')[0]} <ArrowRight className="ml-1 h-4 w-4" />
                        </Link>
                      </div>
                    )}
                  </div>
                  <div className="flex-1 relative aspect-[4/3] w-full rounded-2xl bg-card border border-border shadow-sm overflow-hidden flex items-center justify-center">
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent pointer-events-none" />
                    {/* Placeholder for feature screenshot */}
                    <Icon className="h-24 w-24 text-muted-foreground/20" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="border-t border-border bg-primary text-primary-foreground">
        <div className="mx-auto flex max-w-7xl flex-col items-center gap-6 px-4 py-16 text-center sm:px-6 lg:px-8">
          <h2 className="font-heading text-3xl font-extrabold tracking-tight sm:text-4xl">Ready to upgrade your retail billing?</h2>
          <p className="max-w-2xl text-lg text-primary-foreground/80">
            Join thousands of smart retailers using MiniHisab to manage their daily operations.
          </p>
          <div className="mt-4 flex flex-col sm:flex-row gap-4">
            <Button asChild variant="secondary" size="lg" className="rounded-[8px]">
              <Link href={APP_ROUTES.LOGIN}>
                Get Started Now <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="rounded-[8px] bg-transparent border-primary-foreground/20 hover:bg-primary-foreground/10 text-primary-foreground">
              <Link href={APP_ROUTES.PRICING}>View Pricing</Link>
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}
