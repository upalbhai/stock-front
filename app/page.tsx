"use client";

import * as React from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/components/auth/auth-provider";
import { useFeature } from "@/hooks/useFeature";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatsCard } from "@/components/ui/stats-card";
import { getJson } from "@/lib/api-client";
import { formatCurrency, formatNumber } from "@/lib/format";
import {
  ArrowRight,
  ReceiptText,
  Package,
  Store,
  Users,
  ShieldCheck,
  ChartNoAxesCombined,
  DollarSign,
  ShoppingBag,
  FileText,
  Wallet,
  TrendingUp,
  History,
  UserCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

const features = [
  { title: "Billing", description: "Create bills fast with payment tracking and receipt flow.", icon: ReceiptText },
  { title: "Stock", description: "Watch products, low stock alerts, and outlet stock movement.", icon: Package },
  { title: "Outlets", description: "Manage branches and approve new outlets before they go live.", icon: Store },
  { title: "Users & Roles", description: "Create staff, assign roles, and control permissions safely.", icon: Users },
  { title: "Approval Flow", description: "Business owners wait for admin approval before activation.", icon: ShieldCheck },
  { title: "Reports", description: "See daily sales, trends, and outlet performance in one place.", icon: ChartNoAxesCombined }
];

type SummaryData = {
  totalCreditOutstanding: number;
  customersWithDue: number;
  totalCustomers: number;
  totalSalesToday: number;
  totalOrdersToday: number;
  gstCollectedToday: number;
  wholesaleSalesToday: number;
  creditIssuedToday: number;
  invoicesToday: number;
  igstToday: number;
  cgstSgstToday: number;
};

function DashboardHome({ token, outletId }: { token: string; outletId: string | null }) {
  const hasCreditKhata = useFeature("credit_khata");
  const hasGstInvoices = useFeature("gst_invoices");
  const hasWholesale = useFeature("wholesale_billing");

  const { data, isLoading } = useQuery({
    queryKey: ["reports-summary", outletId],
    queryFn: () =>
      getJson<SummaryData>("/reports/summary", token, {
        outletId: outletId ?? undefined
      }),
    enabled: Boolean(token)
  });

  const summary = data;

  const quickActions = React.useMemo(
    () =>
      [
        { href: "/billing", label: "New bill", icon: ReceiptText },
        { href: "/stock", label: "Stock", icon: Package },
        hasCreditKhata && { href: "/customers", label: "Customers", icon: UserCircle },
        hasGstInvoices && { href: "/invoices", label: "Invoices", icon: FileText },
        { href: "/orders", label: "Order history", icon: History },
      ].filter(Boolean) as { href: string; label: string; icon: typeof ReceiptText }[],
    [hasCreditKhata, hasGstInvoices]
  );

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Badge className="mb-2 w-fit">Today&apos;s pulse</Badge>
          <h1 className="text-2xl font-bold tracking-tight">Operations dashboard</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Live snapshot for your outlet — sales, GST, and credit at a glance.
          </p>
        </div>
        <div className="grid w-full grid-cols-2 gap-2 sm:flex sm:w-auto">
          <Button asChild className="w-full sm:w-auto">
            <Link href="/billing">
              Open Billing <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
          <Button asChild variant="outline" className="w-full sm:w-auto">
            <Link href="/reports">Full Reports</Link>
          </Button>
        </div>
      </section>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          label="Sales Today"
          value={isLoading ? "…" : formatCurrency(summary?.totalSalesToday ?? 0)}
          hint={`${formatNumber(summary?.totalOrdersToday ?? 0)} orders`}
          icon={<DollarSign className="h-5 w-5" />}
          color="primary"
        />
        {hasGstInvoices && (
          <StatsCard
            label="GST Collected Today"
            value={isLoading ? "…" : formatCurrency(summary?.gstCollectedToday ?? 0)}
            hint={
              (summary?.igstToday ?? 0) > 0
                ? `IGST ${formatCurrency(summary?.igstToday ?? 0)}`
                : `CGST+SGST ${formatCurrency(summary?.cgstSgstToday ?? 0)}`
            }
            icon={<FileText className="h-5 w-5" />}
          />
        )}
        {hasCreditKhata && (
          <StatsCard
            label="Credit Outstanding"
            value={isLoading ? "…" : formatCurrency(summary?.totalCreditOutstanding ?? 0)}
            hint={`${summary?.customersWithDue ?? 0} customers with due`}
            icon={<Wallet className="h-5 w-5" />}
            color="warning"
          />
        )}
        {hasWholesale && (
          <StatsCard
            label="Wholesale Sales Today"
            value={isLoading ? "…" : formatCurrency(summary?.wholesaleSalesToday ?? 0)}
            hint={`Credit issued ${formatCurrency(summary?.creditIssuedToday ?? 0)}`}
            icon={<TrendingUp className="h-5 w-5" />}
            color="success"
          />
        )}
        {!hasCreditKhata && !hasWholesale && !hasGstInvoices && (
          <StatsCard
            label="Orders Today"
            value={isLoading ? "…" : formatNumber(summary?.totalOrdersToday ?? 0)}
            icon={<ShoppingBag className="h-5 w-5" />}
          />
        )}
      </div>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <Card className="border-border/70 shadow-sm">
          <CardHeader className="">
            <CardTitle className="text-lg">Quick actions</CardTitle>
            <CardDescription>Jump into daily workflows</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 sm:gap-3">
              {quickActions.map((action) => {
                const Icon = action.icon;
                return (
                  <Link
                    key={action.href}
                    href={action.href}
                    className={cn(
                      "group flex min-h-[5.5rem] flex-col items-center justify-center gap-2.5 rounded-2xl border border-border/80 bg-muted/30 px-3 py-4 text-center transition-all",
                      "hover:border-primary/30 hover:bg-primary/5 active:scale-[0.98]",
                      "sm:min-h-0 sm:flex-row sm:justify-start sm:rounded-xl sm:px-3.5 sm:py-3 sm:text-left"
                    )}
                  >
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary/15 sm:h-9 sm:w-9 sm:rounded-lg">
                      <Icon className="h-5 w-5" />
                    </span>
                    <span className="text-xs font-semibold leading-tight text-foreground sm:text-sm">
                      {action.label}
                    </span>
                  </Link>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {hasGstInvoices && (
          <Card className="border-border/70 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">GST today</CardTitle>
              <CardDescription>Tax invoices and collection</CardDescription>
            </CardHeader>
            <CardContent className="text-sm space-y-2">
              <div className="flex justify-between"><span>Invoices generated</span><span className="font-semibold">{summary?.invoicesToday ?? 0}</span></div>
              <div className="flex justify-between"><span>GST collected</span><span className="font-semibold">{formatCurrency(summary?.gstCollectedToday ?? 0)}</span></div>
              {(summary?.igstToday ?? 0) > 0 && (
                <div className="flex justify-between text-amber-700"><span>IGST (inter-state)</span><span className="font-semibold">{formatCurrency(summary?.igstToday ?? 0)}</span></div>
              )}
            </CardContent>
          </Card>
        )}

        {hasCreditKhata && (
          <Card className="border-border/70 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">Khata / credit</CardTitle>
              <CardDescription>Outstanding balances across customers</CardDescription>
            </CardHeader>
            <CardContent className="text-sm space-y-2">
              <div className="flex justify-between"><span>Total outstanding</span><span className="font-semibold text-warning">{formatCurrency(summary?.totalCreditOutstanding ?? 0)}</span></div>
              <div className="flex justify-between"><span>Customers with due</span><span className="font-semibold">{summary?.customersWithDue ?? 0} / {summary?.totalCustomers ?? 0}</span></div>
              <div className="flex justify-between"><span>Credit issued today</span><span className="font-semibold">{formatCurrency(summary?.creditIssuedToday ?? 0)}</span></div>
            </CardContent>
          </Card>
        )}
      </section>
    </div>
  );
}

function MarketingHome({ userName }: { userName?: string }) {
  return (
    <div className="space-y-6">
      <section className="grid gap-4 lg:grid-cols-[1.5fr_1fr]">
        <Card className="border-border/70 shadow-sm">
          <CardHeader>
            <Badge className="w-fit">Retail SaaS</Badge>
            <CardTitle className="text-3xl font-bold tracking-tight">Run billing, stock, outlets, and staff from one panel</CardTitle>
            <CardDescription className="text-base max-w-2xl">
              Outlet Pulse is built for retail owners who need approval-based onboarding, outlet control, role-based access, and daily reporting without extra noise.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-3">
            <Button asChild><Link href="/login">Go to Login <ArrowRight className="h-4 w-4" /></Link></Button>
            <Button asChild variant="outline"><Link href="/reports">Open Reports</Link></Button>
            <Button asChild variant="soft"><Link href="/stock">Check Stock</Link></Button>
          </CardContent>
        </Card>

        <Card className="border-border/70 shadow-sm">
          <CardHeader>
            <CardTitle className="text-xl font-semibold">Current access</CardTitle>
            <CardDescription>Simple status for the signed-in user</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p><span className="font-medium">User:</span> {userName || "Guest"}</p>
            <p><span className="font-medium">Mode:</span> Public homepage</p>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {features.map((feature) => {
          const Icon = feature.icon;
          return (
            <Card key={feature.title} className="border-border/70 shadow-sm">
              <CardHeader>
                <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Icon className="h-5 w-5" />
                </div>
                <CardTitle className="text-lg">{feature.title}</CardTitle>
                <CardDescription>{feature.description}</CardDescription>
              </CardHeader>
            </Card>
          );
        })}
      </section>
    </div>
  );
}

export default function HomePage() {
  const { user, token, outletId } = useAuth();

  if (user && token) {
    return <DashboardHome token={token} outletId={outletId} />;
  }

  return <MarketingHome userName={user?.name} />;
}
