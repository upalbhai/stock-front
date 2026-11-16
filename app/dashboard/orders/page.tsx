"use client";

import * as React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Ban,
  Receipt,
  FileText,
  Printer,
  X,
  User as UserIcon,
  RefreshCw,
  Plus,
  Calendar,
  CreditCard,
  Banknote,
  QrCode,
  Wallet,
  BookOpen,
  DollarSign,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Layers,
  ArrowUpRight,
  TrendingUp,
  FileCheck,
  ShoppingBag,
  ExternalLink,
  ChevronRight,
  Eye,
  Store,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { DataTable } from "@/components/ui/data-table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/components/auth/auth-provider";
import { useFeature } from "@/hooks/useFeature";
import { orderService } from "@/services/order.service";
import { invoiceService } from "@/services/invoice.service";
import { businessService } from "@/services/business.service";
import { userService } from "@/services/user.service";
import AsyncSelect from "@/components/ui/async-select";
import { formatCurrency, formatDateTime } from "@/lib/format";
import type { Order, Outlet } from "@/lib/types";
import toast from "react-hot-toast";
import { getErrorMessage } from "@/lib/error";
import { APP_ROUTES } from "@/lib/routes";
import { useQueryStates, parseAsString, parseAsInteger, parseAsStringEnum } from "nuqs";
import { JollyDateRangePicker } from "@/components/ui/jolly-date-picker";
import { parseDate } from "@internationalized/date";
import { usePOSPrinter } from "@/hooks/use-pos-printer";
import { cn } from "@/lib/utils";

type RecordFilter = "active" | "voided" | "all";

const statusVariant: Record<string, "soft" | "danger" | "warning" | "secondary"> = {
  completed: "soft",
  voided: "danger",
  refunded: "warning",
  cancelled: "secondary",
  pending: "secondary"
};

const VOID_PRESETS = [
  "Wrong items or quantity entered",
  "Customer cancelled order",
  "Duplicate bill generated",
  "Payment method error",
  "Customer left without paying"
];

