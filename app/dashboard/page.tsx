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
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
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
  ArrowUpRight,
  Sparkles,
  Zap,
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

// ─── Types ──────────────────────────────────────────────────────────
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

// ─── Visual Palette ──────────────────────────────────────────────────
const CHART_COLORS = [
  "#3b82f6", "#10b981", "#8b5cf6", "#f59e0b", "#ec4899",
  "#06b6d4", "#f97316", "#6366f1", "#14b8a6", "#84cc16",
];

// ─── Quick Presets Helper ───────────────────────────────────────────
function getPresetRange(preset: "today" | "yesterday" | "7d" | "30d" | "this_month") {
  const now = new Date();
  const startOfDay = (d: Date) => {
    const res = new Date(d);
    res.setHours(0, 0, 0, 0);
    return res;
  };
  const endOfDay = (d: Date) => {
    const res = new Date(d);
    res.setHours(23, 59, 59, 999);
    return res;
  };

  if (preset === "today") {
    return {
      from: startOfDay(now).toISOString(),
      to: endOfDay(now).toISOString(),
    };
  }
  if (preset === "yesterday") {
    const yest = new Date(now);
    yest.setDate(yest.getDate() - 1);
    return {
      from: startOfDay(yest).toISOString(),
      to: endOfDay(yest).toISOString(),
    };
  }
  if (preset === "7d") {
    const past7 = new Date(now);
    past7.setDate(past7.getDate() - 6);
    return {
      from: startOfDay(past7).toISOString(),
      to: endOfDay(now).toISOString(),
    };
  }
  if (preset === "30d") {
    const past30 = new Date(now);
    past30.setDate(past30.getDate() - 29);
    return {
      from: startOfDay(past30).toISOString(),
      to: endOfDay(now).toISOString(),
    };
  }
  if (preset === "this_month") {
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    return {
      from: startOfDay(firstDay).toISOString(),
      to: endOfDay(now).toISOString(),
    };
  }
  return { from: "", to: "" };
}

// ─── Pagination Controls ─────────────────────────────────────────────
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
    <div className="flex items-center gap-1 text-xs">
      <Button
        variant="ghost"
        size="icon"
        className="h-6 w-6 rounded-md hover:bg-muted cursor-pointer"
        disabled={page <= 1}
        onClick={onPrev}
      >
        <ChevronLeft className="h-3.5 w-3.5" />
      </Button>
      <span className="font-mono text-[11px] text-muted-foreground tabular-nums px-1">
        {page}/{totalPages}
      </span>
      <Button
        variant="ghost"
        size="icon"
        className="h-6 w-6 rounded-md hover:bg-muted cursor-pointer"
        disabled={page >= totalPages}
        onClick={onNext}
      >
        <ChevronRight className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
}

// ─── Sort Toggle Button ──────────────────────────────────────────────
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
      className="h-6 w-6 rounded-md hover:bg-muted cursor-pointer transition-colors"
      onClick={onToggle}
      title={sort === "desc" ? "Showing highest first" : "Showing lowest first"}
    >
      {sort === "desc" ? (
        <ArrowDown className="h-3 w-3 text-primary" />
      ) : (
        <ArrowUp className="h-3 w-3 text-amber-500" />
      )}
    </Button>
  );
}

// ─── Skeletons ───────────────────────────────────────────────────────
function ChartSkeleton() {
  return (
    <div className="flex items-end gap-2 h-44 px-2 pt-4">
      {[0.4, 0.7, 0.55, 0.85, 0.6, 0.45].map((h, i) => (
        <Skeleton
          key={i}
          className="flex-1 rounded-sm"
          style={{ height: `${h * 100}%` }}
        />
      ))}
    </div>
  );
}

function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-2 mt-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-2.5">
          <Skeleton className="h-4 w-4 rounded" />
          <Skeleton className="h-4 flex-1 rounded" />
          <Skeleton className="h-4 w-16 rounded" />
        </div>
      ))}
    </div>
  );
}

// ─── Severity Color for Stock ────────────────────────────────────────
function stockSeverity(stockPercent: number) {
  if (stockPercent <= 0) {
    return {
      bg: "bg-red-500/10 border-red-500/25",
      text: "text-red-600 dark:text-red-400",
      badge: "bg-red-500/15 text-red-700 dark:text-red-300 border-red-500/30",
      label: "Out of stock",
    };
  }
  if (stockPercent <= 30) {
    return {
      bg: "bg-rose-500/10 border-rose-500/20",
      text: "text-rose-600 dark:text-rose-400",
      badge: "bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30",
      label: "Critical",
    };
  }
  if (stockPercent <= 60) {
    return {
      bg: "bg-amber-500/10 border-amber-500/20",
      text: "text-amber-600 dark:text-amber-400",
      badge: "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30",
      label: "Low Stock",
    };
  }
  return {
    bg: "bg-yellow-500/10 border-yellow-500/20",
    text: "text-yellow-600 dark:text-yellow-400",
    badge: "bg-yellow-500/15 text-yellow-700 dark:text-yellow-300 border-yellow-500/30",
    label: "Warning",
  };
}

// ─── Custom Tooltip ──────────────────────────────────────────────────
function CustomTooltip({ active, payload, label, currency = "" }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-border/80 bg-popover/95 backdrop-blur-md px-3 py-2 shadow-md text-xs">
      <p className="font-semibold text-popover-foreground mb-1">{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} className="text-muted-foreground flex items-center gap-1.5 font-mono">
          <span className="inline-block h-2 w-2 rounded-full" style={{ backgroundColor: p.color }} />
          <span>{p.name}:</span>
          <span className="font-bold text-popover-foreground">
            {currency ? formatCurrency(p.value, currency) : formatNumber(p.value)}
          </span>
        </p>
      ))}
    </div>
  );
}

