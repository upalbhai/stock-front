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
  DollarSign,
  ShoppingBag,
  FileText,
  Wallet,
  TrendingUp,
  History,
  UserCircle,
  RefreshCw,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { APP_ROUTES } from "@/lib/routes";

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

  const { data, isLoading, refetch } = useQuery({
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
        { href: APP_ROUTES.BILLING, label: "New bill", icon: ReceiptText },
        { href: APP_ROUTES.STOCK, label: "Stock", icon: Package },
        hasCreditKhata && { href: APP_ROUTES.CUSTOMERS, label: "Customers", icon: UserCircle },
        hasGstInvoices && { href: APP_ROUTES.INVOICES, label: "Invoices", icon: FileText },
        { href: APP_ROUTES.ORDERS, label: "Order history", icon: History },
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
        <div className="grid w-full grid-cols-2 gap-2 sm:flex sm:w-auto items-center">
          <Button asChild className="w-full sm:w-auto">
            <Link href={APP_ROUTES.BILLING}>
              Open Billing <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
          <Button asChild variant="outline" className="w-full sm:w-auto">
            <Link href={APP_ROUTES.REPORTS}>Full Reports</Link>
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => refetch()}
            className="hidden sm:flex"
            title="Refresh Data"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
          {/* Mobile refresh button */}
          <Button
            variant="outline"
            onClick={() => refetch()}
            className="col-span-2 sm:hidden flex items-center justify-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh Data
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
                      "group flex min-h-[4rem] flex-col items-center justify-center gap-2 rounded-2xl border border-border/80 bg-muted/30 px-2 py-2 text-center transition-all",
                      "hover:border-primary/30 hover:bg-primary/5 active:scale-[0.98]",
                      "sm:min-h-0 sm:flex-row sm:justify-start sm:rounded-xl sm:px-2 sm:py-2 sm:text-left"
                    )}
                  >
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary/15 sm:h-8 sm:w-8 sm:rounded-lg">
                      <Icon className="h-4 w-4" />
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

export default function HomePage() {
  const { token, outletId } = useAuth();

  if (!token) return null;

  return <DashboardHome token={token} outletId={outletId} />;
}
