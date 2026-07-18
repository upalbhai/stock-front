"use client";

import * as React from "react";
import Link from "next/link";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { useAuth } from "@/components/auth/auth-provider";
import { useFeature } from "@/hooks/useFeature";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { StatsCard } from "@/components/ui/stats-card";
import { Skeleton } from "@/components/ui/skeleton";
import { getJson } from "@/lib/api-client";
import { formatCurrency, formatNumber } from "@/lib/format";
import {
  ArrowRight,
  ReceiptText,
  Package,
  ShoppingBag,
  FileText,
  Wallet,
  TrendingUp,
  History,
  UserCircle,
  RefreshCw,
  Receipt,
  Store,
  ArrowUp,
  ArrowDown,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  BarChart3,
  Layers,
  X,
  Search,
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
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell,
} from "recharts";

// ─── Types ───
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

type PaginatedSection<T> = {
  items: T[];
  total: number;
  page: number;
};

type CategoryItem = {
  categoryId: string | null;
  name: string;
  icon: string;
  color: string;
  totalQty: number;
  totalRevenue: number;
  orderCount: number;
};

type ProductItem = {
  productId: string | null;
  name: string;
  totalQty: number;
  totalRevenue: number;
  orderCount: number;
};

type LowStockProductItem = {
  productId: string;
  name: string;
  sku: string;
  unit: string;
  price: number;
  onHandQty: number;
  lowStockThreshold: number;
  stockPercent: number;
  categoryName: string;
  categoryIcon: string;
  categoryColor: string;
};

type LowStockCategoryItem = {
  categoryId: string | null;
  name: string;
  icon: string;
  color: string;
  count: number;
  criticalCount: number;
};

type TrendPoint = { date: string; revenue: number; orders: number };

type AnalyticsData = {
  topSellingCategories: PaginatedSection<CategoryItem>;
  topSellingProducts: PaginatedSection<ProductItem>;
  revenueByCategory: PaginatedSection<CategoryItem>;
  revenueByProduct: PaginatedSection<ProductItem>;
  lowStockProducts: PaginatedSection<LowStockProductItem>;
  lowStockCategories: { items: LowStockCategoryItem[]; total: number };
  salesTrend: TrendPoint[];
};

// ─── Chart Colors ───
const CHART_COLORS = [
  "#6366f1", "#8b5cf6", "#a855f7", "#d946ef", "#ec4899",
  "#f43f5e", "#f97316", "#eab308", "#22c55e", "#14b8a6",
];

// ─── Reusable Pagination Component ───
function MiniPagination({
  page,
  totalPages,
  onPrev,
  onNext,
}: {
  page: number;
  totalPages: number;
  onPrev: () => void;
  onNext: () => void;
}) {
  if (totalPages <= 1) return null;
  return (
    <div className="flex items-center gap-1.5 text-xs">
      <Button
        variant="ghost"
        size="icon"
        className="h-6 w-6"
        disabled={page <= 1}
        onClick={onPrev}
      >
        <ChevronLeft className="h-3.5 w-3.5" />
      </Button>
      <span className="font-medium text-muted-foreground tabular-nums">
        {page}/{totalPages}
      </span>
      <Button
        variant="ghost"
        size="icon"
        className="h-6 w-6"
        disabled={page >= totalPages}
        onClick={onNext}
      >
        <ChevronRight className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
}

// ─── Sort Toggle Button ───
function SortToggle({
  sort,
  onToggle,
}: {
  sort: "asc" | "desc";
  onToggle: () => void;
}) {
  return (
    <Button
      variant="ghost"
      size="icon"
      className="h-7 w-7 transition-all duration-200"
      onClick={onToggle}
      title={sort === "desc" ? "Showing highest first" : "Showing lowest first"}
    >
      {sort === "desc" ? (
        <ArrowDown className="h-3.5 w-3.5 text-primary" />
      ) : (
        <ArrowUp className="h-3.5 w-3.5 text-amber-500" />
      )}
    </Button>
  );
}

// ─── Chart Skeleton ───
function ChartSkeleton() {
  return (
    <div className="flex items-end gap-2 h-44 px-2 pt-4">
      {[0.4, 0.7, 0.55, 0.85, 0.6].map((h, i) => (
        <Skeleton
          key={i}
          className="flex-1 rounded-md"
          style={{ height: `${h * 100}%` }}
        />
      ))}
    </div>
  );
}

// ─── Table Skeleton ───
function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-2.5 mt-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-3">
          <Skeleton className="h-4 w-4 rounded" />
          <Skeleton className="h-4 flex-1 rounded" />
          <Skeleton className="h-4 w-16 rounded" />
        </div>
      ))}
    </div>
  );
}

