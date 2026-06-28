"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import {
  TrendingUp, Calendar, Printer, Download, Store, DollarSign,
  ShoppingBag, ClipboardCheck, AlertCircle, Sparkles, FileText, Wallet, RefreshCw
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { StatsCard } from "@/components/ui/stats-card";
import { DataTable } from "@/components/ui/data-table";
import { useAuth } from "@/components/auth/auth-provider";
import { useFeature } from "@/hooks/useFeature";
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
  gstCollected?: number;
  wholesaleSales?: number;
  creditIssued?: number;
  invoicesGenerated?: number;
  igstCollected?: number;
  cgstCollected?: number;
  sgstCollected?: number;
};

export default function ReportsPage() {
  const { token, outletId } = useAuth();
  const hasCreditKhata = useFeature("credit_khata");
  const hasGstInvoices = useFeature("gst_invoices");
  const hasWholesale = useFeature("wholesale_billing");
  const [selectedDate, setSelectedDate] = React.useState(new Date().toISOString().split("T")[0]);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["reports-daily", outletId, selectedDate],
    queryFn: () => getJson<ReportData>("/reports/daily", token, { outletId: outletId ?? undefined, date: selectedDate }),
    enabled: Boolean(token && outletId)
  });

  const report = data;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 print:space-y-4 print:p-4">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <TrendingUp className="h-6 w-6 text-primary" /> Reports & Analytics
          </h1>
          <p className="text-sm text-muted-foreground">Generate end-of-day reports and monitor closing indicators</p>
        </div>
        {/* <Button variant="outline" size="sm" className="gap-1.5 w-full sm:w-auto justify-center shrink-0" onClick={handlePrint}>
          <Printer className="h-4 w-4" /> Print Summary
        </Button> */}
      </div>

      {/* Date Filter & Selector (Single Line on Mobile) */}
      <div className=" p-2.5 sm:p-4 rounded-2xl sm:rounded-3xl shadow-soft flex items-center justify-between gap-3 print:hidden">
        <div className="flex items-center gap-2 flex-grow min-w-0">
          {/* <Calendar className="h-4 w-4 text-muted-foreground shrink-0" /> */}
          <span className="text-xs sm:text-sm font-semibold text-muted-foreground hidden xs:inline shrink-0">Date:</span>
          <Input
            type="date"
            className="w-full max-w-[155px] sm:max-w-[200px] rounded-xl border border-border bg-surface px-2.5 sm:px-3 py-1.5 text-xs sm:text-sm focus:border-primary outline-none transition"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
          />
        </div>
        <Button variant="soft" size="sm" onClick={() => refetch()} className="shrink-0 flex items-center gap-1.5 px-3 sm:px-4">
          <RefreshCw className="h-4 w-4" />
          <span className="hidden sm:inline">Refresh Report</span>
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
          className="min-w-0"
          label="Total Net Revenue"
          value={formatCurrency(report?.totalSales || 0)}
          hint={`For ${formatDate(selectedDate)}`}
          icon={<DollarSign className="h-5 w-5" />}
          color="primary"
        />
        <StatsCard
          className="min-w-0"
          label="Total Orders"
          value={formatNumber(report?.totalOrders || 0)}
          icon={<ShoppingBag className="h-5 w-5" />}
        />
        <StatsCard
          className="min-w-0"
          label="Cash Collected"
          value={formatCurrency(report?.paymentSummary?.cash || 0)}
        />
        <StatsCard
          className="min-w-0"
          label="Digital Payments (UPI/Card)"
          value={formatCurrency((report?.paymentSummary?.online || 0) + (report?.paymentSummary?.card || 0))}
          color="success"
        />
      </div>

      {(hasGstInvoices || hasCreditKhata || hasWholesale) && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {hasGstInvoices && (
            <>
              <StatsCard
                className="min-w-0"
                label="GST Collected"
                value={formatCurrency(report?.gstCollected || 0)}
                hint={
                  (report?.igstCollected ?? 0) > 0
                    ? `IGST ${formatCurrency(report?.igstCollected ?? 0)}`
                    : `CGST ${formatCurrency(report?.cgstCollected ?? 0)} · SGST ${formatCurrency(report?.sgstCollected ?? 0)}`
                }
                icon={<FileText className="h-5 w-5" />}
              />
              <StatsCard
                className="min-w-0"
                label="GST Invoices"
                value={formatNumber(report?.invoicesGenerated || 0)}
                icon={<FileText className="h-5 w-5" />}
              />
            </>
          )}
          {hasWholesale && (
            <StatsCard
              className="min-w-0"
              label="Wholesale Sales"
              value={formatCurrency(report?.wholesaleSales || 0)}
              icon={<TrendingUp className="h-5 w-5" />}
              color="primary"
            />
          )}
          {hasCreditKhata && (
            <StatsCard
              className="min-w-0"
              label="Credit Issued"
              value={formatCurrency(report?.creditIssued || 0)}
              icon={<Wallet className="h-5 w-5" />}
              color="warning"
            />
          )}
        </div>
      )}

      {/* Payment Split & Drawer Analysis */}
      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        {/* Left: Best Sellers */}
        <div className="min-w-0">
          <DataTable
            title="Sales Mix & Best Sellers"
            description="Product sales breakdown and total contribution"
            isLoading={isLoading}
            data={report?.bestSelling ?? []}
            keyExtractor={(p) => p.name}
            hidePagination
            onRefetch={() => refetch()}
            emptyStateText="No sales recorded on this business date."
            columns={[
              {
                key: "rank",
                header: "Rank",
                render: (p) => {
                  const idx = (report?.bestSelling ?? []).findIndex((x) => x.name === p.name);
                  return <span className="font-semibold text-muted">#{idx + 1}</span>;
                }
              },
              { key: "name", header: "Item Name", render: (p) => <span className="font-medium">{p.name}</span> },
              { key: "qty", header: "Qty Sold", className: "text-right", render: (p) => <span className="font-bold">{p.qty}</span> },
              { key: "total", header: "Revenue Contribution", className: "text-right", render: (p) => <span className="font-bold text-primary">{formatCurrency(p.total ?? 0)}</span> }
            ]}
          />
        </div>

        {/* Right: Closing stock */}
        <div className="min-w-0">
          <DataTable
            title="Closing Inventory"
            description="End-of-day remaining quantities"
            isLoading={isLoading}
            data={report?.remainingStock ?? []}
            keyExtractor={(item) => item.name}
            hidePagination
            emptyStateText="No stock levels tracked yet."
            columns={[
              {
                key: "name",
                header: "Product",
                render: (item) => (
                  <div>
                    <p className="font-semibold text-sm">{item.name}</p>
                    <p className="text-xs text-muted-foreground">Threshold: {item.lowStockThreshold} {item.unit}</p>
                  </div>
                )
              },
              {
                key: "onHandQty",
                header: "On Hand",
                className: "text-right",
                render: (item) => {
                  const isLow = item.onHandQty <= item.lowStockThreshold;
                  return (
                    <div className="flex items-center justify-end gap-2">
                      <span className={`font-bold text-sm ${isLow ? "text-danger" : ""}`}>
                        {item.onHandQty} {item.unit}
                      </span>
                      {isLow && <Badge variant="danger" className="text-[10px] py-0.5">Low</Badge>}
                    </div>
                  );
                }
              }
            ]}
          />
        </div>

        {/* Bottom Row: Staff Performance */}
        <div className="lg:col-span-2 min-w-0">
          <DataTable
            title="Staff Shift Performance"
            description="Sales tracked by individual team members"
            isLoading={isLoading}
            data={report?.staffSales ?? []}
            keyExtractor={(staff) => staff.name}
            hidePagination
            emptyStateText="No staff sales data available."
            columns={[
              {
                key: "rank",
                header: "#",
                render: (staff) => {
                  const idx = (report?.staffSales ?? []).findIndex((s) => s.name === staff.name);
                  return <span className="font-bold text-primary">{idx + 1}</span>;
                }
              },
              { key: "name", header: "Staff", render: (staff) => <span className="font-semibold">{staff.name}</span> },
              { key: "orders", header: "Orders", render: (staff) => <span className="text-sm text-muted-foreground">{staff.orders} orders</span> },
              { key: "revenue", header: "Revenue", className: "text-right", render: (staff) => <span className="font-bold text-primary">{formatCurrency(staff.revenue)}</span> }
            ]}
          />
        </div>
      </div>
    </div>
  );
}
