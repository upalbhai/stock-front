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
import { useQueryStates, parseAsString } from "nuqs";
import { JollyDateRangePicker } from "@/components/ui/jolly-date-picker";
import { parseDate } from "@internationalized/date";

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

  const [query, setQuery] = useQueryStates({
    from: parseAsString.withDefault(""),
    to: parseAsString.withDefault("")
  });

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["reports-summary", outletId, query.from, query.to],
    queryFn: () =>
      getJson<SummaryData>("/reports/summary", token, {
        outletId: outletId ?? undefined,
        from: query.from || undefined,
        to: query.to || undefined
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
          <Badge className="mb-2 w-fit">
            {query.from || query.to ? "Selected Period" : "Today's pulse"}
          </Badge>
          <h1 className="text-2xl font-bold tracking-tight">Operations dashboard</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Live snapshot for your outlet — sales, GST, and credit at a glance.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 items-center">
          <JollyDateRangePicker 
            label="Filter Pulse"
            value={(query.from && query.to) ? { start: parseDate(query.from.split('T')[0]), end: parseDate(query.to.split('T')[0]) } : null}
            onChange={(val) => {
              if (val) {
                setQuery({ 
                  from: val.start.toString() + "T00:00:00.000Z", 
                  to: val.end.toString() + "T23:59:59.999Z" 
                });
              } else {
                setQuery({ from: "", to: "" });
              }
            }}
          />
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
        </div>
      </section>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          label={query.from || query.to ? "Sales in Period" : "Sales Today"}
          value={isLoading ? "…" : formatCurrency(summary?.totalSalesToday ?? 0)}
          hint={`${formatNumber(summary?.totalOrdersToday ?? 0)} orders`}
          icon={<DollarSign className="h-5 w-5" />}
          color="primary"
        />
        {hasGstInvoices && (
          <StatsCard
            label={query.from || query.to ? "GST Collected in Period" : "GST Collected Today"}
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
            label={query.from || query.to ? "Wholesale Sales in Period" : "Wholesale Sales Today"}
            value={isLoading ? "…" : formatCurrency(summary?.wholesaleSalesToday ?? 0)}
            hint={`Credit issued ${formatCurrency(summary?.creditIssuedToday ?? 0)}`}
            icon={<TrendingUp className="h-5 w-5" />}
            color="success"
          />
        )}
        {!hasCreditKhata && !hasWholesale && !hasGstInvoices && (
          <StatsCard
            label={query.from || query.to ? "Orders in Period" : "Orders Today"}
            value={isLoading ? "…" : formatNumber(summary?.totalOrdersToday ?? 0)}
            icon={<ShoppingBag className="h-5 w-5" />}
          />
        )}
      </div>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <Card className="border-border/70 shadow-sm md:col-span-2 xl:col-span-1">
          <CardHeader className="">
            <CardTitle className="text-lg">Quick actions</CardTitle>
            <CardDescription>Jump into daily workflows</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
              {quickActions.map((action) => {
                const Icon = action.icon;
                return (
                  <Link
                    key={action.href}
                    href={action.href}
                    className={cn(
                      "group flex items-center gap-3 rounded-xl border border-border/80 bg-muted/20 p-2.5 transition-all text-left",
                      "hover:border-primary/30 hover:bg-primary/5 active:scale-[0.97]"
                    )}
                  >
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary/15">
                      <Icon className="h-4.5 w-4.5" />
                    </span>
                    <span className="text-sm font-semibold leading-none text-foreground">
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
              <CardTitle className="text-lg">GST Overview</CardTitle>
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
  const { token, outletId, user } = useAuth();

  console.log('owner details', user)
  if (!token) return null;

  return <DashboardHome token={token} outletId={outletId} />;
}
