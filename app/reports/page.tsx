"use client";

import { useQuery } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/components/auth/auth-provider";
import { getJson } from "@/lib/api-client";
import { formatCurrency } from "@/lib/format";
import { RoleGate } from "@/components/auth/role-gate";

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
  remainingStock: { name: string; onHandQty: number }[];
};

export default function ReportsPage() {
  const { token, outletId } = useAuth();

  const { data } = useQuery({
    queryKey: ["report", outletId],
    queryFn: () =>
      getJson<{ data: ReportData }>("/reports/daily", token, { outletId }),
    enabled: Boolean(token && outletId)
  });

  const report = data?.data;

  return (
    <RoleGate allowed={["owner", "manager"]}>
      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>End of Day Summary</CardTitle>
            <CardDescription>Auto-generated report for today</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-border/70 bg-surface/70 p-4">
              <p className="text-sm text-muted">Total Sales</p>
              <p className="text-xl font-semibold">
                {formatCurrency(report?.totalSales || 0)}
              </p>
            </div>
            <div className="rounded-2xl border border-border/70 bg-surface/70 p-4">
              <p className="text-sm text-muted">Total Orders</p>
              <p className="text-xl font-semibold">
                {report?.totalOrders || 0}
              </p>
            </div>
            <div className="rounded-2xl border border-border/70 bg-surface/70 p-4">
              <p className="text-sm text-muted">Cash Collected</p>
              <p className="text-xl font-semibold">
                {formatCurrency(report?.paymentSummary.cash || 0)}
              </p>
            </div>
            <div className="rounded-2xl border border-border/70 bg-surface/70 p-4">
              <p className="text-sm text-muted">Online Collected</p>
              <p className="text-xl font-semibold">
                {formatCurrency(report?.paymentSummary.online || 0)}
              </p>
            </div>
            <div className="rounded-2xl border border-border/70 bg-surface/70 p-4">
              <p className="text-sm text-muted">Split Payments</p>
              <p className="text-xl font-semibold">
                {formatCurrency(report?.paymentSummary.split || 0)}
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Best Sellers</CardTitle>
              <CardDescription>Top products for the day</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {(report?.bestSelling ?? []).map((product) => (
                <div
                  key={product.name}
                  className="flex items-center justify-between text-sm"
                >
                  <span>{product.name}</span>
                  <Badge variant="soft">{product.qty} sold</Badge>
                </div>
              ))}
              {!report?.bestSelling?.length && (
                <p className="text-sm text-muted">No sales yet.</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Remaining Stock</CardTitle>
              <CardDescription>Closing quantities</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {(report?.remainingStock ?? []).map((item) => (
                <div
                  key={item.name}
                  className="flex items-center justify-between text-sm"
                >
                  <span>{item.name}</span>
                  <span className="text-muted">{item.onHandQty} left</span>
                </div>
              ))}
              {!report?.remainingStock?.length && (
                <p className="text-sm text-muted">No stock data yet.</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </RoleGate>
  );
}