// ─── Severity color for stock level ───
function stockSeverity(stockPercent: number) {
  if (stockPercent <= 0) return { bg: "bg-red-500/15", text: "text-red-600 dark:text-red-400", label: "Out of stock" };
  if (stockPercent <= 30) return { bg: "bg-red-500/10", text: "text-red-500 dark:text-red-400", label: "Critical" };
  if (stockPercent <= 60) return { bg: "bg-amber-500/10", text: "text-amber-600 dark:text-amber-400", label: "Low" };
  return { bg: "bg-yellow-500/10", text: "text-yellow-600 dark:text-yellow-400", label: "Warning" };
}

function CustomTooltip({ active, payload, label, currency = "" }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-border/70 bg-card/95 backdrop-blur-md px-3.5 py-2.5 shadow-lg text-xs">
      <p className="font-semibold text-foreground mb-1">{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} className="text-muted-foreground">
          <span className="inline-block h-2 w-2 rounded-full mr-1.5" style={{ backgroundColor: p.color }} />
          {p.name}: <span className="font-bold text-foreground">{currency ? formatCurrency(p.value, currency) : formatNumber(p.value)}</span>
        </p>
      ))}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════
// ─── ANALYTICS SECTION COMPONENT ──────────────────────────────────
// A reusable card for any "bar chart + table" analytics section
// ════════════════════════════════════════════════════════════════════
function AnalyticsSection({
  title,
  description,
  icon: Icon,
  items,
  total,
  page,
  limit,
  sort,
  onSortToggle,
  onPageChange,
  isLoading,
  chartDataKey,
  chartLabel,
  renderRow,
  barColor,
  gradientId,
}: {
  title: string;
  description: string;
  icon: React.ElementType;
  items: any[];
  total: number;
  page: number;
  limit: number;
  sort: "asc" | "desc";
  onSortToggle: () => void;
  onPageChange: (p: number) => void;
  isLoading: boolean;
  chartDataKey: string;
  chartLabel: string;
  renderRow: (item: any, i: number) => React.ReactNode;
  barColor?: string;
  gradientId: string;
}) {
  const { user } = useAuth();
  const currency = user?.currency || "INR";
  const totalPages = Math.ceil(total / limit) || 1;
  const color = barColor || "#6366f1";

  return (
    <Card className="border-border/70 shadow-sm bg-card/40 backdrop-blur-md overflow-hidden animate-rise">
      <CardHeader className="pb-1">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Icon className="h-4 w-4" />
            </div>
            <div>
              <CardTitle className="text-sm font-bold tracking-tight">{title}</CardTitle>
              <CardDescription className="text-[11px]">{description}</CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-1 self-end sm:self-auto">
            <SortToggle sort={sort} onToggle={onSortToggle} />
            <MiniPagination
              page={page}
              totalPages={totalPages}
              onPrev={() => onPageChange(page - 1)}
              onNext={() => onPageChange(page + 1)}
            />
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-1 pb-3 px-3">
        {isLoading ? (
          <>
            <ChartSkeleton />
            <TableSkeleton rows={limit} />
          </>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <Icon className="h-8 w-8 text-muted-foreground/30 mb-2" />
            <p className="text-sm font-semibold text-muted-foreground">No data available</p>
            <p className="text-xs text-muted-foreground/70 mt-0.5">Try adjusting the date range</p>
          </div>
        ) : (
          <>
            {/* Bar Chart */}
            <div className="h-44 -mx-1">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={items} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={color} stopOpacity={0.85} />
                      <stop offset="95%" stopColor={color} stopOpacity={0.3} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border)" opacity={0.3} />
                  <XAxis
                    dataKey="name"
                    stroke="var(--color-muted-foreground)"
                    opacity={0.6}
                    fontSize={10}
                    tickLine={false}
                    axisLine={false}
                    interval={0}
                    tick={({ x, y, payload }: any) => (
                      <text x={x} y={y + 10} textAnchor="middle" fill="var(--color-muted-foreground)" opacity={0.7} fontSize={9}>
                        {String(payload.value).length > 8 ? String(payload.value).slice(0, 7) + "…" : payload.value}
                      </text>
                    )}
                  />
                  <YAxis
                    stroke="var(--color-muted-foreground)"
                    opacity={0.5}
                    fontSize={9}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(v) => chartDataKey === "totalRevenue" ? formatCurrency(v, currency) : formatNumber(v)}
                  />
                  <Tooltip content={<CustomTooltip currency={chartDataKey === "totalRevenue" ? currency : ""} />} />
                  <Bar dataKey={chartDataKey} name={chartLabel} radius={[4, 4, 0, 0]} maxBarSize={40}>
                    {items.map((_: any, i: number) => (
                      <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} fillOpacity={0.85} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Table Rows */}
            <div className="mt-3 space-y-1">
              {items.map((item: any, i: number) => renderRow(item, i))}
            </div>

            {/* Footer info */}
            <div className="mt-2 flex items-center justify-between text-[10px] text-muted-foreground/60">
              <span>Showing {items.length} of {total}</span>
              <span>{sort === "desc" ? "Highest first" : "Lowest first"}</span>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

// ════════════════════════════════════════════════════════════════════
// ─── MAIN DASHBOARD ───────────────────────────────────────────────
// ════════════════════════════════════════════════════════════════════
function DashboardHome({ token, outletId }: { token: string; outletId: string | null }) {
  const { user } = useAuth();
  const currency = user?.currency || "INR";
  const hasCreditKhata = useFeature("credit_khata");
  const hasGstInvoices = useFeature("gst_invoices");
  const hasWholesale = useFeature("wholesale_billing");

  // ─── Global date range ───
  const [query, setQuery] = useQueryStates({
    from: parseAsString.withDefault(""),
    to: parseAsString.withDefault(""),
  });

  // ─── Section-specific pagination & sort ───
  const [topCatPage, setTopCatPage] = React.useState(1);
  const [topCatSort, setTopCatSort] = React.useState<"asc" | "desc">("desc");
  const [topProdPage, setTopProdPage] = React.useState(1);
  const [topProdSort, setTopProdSort] = React.useState<"asc" | "desc">("desc");
  const [revCatPage, setRevCatPage] = React.useState(1);
  const [revCatSort, setRevCatSort] = React.useState<"asc" | "desc">("desc");
  const [revProdPage, setRevProdPage] = React.useState(1);
  const [revProdSort, setRevProdSort] = React.useState<"asc" | "desc">("desc");
  const [lowStockPage, setLowStockPage] = React.useState(1);
  const [lowStockSearch, setLowStockSearch] = React.useState("");
  const [lowStockCatPage, setLowStockCatPage] = React.useState(1);
  const [lowStockCatSearch, setLowStockCatSearch] = React.useState("");

  const LIMIT = 5;
  const LOW_STOCK_LIMIT = 8;

  // ─── Summary query (existing endpoint) ───
  const { data: summaryData, isLoading: summaryLoading, refetch: refetchSummary } = useQuery({
    queryKey: ["reports-summary", outletId, query.from, query.to],
    queryFn: () =>
      getJson<SummaryData>("/reports/summary", token, {
        outletId: outletId ?? undefined,
        from: query.from || undefined,
        to: query.to || undefined,
      }),
    enabled: Boolean(token),
  });

  // ─── Analytics query (new endpoint) ───
  const { data: analyticsRaw, isLoading: analyticsLoading, refetch: refetchAnalytics } = useQuery({
    queryKey: [
      "dashboard-analytics",
      outletId,
      query.from, query.to,
      topCatPage, topCatSort,
      topProdPage, topProdSort,
      revCatPage, revCatSort,
      revProdPage, revProdSort,
      lowStockPage, lowStockSearch,
      lowStockCatPage, lowStockCatSearch,
    ],
    queryFn: () =>
      getJson<AnalyticsData>("/reports/dashboard-analytics", token, {
        outletId: outletId ?? undefined,
        from: query.from || undefined,
        to: query.to || undefined,
        topCatPage, topCatLimit: LIMIT, topCatSort,
        topProdPage, topProdLimit: LIMIT, topProdSort,
        revCatPage, revCatLimit: LIMIT, revCatSort,
        revProdPage, revProdLimit: LIMIT, revProdSort,
        lowStockPage, lowStockLimit: LOW_STOCK_LIMIT, lowStockSearch,
        lowStockCatPage, lowStockCatLimit: LOW_STOCK_LIMIT, lowStockCatSearch,
      }),
    enabled: Boolean(token),
    placeholderData: keepPreviousData,
  });

  const analytics = analyticsRaw as AnalyticsData | undefined;
  const summary = summaryData;
  const isLoading = summaryLoading;

  const refetch = React.useCallback(() => {
    refetchSummary();
    refetchAnalytics();
  }, [refetchSummary, refetchAnalytics]);

  // Reset all pages when date range changes
  React.useEffect(() => {
    setTopCatPage(1);
    setTopProdPage(1);
    setRevCatPage(1);
    setRevProdPage(1);
    setLowStockPage(1);
  }, [query.from, query.to]);

  // ─── Quick actions ───
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

  // ─── Low stock pagination ───
  const lowStockTotalPages = Math.ceil((analytics?.lowStockProducts?.total || 0) / LOW_STOCK_LIMIT) || 1;
  const lowStockCatTotalPages = Math.ceil((analytics?.lowStockCategories?.total || 0) / LOW_STOCK_LIMIT) || 1;

  return (
    <div className="space-y-6">
      {/* ═══ HEADER ═══ */}
      <section className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Badge className="mb-2 w-fit">
            {query.from || query.to ? "Selected Period" : "Today's pulse"}
          </Badge>
          <h1 className="text-2xl font-bold tracking-tight">Operations dashboard</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Live snapshot for your outlet — sales, analytics, and insights at a glance.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 items-center">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <JollyDateRangePicker
              label="Filter Pulse"
              value={
                query.from && query.to
                  ? { start: parseDate(query.from.split("T")[0]), end: parseDate(query.to.split("T")[0]) }
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
            {(query.from || query.to) && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setQuery({ from: "", to: "" })}
                className="h-9 w-9 shrink-0 hover:bg-destructive/10 hover:text-destructive transition-colors"
                title="Clear date filter"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
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

      {/* ═══ STATS ROW ═══ */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          label={query.from || query.to ? "Sales in Period" : "Sales Today"}
          value={isLoading ? "…" : formatCurrency(summary?.totalSalesToday ?? 0, currency)}
          hint={`${formatNumber(summary?.totalOrdersToday ?? 0)} orders`}
          icon={<TrendingUp />}
          color="primary"
        />
        {hasGstInvoices && (
          <StatsCard
            label={query.from || query.to ? "GST Collected" : "GST Collected Today"}
            value={isLoading ? "…" : formatCurrency(summary?.gstCollectedToday ?? 0, currency)}
            hint={
              (summary?.igstToday ?? 0) > 0
                ? `IGST ${formatCurrency(summary?.igstToday ?? 0, currency)}`
                : `CGST+SGST ${formatCurrency(summary?.cgstSgstToday ?? 0, currency)}`
            }
            icon={<Receipt />}
            color="success"
          />
        )}
        {hasCreditKhata && (
          <StatsCard
            label="Credit Outstanding"
            value={isLoading ? "…" : formatCurrency(summary?.totalCreditOutstanding ?? 0, currency)}
            hint={`${summary?.customersWithDue ?? 0} customers with due`}
            icon={<Wallet />}
            color="warning"
          />
        )}
        {hasWholesale && (
          <StatsCard
            label={query.from || query.to ? "Wholesale Sales" : "Wholesale Sales Today"}
            value={isLoading ? "…" : formatCurrency(summary?.wholesaleSalesToday ?? 0, currency)}
            hint={`Credit issued ${formatCurrency(summary?.creditIssuedToday ?? 0, currency)}`}
            icon={<Store />}
            color="purple"
          />
        )}
        {!hasCreditKhata && !hasWholesale && !hasGstInvoices && (
          <StatsCard
            label={query.from || query.to ? "Orders" : "Orders Today"}
            value={isLoading ? "…" : formatNumber(summary?.totalOrdersToday ?? 0)}
            icon={<ShoppingBag />}
            color="default"
          />
        )}
      </div>

      {/* ═══ SALES TREND + QUICK ACTIONS ═══ */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2 border-border/70 shadow-sm bg-card/40 backdrop-blur-md animate-rise">
          <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between pb-2">
            <div>
              <CardTitle className="text-lg font-bold tracking-tight">Sales Trend</CardTitle>
              <CardDescription>
                {analytics?.salesTrend?.length
                  ? `${analytics.salesTrend.length} day${analytics.salesTrend.length > 1 ? "s" : ""} of data`
                  : "Revenue over time"}
              </CardDescription>
            </div>
            <Badge variant="soft" className="text-xs bg-primary/5 text-primary border-primary/20 w-fit">
              <BarChart3 className="h-3 w-3 mr-1" />
              {query.from ? "Custom Range" : "Live"}
            </Badge>
          </CardHeader>
          <CardContent className="h-60 pt-4">
            {analyticsLoading ? (
              <div className="flex items-end gap-1 h-full px-2">
                {Array.from({ length: 12 }).map((_, i) => (
                  <Skeleton
                    key={i}
                    className="flex-1 rounded-sm"
                    style={{ height: `${20 + Math.random() * 70}%` }}
                  />
                ))}
              </div>
            ) : analytics?.salesTrend?.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={analytics.salesTrend} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorSalesTrend" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--color-primary)" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border)" opacity={0.3} />
                  <XAxis
                    dataKey="date"
                    stroke="var(--color-muted-foreground)"
                    opacity={0.6}
                    fontSize={10}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(d) => {
                      const parts = d.split("-");
                      return `${parts[2]}/${parts[1]}`;
                    }}
                  />
                  <YAxis
                    stroke="var(--color-muted-foreground)"
                    opacity={0.5}
                    fontSize={10}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(v) => formatCurrency(v, currency)}
                  />
                  <Tooltip content={<CustomTooltip currency={currency} />} />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    name="Revenue"
                    stroke="var(--color-primary)"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#colorSalesTrend)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <BarChart3 className="h-10 w-10 text-muted-foreground/20 mb-2" />
                <p className="text-sm font-semibold text-muted-foreground">No sales data</p>
                <p className="text-xs text-muted-foreground/60">Start billing to see trends here</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-border/70 shadow-sm bg-card/40 backdrop-blur-md animate-rise">
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

      {/* ═══ TOP SELLING: CATEGORIES & PRODUCTS ═══ */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <TrendingUp className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-bold tracking-tight">Top Selling</h2>
          <Badge variant="soft" className="text-[10px]">By Quantity Sold</Badge>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <AnalyticsSection
            title="Categories"
            description="Highest/lowest selling categories"
            icon={Layers}
            items={analytics?.topSellingCategories?.items || []}
            total={analytics?.topSellingCategories?.total || 0}
            page={topCatPage}
            limit={LIMIT}
            sort={topCatSort}
            onSortToggle={() => { setTopCatSort(s => s === "desc" ? "asc" : "desc"); setTopCatPage(1); }}
            onPageChange={setTopCatPage}
            isLoading={analyticsLoading}
            chartDataKey="totalQty"
            chartLabel="Units Sold"
            gradientId="gradTopCat"
            barColor="#6366f1"
            renderRow={(item: CategoryItem, i: number) => (
              <div key={item.categoryId || i} className="flex items-center gap-2 sm:gap-2.5 rounded-lg px-2 py-1.5 hover:bg-muted/30 transition-colors">
                <span className="text-base leading-none hidden sm:inline">{item.icon}</span>
                <span className="flex-1 text-xs font-semibold truncate min-w-0">{item.name}</span>
                <span className="text-[11px] font-bold tabular-nums text-primary shrink-0">{formatNumber(item.totalQty)} qty</span>
                <span className="text-[10px] text-muted-foreground tabular-nums shrink-0 hidden sm:inline">{formatCurrency(item.totalRevenue, currency)}</span>
              </div>
            )}
          />
          <AnalyticsSection
            title="Products"
            description="Highest/lowest selling products"
            icon={Package}
            items={analytics?.topSellingProducts?.items || []}
            total={analytics?.topSellingProducts?.total || 0}
            page={topProdPage}
            limit={LIMIT}
            sort={topProdSort}
            onSortToggle={() => { setTopProdSort(s => s === "desc" ? "asc" : "desc"); setTopProdPage(1); }}
            onPageChange={setTopProdPage}
            isLoading={analyticsLoading}
            chartDataKey="totalQty"
            chartLabel="Units Sold"
            gradientId="gradTopProd"
            barColor="#8b5cf6"
            renderRow={(item: ProductItem, i: number) => (
              <div key={item.productId || i} className="flex items-center gap-2 sm:gap-2.5 rounded-lg px-2 py-1.5 hover:bg-muted/30 transition-colors">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-primary/10 text-[10px] font-bold text-primary">
                  {i + 1}
                </span>
                <span className="flex-1 text-xs font-semibold truncate min-w-0">{item.name}</span>
                <span className="text-[11px] font-bold tabular-nums text-violet-600 dark:text-violet-400 shrink-0">{formatNumber(item.totalQty)} qty</span>
                <span className="text-[10px] text-muted-foreground tabular-nums shrink-0 hidden sm:inline">{formatCurrency(item.totalRevenue, currency)}</span>
              </div>
            )}
          />
        </div>
      </div>

      {/* ═══ REVENUE: CATEGORIES & PRODUCTS ═══ */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <TrendingUp className="h-5 w-5 text-emerald-500" />
          <h2 className="text-lg font-bold tracking-tight">Revenue Analytics</h2>
          <Badge variant="soft" className="text-[10px]">By Revenue Generated</Badge>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <AnalyticsSection
            title="Categories"
            description="Highest/lowest revenue categories"
            icon={Layers}
            items={analytics?.revenueByCategory?.items || []}
            total={analytics?.revenueByCategory?.total || 0}
            page={revCatPage}
            limit={LIMIT}
            sort={revCatSort}
            onSortToggle={() => { setRevCatSort(s => s === "desc" ? "asc" : "desc"); setRevCatPage(1); }}
            onPageChange={setRevCatPage}
            isLoading={analyticsLoading}
            chartDataKey="totalRevenue"
            chartLabel="Revenue"
            gradientId="gradRevCat"
            barColor="#22c55e"
            renderRow={(item: CategoryItem, i: number) => (
              <div key={item.categoryId || i} className="flex items-center gap-2 sm:gap-2.5 rounded-lg px-2 py-1.5 hover:bg-muted/30 transition-colors">
                <span className="text-base leading-none hidden sm:inline">{item.icon}</span>
                <span className="flex-1 text-xs font-semibold truncate min-w-0">{item.name}</span>
                <span className="text-[11px] font-bold tabular-nums text-emerald-600 dark:text-emerald-400 shrink-0">{formatCurrency(item.totalRevenue, currency)}</span>
                <span className="text-[10px] text-muted-foreground tabular-nums shrink-0 hidden sm:inline">{formatNumber(item.totalQty)} qty</span>
              </div>
            )}
          />
          <AnalyticsSection
            title="Products"
            description="Highest/lowest revenue products"
            icon={Package}
            items={analytics?.revenueByProduct?.items || []}
            total={analytics?.revenueByProduct?.total || 0}
            page={revProdPage}
            limit={LIMIT}
            sort={revProdSort}
            onSortToggle={() => { setRevProdSort(s => s === "desc" ? "asc" : "desc"); setRevProdPage(1); }}
            onPageChange={setRevProdPage}
            isLoading={analyticsLoading}
            chartDataKey="totalRevenue"
            chartLabel="Revenue"
            gradientId="gradRevProd"
            barColor="#14b8a6"
            renderRow={(item: ProductItem, i: number) => (
              <div key={item.productId || i} className="flex items-center gap-2 sm:gap-2.5 rounded-lg px-2 py-1.5 hover:bg-muted/30 transition-colors">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-emerald-500/10 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                  {i + 1}
                </span>
                <span className="flex-1 text-xs font-semibold truncate min-w-0">{item.name}</span>
                <span className="text-[11px] font-bold tabular-nums text-teal-600 dark:text-teal-400 shrink-0">{formatCurrency(item.totalRevenue, currency)}</span>
                <span className="text-[10px] text-muted-foreground tabular-nums shrink-0 hidden sm:inline">{formatNumber(item.orderCount)} orders</span>
              </div>
            )}
          />
        </div>
      </div>

      {/* ═══ LOW STOCK ═══ */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <AlertTriangle className="h-5 w-5 text-amber-500" />
          <h2 className="text-lg font-bold tracking-tight">Low Stock Alerts</h2>
          <Badge variant="warning" className="text-[10px]">
            {analytics?.lowStockProducts?.total || 0} items
          </Badge>
        </div>
        <div className="grid gap-4 lg:grid-cols-3">
          {/* Low Stock Products */}
          <Card className="lg:col-span-2 border-border/70 shadow-sm bg-card/40 backdrop-blur-md animate-rise">
            <CardHeader className="pb-1">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-500/10 text-amber-500">
                    <Package className="h-4 w-4" />
                  </div>
                  <div>
                    <CardTitle className="text-sm font-bold tracking-tight">Products Below Threshold</CardTitle>
                    <CardDescription className="text-[11px]">Items needing restock — sorted by severity</CardDescription>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="relative flex-1 sm:flex-initial">
                    <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-muted-foreground" />
                    <Input
                      placeholder="Search product..."
                      className="h-8 w-full sm:w-[150px] pl-8 text-xs bg-background/50 border-border/60 focus-visible:ring-1"
                      value={lowStockSearch}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                        setLowStockSearch(e.target.value);
                        setLowStockPage(1);
                      }}
                    />
                  </div>
                  <MiniPagination
                    page={lowStockPage}
                    totalPages={lowStockTotalPages}
                    onPrev={() => setLowStockPage(p => p - 1)}
                    onNext={() => setLowStockPage(p => p + 1)}
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-1 pb-3 px-3">
              {analyticsLoading ? (
                <TableSkeleton rows={LOW_STOCK_LIMIT} />
              ) : !analytics?.lowStockProducts?.items?.length ? (
                <div className="flex flex-col items-center justify-center py-10 text-center">
                  <Package className="h-8 w-8 text-emerald-500/40 mb-2" />
                  <p className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">All stocked up! 🎉</p>
                  <p className="text-xs text-muted-foreground/70 mt-0.5">No products are below their threshold</p>
                </div>
              ) : (
                <div className="space-y-1 mt-2">
                  {analytics.lowStockProducts.items.map((item) => {
                    const severity = stockSeverity(item.stockPercent);
                    return (
                      <div
                        key={item.productId}
                        className={cn(
                          "flex items-center gap-2 sm:gap-3 rounded-lg px-2 sm:px-2.5 py-2 transition-colors",
                          severity.bg
                        )}
                      >
                        <span className="text-sm leading-none hidden sm:inline">{item.categoryIcon}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold truncate">{item.name}</p>
                          <p className="text-[10px] text-muted-foreground truncate">
                            {item.categoryName} • {item.sku || "No SKU"} • {item.unit}
                          </p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className={cn("text-xs font-bold tabular-nums", severity.text)}>
                            {item.onHandQty} / {item.lowStockThreshold}
                          </p>
                          <p className={cn("text-[10px] font-semibold", severity.text)}>
                            {severity.label}
                          </p>
                        </div>
                        {/* Progress bar — hidden on very small screens */}
                        <div className="w-12 h-1.5 rounded-full bg-muted/30 overflow-hidden shrink-0 hidden sm:block">
                          <div
                            className={cn(
                              "h-full rounded-full transition-all",
                              item.stockPercent <= 0 ? "bg-red-500" :
                              item.stockPercent <= 30 ? "bg-red-400" :
                              item.stockPercent <= 60 ? "bg-amber-400" : "bg-yellow-400"
                            )}
                            style={{ width: `${Math.max(Math.min(item.stockPercent, 100), 3)}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                  <div className="mt-2 text-[10px] text-muted-foreground/60 text-right">
                    Showing {analytics.lowStockProducts.items.length} of {analytics.lowStockProducts.total}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Low Stock Categories Summary */}
          <Card className="border-border/70 shadow-sm bg-card/40 backdrop-blur-md animate-rise">
            <CardHeader className="pb-1">
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-500/10 text-amber-500">
                    <Layers className="h-4 w-4" />
                  </div>
                  <div>
                    <CardTitle className="text-sm font-bold tracking-tight">By Category</CardTitle>
                    <CardDescription className="text-[11px]">Low-stock items grouped</CardDescription>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-muted-foreground" />
                    <Input
                      placeholder="Search category..."
                      className="h-8 w-full pl-8 text-xs bg-background/50 border-border/60 focus-visible:ring-1"
                      value={lowStockCatSearch}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                        setLowStockCatSearch(e.target.value);
                        setLowStockCatPage(1);
                      }}
                    />
                  </div>
                  <MiniPagination
                    page={lowStockCatPage}
                    totalPages={lowStockCatTotalPages}
                    onPrev={() => setLowStockCatPage(p => p - 1)}
                    onNext={() => setLowStockCatPage(p => p + 1)}
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-1 pb-3 px-3">
              {analyticsLoading ? (
                <TableSkeleton rows={5} />
              ) : !analytics?.lowStockCategories?.items?.length ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <Layers className="h-8 w-8 text-emerald-500/40 mb-2" />
                  <p className="text-sm font-semibold text-muted-foreground">No categories affected</p>
                </div>
              ) : (
                <div className="space-y-1 mt-2">
                  {analytics.lowStockCategories.items.map((cat) => (
                    <div
                      key={cat.categoryId || "uncategorized"}
                      className="flex items-center gap-2.5 rounded-lg px-2 py-1.5 hover:bg-muted/30 transition-colors"
                    >
                      <span className="text-base leading-none">{cat.icon}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold truncate">{cat.name}</p>
                        <p className="text-[10px] text-muted-foreground">
                          {cat.criticalCount > 0 && (
                            <span className="text-red-500 font-bold">{cat.criticalCount} out of stock • </span>
                          )}
                          {cat.count} low items
                        </p>
                      </div>
                      <Badge
                        variant={cat.criticalCount > 0 ? "danger" : "warning"}
                        className="text-[10px] px-1.5 py-0.5"
                      >
                        {cat.count}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* ═══ GST & CREDIT SECTION ═══ */}
      <section className="grid gap-4 md:grid-cols-2">
        {hasGstInvoices && (
          <Card className="border-border/70 shadow-sm bg-card/40 backdrop-blur-md animate-rise">
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
                    <span className="font-bold text-foreground">{formatCurrency(summary?.gstCollectedToday ?? 0, currency)}</span>
                  </div>
                  {(summary?.igstToday ?? 0) > 0 && (
                    <div className="flex justify-between text-amber-700 dark:text-amber-500 font-medium">
                      <span>IGST (inter-state)</span>
                      <span className="font-bold">{formatCurrency(summary?.igstToday ?? 0, currency)}</span>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {hasCreditKhata && (
          <Card className="border-border/70 shadow-sm bg-card/40 backdrop-blur-md animate-rise">
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
                    <span className="font-bold text-warning">{formatCurrency(summary?.totalCreditOutstanding ?? 0, currency)}</span>
                  </div>
                  <div className="flex justify-between border-b border-border/40 pb-1.5">
                    <span className="text-muted-foreground font-medium">Customers with due</span>
                    <span className="font-bold text-foreground">{summary?.customersWithDue ?? 0} / {summary?.totalCustomers ?? 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground font-medium">Credit issued today</span>
                    <span className="font-bold text-foreground">{formatCurrency(summary?.creditIssuedToday ?? 0, currency)}</span>
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

  if (!token) return null;

  return <DashboardHome token={token} outletId={outletId} />;
}
