import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  Boxes,
  Building2,
  CreditCard,
  FileText,
  ReceiptText,
  Settings,
  ShieldCheck,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { APP_ROUTES } from "@/lib/routes";
import { serviceListSchema } from "@/lib/jsonld";

export const metadata: Metadata = {
  title: "Services",
  description: "Explore MiniHisab services for retail billing, inventory, GST invoices, outlets, staff, and reporting.",
  alternates: { canonical: "/services" },
};

const serviceGroups = [
  { title: "Billing and checkout", text: "POS billing, payment tracking, receipt flow, GST invoice generation, and order history.", icon: ReceiptText },
  { title: "Products and stock", text: "Product catalog, categories, units, stock adjustment, low-stock visibility, and outlet stock views.", icon: Boxes },
  { title: "Customers and credit", text: "Customer profiles, khata balances, credit issued today, and collection visibility.", icon: CreditCard },
  { title: "Reports and profit", text: "Daily reports, sales summaries, GST collected, wholesale sales, expenses, and profit ledger.", icon: BarChart3 },
  { title: "Outlets and staff", text: "Outlet setup, branch-level operations, staff accounts, roles, permissions, and audit logs.", icon: Building2 },
  { title: "Platform controls", text: "Admin approvals, subscriptions, plans, business status controls, and impersonation audit support.", icon: ShieldCheck },
];

export default function ServicesPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceListSchema(serviceGroups)) }}
      />
      <section className="border-b border-border bg-muted/25">
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
          <Breadcrumbs items={[{ name: "Services", url: "/services" }]} />
          <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-primary">Services</p>
          <h1 className="mt-3 max-w-3xl font-heading text-4xl font-extrabold tracking-tight sm:text-5xl">
            Everything the retail team touches in a normal working day.
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-muted-foreground">
            The public site now explains the service clearly, while the actual operational routes live inside the dashboard.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {serviceGroups.map((service) => {
            const Icon = service.icon;
            return (
              <div key={service.title} className="rounded-[8px] border border-border bg-card p-5 shadow-sm">
                <Icon className="h-6 w-6 text-primary" />
                <h2 className="mt-4 font-heading text-lg font-bold">{service.title}</h2>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{service.text}</p>
              </div>
            );
          })}
        </div>

        <div className="mt-10 flex flex-col gap-4 rounded-[8px] border border-border bg-card p-6 shadow-sm md:flex-row md:items-center md:justify-between">
          <div className="flex items-start gap-3">
            <Settings className="mt-1 h-5 w-5 text-warning" />
            <div>
              <h2 className="font-heading text-xl font-bold">Need to use the product?</h2>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">
                Sign in and continue from the dashboard area.
              </p>
            </div>
          </div>
          <Button asChild className="rounded-[8px]">
            <Link href={APP_ROUTES.DASHBOARD}>
              Open dashboard <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>
    </>
  );
}
