"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  ReceiptText, Package, Wallet, TrendingUp,
  AlertTriangle, Store, ArrowRight, Tag
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { StatsCard } from "@/components/ui/stats-card";
import { useAuth } from "@/components/auth/auth-provider";
import { getJson } from "@/lib/api-client";
import { formatCurrency, formatNumber } from "@/lib/format";

type ReportData = {
  totalSales: number;
  totalOrders: number;
  paymentSummary: { cash: number; upi: number; card: number; wallet: number; split: number };
  bestSelling: { name: string; qty: number; total: number }[];
};

type StockAlert = { _id: string; name: string; onHandQty: number; lowStockThreshold: number; unit: string };
type StockSummary = { totalSkus: number; onHandTotal: number; lowStock: number };
type TrendDay = { date: string; revenue: number; orders: number };
type Comparison = { outlet: { id: string; name: string }; revenue: number; orders: number };

function MiniBarChart({ data }: { data: TrendDay[] }) {
  const max = Math.max(...data.map((d) => d.revenue), 1);
  return (
    <div className="flex h-28 items-end gap-1.5">
      {data.map((day) => {
        const pct = Math.max(4, (day.revenue / max) * 100);
        return (
          <div key={day.date} className="group relative flex-1 flex flex-col items-center gap-1">
            <div className="absolute -top-6 hidden group-hover:block bg-surface border border-border rounded-xl px-2 py-1 text-xs shadow-soft whitespace-nowrap z-10">
              {formatCurrency(day.revenue)}
            </div>
            <div className="w-full rounded-t-2xl bg-primary/20 overflow-hidden" style={{ height: "100%" }}>
              <div className="w-full rounded-t-2xl bg-primary transition-all" style={{ height: `${pct}%` }} />
            </div>
            <span className="text-[9px] text-muted">{day.date.slice(5)}</span>
          </div>
        );
      })}
    </div>
  );
}

