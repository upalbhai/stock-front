"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import {
  TrendingUp,
  Calendar,
  Printer,
  Download,
  Store,
  DollarSign,
  ShoppingBag,
  ClipboardCheck,
  AlertCircle,
  Sparkles,
  FileText,
  Wallet,
  RefreshCw,
  CreditCard,
  QrCode,
  Users,
  Award,
  Package,
  Layers,
  ArrowUpRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import { useAuth } from "@/components/auth/auth-provider";
import { useFeature } from "@/hooks/useFeature";
import { getJson } from "@/lib/api-client";
import { formatCurrency, formatNumber, formatDate } from "@/lib/format";
import { useQueryStates, parseAsString } from "nuqs";
import { JollyDateRangePicker } from "@/components/ui/jolly-date-picker";
import { parseDate } from "@internationalized/date";
import { cn } from "@/lib/utils";

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
  const { user, token, outletId } = useAuth();
  const currency = user?.currency || "INR";
  const hasCreditKhata = useFeature("credit_khata");
  const hasGstInvoices = useFeature("gst_invoices");
  const hasWholesale = useFeature("wholesale_billing");

  const [query, setQuery] = useQueryStates({
    from: parseAsString.withDefault(""),
    to: parseAsString.withDefault(""),
  });

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["reports-daily", outletId, query.from, query.to],
    queryFn: () =>
      getJson<ReportData>("/reports/daily", token, {
        outletId: outletId ?? undefined,
        from: query.from || undefined,
        to: query.to || undefined,
      }),
    enabled: Boolean(token && outletId),
  });

  const report = data;

  const handlePrint = () => {
    window.print();
  };

  const totalSales = report?.totalSales || 0;
  const totalOrders = report?.totalOrders || 0;
  const avgOrderValue = totalOrders > 0 ? totalSales / totalOrders : 0;

  const cashAmount = report?.paymentSummary?.cash || 0;
  const upiAmount = (report?.paymentSummary?.upi || 0) + (report?.paymentSummary?.online || 0);
  const cardAmount = report?.paymentSummary?.card || 0;
  const splitAmount = report?.paymentSummary?.split || 0;
  const digitalAmount = upiAmount + cardAmount;

  const cashPercent = totalSales > 0 ? ((cashAmount / totalSales) * 100).toFixed(0) : "0";
  const digitalPercent = totalSales > 0 ? ((digitalAmount / totalSales) * 100).toFixed(0) : "0";

  return (
    <div className="space-y-6 print:space-y-4 print:p-4">
      {/* Page Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 print:hidden">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Business Reports & Analytics
            </h1>
            <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 text-xs">
              Financial Intelligence
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">
            Consolidated sales revenue, payment channel breakdown, product velocities, and shift summaries.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <JollyDateRangePicker
            label="Report Period"
            value={
              query.from && query.to
                ? {
                    start: parseDate(query.from.split("T")[0]),
                    end: parseDate(query.to.split("T")[0]),
                  }
                : null
            }
            onChange={(val) => {
              if (val) {
                setQuery({
                  from: val.start.toString() + "T00:00:00.000Z",
                  to: val.end.toString() + "T23:59:59.999Z",
                });
              } else {
                setQuery({ from: "", to: "" });
              }
            }}
          />

          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            className="h-10 px-3.5 text-xs font-semibold gap-1.5 cursor-pointer"
            title="Refresh Report Data"
          >
            <RefreshCw className="h-4 w-4" />
            <span className="hidden sm:inline">Refresh</span>
          </Button>

          <Button
            onClick={handlePrint}
            className="h-10 px-4 text-xs font-semibold gap-1.5 shadow-xs cursor-pointer bg-foreground text-background hover:bg-foreground/90"
            title="Print Period Summary"
          >
            <Printer className="h-4 w-4" />
            <span>Print Report</span>
          </Button>
        </div>
      </div>

      {/* Printable Heading (for clean paper/PDF export) */}
      <div className="hidden print:block border-b border-border/80 pb-4 mb-4">
        <h2 className="text-2xl font-bold">Mini Hisab: Period Settlement Report</h2>
        <p className="text-xs text-muted-foreground mt-1">
          Period: {query.from && query.to ? `${formatDate(query.from.split("T")[0])} to ${formatDate(query.to.split("T")[0])}` : "Today"} | Outlet Financial Statement
        </p>
      </div>

      {/* Core Executive KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <Card className="border border-border/70 bg-card shadow-2xs hover:shadow-xs transition-shadow">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                Total Net Revenue
              </p>
              <p className="text-xl font-extrabold text-foreground tracking-tight mt-1 truncate">
                {isLoading ? "..." : formatCurrency(totalSales, currency)}
              </p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Avg order: {formatCurrency(avgOrderValue, currency)}
              </p>
            </div>
            <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0 border border-primary/20">
              <DollarSign className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border border-border/70 bg-card shadow-2xs hover:shadow-xs transition-shadow">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                Orders Completed
              </p>
              <p className="text-xl font-extrabold text-foreground tracking-tight mt-1 truncate">
                {isLoading ? "..." : formatNumber(totalOrders)}
              </p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Customer checkout transactions
              </p>
            </div>
            <div className="h-10 w-10 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 border border-indigo-500/20">
              <ShoppingBag className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border border-border/70 bg-card shadow-2xs hover:shadow-xs transition-shadow">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  Cash Collected
                </p>
                <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-muted/60 text-muted-foreground border border-border/50">
                  {cashPercent}%
                </span>
              </div>
              <p className="text-xl font-extrabold text-emerald-600 dark:text-emerald-400 tracking-tight mt-1 truncate">
                {isLoading ? "..." : formatCurrency(cashAmount, currency)}
              </p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                In register cash drawer
              </p>
            </div>
            <div className="h-10 w-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-500/20">
              <Wallet className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border border-border/70 bg-card shadow-2xs hover:shadow-xs transition-shadow">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  Digital Collections
                </p>
                <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-muted/60 text-muted-foreground border border-border/50">
                  {digitalPercent}%
                </span>
              </div>
              <p className="text-xl font-extrabold text-blue-600 dark:text-blue-400 tracking-tight mt-1 truncate">
                {isLoading ? "..." : formatCurrency(digitalAmount, currency)}
              </p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                UPI QR & card settlements
              </p>
            </div>
            <div className="h-10 w-10 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center shrink-0 border border-blue-500/20">
              <QrCode className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tax & Operational Metrics Banner (When Active) */}
      {(hasGstInvoices || hasCreditKhata || hasWholesale) && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
          {hasGstInvoices && (
            <Card className="border border-border/70 bg-card p-4 shadow-2xs">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                    GST Tax Collected
                  </p>
                  <p className="text-base font-extrabold text-foreground mt-0.5 font-mono">
                    {formatCurrency(report?.gstCollected || 0, currency)}
                  </p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    {(report?.igstCollected ?? 0) > 0
                      ? `IGST: ${formatCurrency(report?.igstCollected ?? 0, currency)}`
                      : `CGST: ${formatCurrency(report?.cgstCollected ?? 0, currency)} | SGST: ${formatCurrency(report?.sgstCollected ?? 0, currency)}`}
                  </p>
                </div>
                <FileText className="h-5 w-5 text-muted-foreground" />
              </div>
            </Card>
          )}

          {hasGstInvoices && (
            <Card className="border border-border/70 bg-card p-4 shadow-2xs">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                    Tax Invoices Created
                  </p>
                  <p className="text-base font-extrabold text-foreground mt-0.5 font-mono">
                    {formatNumber(report?.invoicesGenerated || 0)} Bills
                  </p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">B2B / B2C tax invoices</p>
                </div>
                <FileText className="h-5 w-5 text-muted-foreground" />
              </div>
            </Card>
          )}

          {hasCreditKhata && (
            <Card className="border border-border/70 bg-card p-4 shadow-2xs">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                    Credit / Khata Issued
                  </p>
                  <p className="text-base font-extrabold text-amber-600 dark:text-amber-400 mt-0.5 font-mono">
                    {formatCurrency(report?.creditIssued || 0, currency)}
                  </p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">Deferred balance sales</p>
                </div>
                <Wallet className="h-5 w-5 text-amber-500" />
              </div>
            </Card>
          )}

          {hasWholesale && (
            <Card className="border border-border/70 bg-card p-4 shadow-2xs">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                    Wholesale Volume
                  </p>
                  <p className="text-base font-extrabold text-indigo-600 dark:text-indigo-400 mt-0.5 font-mono">
                    {formatCurrency(report?.wholesaleSales || 0, currency)}
                  </p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">B2B tiered order value</p>
                </div>
                <Layers className="h-5 w-5 text-indigo-500" />
              </div>
            </Card>
          )}
        </div>
      )}

      {/* Payment Channel Breakdown Card */}
      <Card className="border border-border/70 bg-card shadow-2xs">
        <CardHeader className="pb-3 border-b border-border/40">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base font-bold text-foreground">
                Payment Channel Distribution
              </CardTitle>
              <CardDescription className="text-xs">
                Detailed breakdown of payment methods accepted across the POS terminal.
              </CardDescription>
            </div>
            <Badge variant="outline" className="text-xs font-mono">
              Total: {formatCurrency(totalSales, currency)}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 rounded-xl border border-border/50 bg-muted/30">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Cash</span>
                <span className="font-mono font-bold text-foreground">{cashPercent}%</span>
              </div>
              <p className="text-base font-extrabold text-foreground mt-1 font-mono">
                {formatCurrency(cashAmount, currency)}
              </p>
            </div>

            <div className="p-3 rounded-xl border border-border/50 bg-muted/30">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>UPI / QR</span>
                <span className="font-mono font-bold text-foreground">
                  {totalSales > 0 ? ((upiAmount / totalSales) * 100).toFixed(0) : 0}%
                </span>
              </div>
              <p className="text-base font-extrabold text-foreground mt-1 font-mono">
                {formatCurrency(upiAmount, currency)}
              </p>
            </div>

            <div className="p-3 rounded-xl border border-border/50 bg-muted/30">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Card (POS)</span>
                <span className="font-mono font-bold text-foreground">
                  {totalSales > 0 ? ((cardAmount / totalSales) * 100).toFixed(0) : 0}%
                </span>
              </div>
              <p className="text-base font-extrabold text-foreground mt-1 font-mono">
                {formatCurrency(cardAmount, currency)}
              </p>
            </div>

            <div className="p-3 rounded-xl border border-border/50 bg-muted/30">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Split Tender</span>
                <span className="font-mono font-bold text-foreground">
                  {totalSales > 0 ? ((splitAmount / totalSales) * 100).toFixed(0) : 0}%
                </span>
              </div>
              <p className="text-base font-extrabold text-foreground mt-1 font-mono">
                {formatCurrency(splitAmount, currency)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Grid: Best Sellers & Closing Inventory */}
      <div className="grid gap-6 lg:grid-cols-2 items-start">
        {/* Left: Best Sellers */}
        <DataTable
          title="Top Product Velocities"
          description="Best-selling items ranked by revenue contribution."
          isLoading={isLoading}
          data={report?.bestSelling ?? []}
          keyExtractor={(p) => p.name}
          hidePagination
          onRefetch={() => refetch()}
          emptyStateText="No product sales recorded in this period."
          columns={[
            {
              key: "rank",
              header: "Rank",
              render: (p) => {
                const idx = (report?.bestSelling ?? []).findIndex((x) => x.name === p.name);
                const rank = idx + 1;
                return (
                  <div
                    className={cn(
                      "flex h-7 w-7 items-center justify-center rounded-lg text-xs font-bold font-mono",
                      rank === 1
                        ? "bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30"
                        : rank === 2
                        ? "bg-slate-500/15 text-slate-700 dark:text-slate-300 border border-slate-500/30"
                        : rank === 3
                        ? "bg-amber-700/15 text-amber-800 dark:text-amber-500 border border-amber-700/30"
                        : "bg-muted/60 text-muted-foreground"
                    )}
                  >
                    #{rank}
                  </div>
                );
              },
            },
            {
              key: "name",
              header: "Product Title",
              render: (p) => <span className="font-semibold text-sm text-foreground">{p.name}</span>,
            },
            {
              key: "qty",
              header: "Sold",
              className: "text-right",
              render: (p) => (
                <span className="font-mono font-bold text-xs bg-muted/60 px-2 py-0.5 rounded border border-border/40">
                  {formatNumber(p.qty)} units
                </span>
              ),
            },
            {
              key: "total",
              header: "Revenue",
              className: "text-right",
              render: (p) => (
                <span className="font-mono font-bold text-sm text-primary">
                  {formatCurrency(p.total ?? 0, currency)}
                </span>
              ),
            },
          ]}
        />

        {/* Right: Closing Inventory */}
        <DataTable
          title="Closing Inventory Status"
          description="Stock on hand and low stock alert thresholds."
          isLoading={isLoading}
          data={report?.remainingStock ?? []}
          keyExtractor={(item) => item.name}
          hidePagination
          emptyStateText="No stock levels recorded for this outlet."
          columns={[
            {
              key: "name",
              header: "Product Name",
              render: (item) => (
                <div>
                  <p className="font-semibold text-sm text-foreground">{item.name}</p>
                  <p className="text-[11px] text-muted-foreground font-mono">
                    Min Alert: {item.lowStockThreshold} {item.unit}
                  </p>
                </div>
              ),
            },
            {
              key: "onHandQty",
              header: "Stock on Hand",
              className: "text-right",
              render: (item) => {
                const isLow = item.onHandQty <= item.lowStockThreshold;
                return (
                  <div className="flex items-center justify-end gap-2">
                    <span
                      className={cn(
                        "font-mono font-bold text-sm",
                        isLow ? "text-rose-600 dark:text-rose-400" : "text-foreground"
                      )}
                    >
                      {item.onHandQty} {item.unit}
                    </span>
                    {isLow ? (
                      <Badge variant="danger" className="text-[10px] py-0.2 font-semibold">
                        Low
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-[10px] py-0.2 text-emerald-600 border-emerald-500/20 bg-emerald-500/5">
                        In Stock
                      </Badge>
                    )}
                  </div>
                );
              },
            },
          ]}
        />
      </div>

      {/* Staff Shift Performance */}
      <DataTable
        title="Staff & Shift Performance"
        description="Individual cashier sales volumes, completed tickets, and contributions."
        isLoading={isLoading}
        data={report?.staffSales ?? []}
        keyExtractor={(staff) => staff.name}
        hidePagination
        emptyStateText="No staff sales data recorded in this period."
        columns={[
          {
            key: "rank",
            header: "#",
            render: (staff) => {
              const idx = (report?.staffSales ?? []).findIndex((s) => s.name === staff.name);
              return <span className="font-mono font-bold text-xs text-muted-foreground">#{idx + 1}</span>;
            },
          },
          {
            key: "name",
            header: "Staff Member",
            render: (staff) => (
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary font-bold text-xs border border-primary/20">
                  {staff.name.slice(0, 2).toUpperCase()}
                </div>
                <span className="font-semibold text-sm text-foreground">{staff.name}</span>
              </div>
            ),
          },
          {
            key: "orders",
            header: "Tickets Settled",
            render: (staff) => (
              <span className="text-xs font-mono font-semibold text-muted-foreground bg-muted/60 px-2 py-0.5 rounded border border-border/40">
                {staff.orders} orders
              </span>
            ),
          },
          {
            key: "revenue",
            header: "Total Revenue Contribution",
            className: "text-right",
            render: (staff) => (
              <span className="font-mono font-bold text-sm text-primary">
                {formatCurrency(staff.revenue, currency)}
              </span>
            ),
          },
        ]}
      />
    </div>
  );
}
