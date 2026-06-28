import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  Boxes,
  Building2,
  CheckCircle2,
  CreditCard,
  FileText,
  ReceiptText,
  ShieldCheck,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { APP_ROUTES } from "@/lib/routes";

const services = [
  { title: "Fast counter billing", text: "Create sales, print receipts, track payments, and keep checkout moving.", icon: ReceiptText },
  { title: "Inventory control", text: "Watch stock, units, transfers, low stock, and outlet-wise availability.", icon: Boxes },
  { title: "GST invoices", text: "Generate tax-ready invoices and keep sales records easy to retrieve.", icon: FileText },
  { title: "Reports and profit", text: "Track daily sales, GST, credit, expenses, and profit from one dashboard.", icon: BarChart3 },
  { title: "Customer khata", text: "Manage customer balances, credit sales, and collections without side notebooks.", icon: CreditCard },
  { title: "Roles and approvals", text: "Give owners, managers, staff, and admins the right level of access.", icon: ShieldCheck },
];

const proofPoints = [
  "Built for billing counters",
  "Outlet-ready from day one",
  "Role-based access",
  "Mobile-first workflows",
];

export default function LandingPage() {
  return (
    <>
      <section className="relative isolate flex h-[calc(100svh-9rem)] min-h-[430px] max-h-[720px] items-center overflow-hidden">
        <Image
          src="/images/retail-operations-hero.png"
          alt="Retail counter with POS billing and inventory dashboard"
          fill
          priority
          className="object-cover object-center"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-white/72 dark:bg-black/62" />
        <div className="relative mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl">
            <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-primary">
              Retail operations platform
            </p>
            <h1 className="mt-4 font-heading text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
              Outlet Pulse
            </h1>
            <p className="mt-5 max-w-xl text-base leading-7 text-muted-foreground sm:text-lg">
              A service-first platform for retail owners who need billing, stock, outlets, staff, credit, GST invoices, and reports in one place.
            </p>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg" className="rounded-[8px]">
                <Link href={APP_ROUTES.DASHBOARD}>
                  Open Dashboard <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="rounded-[8px] bg-background/70">
                <Link href={APP_ROUTES.SERVICES}>View Services</Link>
              </Button>
            </div>
            <div className="mt-7 grid gap-2 text-sm font-semibold text-foreground sm:grid-cols-2">
              {proofPoints.map((point) => (
                <span key={point} className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-info" />
                  {point}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-border bg-muted/30">
        <div className="mx-auto grid max-w-7xl gap-4 px-4 py-5 sm:grid-cols-3 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <Building2 className="h-5 w-5 text-primary" />
            <p className="text-sm font-semibold">Multi-outlet controls</p>
          </div>
          <div className="flex items-center gap-3">
            <Users className="h-5 w-5 text-info" />
            <p className="text-sm font-semibold">Owner, manager, and staff roles</p>
          </div>
          <div className="flex items-center gap-3">
            <BarChart3 className="h-5 w-5 text-warning" />
            <p className="text-sm font-semibold">Daily reports and profit tracking</p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="max-w-2xl">
          <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-primary">Services</p>
          <h2 className="mt-3 font-heading text-3xl font-extrabold tracking-tight sm:text-4xl">
            Daily retail workflows, organized for speed.
          </h2>
        </div>
        <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {services.map((service) => {
            const Icon = service.icon;
            return (
              <div key={service.title} className="rounded-[8px] border border-border bg-card p-5 shadow-sm">
                <Icon className="h-6 w-6 text-primary" />
                <h3 className="mt-4 font-heading text-lg font-bold">{service.title}</h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{service.text}</p>
              </div>
            );
          })}
        </div>
      </section>

      <section className="bg-primary text-primary-foreground">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-12 sm:px-6 md:flex-row md:items-center md:justify-between lg:px-8">
          <div>
            <h2 className="font-heading text-2xl font-extrabold tracking-tight">Ready to run the counter from one dashboard?</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-primary-foreground/80">
              Login to continue to the product, or review services before onboarding your business.
            </p>
          </div>
          <Button asChild variant="secondary" size="lg" className="rounded-[8px]">
            <Link href={APP_ROUTES.LOGIN}>
              Login <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>
    </>
  );
}