export default function DashboardPage() {
  const { token, outletId, impersonating } = useAuth();

  const { data: reportData } = useQuery({
    queryKey: ["report", outletId],
    queryFn: () => getJson<{ data: ReportData }>("/reports/daily", token, { outletId: outletId ?? undefined }),
    enabled: Boolean(token && outletId)
  });
  const { data: alertData } = useQuery({
    queryKey: ["stock-alerts", outletId],
    queryFn: () => getJson<{ data: StockAlert[] }>("/stock/alerts", token, { outletId: outletId ?? undefined }),
    enabled: Boolean(token && outletId)
  });
  const { data: stockSummaryData } = useQuery({
    queryKey: ["stock-summary", outletId],
    queryFn: () => getJson<{ data: StockSummary }>("/stock/summary", token, { outletId: outletId ?? undefined }),
    enabled: Boolean(token && outletId)
  });
  const { data: trendData } = useQuery({
    queryKey: ["trend", outletId],
    queryFn: () => getJson<{ trend: TrendDay[] }>("/reports/trend", token, { outletId: outletId ?? undefined, days: 7 }),
    enabled: Boolean(token && outletId)
  });
  const { data: compareData } = useQuery({
    queryKey: ["compare"],
    queryFn: () => getJson<{ comparison: Comparison[] }>("/reports/compare", token),
    enabled: Boolean(token)
  });

  const report = reportData?.data;
  const alerts = alertData?.data ?? [];
  const stockSummary = stockSummaryData?.data;
  const trend = trendData?.trend ?? [];
  const comparison = compareData?.comparison ?? [];
  const payments = report?.paymentSummary;
  const bestSelling = report?.bestSelling ?? [];

  return (
    <div className="space-y-6">
      {/* Impersonation Banner */}
      {impersonating && (
        <div className="flex items-center gap-3 rounded-2xl bg-danger/10 border border-danger/30 px-4 py-3 animate-rise">
          <AlertTriangle className="h-5 w-5 text-danger shrink-0" />
          <p className="text-sm font-medium text-danger">You are in an impersonation session. Actions will be logged.</p>
        </div>
      )}

      {/* Quick Actions */}
      <section className="grid gap-4 lg:grid-cols-[2fr_1fr]">
        <Card className="animate-rise">
          <CardHeader><CardTitle>Quick Actions</CardTitle><CardDescription>Start fast tasks for today</CardDescription></CardHeader>
          <CardContent className="flex flex-wrap gap-3">
            <Button asChild size="xl" className="flex-1"><Link href="/billing"><ReceiptText className="h-4 w-4" /> New Billing</Link></Button>
            <Button asChild variant="outline" size="xl" className="flex-1"><Link href="/products"><Tag className="h-4 w-4" /> Products</Link></Button>
            <Button asChild variant="soft" size="xl" className="flex-1"><Link href="/reports"><TrendingUp className="h-4 w-4" /> Reports</Link></Button>
          </CardContent>
        </Card>
        <Card className="animate-rise">
          <CardHeader><CardTitle>Today Payments</CardTitle><CardDescription>By method</CardDescription></CardHeader>
          <CardContent className="space-y-2.5">
            {[
              { method: "Cash", icon: "💵", amount: payments?.cash },
              { method: "UPI", icon: "📱", amount: payments?.upi },
              { method: "Card", icon: "💳", amount: payments?.card },
              { method: "Split", icon: "✂️", amount: payments?.split }
            ].map(({ method, icon, amount }) => (
              <div key={method} className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2 text-muted"><span>{icon}</span>{method}</span>
                <span className="font-semibold">{formatCurrency(amount || 0)}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>

      {/* Stats Row */}
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatsCard label="Today Revenue" value={formatCurrency(report?.totalSales || 0)} hint="Live from billing" icon={<Wallet className="h-5 w-5" />} color="primary" />
        <StatsCard label="Orders" value={formatNumber(report?.totalOrders || 0)} hint="Across all staff" icon={<ReceiptText className="h-5 w-5" />} />
        <StatsCard label="Total SKUs" value={formatNumber(stockSummary?.totalSkus || 0)} hint="Active products" icon={<Package className="h-5 w-5" />} />
        <StatsCard label="Low Stock" value={stockSummary?.lowStock || 0} hint="Need attention" icon={<AlertTriangle className="h-5 w-5" />} color={stockSummary?.lowStock ? "danger" : "default"} />
      </section>

      {/* Revenue Chart + Outlet Compare */}
      <section className="grid gap-4 lg:grid-cols-[2fr_1fr]">
        <Card className="animate-rise">
          <CardHeader><CardTitle>7-Day Revenue</CardTitle><CardDescription>Daily sales trend</CardDescription></CardHeader>
          <CardContent>
            {trend.length > 0 ? <MiniBarChart data={trend} /> : (
              <div className="flex h-28 items-center justify-center">
                <p className="text-sm text-muted">No data yet for this period</p>
              </div>
            )}
          </CardContent>
        </Card>
        <Card className="animate-rise">
          <CardHeader>
            <CardTitle>Outlet Comparison</CardTitle>
            <CardDescription>Today's performance</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {comparison.length === 0
              ? <p className="text-sm text-muted">No outlet data</p>
              : comparison.sort((a, b) => b.revenue - a.revenue).map((c) => {
                const maxRevenue = Math.max(...comparison.map((x) => x.revenue), 1);
                return (
                  <div key={c.outlet.id}>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="flex items-center gap-2"><Store className="h-3.5 w-3.5 text-muted" />{c.outlet.name}</span>
                      <span className="font-semibold">{formatCurrency(c.revenue)}</span>
                    </div>
                    <div className="h-2 rounded-full bg-border/60">
                      <div className="h-2 rounded-full bg-primary transition-all" style={{ width: `${(c.revenue / maxRevenue) * 100}%` }} />
                    </div>
                  </div>
                );
              })}
          </CardContent>
        </Card>
      </section>

      {/* Best Sellers + Stock Alerts */}
      <section className="grid gap-4 lg:grid-cols-2">
        <Card className="animate-rise">
          <CardHeader className="flex flex-row items-center justify-between">
            <div><CardTitle>Top Products</CardTitle><CardDescription>Best sellers today</CardDescription></div>
            <Button asChild variant="ghost" size="sm"><Link href="/products"><ArrowRight className="h-4 w-4" /></Link></Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {bestSelling.length === 0
              ? <p className="text-sm text-muted">No sales data for today</p>
              : bestSelling.slice(0, 6).map((product, i) => (
                <div key={product.name} className="flex items-center gap-3 text-sm">
                  <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-primary/10 text-xs font-bold text-primary shrink-0">#{i + 1}</div>
                  <span className="flex-1 font-medium truncate">{product.name}</span>
                  <span className="text-muted">{product.qty} sold</span>
                  <span className="font-semibold shrink-0">{formatCurrency(product.total)}</span>
                </div>
              ))}
          </CardContent>
        </Card>

        <Card className="animate-rise">
          <CardHeader className="flex flex-row items-center justify-between">
            <div><CardTitle>Stock Alerts</CardTitle><CardDescription>Low stock items</CardDescription></div>
            <Button asChild variant="ghost" size="sm"><Link href="/stock"><ArrowRight className="h-4 w-4" /></Link></Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {alerts.length === 0
              ? <p className="text-sm text-muted">✓ All stock levels are healthy</p>
              : alerts.slice(0, 5).map((alert) => {
                const isCritical = alert.onHandQty <= Math.max(2, alert.lowStockThreshold / 2);
                return (
                  <div key={alert._id} className="flex items-center justify-between text-sm">
                    <div><p className="font-medium">{alert.name}</p><p className="text-xs text-muted">{alert.onHandQty} {alert.unit} remaining</p></div>
                    <Badge variant={isCritical ? "danger" : "warning"}>{isCritical ? "Critical" : "Low"}</Badge>
                  </div>
                );
              })}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
