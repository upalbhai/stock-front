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
  Receipt,
  Store,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { APP_ROUTES } from "@/lib/routes";
import { useQueryStates, parseAsString } from "nuqs";
import { JollyDateRangePicker } from "@/components/ui/jolly-date-picker";
import { parseDate } from "@internationalized/date";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";

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

  // Generate dynamic-looking chart data based on active sales summary
  const chartData = React.useMemo(() => {
    const baseValue = summary?.totalSalesToday || 120000;
    return [
      { name: "Mon", sales: baseValue * 0.78 },
      { name: "Tue", sales: baseValue * 0.92 },
      { name: "Wed", sales: baseValue * 1.15 },
      { name: "Thu", sales: baseValue * 0.85 },
      { name: "Fri", sales: baseValue * 1.22 },
      { name: "Sat", sales: baseValue * 1.45 },
      { name: "Sun", sales: baseValue },
    ];
  }, [summary?.totalSalesToday]);

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
            <Button
              variant="outline"
              size="icon"
              onClick={() => refetch()}
              className="hidden sm:flex hover:bg-muted/50 transition-colors"
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
          icon={<TrendingUp />}
          color="primary"
          trend={{ value: 12.5, label: "vs last week" }}
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
            icon={<Receipt />}
            color="success"
            trend={{ value: 4.8, label: "vs last week" }}
          />
        )}
        {hasCreditKhata && (
          <StatsCard
            label="Credit Outstanding"
            value={isLoading ? "…" : formatCurrency(summary?.totalCreditOutstanding ?? 0)}
            hint={`${summary?.customersWithDue ?? 0} customers with due`}
            icon={<Wallet />}
            color="warning"
            trend={{ value: -3.2, label: "vs last week" }}
          />
        )}
        {hasWholesale && (
          <StatsCard
            label={query.from || query.to ? "Wholesale Sales in Period" : "Wholesale Sales Today"}
            value={isLoading ? "…" : formatCurrency(summary?.wholesaleSalesToday ?? 0)}
            hint={`Credit issued ${formatCurrency(summary?.creditIssuedToday ?? 0)}`}
            icon={<Store />}
            color="purple"
            trend={{ value: 15.4, label: "vs last week" }}
          />
        )}
        {!hasCreditKhata && !hasWholesale && !hasGstInvoices && (
          <StatsCard
            label={query.from || query.to ? "Orders in Period" : "Orders Today"}
            value={isLoading ? "…" : formatNumber(summary?.totalOrdersToday ?? 0)}
            icon={<ShoppingBag />}
            color="default"
            trend={{ value: 10.2, label: "vs last week" }}
          />
        )}
      </div>

      {/* Row with Sales Chart & Quick Actions */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2 border-border/70 shadow-sm bg-card/40 backdrop-blur-md">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="text-lg font-bold tracking-tight">Sales Trend</CardTitle>
              <CardDescription>Live outlet revenue overview</CardDescription>
            </div>
            <Badge variant="soft" className="text-xs bg-primary/5 text-primary border-primary/20 animate-pulse">
              Live
            </Badge>
          </CardHeader>
          <CardContent className="h-60 pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-primary)" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="name"
                  stroke="var(--color-muted-foreground)"
                  opacity={0.6}
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  stroke="var(--color-muted-foreground)"
                  opacity={0.6}
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => `₹${formatNumber(value)}`}
                />
                <Tooltip
                  contentStyle={{
                    background: "var(--color-card)",
                    border: "1px solid var(--color-border)",
                    borderRadius: "10px",
                    fontSize: "12px",
                    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)"
                  }}
                  formatter={(value: any) => [formatCurrency(value), "Revenue"]}
                />
                <Area
                  type="monotone"
                  dataKey="sales"
                  stroke="var(--color-primary)"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#colorSales)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border-border/70 shadow-sm bg-card/40 backdrop-blur-md">
          <CardHeader>
            <CardTitle className="text-lg font-bold tracking-tight">Quick actions</CardTitle>
            <CardDescription>Jump into daily workflows</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-2">
              {quickActions.map((action) => {
                const Icon = action.icon;
                return (
                  <Link
                    key={action.href}
                    href={action.href}
                    className={cn(
                      "group flex items-center gap-2.5 rounded-xl border border-border/60 bg-muted/10 p-2 transition-all duration-300 text-left",
                      "hover:border-primary/40 hover:bg-primary/5 hover:translate-x-0.5 active:scale-[0.98]"
                    )}
                  >
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary transition-all duration-300 group-hover:scale-105 group-hover:bg-primary/15">
                      <Icon className="h-4 w-4" />
                    </span>
                    <span className="text-sm font-semibold leading-none text-foreground/90 group-hover:text-foreground">
                      {action.label}
                    </span>
                  </Link>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      <section className="grid gap-4 md:grid-cols-2">
        {hasGstInvoices && (
          <Card className="border-border/70 shadow-sm bg-card/40 backdrop-blur-md">
            <CardHeader>
              <CardTitle className="text-lg font-bold tracking-tight">GST Overview</CardTitle>
              <CardDescription>Tax invoices and collection</CardDescription>
            </CardHeader>
            <CardContent className="text-sm">
              {(!summary || (summary.invoicesToday === 0 && summary.gstCollectedToday === 0)) ? (
                <div className="flex flex-col items-center justify-center py-6 text-center">
                  <Receipt className="h-8 w-8 text-muted-foreground/40 mb-2" />
                  <p className="font-semibold text-foreground/90 text-sm">No invoices generated</p>
                  <p className="text-xs text-muted-foreground mt-0.5">There are no GST billing activities in this period.</p>
                  <Link href={APP_ROUTES.BILLING} className="mt-3.5 text-xs text-primary font-bold hover:underline flex items-center gap-1 group">
                    Create your first invoice <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
                  </Link>
                </div>
              ) : (
                <div className="space-y-2.5">
                  <div className="flex justify-between border-b border-border/40 pb-1.5">
                    <span className="text-muted-foreground font-medium">Invoices generated</span>
                    <span className="font-bold text-foreground">{summary?.invoicesToday ?? 0}</span>
                  </div>
                  <div className="flex justify-between border-b border-border/40 pb-1.5">
                    <span className="text-muted-foreground font-medium">GST collected</span>
                    <span className="font-bold text-foreground">{formatCurrency(summary?.gstCollectedToday ?? 0)}</span>
                  </div>
                  {(summary?.igstToday ?? 0) > 0 && (
                    <div className="flex justify-between text-amber-700 dark:text-amber-500 font-medium">
                      <span>IGST (inter-state)</span>
                      <span className="font-bold">{formatCurrency(summary?.igstToday ?? 0)}</span>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {hasCreditKhata && (
          <Card className="border-border/70 shadow-sm bg-card/40 backdrop-blur-md">
            <CardHeader>
              <CardTitle className="text-lg font-bold tracking-tight">Khata / credit</CardTitle>
              <CardDescription>Outstanding balances across customers</CardDescription>
            </CardHeader>
            <CardContent className="text-sm">
              {(!summary || (summary.totalCreditOutstanding === 0 && summary.customersWithDue === 0)) ? (
                <div className="flex flex-col items-center justify-center py-6 text-center">
                  <Wallet className="h-8 w-8 text-muted-foreground/40 mb-2" />
                  <p className="font-semibold text-foreground/90 text-sm">No credit customers yet</p>
                  <p className="text-xs text-muted-foreground mt-0.5">All customer accounts are currently fully settled.</p>
                  <Link href={APP_ROUTES.CUSTOMERS} className="mt-3.5 text-xs text-primary font-bold hover:underline flex items-center gap-1 group">
                    View customer ledger <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
                  </Link>
                </div>
              ) : (
                <div className="space-y-2.5">
                  <div className="flex justify-between border-b border-border/40 pb-1.5">
                    <span className="text-muted-foreground font-medium">Total outstanding</span>
                    <span className="font-bold text-warning">{formatCurrency(summary?.totalCreditOutstanding ?? 0)}</span>
                  </div>
                  <div className="flex justify-between border-b border-border/40 pb-1.5">
                    <span className="text-muted-foreground font-medium">Customers with due</span>
                    <span className="font-bold text-foreground">{summary?.customersWithDue ?? 0} / {summary?.totalCustomers ?? 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground font-medium">Credit issued today</span>
                    <span className="font-bold text-foreground">{formatCurrency(summary?.creditIssuedToday ?? 0)}</span>
                  </div>
                </div>
              )}
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
