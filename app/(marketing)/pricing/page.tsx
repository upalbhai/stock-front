import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { APP_ROUTES } from "@/lib/routes";
import { softwareApplicationSchema } from "@/lib/jsonld";

export const metadata: Metadata = {
  title: "Pricing",
  description: "Compare MiniHisab plans for retail billing, inventory, GST invoices, and outlet operations.",
  alternates: { canonical: "/pricing" },
};

const plans = [
  {
    name: "Starter",
    price: "For new shops",
    points: ["Billing and products", "Basic stock control", "Daily sales view"],
  },
  {
    name: "Growth",
    price: "For active outlets",
    points: ["GST invoices", "Customer khata", "Reports and expenses"],
  },
  {
    name: "Scale",
    price: "For multi-outlet teams",
    points: ["Outlet controls", "Roles and audit logs", "Admin approvals"],
  },
];

export default function PricingPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareApplicationSchema()) }}
      />
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="max-w-3xl">
        <Breadcrumbs items={[{ name: "Pricing", url: "/pricing" }]} />
        <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-primary">Pricing</p>
        <h1 className="mt-3 font-heading text-4xl font-extrabold tracking-tight sm:text-5xl">
          Choose the service level that fits your retail workflow.
        </h1>
        <p className="mt-5 text-base leading-7 text-muted-foreground">
          Plan management stays inside the authenticated dashboard so owners can upgrade with the correct business account.
        </p>
      </div>

      <div className="mt-10 grid gap-4 lg:grid-cols-3">
        {plans.map((plan) => (
          <div key={plan.name} className="rounded-[8px] border border-border bg-card p-6 shadow-sm">
            <h2 className="font-heading text-2xl font-extrabold">{plan.name}</h2>
            <p className="mt-2 text-sm font-semibold text-primary">{plan.price}</p>
            <div className="mt-6 grid gap-3">
              {plan.points.map((point) => (
                <p key={point} className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CheckCircle2 className="h-4 w-4 text-info" />
                  {point}
                </p>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-10 flex flex-col gap-3 rounded-[8px] bg-primary p-6 text-primary-foreground sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-heading text-xl font-extrabold">Already have an account?</h2>
          <p className="mt-1 text-sm text-primary-foreground/80">Open the dashboard and manage your plan from subscription settings.</p>
        </div>
        <Button asChild variant="secondary" className="rounded-[8px]">
          <Link href={APP_ROUTES.SUBSCRIBE}>
            Manage plan <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </div>

      {/* Why MiniHisab Pricing is Better */}
      <div className="mt-10 rounded-[8px] border border-border bg-muted/20 p-6 sm:p-8">
        <h2 className="font-heading text-2xl font-bold">Why our pricing beats traditional billing software</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Unlike legacy ERPs and POS vendors that charge extra for every checkout terminal or lock you into proprietary hardware, MiniHisab keeps pricing fair and transparent.
        </p>
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <div className="rounded-[8px] border border-border bg-card p-4">
            <h3 className="font-bold text-sm">Zero Terminal License Fees</h3>
            <p className="mt-1 text-xs text-muted-foreground">Run multiple cashier registers without paying per-device license penalties.</p>
          </div>
          <div className="rounded-[8px] border border-border bg-card p-4">
            <h3 className="font-bold text-sm">No Proprietary Hardware Lock</h3>
            <p className="mt-1 text-xs text-muted-foreground">Use any standard 58mm/80mm thermal printer and USB/Bluetooth barcode scanner you already own.</p>
          </div>
          <div className="rounded-[8px] border border-border bg-card p-4">
            <h3 className="font-bold text-sm">Instant Cloud Sync Included</h3>
            <p className="mt-1 text-xs text-muted-foreground">Real-time multi-branch and godown inventory transfers with zero technician installation charges.</p>
          </div>
        </div>
        <div className="mt-6 pt-4 border-t border-border flex flex-wrap gap-4 text-xs font-semibold text-primary">
          <Link href="/for/kirana-store" className="hover:underline flex items-center gap-1">
            Kirana &amp; Grocery Solutions <ArrowRight className="h-3 w-3" />
          </Link>
          <Link href="/for/pharmacy" className="hover:underline flex items-center gap-1">
            Pharmacy &amp; Medical POS <ArrowRight className="h-3 w-3" />
          </Link>
          <Link href="/for/wholesale-distributor" className="hover:underline flex items-center gap-1">
            Wholesale Distribution Features <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      </div>

      <div className="mt-6 flex flex-col gap-3 rounded-[8px] border border-border bg-card p-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-heading text-xl font-bold">Have custom requirements?</h2>
          <p className="mt-1 text-sm text-muted-foreground">Talk to our team for enterprise setups and custom billing configurations.</p>
        </div>
        <Button asChild variant="outline" className="rounded-[8px]">
          <Link href={APP_ROUTES.CONTACT}>
            Contact Sales <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </div>
    </section>
    </>
  );
}