export default function OrdersPage() {
  const { token, outletId, businessId, user } = useAuth();
  const currency = user?.currency || "INR";
  const qc = useQueryClient();
  const hasHistory = useFeature("order_history");
  const hasGstInvoices = useFeature("gst_invoices");
  const canVoid = useFeature("order_void") && (user?.role === "owner" || user?.role === "manager" || user?.role === "superadmin");
  const printer = usePOSPrinter(token);

  const [query, setQuery] = useQueryStates({
    page: parseAsInteger.withDefault(1),
    limit: parseAsInteger.withDefault(10),
    search: parseAsString.withDefault(""),
    status: parseAsStringEnum<RecordFilter>(["active", "voided", "all"]).withDefault("active"),
    from: parseAsString.withDefault(""),
    to: parseAsString.withDefault(""),
    staffId: parseAsString.withDefault("")
  });

  const [voidTarget, setVoidTarget] = React.useState<Order | null>(null);
  const [voidReason, setVoidReason] = React.useState("");
  const [viewOrderId, setViewOrderId] = React.useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = React.useState(false);

  const loadStaffOptions = async ({ search = "", page }: { search?: string; page: number }) => {
    if (!businessId || !token) return { data: [] };
    try {
      const res = await userService.getUsers(token, { businessId, search, page, limit: 25, flat: true });
      const options = res.users.map((u: any) => ({
        id: u._id,
        name: u.name,
        label: u.name,
      }));
      if (page === 1 && !search) {
        options.unshift({ id: "", name: "All Cashiers & Staff", label: "All Cashiers & Staff" });
      }
      return {
        data: options,
        meta: res.meta
      };
    } catch (error) {
      console.error("Failed to load staff", error);
      return { data: [] };
    }
  };

  const { data: orderDetailsData, isLoading: isLoadingOrder } = useQuery({
    queryKey: ["order", viewOrderId],
    queryFn: () => orderService.getOrder(viewOrderId!, token),
    enabled: !!viewOrderId && !!token,
    staleTime: 5_000
  });

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["orders", outletId, query.status, query.page, query.limit, query.search, query.from, query.to, query.staffId],
    queryFn: () =>
      orderService.getOrders(token, {
        outletId: outletId ?? undefined,
        recordStatus: query.status,
        page: query.page,
        limit: query.limit,
        search: query.search || undefined,
        from: query.from || undefined,
        to: query.to || undefined,
        staffId: query.staffId || undefined
      }),
    enabled: Boolean(token) && hasHistory,
    staleTime: 5_000,
    refetchOnMount: "always",
    refetchOnWindowFocus: true
  });

  const handleManualRefetch = async () => {
    setIsRefreshing(true);
    qc.invalidateQueries({ queryKey: ["orders"] });
    await refetch();
    setTimeout(() => setIsRefreshing(false), 500);
  };

  const voidMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      orderService.voidOrder(id, reason, token),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["orders"] });
      setVoidTarget(null);
      setVoidReason("");
      toast.success("Order voided and stock restored successfully");
    },
    onError: (err) => toast.error(getErrorMessage(err, "Failed to void order"))
  });

  const generateInvoiceMutation = useMutation({
    mutationFn: (id: string) => invoiceService.generateInvoice(id, token),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["orders"] });
      toast.success("GST Tax Invoice generated successfully");
    },
    onError: (err) => toast.error(getErrorMessage(err, "Failed to generate invoice"))
  });

  const orders = data?.orders ?? [];
  const totalOrdersCount = data?.total ?? 0;

  // KPI Calculations
  const completedOrders = React.useMemo(() => orders.filter((o) => o.status === "completed"), [orders]);
  const voidedOrdersInList = React.useMemo(() => orders.filter((o) => o.status === "voided"), [orders]);
  const totalSalesVolume = React.useMemo(() => {
    return completedOrders.reduce((sum, o) => sum + (o.total || 0), 0);
  }, [completedOrders]);
  const averageTicketValue = completedOrders.length > 0 ? totalSalesVolume / completedOrders.length : 0;

  // Quick Preset Handlers
  const applyPreset = (preset: "today" | "yesterday" | "7d" | "this_month" | "all") => {
    if (preset === "all") {
      setQuery({ from: null, to: null, page: 1 });
      return;
    }
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
      setQuery({
        from: startOfDay(now).toISOString(),
        to: endOfDay(now).toISOString(),
        page: 1,
      });
    } else if (preset === "yesterday") {
      const yest = new Date(now);
      yest.setDate(yest.getDate() - 1);
      setQuery({
        from: startOfDay(yest).toISOString(),
        to: endOfDay(yest).toISOString(),
        page: 1,
      });
    } else if (preset === "7d") {
      const past7 = new Date(now);
      past7.setDate(past7.getDate() - 6);
      setQuery({
        from: startOfDay(past7).toISOString(),
        to: endOfDay(now).toISOString(),
        page: 1,
      });
    } else if (preset === "this_month") {
      const startMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      setQuery({
        from: startOfDay(startMonth).toISOString(),
        to: endOfDay(now).toISOString(),
        page: 1,
      });
    }
  };

  const activePreset = React.useMemo<"all" | "today" | "yesterday" | "7d" | "this_month" | "custom">(() => {
    if (!query.from && !query.to) return "all";
    const now = new Date();
    const todayDateStr = new Date(now.setHours(0, 0, 0, 0)).toISOString().split("T")[0];
    if (query.from?.startsWith(todayDateStr) && query.to?.startsWith(todayDateStr)) {
      return "today";
    }
    const yest = new Date();
    yest.setDate(yest.getDate() - 1);
    const yestDateStr = yest.toISOString().split("T")[0];
    if (query.from?.startsWith(yestDateStr) && query.to?.startsWith(yestDateStr)) {
      return "yesterday";
    }
    return "custom";
  }, [query.from, query.to]);

  const handlePrintOrder = async (order: Order) => {
    const currentOutlet = user?.outlets?.find((o: Outlet) => o._id === order.outletId);
    let bizDetails: any = null;
    try {
      bizDetails = await qc.fetchQuery({
        queryKey: ["business-mine"],
        queryFn: () => businessService.getMyBusiness(token),
        staleTime: 60_000,
      });
    } catch (e) {
      console.error("Failed to fetch business details for printing", e);
    }

    try {
      await printer.print({
        businessName: bizDetails?.business?.name ?? "Shop",
        outletName: currentOutlet?.name ?? undefined,
        businessPhone: bizDetails?.business?.phone ?? undefined,
        businessAddress: bizDetails?.business?.address ?? undefined,
        businessGst: bizDetails?.business?.gstNumber ?? undefined,
        orderNumber: order.orderNumber,
        createdAt: order.createdAt,
        customerName: order.customerName || undefined,
        customerPhone: order.customerPhone || undefined,
        items: order.items.map((i: any) => ({
          name: i.name,
          qty: i.soldQty || i.qty,
          unit: i.soldUnit || i.unit,
          price: i.price,
          lineTotal: i.lineTotal ?? (i.price * (i.soldQty || i.qty))
        })),
        subtotal: order.subtotal,
        discount: order.discount,
        tax: order.tax,
        total: order.total,
        paymentMethod: (order as any).payments?.[0]?.method || "cash",
        amountPaid: order.amountPaid ?? 0,
        amountDue: order.amountDue ?? 0,
        isWholesale: order.billingMode === "wholesale",
        paperWidth: printer.config.paperWidth
      });
      toast.success(`Reprinted bill: ${order.orderNumber}`);
    } catch (e: any) {
      toast.error(e.message || "Failed to print order");
    }
  };

  const getModeInfo = (mode: string) => {
    switch (mode) {
      case "quick":
        return { label: "Quick", icon: "⚡", color: "border-blue-500/20 bg-blue-500/10 text-blue-700 dark:text-blue-300" };
      case "takeaway":
        return { label: "Takeaway", icon: "🛍️", color: "border-purple-500/20 bg-purple-500/10 text-purple-700 dark:text-purple-300" };
      case "dine_in":
        return { label: "Dine-in", icon: "🪑", color: "border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-300" };
      case "parcel":
        return { label: "Parcel", icon: "📦", color: "border-orange-500/20 bg-orange-500/10 text-orange-700 dark:text-orange-300" };
      case "wholesale":
        return { label: "Wholesale", icon: "🏢", color: "border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400" };
      default:
        return { label: mode, icon: "🧾", color: "border-border bg-muted/30 text-muted-foreground" };
    }
  };

  const renderPaymentBadges = (order: Order) => {
    if (!order.payments || order.payments.length === 0) {
      return <span className="text-xs text-muted-foreground">-</span>;
    }
    return (
      <div className="flex flex-wrap gap-1 max-w-[170px]">
        {order.payments.map((p: any, i: number) => {
          if (p.method === "split" && p.split) {
            return Object.entries(p.split).map(([methodKey, splitAmt]: any) => {
              if (!splitAmt || Number(splitAmt) <= 0) return null;
              return (
                <span
                  key={`${i}-${methodKey}`}
                  className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-bold border border-border/80 bg-muted/40 text-foreground"
                >
                  <span className="capitalize">{methodKey}</span>: {formatCurrency(Number(splitAmt), currency)}
                </span>
              );
            });
          }
          const method = p.method?.toLowerCase();
          return (
            <span
              key={i}
              className={cn(
                "inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-bold border",
                method === "cash" && "border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
                method === "upi" && "border-cyan-500/20 bg-cyan-500/10 text-cyan-700 dark:text-cyan-400",
                method === "card" && "border-indigo-500/20 bg-indigo-500/10 text-indigo-700 dark:text-indigo-400",
                method === "credit" && "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400",
                method === "wallet" && "border-pink-500/20 bg-pink-500/10 text-pink-700 dark:text-pink-400",
                !["cash", "upi", "card", "credit", "wallet"].includes(method) && "border-border bg-muted/30 text-foreground"
              )}
            >
              {method === "cash" && <Banknote className="h-2.5 w-2.5" />}
              {method === "upi" && <QrCode className="h-2.5 w-2.5" />}
              {method === "card" && <CreditCard className="h-2.5 w-2.5" />}
              {method === "credit" && <BookOpen className="h-2.5 w-2.5" />}
              {method === "wallet" && <Wallet className="h-2.5 w-2.5" />}
              <span className="capitalize">{method === "credit" ? "Khata" : method}</span>: {formatCurrency(p.amount, currency)}
            </span>
          );
        })}
      </div>
    );
  };

  if (!hasHistory) {
    return (
      <div className="rounded-2xl border border-border/80 bg-card p-10 text-center shadow-sm">
        <Receipt className="mx-auto h-12 w-12 text-muted-foreground/40" />
        <h1 className="mt-4 text-xl font-bold tracking-tight">Order History</h1>
        <p className="mt-2 text-sm text-muted-foreground">Order history and transaction logs are not enabled on your current subscription.</p>
        <div className="mt-6">
          <Link href="/dashboard/billing">
            <Button className="gap-2 font-semibold">
              <Plus className="h-4 w-4" /> Go to POS Billing
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-2 border-b border-border/60">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Order History</h1>
            <Badge variant="soft" className="text-xs font-semibold px-2 py-0.5">
              Live Register Logs
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Complete audit trail of store sales, refunds, voids, and cashier settlements.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={handleManualRefetch}
            disabled={isRefreshing || isLoading}
            className="h-10 px-3 gap-1.5 text-xs font-semibold border-border/80 hover:bg-muted/50 cursor-pointer"
          >
            <RefreshCw className={cn("h-3.5 w-3.5", (isRefreshing || isLoading) && "animate-spin text-primary")} />
            <span>Refresh</span>
          </Button>

          <Link href="/dashboard/billing">
            <Button size="sm" className="h-10 px-4 gap-2 text-xs font-bold bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm rounded-xl cursor-pointer">
              <Plus className="h-4 w-4" />
              <span>New Bill</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* KPI Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        <Card className="border border-border/70 bg-card shadow-2xs hover:shadow-xs transition-shadow">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Total Sales</p>
              <p className="text-xl font-extrabold text-foreground tracking-tight mt-1 truncate">
                {formatCurrency(totalSalesVolume, currency)}
              </p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                {completedOrders.length} completed {completedOrders.length === 1 ? "bill" : "bills"}
              </p>
            </div>
            <div className="h-10 w-10 rounded-xl bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/20">
              <TrendingUp className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border border-border/70 bg-card shadow-2xs hover:shadow-xs transition-shadow">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Total Bills</p>
              <p className="text-xl font-extrabold text-foreground tracking-tight mt-1 truncate">
                {totalOrdersCount}
              </p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                In current filter view
              </p>
            </div>
            <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0 border border-primary/20">
              <Receipt className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border border-border/70 bg-card shadow-2xs hover:shadow-xs transition-shadow">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Average Bill</p>
              <p className="text-xl font-extrabold text-foreground tracking-tight mt-1 truncate">
                {formatCurrency(averageTicketValue, currency)}
              </p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Per customer basket
              </p>
            </div>
            <div className="h-10 w-10 rounded-xl bg-cyan-500/10 text-cyan-700 dark:text-cyan-400 flex items-center justify-center shrink-0 border border-cyan-500/20">
              <ShoppingBag className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border border-border/70 bg-card shadow-2xs hover:shadow-xs transition-shadow">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Voided Entries</p>
              <p className={cn("text-xl font-extrabold tracking-tight mt-1 truncate", voidedOrdersInList.length > 0 ? "text-destructive" : "text-foreground")}>
                {voidedOrdersInList.length}
              </p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                {voidedOrdersInList.length === 0 ? "No voided bills" : "Stock restored"}
              </p>
            </div>
            <div className="h-10 w-10 rounded-xl bg-destructive/10 text-destructive flex items-center justify-center shrink-0 border border-destructive/20">
              <Ban className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Payment Channel Highlights */}
      {data?.payments && data.payments.length > 0 && (
        <div className="rounded-2xl border border-border/70 bg-muted/20 p-3.5">
          <div className="flex items-center justify-between mb-2 px-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <CreditCard className="h-3.5 w-3.5 text-primary" />
              Settlement Channels (Period Total)
            </span>
            <span className="text-[11px] text-muted-foreground">
              {data.payments.length} {data.payments.length === 1 ? "active channel" : "active channels"}
            </span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {data.payments.map((p: any, i: number) => {
              const type = p.payment_type?.toLowerCase();
              return (
                <div
                  key={i}
                  className="rounded-xl border border-border/70 bg-card p-3 shadow-2xs flex items-center gap-3"
                >
                  <div className={cn(
                    "h-9 w-9 rounded-lg flex items-center justify-center shrink-0 border",
                    type === "cash" && "border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
                    type === "upi" && "border-cyan-500/20 bg-cyan-500/10 text-cyan-700 dark:text-cyan-400",
                    type === "card" && "border-indigo-500/20 bg-indigo-500/10 text-indigo-700 dark:text-indigo-400",
                    type === "wallet" && "border-pink-500/20 bg-pink-500/10 text-pink-700 dark:text-pink-400",
                    type === "credit" && "border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-400"
                  )}>
                    {type === "cash" && <Banknote className="h-4 w-4" />}
                    {type === "upi" && <QrCode className="h-4 w-4" />}
                    {type === "card" && <CreditCard className="h-4 w-4" />}
                    {type === "wallet" && <Wallet className="h-4 w-4" />}
                    {type === "credit" && <BookOpen className="h-4 w-4" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground truncate">
                      {type === "credit" ? "Khata" : p.payment_type}
                    </p>
                    <p className="font-mono text-sm font-extrabold text-foreground tracking-tight truncate mt-0.5">
                      {formatCurrency(p.amount, currency)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Filter Toolbar: Staff, Quick Preset Pills, Date Range Picker */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 p-3.5 rounded-2xl border border-border/70 bg-card shadow-2xs">
        {/* Preset Date Pills */}
        <div className="flex flex-wrap items-center gap-1.5">
          <Button
            type="button"
            variant={activePreset === "all" ? "default" : "outline"}
            size="sm"
            className="h-8 px-2.5 text-xs font-semibold rounded-lg"
            onClick={() => applyPreset("all")}
          >
            All Time
          </Button>
          <Button
            type="button"
            variant={activePreset === "today" ? "default" : "outline"}
            size="sm"
            className="h-8 px-2.5 text-xs font-semibold rounded-lg"
            onClick={() => applyPreset("today")}
          >
            Today
          </Button>
          <Button
            type="button"
            variant={activePreset === "yesterday" ? "default" : "outline"}
            size="sm"
            className="h-8 px-2.5 text-xs font-semibold rounded-lg"
            onClick={() => applyPreset("yesterday")}
          >
            Yesterday
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8 px-2.5 text-xs font-semibold rounded-lg"
            onClick={() => applyPreset("7d")}
          >
            Last 7 Days
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8 px-2.5 text-xs font-semibold rounded-lg"
            onClick={() => applyPreset("this_month")}
          >
            This Month
          </Button>
        </div>

        {/* Date Picker & Staff Filter */}
        <div className="flex flex-wrap items-center gap-2">
          {(user?.role === "owner" || user?.role === "superadmin" || user?.role === "manager") && (
            <div className="w-[180px]">
              <AsyncSelect
                value={query.staffId ? { id: query.staffId, label: "Staff Selected", name: "Staff Selected" } : { id: "", label: "All Cashiers", name: "All Cashiers" }}
                onChange={(opt: any) => setQuery({ staffId: opt?.id || "", page: 1 })}
                loadOptions={loadStaffOptions}
                placeholder="All Cashiers"
                searchable
                pageSize={25}
                className="h-9 text-xs"
              />
            </div>
          )}

          <div className="relative">
            <JollyDateRangePicker 
              label="Custom Date"
              value={(query.from && query.to) ? { start: parseDate(query.from.split('T')[0]), end: parseDate(query.to.split('T')[0]) } : null}
              onChange={(val) => {
                if (val) {
                  setQuery({ 
                    from: val.start.toString() + "T00:00:00.000Z", 
                    to: val.end.toString() + "T23:59:59.999Z", 
                    page: 1 
                  });
                } else {
                  setQuery({ from: null, to: null, page: 1 });
                }
              }}
            />
          </div>

          {(query.from || query.to || query.staffId) && (
            <Button
              variant="ghost"
              size="sm"
              className="h-9 px-2.5 text-xs font-medium text-destructive hover:bg-destructive/10"
              onClick={() => setQuery({ from: null, to: null, staffId: "", page: 1 })}
              title="Reset all filters"
            >
              <X className="h-3.5 w-3.5 mr-1" /> Clear
            </Button>
          )}
        </div>
      </div>

      {/* Orders Data Table */}
      <DataTable
        isLoading={isLoading}
        data={orders}
        keyExtractor={(o) => o._id}
        emptyStateText="No bills found for the selected date range and filter criteria."
        totalItems={data?.total ?? 0}
        page={query.page}
        limit={query.limit}
        onPageChange={(p) => setQuery({ page: p })}
        onLimitChange={(l) => setQuery({ limit: l, page: 1 })}
        searchQuery={query.search}
        onSearchChange={(s) => setQuery({ search: s, page: 1 })}
        onRefetch={handleManualRefetch}
        filters={
          <Tabs
            value={query.status}
            onValueChange={(v) => setQuery({ status: v as RecordFilter, page: 1 })}
            className="w-auto shrink-0"
          >
            <TabsList className="h-9 bg-muted/60 p-0.5 border border-border/40 shrink-0">
              <TabsTrigger
                value="active"
                className="h-full px-3.5 text-xs font-semibold whitespace-nowrap shrink-0 text-muted-foreground hover:text-foreground data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-xs transition-all"
              >
                Active Bills
              </TabsTrigger>
              <TabsTrigger
                value="voided"
                className="h-full px-3.5 text-xs font-semibold whitespace-nowrap shrink-0 text-muted-foreground hover:text-foreground data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-xs transition-all"
              >
                Voided Bills
              </TabsTrigger>
              <TabsTrigger
                value="all"
                className="h-full px-3.5 text-xs font-semibold whitespace-nowrap shrink-0 text-muted-foreground hover:text-foreground data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-xs transition-all"
              >
                All Records
              </TabsTrigger>
            </TabsList>
          </Tabs>
        }
        columns={[
          {
            key: "orderNumber",
            header: "Bill & Time",
            render: (o) => {
              const mode = getModeInfo(o.billingMode);
              return (
                <div className="flex flex-col gap-1 py-1">
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setViewOrderId(o._id)}
                      className={cn(
                        "font-mono font-bold text-sm tracking-tight text-foreground hover:text-primary transition-colors cursor-pointer text-left",
                        o.status === "voided" && "line-through text-muted-foreground"
                      )}
                    >
                      {o.orderNumber}
                    </button>
                    <span className={cn("inline-flex items-center gap-1 px-1.5 py-0.2 rounded-md text-[9px] font-bold border", mode.color)}>
                      <span>{mode.icon}</span>
                      <span>{mode.label}</span>
                    </span>
                  </div>
                  <span className="text-[11px] text-muted-foreground font-mono">
                    {formatDateTime(o.createdAt)}
                  </span>
                </div>
              );
            }
          },
          {
            key: "customer",
            header: "Customer & Cashier",
            className: "hidden md:table-cell",
            render: (o) => (
              <div className="flex flex-col gap-0.5">
                {o.customerName ? (
                  <>
                    <span className="text-xs font-bold text-foreground truncate max-w-[170px]">
                      {o.customerName}
                    </span>
                    {o.customerPhone && (
                      <span className="text-[11px] text-muted-foreground font-mono">
                        {o.customerPhone}
                      </span>
                    )}
                  </>
                ) : (
                  <span className="text-xs font-medium text-muted-foreground/80 italic">
                    Walk-in Customer
                  </span>
                )}
                {o.createdBy?.name && (
                  <span className="text-[10px] text-muted-foreground flex items-center gap-1 mt-0.5">
                    <UserIcon className="h-2.5 w-2.5 text-primary/70" />
                    <span>Cashier: {o.createdBy.name}</span>
                  </span>
                )}
              </div>
            )
          },
          {
            key: "items",
            header: "Items",
            className: "hidden sm:table-cell",
            render: (o) => {
              const totalQty = o.items?.reduce((s, i) => s + (i.soldQty ?? i.qty), 0) || o.items?.length || 0;
              const previewNames = o.items?.slice(0, 2).map((i) => i.name).join(", ");
              return (
                <div className="flex flex-col max-w-[190px]">
                  <span className="text-xs font-bold text-foreground">
                    {totalQty} {totalQty === 1 ? "unit" : "units"} ({o.items?.length || 0} line {o.items?.length === 1 ? "item" : "items"})
                  </span>
                  {previewNames && (
                    <span className="text-[10px] text-muted-foreground truncate" title={previewNames}>
                      {previewNames}
                    </span>
                  )}
                </div>
              );
            }
          },
          {
            key: "payment",
            header: "Payment Method",
            className: "hidden lg:table-cell",
            render: (o) => renderPaymentBadges(o)
          },
          {
            key: "total",
            header: "Total & Dues",
            render: (o) => (
              <div className="flex flex-col">
                <span className={cn(
                  "font-mono text-sm font-black text-foreground",
                  o.status === "voided" && "line-through text-muted-foreground"
                )}>
                  {formatCurrency(o.total, currency)}
                </span>
                {(o.amountDue ?? 0) > 0 && o.status !== "voided" && (
                  <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400">
                    Due: {formatCurrency(o.amountDue ?? 0, currency)}
                  </span>
                )}
              </div>
            )
          },
          {
            key: "status",
            header: "Status",
            render: (o) => (
              <div className="flex flex-col gap-1">
                <Badge
                  variant={statusVariant[o.status] ?? "secondary"}
                  className="capitalize font-bold text-[10px] px-2 py-0.5 w-fit"
                >
                  {o.status}
                </Badge>
                {o.status === "voided" && o.voidReason && (
                  <span className="text-[10px] text-muted-foreground truncate max-w-[130px]" title={o.voidReason}>
                    {o.voidReason}
                  </span>
                )}
              </div>
            )
          },
          {
            key: "invoice",
            header: "GST Tax Invoice",
            className: "hidden xl:table-cell",
            render: (o) =>
              o.invoiceNumber ? (
                <Link
                  href={APP_ROUTES.invoiceDetail(o._id)}
                  className="inline-flex items-center gap-1 text-xs font-mono font-bold text-primary hover:underline"
                >
                  <FileText className="h-3 w-3" />
                  <span>{o.invoiceNumber}</span>
                </Link>
              ) : hasGstInvoices && o.tax > 0 && o.status === "completed" ? (
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 text-[10px] font-semibold gap-1 rounded-md px-2 border-border/80"
                  disabled={generateInvoiceMutation.isPending}
                  onClick={() => generateInvoiceMutation.mutate(o._id)}
                >
                  <FileText className="h-3 w-3 text-primary" />
                  <span>Create Invoice</span>
                </Button>
              ) : (
                <span className="text-xs text-muted-foreground">-</span>
              )
          },
          {
            key: "actions",
            header: "",
            render: (o) => (
              <div className="flex items-center gap-1 justify-end">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 px-2 text-xs font-semibold hover:bg-muted/60"
                  onClick={() => setViewOrderId(o._id)}
                  title="View Bill Details"
                >
                  <Eye className="h-3.5 w-3.5 sm:mr-1 text-primary" />
                  <span className="hidden sm:inline">Receipt</span>
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 px-2 text-xs font-semibold hover:bg-muted/60 text-foreground"
                  onClick={() => handlePrintOrder(o)}
                  title="Reprint Bill"
                >
                  <Printer className="h-3.5 w-3.5 sm:mr-1 text-muted-foreground" />
                  <span className="hidden sm:inline">Reprint</span>
                </Button>

                {canVoid && o.status === "completed" && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 px-2 text-xs font-semibold text-destructive hover:bg-destructive/10"
                    onClick={() => setVoidTarget(o)}
                    title="Void this bill"
                  >
                    <Ban className="h-3.5 w-3.5 sm:mr-1" />
                    <span className="hidden sm:inline">Void</span>
                  </Button>
                )}
              </div>
            )
          }
        ]}
      />

      {/* Order Details / POS Receipt Modal */}
      <Modal
        open={!!viewOrderId}
        onClose={() => setViewOrderId(null)}
        title="POS Bill Receipt & Audit Record"
        size="lg"
      >
        {isLoadingOrder ? (
          <div className="flex flex-col items-center justify-center p-12 text-muted-foreground gap-3">
            <RefreshCw className="h-6 w-6 animate-spin text-primary" />
            <p className="text-xs font-medium">Fetching order audit details...</p>
          </div>
        ) : orderDetailsData?.order ? (
          <div className="space-y-4 pt-1">
            {/* Receipt Top Identity Card */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-border/80 bg-muted/20 p-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-lg font-black text-foreground">
                    {orderDetailsData.order.orderNumber}
                  </span>
                  <Badge variant={statusVariant[orderDetailsData.order.status] ?? "secondary"} className="capitalize font-bold text-xs">
                    {orderDetailsData.order.status}
                  </Badge>
                  <Badge variant="outline" className="text-xs capitalize font-semibold border-border">
                    {orderDetailsData.order.billingMode.replace("_", " ")}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1.5 font-mono">
                  <Clock className="h-3.5 w-3.5" />
                  {formatDateTime(orderDetailsData.order.createdAt)}
                </p>
              </div>

              <div className="text-right">
                <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground block">
                  Amount Payable
                </span>
                <span className="font-mono text-2xl font-black text-primary">
                  {formatCurrency(orderDetailsData.order.total, currency)}
                </span>
              </div>
            </div>

            {/* Void Notice if Voided */}
            {orderDetailsData.order.status === "voided" && (
              <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-destructive text-xs">
                <div className="flex items-center gap-2 font-bold text-sm">
                  <AlertTriangle className="h-4 w-4" />
                  <span>This bill has been voided</span>
                </div>
                <p className="mt-1 font-medium text-destructive/90">
                  Reason: {orderDetailsData.order.voidReason || "None specified"}
                </p>
                {orderDetailsData.order.voidedBy?.name && (
                  <p className="mt-0.5 text-[11px] text-destructive/80">
                    Voided by: {orderDetailsData.order.voidedBy.name}
                  </p>
                )}
              </div>
            )}

            {/* Customer & Staff Coordinates */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="rounded-xl border border-border/70 bg-card p-3 shadow-2xs">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                  <UserIcon className="h-3 w-3 text-primary" />
                  Customer Information
                </span>
                {orderDetailsData.order.customerName ? (
                  <div className="mt-1.5">
                    <p className="font-bold text-xs text-foreground">{orderDetailsData.order.customerName}</p>
                    {orderDetailsData.order.customerPhone && (
                      <p className="font-mono text-[11px] text-muted-foreground mt-0.5">
                        {orderDetailsData.order.customerPhone}
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="mt-1.5 text-xs text-muted-foreground italic">Walk-in Customer (General Counter Sale)</p>
                )}
              </div>

              <div className="rounded-xl border border-border/70 bg-card p-3 shadow-2xs">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                  <Store className="h-3 w-3 text-primary" />
                  Register & Cashier
                </span>
                <div className="mt-1.5">
                  <p className="font-bold text-xs text-foreground">
                    Cashier: {orderDetailsData.order.createdBy?.name || "Counter Register"}
                  </p>
                  {orderDetailsData.order.invoiceNumber && (
                    <p className="font-mono text-[11px] text-primary mt-0.5 font-bold">
                      GST Invoice: {orderDetailsData.order.invoiceNumber}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Line Items Itemized List */}
            <div className="space-y-1.5">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Itemized Basket ({orderDetailsData.order.items?.length || 0} line items)
              </span>

              <div className="max-h-[35vh] overflow-y-auto space-y-2 pr-1 border rounded-xl border-border/70 p-2.5 bg-background">
                {orderDetailsData.order.items.map((item: any, idx: number) => {
                  const qty = item.soldQty || item.qty;
                  const unit = item.soldUnit || item.unit;
                  const lineTotal = item.lineTotal ?? (item.price * qty);
                  return (
                    <div
                      key={idx}
                      className="flex items-start justify-between gap-3 p-2 rounded-lg bg-card border border-border/50 text-xs"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="font-bold text-foreground leading-snug">{item.name}</p>
                        <p className="font-mono text-[11px] text-muted-foreground mt-0.5">
                          {qty} {unit} @ {formatCurrency(item.price, currency)} / {unit}
                          {item.taxRate > 0 && <span className="ml-2 font-normal text-muted-foreground">(GST {item.taxRate}%)</span>}
                        </p>
                      </div>
                      <span className="font-mono font-bold text-sm text-foreground shrink-0">
                        {formatCurrency(lineTotal, currency)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Ledger Totals */}
            <div className="rounded-xl border border-border/70 bg-card p-3.5 space-y-2 text-xs">
              <div className="flex justify-between text-muted-foreground">
                <span>Subtotal</span>
                <span className="font-mono font-semibold text-foreground">
                  {formatCurrency(orderDetailsData.order.subtotal, currency)}
                </span>
              </div>

              {orderDetailsData.order.discount > 0 && (
                <div className="flex justify-between text-emerald-700 dark:text-emerald-400 font-medium">
                  <span>Discount Applied</span>
                  <span className="font-mono font-bold">
                    -{formatCurrency(orderDetailsData.order.discount, currency)}
                  </span>
                </div>
              )}

              {orderDetailsData.order.tax > 0 && (
                <div className="flex justify-between text-muted-foreground">
                  <span>GST Total</span>
                  <span className="font-mono font-semibold text-foreground">
                    {formatCurrency(orderDetailsData.order.tax, currency)}
                  </span>
                </div>
              )}

              <div className="flex items-baseline justify-between pt-2 border-t border-border/80 font-bold text-base">
                <span className="text-foreground">Grand Total</span>
                <span className="font-mono text-xl font-black text-primary">
                  {formatCurrency(orderDetailsData.order.total, currency)}
                </span>
              </div>

              <div className="flex justify-between text-xs pt-1.5 border-t border-border/40 text-muted-foreground">
                <span>Amount Paid</span>
                <span className="font-mono font-bold text-foreground">
                  {formatCurrency(orderDetailsData.order.amountPaid ?? orderDetailsData.order.total, currency)}
                </span>
              </div>

              {(orderDetailsData.order.amountDue ?? 0) > 0 && (
                <div className="flex justify-between text-xs font-bold text-amber-600 dark:text-amber-400">
                  <span>Remaining Khata Due</span>
                  <span className="font-mono text-sm">
                    {formatCurrency(orderDetailsData.order.amountDue ?? 0, currency)}
                  </span>
                </div>
              )}
            </div>

            {/* Actions Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-border/70">
              <Button variant="outline" size="sm" onClick={() => setViewOrderId(null)} className="h-10 px-4">
                Close
              </Button>

              <div className="flex flex-wrap items-center gap-2">
                {canVoid && orderDetailsData.order.status === "completed" && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-10 px-3 text-xs font-semibold text-destructive hover:bg-destructive/10"
                    onClick={() => {
                      setVoidTarget(orderDetailsData.order);
                      setViewOrderId(null);
                    }}
                  >
                    <Ban className="h-4 w-4 mr-1.5" /> Void Bill
                  </Button>
                )}

                {hasGstInvoices && !orderDetailsData.order.invoiceNumber && orderDetailsData.order.tax > 0 && orderDetailsData.order.status === "completed" && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-10 px-3 text-xs font-semibold"
                    disabled={generateInvoiceMutation.isPending}
                    onClick={() => generateInvoiceMutation.mutate(orderDetailsData.order._id)}
                  >
                    <FileText className="h-4 w-4 mr-1.5 text-primary" /> Generate GST Invoice
                  </Button>
                )}

                <Button
                  size="sm"
                  className="h-10 px-4 text-xs font-bold bg-primary hover:bg-primary/90 text-primary-foreground gap-1.5"
                  onClick={() => handlePrintOrder(orderDetailsData.order)}
                  disabled={printer.status === "printing"}
                >
                  <Printer className="h-4 w-4" />
                  <span>Reprint POS Bill</span>
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex justify-center p-8 text-destructive text-xs font-semibold">
            Unable to fetch order information.
          </div>
        )}
      </Modal>

      {/* Void Bill Confirmation Modal */}
      <Modal
        open={!!voidTarget}
        onClose={() => { setVoidTarget(null); setVoidReason(""); }}
        title="Void Bill Confirmation"
        size="md"
      >
        <div className="space-y-4 pt-1">
          <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-3.5 text-xs text-destructive">
            <p className="font-bold text-sm flex items-center gap-1.5">
              <AlertTriangle className="h-4 w-4" />
              Permanent Action Warning
            </p>
            <p className="mt-1 text-destructive/90 leading-relaxed">
              Bill <strong>{voidTarget?.orderNumber}</strong> ({formatCurrency(voidTarget?.total || 0, currency)}) will be permanently voided.
              Inventory quantities for all billed items will be restored automatically to the outlet stock.
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block">
              Quick Reason Selection
            </label>
            <div className="flex flex-wrap gap-1.5">
              {VOID_PRESETS.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setVoidReason(preset)}
                  className={cn(
                    "rounded-lg border px-2.5 py-1 text-xs font-medium transition-colors cursor-pointer text-left",
                    voidReason === preset
                      ? "border-destructive bg-destructive/10 text-destructive font-bold"
                      : "border-border/80 bg-card text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                  )}
                >
                  {preset}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block">
              Reason Description *
            </label>
            <Input
              value={voidReason}
              onChange={(e) => setVoidReason(e.target.value)}
              placeholder="e.g. Wrong items entered on cash counter"
              minLength={2}
              required
              className="h-10 text-xs"
            />
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-border/70">
            <Button
              variant="outline"
              size="sm"
              className="h-10 px-4"
              onClick={() => { setVoidTarget(null); setVoidReason(""); }}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              size="sm"
              className="h-10 px-4 font-bold"
              disabled={voidReason.trim().length < 2 || voidMutation.isPending}
              onClick={() => voidTarget && voidMutation.mutate({ id: voidTarget._id, reason: voidReason.trim() })}
            >
              {voidMutation.isPending ? "Voiding Order..." : "Confirm & Void Bill"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
