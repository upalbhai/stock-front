"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import {
  TrendingUp, Calendar, Printer, Download, Store, DollarSign,
  ShoppingBag, ClipboardCheck, AlertCircle, Sparkles
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { StatsCard } from "@/components/ui/stats-card";
import { useAuth } from "@/components/auth/auth-provider";
import { getJson } from "@/lib/api-client";
import { formatCurrency, formatNumber, formatDate } from "@/lib/format";

type ReportData = {
  totalSales: number;
  totalOrders: number;
  paymentSummary: {
    cash: number;
    online: number;
    upi: number;
    card: number;
    split: number;
  };
  bestSelling: { name: string; qty: number; total: number }[];
  remainingStock: { name: string; onHandQty: number; lowStockThreshold: number; unit: string }[];
  staffSales: { name: string; revenue: number; orders: number }[];
};

export default function ReportsPage() {
  const { token, outletId } = useAuth();
  const [selectedDate, setSelectedDate] = React.useState(new Date().toISOString().split("T")[0]);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["reports-daily", outletId, selectedDate],
    queryFn: () => getJson<{ data: ReportData }>("/reports/daily", token, { outletId: outletId ?? undefined, date: selectedDate }),
    enabled: Boolean(token && outletId)
  });

  const report = data?.data;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 print:space-y-4 print:p-4">
      {/* Page Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 print:hidden">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <TrendingUp className="h-6 w-6 text-primary" /> Reports & Analytics
          </h1>
          <p className="text-sm text-muted">Generate end-of-day reports and monitor closing indicators</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-1.5" onClick={handlePrint}>
            <Printer className="h-4 w-4" /> Print Summary
          </Button>
        </div>
      </div>

      {/* Date Filter & Selector */}
      <div className="glass-panel border border-border/70 p-4 rounded-3xl shadow-soft flex items-center gap-4 flex-wrap print:hidden">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <Calendar className="h-4 w-4 text-muted" /> Date:
        </div>
        <Input
          type="date"
          className="w-48 rounded-xl border border-border bg-surface px-3 py-1.5 text-sm"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
        />
        <Button variant="soft" size="sm" onClick={() => refetch()} className="ml-auto">
          Refresh Report
        </Button>
      </div>

      {/* Printable Heading */}
      <div className="hidden print:block border-b pb-4 mb-6">
        <h2 className="text-2xl font-bold">Outlet Pulse — EOD Report</h2>
        <p className="text-sm text-muted">Date: {formatDate(selectedDate)} | Outlet Session Summary</p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          label="Total Net Revenue"
          value={formatCurrency(report?.totalSales || 0)}
          hint={`For ${formatDate(selectedDate)}`}
          icon={<DollarSign className="h-5 w-5" />}
          color="primary"
        />
        <StatsCard
          label="Total Orders"
          value={formatNumber(report?.totalOrders || 0)}
          icon={<ShoppingBag className="h-5 w-5" />}
        />
        <StatsCard
          label="Cash Collected"
          value={formatCurrency(report?.paymentSummary?.cash || 0)}
        />
        <StatsCard
          label="Digital Payments (UPI/Card)"
          value={formatCurrency((report?.paymentSummary?.online || 0) + (report?.paymentSummary?.card || 0))}
          color="success"
        />
      </div>

      {/* Payment Split & Drawer Analysis */}
      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        {/* Left Card: Best Sellers */}
        <Card className="rounded-3xl border border-border/70 shadow-soft">
          <CardHeader>
            <CardTitle>Sales Mix & Best Sellers</CardTitle>
            <CardDescription>Product sales breakdown and total contribution</CardDescription>
          </CardHeader>
          <CardContent className="space-y-1">
            {isLoading ? (
              <p className="text-sm text-muted animate-pulse">Analyzing sales matrix...</p>
            ) : !report?.bestSelling?.length ? (
              <p className="text-sm text-muted italic">No sales recorded on this business date.</p>
            ) : (
              <div className="border border-border/50 rounded-2xl overflow-hidden">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="bg-border/30 border-b border-border/50 text-xs font-semibold text-muted">
                      <th className="p-3">Rank</th>
                      <th className="p-3">Item Name</th>
                      <th className="p-3 text-right">Qty Sold</th>
                      <th className="p-3 text-right">Revenue Contribution</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/30">
                    {report.bestSelling.map((p, idx) => (
                      <tr key={p.name} className="hover:bg-surface/50 transition">
                        <td className="p-3 font-semibold text-muted">#{idx + 1}</td>
                        <td className="p-3 font-medium">{p.name}</td>
                        <td className="p-3 text-right font-bold">{p.qty}</td>
                        <td className="p-3 text-right font-bold text-primary">{formatCurrency(p.total ?? 0)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Right Columns: Closing stock */}
        <Card className="rounded-3xl border border-border/70 shadow-soft">
          <CardHeader>
            <CardTitle>Closing Inventory</CardTitle>
            <CardDescription>End-of-day remaining quantities</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 max-h-[400px] overflow-y-auto">
            {isLoading ? (
              <p className="text-sm text-muted animate-pulse">Checking stock registers...</p>
            ) : !report?.remainingStock?.length ? (
              <p className="text-sm text-muted italic">No stock levels tracked yet.</p>
            ) : (
              <div className="space-y-3">
                {report.remainingStock.map((item) => {
                  const isLow = item.onHandQty <= item.lowStockThreshold;
                  return (
                    <div key={item.name} className="flex justify-between items-center py-1.5 border-b border-border/20">
                      <div>
                        <p className="font-semibold text-sm">{item.name}</p>
                        <p className="text-xs text-muted">Threshold: {item.lowStockThreshold} {item.unit}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`font-bold text-sm ${isLow ? "text-danger" : ""}`}>
                          {item.onHandQty} {item.unit}
                        </span>
                        {isLow && (
                          <Badge variant="danger" className="text-[10px] py-0.5">Low</Badge>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
        {/* Bottom Row: Staff Performance */}
        <Card className="rounded-3xl border border-border/70 shadow-soft lg:col-span-2">
          <CardHeader>
            <CardTitle>Staff Shift Performance</CardTitle>
            <CardDescription>Sales tracked by individual team members</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p className="text-sm text-muted animate-pulse">Calculating staff contributions...</p>
            ) : !report?.staffSales?.length ? (
              <p className="text-sm text-muted italic">No staff sales data available.</p>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
                {report.staffSales.map((staff, idx) => (
                  <div key={staff.name} className="flex items-center gap-4 p-4 rounded-xl border border-border/50 bg-surface">
                    <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 text-primary font-bold">
                      {idx + 1}
                    </div>
                    <div>
                      <p className="font-semibold">{staff.name}</p>
                      <p className="text-sm text-muted">{staff.orders} orders</p>
                    </div>
                    <div className="ml-auto text-right">
                      <p className="font-bold text-primary">{formatCurrency(staff.revenue)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