// ─── Generic Ranking Section (Bar Chart + List) ──────────────────────
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
  const color = barColor || "#3b82f6";

  return (
    <Card className="border-border/80 shadow-2xs bg-card/60 backdrop-blur-sm overflow-hidden flex flex-col justify-between">
      <div>
        <CardHeader className="p-3.5 pb-2 border-b border-border/50">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                <Icon className="h-3.5 w-3.5" />
              </div>
              <div className="min-w-0">
                <CardTitle className="text-xs font-bold tracking-tight truncate">{title}</CardTitle>
                <CardDescription className="text-[10px] text-muted-foreground truncate">{description}</CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-1 shrink-0">
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
        <CardContent className="p-3.5 pt-2">
          {isLoading ? (
            <>
              <ChartSkeleton />
              <TableSkeleton rows={limit} />
            </>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <Icon className="h-7 w-7 text-muted-foreground/30 mb-1.5" />
              <p className="text-xs font-semibold text-muted-foreground">No data for selected period</p>
              <p className="text-[10px] text-muted-foreground/70">Adjust the date filters to inspect sales</p>
            </div>
          ) : (
            <>
              {/* Bar Chart Visualizer */}
              <div className="h-36 -mx-1">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={items} margin={{ top: 8, right: 6, left: -22, bottom: 0 }}>
                    <defs>
                      <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={color} stopOpacity={0.85} />
                        <stop offset="95%" stopColor={color} stopOpacity={0.25} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border)" opacity={0.25} />
                    <XAxis
                      dataKey="name"
                      stroke="var(--color-muted-foreground)"
                      opacity={0.6}
                      fontSize={9}
                      tickLine={false}
                      axisLine={false}
                      interval={0}
                      tick={({ x, y, payload }: any) => (
                        <text x={x} y={y + 8} textAnchor="middle" fill="var(--color-muted-foreground)" opacity={0.75} fontSize={8.5}>
                          {String(payload.value).length > 8 ? String(payload.value).slice(0, 7) + "…" : payload.value}
                        </text>
                      )}
                    />
                    <YAxis
                      stroke="var(--color-muted-foreground)"
                      opacity={0.5}
                      fontSize={8.5}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(v) => chartDataKey === "totalRevenue" ? formatCurrency(v, currency) : formatNumber(v)}
                    />
                    <Tooltip content={<CustomTooltip currency={chartDataKey === "totalRevenue" ? currency : ""} />} />
                    <Bar dataKey={chartDataKey} name={chartLabel} radius={[3, 3, 0, 0]} maxBarSize={32}>
                      {items.map((_: any, i: number) => (
                        <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} fillOpacity={0.85} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Table Rows */}
              <div className="mt-2.5 space-y-1">
                {items.map((item: any, i: number) => renderRow(item, i))}
              </div>
            </>
          )}
        </CardContent>
      </div>
      <div className="px-3.5 py-1.5 border-t border-border/50 flex items-center justify-between text-[10px] text-muted-foreground/70 bg-muted/20">
        <span>Showing {items.length} of {total}</span>
        <span>{sort === "desc" ? "Highest rank first" : "Lowest rank first"}</span>
      </div>
    </Card>
  );
}

