"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/components/auth/auth-provider";
import { getJson } from "@/lib/api-client";
import { formatCurrency, formatNumber } from "@/lib/format";

type ReportData = {
  totalSales: number;
  totalOrders: number;
  paymentSummary: {
    cash: number;
    online: number;
    card: number;
    split: number;
  };
  bestSelling: { name: string; qty: number }[];
};

type StockAlert = {
  name: string;
  onHandQty: number;
  lowStockThreshold: number;
};

type StockSummary = {
  totalSkus: number;
  onHandTotal: number;
  lowStock: number;
};

const chart = [30, 55, 45, 70, 60, 90, 75];

export default function Page() {
  const { token, outletId } = useAuth();

  const { data: reportData } = useQuery({
    queryKey: ["report", outletId],
    queryFn: () =>
      getJson<{ data: ReportData }>("/reports/daily", token, { outletId }),
    enabled: Boolean(token && outletId)
  });

  const { data: alertData } = useQuery({
    queryKey: ["stock-alerts", outletId],
    queryFn: () =>
      getJson<{ data: StockAlert[] }>("/stock/alerts", token, { outletId }),
    enabled: Boolean(token && outletId)
  });

  const { data: stockSummaryData } = useQuery({
    queryKey: ["stock-summary", outletId],
    queryFn: () =>
      getJson<{ data: StockSummary }>("/stock/summary", token, { outletId }),
    enabled: Boolean(token && outletId)
  });

  const report = reportData?.data;
  const payments = report?.paymentSummary;
  const alerts = alertData?.data ?? [];
  const bestSelling = report?.bestSelling ?? [];
  const stockSummary = stockSummaryData?.data;

  const stats = [
    {
      label: "Today Sales",
      value: formatCurrency(report?.totalSales || 0),
      hint: "Live from billing"
    },
    {
      label: "Orders",
      value: formatNumber(report?.totalOrders || 0),
      hint: "Across all staff"
    },
    {
      label: "Cash Collected",
      value: formatCurrency(payments?.cash || 0),
      hint: "Cash drawer"
    },
    {
      label: "Online + Card",
      value: formatCurrency((payments?.online || 0) + (payments?.card || 0)),
      hint: "Digital payments"
    }
  ];

  const paymentRows = [
    { method: "Cash", amount: formatCurrency(payments?.cash || 0) },
    { method: "UPI", amount: formatCurrency(payments?.online || 0) },
    { method: "Card", amount: formatCurrency(payments?.card || 0) },
    { method: "Split", amount: formatCurrency(payments?.split || 0) }
  ];

  return (
    <div className="space-y-6">
      <section className="grid gap-4 lg:grid-cols-[2fr_1fr]">
        <Card className="animate-rise">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Start fast tasks for the day</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 sm:flex-row">
            <Button asChild size="xl" className="flex-1">
              <Link href="/stock">Start Day Stock</Link>
            </Button>
            <Button asChild variant="outline" size="xl" className="flex-1">
              <Link href="/billing">New Billing</Link>
            </Button>
            <Button asChild variant="soft" size="xl" className="flex-1">
              <Link href="/reports">End Day Report</Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="animate-rise">
          <CardHeader>
            <CardTitle>Live Payments</CardTitle>
            <CardDescription>Collected by method</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {paymentRows.map((payment) => (
              <div
                key={payment.method}
                className="flex items-center justify-between text-sm"
              >
                <span className="text-muted">{payment.method}</span>
                <span className="font-semibold">{payment.amount}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.label} className="animate-rise">
            <CardHeader>
              <CardDescription>{stat.label}</CardDescription>
              <CardTitle className="text-2xl">{stat.value}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted">{stat.hint}</p>
            </CardContent>
          </Card>
        ))}
      </section>

      <section className="grid gap-4 lg:grid-cols-[2fr_1fr]">
        <Card className="animate-rise">
          <CardHeader>
            <CardTitle>Daily Performance</CardTitle>
            <CardDescription>Sales pulse by hour</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex h-40 items-end gap-3">
              {chart.map((value, index) => (
                <div
                  key={index}
                  className="flex-1 rounded-2xl bg-primary/20"
                >
                  <div
                    className="rounded-2xl bg-primary"
                    style={{ height: `${value}%` }}
                  />
                </div>
              ))}
            </div>
            <p className="mt-3 text-xs text-muted">
              Hourly analytics will appear once order tracking is enabled.
            </p>
          </CardContent>
        </Card>

        <div className="grid gap-4">
          <Card className="animate-rise">
            <CardHeader>
              <CardTitle>Stock Alerts</CardTitle>
              <CardDescription>Low stock items</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {alerts.length === 0 && (
                <p className="text-sm text-muted">No low stock alerts.</p>
              )}
              {alerts.map((alert) => {
                const isCritical =
                  alert.onHandQty <= Math.max(2, alert.lowStockThreshold / 2);
                return (
                  <div
                    key={alert.name}
                    className="flex items-center justify-between text-sm"
                  >
                    <div>
                      <p className="font-medium">{alert.name}</p>
                      <p className="text-xs text-muted">
                        Remaining: {alert.onHandQty}
                      </p>
                    </div>
                    <Badge variant={isCritical ? "danger" : "warning"}>
                      {isCritical ? "Critical" : "Low"}
                    </Badge>
                  </div>
                );
              })}
            </CardContent>
          </Card>

          <Card className="animate-rise">
            <CardHeader>
              <CardTitle>Top Products</CardTitle>
              <CardDescription>Best sellers today</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {bestSelling.length === 0 && (
                <p className="text-sm text-muted">
                  No sales data for today.
                </p>
              )}
              {bestSelling.map((product) => (
                <div
                  key={product.name}
                  className="flex items-center justify-between text-sm"
                >
                  <span className="font-medium">{product.name}</span>
                  <span className="text-muted">{product.qty} sold</span>
                </div>
              ))}
            </CardContent>
          </Card>

          {stockSummary && (
            <Card className="animate-rise">
              <CardHeader>
                <CardTitle>Stock Summary</CardTitle>
                <CardDescription>Live count overview</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted">Total SKUs</span>
                  <span className="font-semibold">{stockSummary.totalSkus}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted">Units on hand</span>
                  <span className="font-semibold">
                    {formatNumber(stockSummary.onHandTotal)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted">Low stock SKUs</span>
                  <span className="font-semibold">{stockSummary.lowStock}</span>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </section>
    </div>
  );
}
