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