// ─── Main Dashboard Home Component ───────────────────────────────────
function DashboardHome({ token, outletId }: { token: string; outletId: string | null }) {
  const { user } = useAuth();
  const currency = user?.currency || "INR";
  const hasCreditKhata = useFeature("credit_khata");
  const hasGstInvoices = useFeature("gst_invoices");
  const hasWholesale = useFeature("wholesale_billing");

  // Global date range from query params
  const [query, setQuery] = useQueryStates({
    from: parseAsString.withDefault(""),
    to: parseAsString.withDefault(""),
  });

  // Sales Trend chart view mode: revenue vs orders
  const [trendView, setTrendView] = React.useState<"revenue" | "orders">("revenue");

  // Section-specific pagination & sort
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
  const LOW_STOCK_LIMIT = 6;

  // Summary query
  const { data: summaryData, isLoading: summaryLoading, isFetching: summaryFetching, refetch: refetchSummary } = useQuery({
    queryKey: ["reports-summary", outletId, query.from, query.to],
    queryFn: () =>
      getJson<SummaryData>("/reports/summary", token, {
        outletId: outletId ?? undefined,
        from: query.from || undefined,
        to: query.to || undefined,
      }),
    enabled: Boolean(token),
  });

  // Analytics query
  const { data: analyticsRaw, isLoading: analyticsLoading, isFetching: analyticsFetching, refetch: refetchAnalytics } = useQuery({
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
  const isRefreshing = summaryFetching || analyticsFetching;

  const refetch = React.useCallback(() => {
    refetchSummary();
    refetchAnalytics();
  }, [refetchSummary, refetchAnalytics]);

  // Reset pagination when date filter changes
  React.useEffect(() => {
    setTopCatPage(1);
    setTopProdPage(1);
    setRevCatPage(1);
    setRevProdPage(1);
    setLowStockPage(1);
  }, [query.from, query.to]);

  // Quick Command Deck
  const quickActions = React.useMemo(() => [
    {
      href: APP_ROUTES.BILLING,
      label: "New Bill (POS)",
      subtext: "Barcode or manual sales",
      icon: ReceiptText,
      primary: true,
      tag: "POS",
    },
    {
      href: APP_ROUTES.STOCK,
      label: "Stock & Inventory",
      subtext: "Batches, counts & alerts",
      icon: Package,
      primary: false,
    },
    ...(hasCreditKhata ? [{
      href: APP_ROUTES.CUSTOMERS,
      label: "Customer Khata",
      subtext: "Udhar & ledger collection",
      icon: UserCircle,
      primary: false,
    }] : []),
    ...(hasGstInvoices ? [{
      href: APP_ROUTES.INVOICES,
      label: "GST Tax Invoices",
      subtext: "B2B & B2C tax receipts",
      icon: FileText,
      primary: false,
    }] : []),
    {
      href: APP_ROUTES.ORDERS,
      label: "Order History",
      subtext: "Recent receipts & logs",
      icon: History,
      primary: false,
    },
  ], [hasCreditKhata, hasGstInvoices]);

  const lowStockTotalPages = Math.ceil((analytics?.lowStockProducts?.total || 0) / LOW_STOCK_LIMIT) || 1;
  const lowStockCatTotalPages = Math.ceil((analytics?.lowStockCategories?.total || 0) / LOW_STOCK_LIMIT) || 1;

  // Trend aggregates
  const trendPoints = analytics?.salesTrend || [];
  const totalTrendRevenue = trendPoints.reduce((acc, p) => acc + (p.revenue || 0), 0);
  const totalTrendOrders = trendPoints.reduce((acc, p) => acc + (p.orders || 0), 0);
  const peakDayRevenue = trendPoints.length ? Math.max(...trendPoints.map(p => p.revenue || 0)) : 0;

  return (
    <div className="space-y-4 animate-in fade-in duration-300 w-full">
      {/* ── 1. HEADER & STORE PULSE BAR ─────────────────────────────────── */}
      <div className="flex flex-col gap-3 rounded-xl border border-border/80 bg-card p-3 sm:p-3.5 shadow-2xs">
        <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-base sm:text-lg font-bold tracking-tight text-foreground sm:text-xl">
                {user?.businessName || "Store Operations Dashboard"}
              </h1>
              <Badge variant="outline" className="text-[10px] bg-primary/10 text-primary border-primary/20 shrink-0">
                {user?.businessProfile ? `${user.businessProfile.toUpperCase()} PLAN` : "STORE PORTAL"}
              </Badge>
              {query.from || query.to ? (
                <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20">
                  Custom Date Filter Active
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" /> Live Pulse: Today
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-0.5 hidden sm:block">
              Real-time sales, inventory alerts, and tax pulse for your store.
            </p>
          </div>

          {/* Quick Date Presets & Custom Picker */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1 bg-muted/40 p-0.5 rounded-lg border border-border/60">
              <button
                type="button"
                onClick={() => setQuery({ from: "", to: "" })}
                className={cn(
                  "px-2.5 py-1 text-[11px] font-semibold rounded-md transition-colors cursor-pointer",
                  !query.from && !query.to
                    ? "bg-background text-foreground shadow-xs border border-border/80"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                Today
              </button>
              <button
                type="button"
                onClick={() => setQuery(getPresetRange("yesterday"))}
                className="px-2.5 py-1 text-[11px] font-semibold rounded-md text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              >
                Yesterday
              </button>
              <button
                type="button"
                onClick={() => setQuery(getPresetRange("7d"))}
                className="px-2.5 py-1 text-[11px] font-semibold rounded-md text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              >
                7 Days
              </button>
              <button
                type="button"
                onClick={() => setQuery(getPresetRange("this_month"))}
                className="px-2.5 py-1 text-[11px] font-semibold rounded-md text-muted-foreground hover:text-foreground transition-colors cursor-pointer hidden md:inline-block"
              >
                This Month
              </button>
            </div>

            <div className="flex items-center gap-1.5">
              <JollyDateRangePicker
                label="Custom Date Range"
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
                  className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-md cursor-pointer"
                  title="Clear date filter"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => refetch()}
                disabled={isRefreshing}
                className="h-8 px-2.5 text-xs font-semibold gap-1.5 cursor-pointer hover:bg-muted/60"
                title="Refresh dashboard data"
              >
                <RefreshCw className={cn("h-3.5 w-3.5", isRefreshing && "animate-spin text-primary")} />
                <span className="hidden sm:inline">Sync</span>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* ── 2. FINANCIAL & OPERATIONAL PULSE (KPI STRIP) ────────────────── */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          label={query.from || query.to ? "Sales in Period" : "Gross Sales Today"}
          value={isLoading ? "…" : formatCurrency(summary?.totalSalesToday ?? 0, currency, "en-IN", true)}
          fullValue={isLoading ? undefined : formatCurrency(summary?.totalSalesToday ?? 0, currency)}
          hint={`${formatNumber(summary?.totalOrdersToday ?? 0)} completed orders`}
          icon={<TrendingUp />}
          color="primary"
        />

        {hasGstInvoices ? (
          <StatsCard
            label={query.from || query.to ? "GST Tax Collected" : "GST Collected Today"}
            value={isLoading ? "…" : formatCurrency(summary?.gstCollectedToday ?? 0, currency, "en-IN", true)}
            fullValue={isLoading ? undefined : formatCurrency(summary?.gstCollectedToday ?? 0, currency)}
            hint={
              (summary?.igstToday ?? 0) > 0
                ? `IGST: ${formatCurrency(summary?.igstToday ?? 0, currency)}`
                : `CGST + SGST: ${formatCurrency(summary?.cgstSgstToday ?? 0, currency)}`
            }
            icon={<Receipt />}
            color="success"
          />
        ) : (
          <StatsCard
            label={query.from || query.to ? "Total Orders" : "Orders Today"}
            value={isLoading ? "…" : formatNumber(summary?.totalOrdersToday ?? 0, "en-IN", true)}
            fullValue={isLoading ? undefined : formatNumber(summary?.totalOrdersToday ?? 0)}
            hint="Customer receipts generated"
            icon={<ShoppingBag />}
            color="default"
          />
        )}

        {hasCreditKhata && (
          <StatsCard
            label="Customer Khata Due"
            value={isLoading ? "…" : formatCurrency(summary?.totalCreditOutstanding ?? 0, currency, "en-IN", true)}
            fullValue={isLoading ? undefined : formatCurrency(summary?.totalCreditOutstanding ?? 0, currency)}
            hint={`${summary?.customersWithDue ?? 0} customers with pending balance`}
            icon={<Wallet />}
            color="warning"
          />
        )}

        {hasWholesale && (
          <StatsCard
            label={query.from || query.to ? "Wholesale Billing" : "Wholesale Sales Today"}
            value={isLoading ? "…" : formatCurrency(summary?.wholesaleSalesToday ?? 0, currency, "en-IN", true)}
            fullValue={isLoading ? undefined : formatCurrency(summary?.wholesaleSalesToday ?? 0, currency)}
            hint={`Credit issued: ${formatCurrency(summary?.creditIssuedToday ?? 0, currency, "en-IN", true)}`}
            icon={<Store />}
            color="purple"
          />
        )}

        {!hasCreditKhata && !hasWholesale && (
          <StatsCard
            label="Inventory Items"
            value={isLoading ? "…" : formatNumber(analytics?.lowStockProducts?.total ?? 0)}
            fullValue={isLoading ? undefined : formatNumber(analytics?.lowStockProducts?.total ?? 0)}
            hint="Products below reorder threshold"
            icon={<AlertTriangle />}
            color="warning"
          />
        )}
      </div>

      {/* ── 3. SALES TRENDS & OPERATIONS COMMAND DECK ───────────────────── */}
      <div className="grid gap-3.5 lg:grid-cols-12 items-start">
        {/* Sales Trend Chart (8 Cols) */}
        <Card className="lg:col-span-8 border-border/80 shadow-2xs bg-card/60 backdrop-blur-sm overflow-hidden">
          <CardHeader className="p-3.5 pb-2 border-b border-border/50">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                  <BarChart3 className="h-3.5 w-3.5" />
                </div>
                <div>
                  <CardTitle className="text-xs font-bold tracking-tight flex items-center gap-1.5">
                    Sales Trend &amp; Revenue Pulse
                    <Badge variant="outline" className="text-[9px] bg-primary/10 text-primary border-primary/20">
                      {trendPoints.length ? `${trendPoints.length} Days` : "Active"}
                    </Badge>
                  </CardTitle>
                  <CardDescription className="text-[10px] text-muted-foreground">
                    Historical volume and revenue trajectory
                  </CardDescription>
                </div>
              </div>

              {/* View Switcher: Revenue vs Orders */}
              <div className="flex items-center gap-1.5 self-end sm:self-auto">
                <div className="flex items-center bg-muted/40 p-0.5 rounded-md border border-border/60">
                  <button
                    type="button"
                    onClick={() => setTrendView("revenue")}
                    className={cn(
                      "px-2 py-0.5 text-[10px] font-semibold rounded transition-colors cursor-pointer",
                      trendView === "revenue"
                        ? "bg-background text-foreground shadow-xs font-bold"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    Revenue ({currency})
                  </button>
                  <button
                    type="button"
                    onClick={() => setTrendView("orders")}
                    className={cn(
                      "px-2 py-0.5 text-[10px] font-semibold rounded transition-colors cursor-pointer",
                      trendView === "orders"
                        ? "bg-background text-foreground shadow-xs font-bold"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    Orders (Qty)
                  </button>
                </div>
              </div>
            </div>

            {/* Quick Metrics Strip on top of chart */}
            {trendPoints.length > 0 && (
              <div className="flex items-center gap-3 pt-2 text-[11px] text-muted-foreground font-mono flex-wrap">
                <div>
                  Period Total: <span className="font-bold text-foreground">{formatCurrency(totalTrendRevenue, currency)}</span>
                </div>
                <div>
                  Orders: <span className="font-bold text-foreground">{formatNumber(totalTrendOrders)}</span>
                </div>
                <div className="hidden sm:inline">
                  Peak Day: <span className="font-bold text-emerald-600 dark:text-emerald-400">{formatCurrency(peakDayRevenue, currency)}</span>
                </div>
              </div>
            )}
          </CardHeader>

          <CardContent className="p-3.5 pt-3">
            {analyticsLoading ? (
              <div className="flex items-end gap-1.5 h-56 px-2">
                {Array.from({ length: 12 }).map((_, i) => (
                  <Skeleton key={i} className="flex-1 rounded-sm" style={{ height: `${20 + (i % 5) * 15}%` }} />
                ))}
              </div>
            ) : trendPoints.length ? (
              <div className="h-56 -mx-1">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={trendPoints} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                    <defs>
                      <linearGradient id="areaGradientPrimary" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--color-primary)" stopOpacity={0.28} />
                        <stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0.02} />
                      </linearGradient>
                      <linearGradient id="areaGradientOrders" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border)" opacity={0.25} />
                    <XAxis
                      dataKey="date"
                      stroke="var(--color-muted-foreground)"
                      opacity={0.6}
                      fontSize={9}
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
                      fontSize={8.5}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(v) => trendView === "revenue" ? formatCurrency(v, currency) : formatNumber(v)}
                    />
                    <Tooltip content={<CustomTooltip currency={trendView === "revenue" ? currency : ""} />} />
                    <Area
                      type="monotone"
                      dataKey={trendView === "revenue" ? "revenue" : "orders"}
                      name={trendView === "revenue" ? "Revenue" : "Completed Orders"}
                      stroke={trendView === "revenue" ? "var(--color-primary)" : "#10b981"}
                      strokeWidth={2}
                      fillOpacity={1}
                      fill={trendView === "revenue" ? "url(#areaGradientPrimary)" : "url(#areaGradientOrders)"}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-56 text-center">
                <BarChart3 className="h-9 w-9 text-muted-foreground/20 mb-2" />
                <p className="text-xs font-bold text-muted-foreground">No sales activity in this period</p>
                <p className="text-[11px] text-muted-foreground/70 mt-0.5">Start billing in POS to see revenue charts</p>
                <Link
                  href={APP_ROUTES.BILLING}
                  className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md bg-primary text-primary-foreground shadow-2xs hover:bg-primary/90"
                >
                  <ReceiptText className="h-3.5 w-3.5" /> Open POS Billing
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Command Deck (4 Cols) */}
        <Card className="lg:col-span-4 border-border/80 shadow-2xs bg-card/60 backdrop-blur-sm overflow-hidden">
          <CardHeader className="p-3.5 pb-2 border-b border-border/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-amber-500/10 text-amber-500">
                  <Zap className="h-3.5 w-3.5" />
                </div>
                <div>
                  <CardTitle className="text-xs font-bold tracking-tight">Store Command Deck</CardTitle>
                  <CardDescription className="text-[10px] text-muted-foreground">
                    Instant access to daily store tasks
                  </CardDescription>
                </div>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-3.5 space-y-2">
            {quickActions.map((action) => {
              const Icon = action.icon;
              return (
                <Link
                  key={action.href}
                  href={action.href}
                  className={cn(
                    "group flex items-center justify-between p-2.5 rounded-lg border transition-all duration-200 text-left cursor-pointer",
                    action.primary
                      ? "border-primary/40 bg-primary/5 hover:bg-primary/10 hover:border-primary/60 shadow-2xs"
                      : "border-border/60 bg-muted/20 hover:bg-muted/40 hover:border-border"
                  )}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span
                      className={cn(
                        "flex h-7 w-7 shrink-0 items-center justify-center rounded-md transition-transform group-hover:scale-105",
                        action.primary
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground group-hover:text-foreground"
                      )}
                    >
                      <Icon className="h-3.5 w-3.5" />
                    </span>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-foreground group-hover:text-primary transition-colors flex items-center gap-1.5">
                        {action.label}
                        {action.tag && (
                          <span className="text-[9px] font-mono uppercase px-1 py-0.2 rounded bg-primary/15 text-primary">
                            {action.tag}
                          </span>
                        )}
                      </p>
                      <p className="text-[10px] text-muted-foreground truncate">{action.subtext}</p>
                    </div>
                  </div>
                  <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all shrink-0 ml-1" />
                </Link>
              );
            })}
          </CardContent>
        </Card>
      </div>

      {/* ── 4. PRODUCT & CATEGORY PERFORMANCE DECK ──────────────────────── */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 pb-1">
          <div>
            <h2 className="text-sm font-bold text-foreground flex items-center gap-1.5">
              <TrendingUp className="h-4 w-4 text-primary" />
              Product &amp; Category Intelligence
            </h2>
            <p className="text-[11px] text-muted-foreground">
              Ranked breakdown of volume movers vs cashflow contributors
            </p>
          </div>
        </div>

        <Tabs defaultValue="volume" className="w-full">
          <TabsList className="bg-muted/40 p-1 border border-border/60 rounded-lg max-w-sm">
            <TabsTrigger value="volume" className="text-xs py-1 cursor-pointer font-semibold">
              By Quantity Sold (Units)
            </TabsTrigger>
            <TabsTrigger value="revenue" className="text-xs py-1 cursor-pointer font-semibold">
              By Revenue Generated ({currency})
            </TabsTrigger>
          </TabsList>

          {/* Tab 1: Volume View (Top Selling Categories & Products) */}
          <TabsContent value="volume" className="mt-3">
            <div className="grid gap-3.5 md:grid-cols-2">
              <AnalyticsSection
                title="Top Categories by Volume"
                description="Categories ranked by total units sold"
                icon={Layers}
                items={analytics?.topSellingCategories?.items || []}
                total={analytics?.topSellingCategories?.total || 0}
                page={topCatPage}
                limit={LIMIT}
                sort={topCatSort}
                onSortToggle={() => {
                  setTopCatSort((s) => (s === "desc" ? "asc" : "desc"));
                  setTopCatPage(1);
                }}
                onPageChange={setTopCatPage}
                isLoading={analyticsLoading}
                chartDataKey="totalQty"
                chartLabel="Units Sold"
                gradientId="gradTopCat"
                barColor="#3b82f6"
                renderRow={(item: CategoryItem, i: number) => (
                  <div
                    key={item.categoryId || i}
                    className="flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-muted/40 transition-colors text-xs"
                  >
                    <span className="text-sm shrink-0">{item.icon || "📦"}</span>
                    <span className="flex-1 font-semibold truncate min-w-0 text-foreground">{item.name}</span>
                    <span className="text-[11px] font-bold font-mono text-primary shrink-0">
                      {formatNumber(item.totalQty)} pcs
                    </span>
                    <span className="text-[10px] font-mono text-muted-foreground shrink-0 hidden sm:inline">
                      {formatCurrency(item.totalRevenue, currency)}
                    </span>
                  </div>
                )}
              />

              <AnalyticsSection
                title="Top Products by Volume"
                description="Products moving fastest off store shelves"
                icon={Package}
                items={analytics?.topSellingProducts?.items || []}
                total={analytics?.topSellingProducts?.total || 0}
                page={topProdPage}
                limit={LIMIT}
                sort={topProdSort}
                onSortToggle={() => {
                  setTopProdSort((s) => (s === "desc" ? "asc" : "desc"));
                  setTopProdPage(1);
                }}
                onPageChange={setTopProdPage}
                isLoading={analyticsLoading}
                chartDataKey="totalQty"
                chartLabel="Units Sold"
                gradientId="gradTopProd"
                barColor="#8b5cf6"
                renderRow={(item: ProductItem, i: number) => (
                  <div
                    key={item.productId || i}
                    className="flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-muted/40 transition-colors text-xs"
                  >
                    <span
                      className={cn(
                        "flex h-5 w-5 shrink-0 items-center justify-center rounded text-[10px] font-bold font-mono",
                        i === 0
                          ? "bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30"
                          : i === 1
                          ? "bg-slate-500/20 text-slate-700 dark:text-slate-300 border border-slate-500/30"
                          : i === 2
                          ? "bg-orange-500/20 text-orange-700 dark:text-orange-400 border border-orange-500/30"
                          : "bg-muted text-muted-foreground"
                      )}
                    >
                      {i + 1}
                    </span>
                    <span className="flex-1 font-semibold truncate min-w-0 text-foreground">{item.name}</span>
                    <span className="text-[11px] font-bold font-mono text-violet-600 dark:text-violet-400 shrink-0">
                      {formatNumber(item.totalQty)} pcs
                    </span>
                    <span className="text-[10px] font-mono text-muted-foreground shrink-0 hidden sm:inline">
                      {formatCurrency(item.totalRevenue, currency)}
                    </span>
                  </div>
                )}
              />
            </div>
          </TabsContent>

          {/* Tab 2: Revenue View (Revenue by Categories & Products) */}
          <TabsContent value="revenue" className="mt-3">
            <div className="grid gap-3.5 md:grid-cols-2">
              <AnalyticsSection
                title="Top Categories by Revenue"
                description="Categories contributing highest billing value"
                icon={Layers}
                items={analytics?.revenueByCategory?.items || []}
                total={analytics?.revenueByCategory?.total || 0}
                page={revCatPage}
                limit={LIMIT}
                sort={revCatSort}
                onSortToggle={() => {
                  setRevCatSort((s) => (s === "desc" ? "asc" : "desc"));
                  setRevCatPage(1);
                }}
                onPageChange={setRevCatPage}
                isLoading={analyticsLoading}
                chartDataKey="totalRevenue"
                chartLabel="Revenue"
                gradientId="gradRevCat"
                barColor="#10b981"
                renderRow={(item: CategoryItem, i: number) => (
                  <div
                    key={item.categoryId || i}
                    className="flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-muted/40 transition-colors text-xs"
                  >
                    <span className="text-sm shrink-0">{item.icon || "📦"}</span>
                    <span className="flex-1 font-semibold truncate min-w-0 text-foreground">{item.name}</span>
                    <span className="text-[11px] font-bold font-mono text-emerald-600 dark:text-emerald-400 shrink-0">
                      {formatCurrency(item.totalRevenue, currency)}
                    </span>
                    <span className="text-[10px] font-mono text-muted-foreground shrink-0 hidden sm:inline">
                      {formatNumber(item.totalQty)} pcs
                    </span>
                  </div>
                )}
              />

              <AnalyticsSection
                title="Top Products by Revenue"
                description="Products generating maximum gross turnover"
                icon={Package}
                items={analytics?.revenueByProduct?.items || []}
                total={analytics?.revenueByProduct?.total || 0}
                page={revProdPage}
                limit={LIMIT}
                sort={revProdSort}
                onSortToggle={() => {
                  setRevProdSort((s) => (s === "desc" ? "asc" : "desc"));
                  setRevProdPage(1);
                }}
                onPageChange={setRevProdPage}
                isLoading={analyticsLoading}
                chartDataKey="totalRevenue"
                chartLabel="Revenue"
                gradientId="gradRevProd"
                barColor="#06b6d4"
                renderRow={(item: ProductItem, i: number) => (
                  <div
                    key={item.productId || i}
                    className="flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-muted/40 transition-colors text-xs"
                  >
                    <span
                      className={cn(
                        "flex h-5 w-5 shrink-0 items-center justify-center rounded text-[10px] font-bold font-mono",
                        i === 0
                          ? "bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30"
                          : i === 1
                          ? "bg-slate-500/20 text-slate-700 dark:text-slate-300 border border-slate-500/30"
                          : i === 2
                          ? "bg-orange-500/20 text-orange-700 dark:text-orange-400 border border-orange-500/30"
                          : "bg-muted text-muted-foreground"
                      )}
                    >
                      {i + 1}
                    </span>
                    <span className="flex-1 font-semibold truncate min-w-0 text-foreground">{item.name}</span>
                    <span className="text-[11px] font-bold font-mono text-cyan-600 dark:text-cyan-400 shrink-0">
                      {formatCurrency(item.totalRevenue, currency)}
                    </span>
                    <span className="text-[10px] font-mono text-muted-foreground shrink-0 hidden sm:inline">
                      {formatNumber(item.orderCount)} orders
                    </span>
                  </div>
                )}
              />
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* ── 5. LOW STOCK & REORDER COMMAND HUB ───────────────────────────── */}
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-500" />
            <h2 className="text-sm font-bold text-foreground">
              Low Stock &amp; Inventory Reorder Hub
            </h2>
            <Badge variant="outline" className="text-[10px] bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20">
              {analytics?.lowStockProducts?.total || 0} Needing Action
            </Badge>
          </div>
          <Link
            href={APP_ROUTES.STOCK}
            className="text-xs font-semibold text-primary hover:underline inline-flex items-center gap-1 group"
          >
            Manage Stock <ArrowRight className="h-3 w-3 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>

        <div className="grid gap-3.5 lg:grid-cols-12 items-start">
          {/* Low Stock Products List (8 Cols) */}
          <Card className="lg:col-span-8 border-border/80 shadow-2xs bg-card/60 backdrop-blur-sm overflow-hidden">
            <CardHeader className="p-3.5 pb-2 border-b border-border/50">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-amber-500/10 text-amber-500">
                    <Package className="h-3.5 w-3.5" />
                  </div>
                  <div>
                    <CardTitle className="text-xs font-bold tracking-tight">Products Below Threshold</CardTitle>
                    <CardDescription className="text-[10px] text-muted-foreground">
                      Critical stock levels prioritized by stock percentage
                    </CardDescription>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                    <Input
                      placeholder="Search items..."
                      className="h-7 w-[140px] sm:w-[170px] pl-8 text-xs bg-muted/30 border-border/60"
                      value={lowStockSearch}
                      onChange={(e) => {
                        setLowStockSearch(e.target.value);
                        setLowStockPage(1);
                      }}
                    />
                  </div>
                  <MiniPagination
                    page={lowStockPage}
                    totalPages={lowStockTotalPages}
                    onPrev={() => setLowStockPage((p) => p - 1)}
                    onNext={() => setLowStockPage((p) => p + 1)}
                  />
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-3.5 pt-2">
              {analyticsLoading ? (
                <TableSkeleton rows={LOW_STOCK_LIMIT} />
              ) : !analytics?.lowStockProducts?.items?.length ? (
                <div className="flex flex-col items-center justify-center py-9 text-center">
                  <div className="h-9 w-9 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-1.5">
                    <Sparkles className="h-4 w-4" />
                  </div>
                  <p className="text-xs font-bold text-foreground">All products are healthy</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">No inventory items are currently below reorder thresholds</p>
                </div>
              ) : (
                <div className="space-y-1.5 mt-1">
                  {analytics.lowStockProducts.items.map((item) => {
                    const severity = stockSeverity(item.stockPercent);
                    return (
                      <div
                        key={item.productId}
                        className={cn(
                          "flex items-center gap-2.5 rounded-lg p-2 border transition-all text-xs",
                          severity.bg
                        )}
                      >
                        <span className="text-base shrink-0">{item.categoryIcon || "📦"}</span>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-foreground truncate">{item.name}</p>
                          <p className="text-[10px] text-muted-foreground truncate">
                            {item.categoryName} • SKU: {item.sku || "N/A"} • Unit: {item.unit}
                          </p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className={cn("font-bold font-mono tabular-nums text-xs", severity.text)}>
                            {item.onHandQty} / {item.lowStockThreshold}
                          </p>
                          <span
                            className={cn(
                              "inline-block text-[9px] font-semibold px-1.5 py-0.2 rounded border",
                              severity.badge
                            )}
                          >
                            {severity.label}
                          </span>
                        </div>
                        {/* Remaining stock bar */}
                        <div className="w-12 h-1.5 rounded-full bg-muted/40 overflow-hidden shrink-0 hidden sm:block">
                          <div
                            className={cn(
                              "h-full rounded-full transition-all",
                              item.stockPercent <= 0
                                ? "bg-red-500"
                                : item.stockPercent <= 30
                                ? "bg-rose-500"
                                : item.stockPercent <= 60
                                ? "bg-amber-500"
                                : "bg-yellow-500"
                            )}
                            style={{ width: `${Math.max(Math.min(item.stockPercent, 100), 4)}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Low Stock Categories Summary (4 Cols) */}
          <Card className="lg:col-span-4 border-border/80 shadow-2xs bg-card/60 backdrop-blur-sm overflow-hidden">
            <CardHeader className="p-3.5 pb-2 border-b border-border/50">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-amber-500/10 text-amber-500">
                    <Layers className="h-3.5 w-3.5" />
                  </div>
                  <div>
                    <CardTitle className="text-xs font-bold tracking-tight">Affected Categories</CardTitle>
                    <CardDescription className="text-[10px] text-muted-foreground">
                      Department inventory breakdown
                    </CardDescription>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <div className="relative">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                    <Input
                      placeholder="Category..."
                      className="h-7 w-[100px] pl-8 text-xs bg-muted/30 border-border/60"
                      value={lowStockCatSearch}
                      onChange={(e) => {
                        setLowStockCatSearch(e.target.value);
                        setLowStockCatPage(1);
                      }}
                    />
                  </div>
                  <MiniPagination
                    page={lowStockCatPage}
                    totalPages={lowStockCatTotalPages}
                    onPrev={() => setLowStockCatPage((p) => p - 1)}
                    onNext={() => setLowStockCatPage((p) => p + 1)}
                  />
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-3.5 pt-2">
              {analyticsLoading ? (
                <TableSkeleton rows={4} />
              ) : !analytics?.lowStockCategories?.items?.length ? (
                <div className="flex flex-col items-center justify-center py-9 text-center">
                  <Layers className="h-7 w-7 text-muted-foreground/30 mb-1.5" />
                  <p className="text-xs font-bold text-muted-foreground">No categories affected</p>
                  <p className="text-[10px] text-muted-foreground/70">All department quotas balanced</p>
                </div>
              ) : (
                <div className="space-y-1.5 mt-1">
                  {analytics.lowStockCategories.items.map((cat) => (
                    <div
                      key={cat.categoryId || "uncategorized"}
                      className="flex items-center justify-between p-2 rounded-md bg-muted/20 border border-border/50 text-xs hover:bg-muted/30 transition-colors"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-sm shrink-0">{cat.icon || "📁"}</span>
                        <div className="min-w-0">
                          <p className="font-semibold text-foreground truncate">{cat.name}</p>
                          <p className="text-[10px] text-muted-foreground">
                            {cat.criticalCount > 0 ? (
                              <span className="text-red-600 dark:text-red-400 font-bold">
                                {cat.criticalCount} empty stock •{" "}
                              </span>
                            ) : null}
                            {cat.count} low items
                          </p>
                        </div>
                      </div>
                      <Badge
                        variant={cat.criticalCount > 0 ? "danger" : "outline"}
                        className={cn(
                          "text-[10px] font-mono px-1.5 py-0.2 shrink-0",
                          cat.criticalCount <= 0 && "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20"
                        )}
                      >
                        {cat.count} items
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* ── 6. COMPLIANCE & CUSTOMER HEALTH (GST & KHATA) ────────────────── */}
      <div className="grid gap-3.5 md:grid-cols-2">
        {hasGstInvoices && (
          <Card className="border-border/80 shadow-2xs bg-card/60 backdrop-blur-sm overflow-hidden flex flex-col justify-between">
            <CardHeader className="p-3.5 pb-2 border-b border-border/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                    <Receipt className="h-3.5 w-3.5" />
                  </div>
                  <div>
                    <CardTitle className="text-xs font-bold tracking-tight">GST Tax Ledger &amp; Invoices</CardTitle>
                    <CardDescription className="text-[10px] text-muted-foreground">
                      Compliant tax invoices issued in selected window
                    </CardDescription>
                  </div>
                </div>
                <Link
                  href={APP_ROUTES.INVOICES}
                  className="text-[11px] font-semibold text-primary hover:underline inline-flex items-center gap-1 group"
                >
                  View Invoices <ArrowRight className="h-3 w-3 group-hover:translate-x-0.5 transition-transform" />
                </Link>
              </div>
            </CardHeader>

            <CardContent className="p-3.5 space-y-2">
              {!summary || (summary.invoicesToday === 0 && summary.gstCollectedToday === 0) ? (
                <div className="flex flex-col items-center justify-center py-6 text-center">
                  <Receipt className="h-7 w-7 text-muted-foreground/30 mb-1.5" />
                  <p className="text-xs font-semibold text-foreground">No tax invoices generated</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">No GST billing logged in this timeframe</p>
                </div>
              ) : (
                <div className="space-y-1.5 text-xs font-mono">
                  <div className="flex justify-between p-2 rounded-md bg-muted/20 border border-border/50">
                    <span className="text-muted-foreground">Tax Invoices Generated:</span>
                    <span className="font-bold text-foreground">{formatNumber(summary.invoicesToday ?? 0)}</span>
                  </div>
                  <div className="flex justify-between p-2 rounded-md bg-muted/20 border border-border/50">
                    <span className="text-muted-foreground">Total GST Collected:</span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">
                      {formatCurrency(summary.gstCollectedToday ?? 0, currency)}
                    </span>
                  </div>
                  {(summary.igstToday ?? 0) > 0 && (
                    <div className="flex justify-between p-2 rounded-md bg-amber-500/5 border border-amber-500/20 text-amber-700 dark:text-amber-400">
                      <span>Inter-State IGST:</span>
                      <span className="font-bold">{formatCurrency(summary.igstToday ?? 0, currency)}</span>
                    </div>
                  )}
                  {(summary.cgstSgstToday ?? 0) > 0 && (
                    <div className="flex justify-between p-2 rounded-md bg-emerald-500/5 border border-emerald-500/20 text-emerald-700 dark:text-emerald-400">
                      <span>Intra-State CGST + SGST:</span>
                      <span className="font-bold">{formatCurrency(summary.cgstSgstToday ?? 0, currency)}</span>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {hasCreditKhata && (
          <Card className="border-border/80 shadow-2xs bg-card/60 backdrop-blur-sm overflow-hidden flex flex-col justify-between">
            <CardHeader className="p-3.5 pb-2 border-b border-border/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-amber-500/10 text-amber-500">
                    <Wallet className="h-3.5 w-3.5" />
                  </div>
                  <div>
                    <CardTitle className="text-xs font-bold tracking-tight">Customer Khata &amp; Udhar</CardTitle>
                    <CardDescription className="text-[10px] text-muted-foreground">
                      Outstanding credit balances and debtor accounts
                    </CardDescription>
                  </div>
                </div>
                <Link
                  href={APP_ROUTES.CUSTOMERS}
                  className="text-[11px] font-semibold text-primary hover:underline inline-flex items-center gap-1 group"
                >
                  Khata Ledger <ArrowRight className="h-3 w-3 group-hover:translate-x-0.5 transition-transform" />
                </Link>
              </div>
            </CardHeader>

            <CardContent className="p-3.5 space-y-2">
              {!summary || (summary.totalCreditOutstanding === 0 && summary.customersWithDue === 0) ? (
                <div className="flex flex-col items-center justify-center py-6 text-center">
                  <Wallet className="h-7 w-7 text-muted-foreground/30 mb-1.5" />
                  <p className="text-xs font-semibold text-foreground">Zero credit debt outstanding</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">All customer ledgers are fully paid and balanced</p>
                </div>
              ) : (
                <div className="space-y-1.5 text-xs font-mono">
                  <div className="flex justify-between p-2 rounded-md bg-amber-500/10 border border-amber-500/20 text-amber-800 dark:text-amber-300">
                    <span className="font-medium">Total Credit Due:</span>
                    <span className="font-bold">{formatCurrency(summary.totalCreditOutstanding ?? 0, currency)}</span>
                  </div>
                  <div className="flex justify-between p-2 rounded-md bg-muted/20 border border-border/50">
                    <span className="text-muted-foreground">Debtors vs Total Customers:</span>
                    <span className="font-bold text-foreground">
                      {summary.customersWithDue ?? 0} / {summary.totalCustomers ?? 0}
                    </span>
                  </div>
                  <div className="flex justify-between p-2 rounded-md bg-muted/20 border border-border/50">
                    <span className="text-muted-foreground">Credit Issued in Period:</span>
                    <span className="font-bold text-foreground">
                      {formatCurrency(summary.creditIssuedToday ?? 0, currency)}
                    </span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

export default function HomePage() {
  const { token, outletId } = useAuth();

  if (!token) return null;

  return <DashboardHome token={token} outletId={outletId} />;
}
