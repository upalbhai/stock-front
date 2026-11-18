"use client";

import * as React from "react";
import { useQuery, useMutation, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import {
  TrendingUp,
  TrendingDown,
  Package,
  AlertTriangle,
  RotateCcw,
  Gift,
  Trash2,
  Plus,
  Calendar,
  Search,
  Info,
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
  Layers,
  Sparkles,
  Pencil,
  AlertCircle,
  Receipt,
  HelpCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Modal } from "@/components/ui/modal";
import { Select } from "@/components/ui/select";
import { DataTable } from "@/components/ui/data-table";
import { useAuth } from "@/components/auth/auth-provider";
import { reportService } from "@/services/report.service";
import { productService } from "@/services/product.service";
import { stockService } from "@/services/stock.service";
import { formatCurrency, formatDateTime, formatNumber } from "@/lib/format";
import { getErrorMessage } from "@/lib/error";
import { toast } from "react-hot-toast";
import { useQueryStates, parseAsString, parseAsInteger } from "nuqs";
import { JollyDateRangePicker } from "@/components/ui/jolly-date-picker";
import { parseDate } from "@internationalized/date";
import {
  buildStockUnitOptions,
  getProductUnitLabel,
  getStockPriceDefaults,
} from "@/lib/productUtils";
import type { Product } from "@/lib/types";
import { cn } from "@/lib/utils";

type LedgerSummary = {
  stockInvested: number;
  potentialMargin: number;
  realizedRevenue: number;
  realizedCost: number;
  realizedGrossProfit: number;
  spoilageLoss: number;
  returnLoss: number;
  replacementCost: number;
  totalLoss: number;
  ordersCount?: number;
  netProfit: number;
  onHandCostValue: number;
  onHandSellValue: number;
  onHandPotentialMargin: number;
};

type LedgerMovement = {
  _id: string;
  createdAt: string;
  productName: string;
  category: string;
  categoryLabel: string;
  categoryHint: string;
  isRealized: boolean;
  isLoss: boolean;
  qty: number;
  soldQty?: number;
  soldUnit?: string;
  costValue: number;
  sellValue: number;
  potentialMargin: number;
  costLoss: number;
  realizedRevenue: number;
  realizedCost: number;
  realizedProfit: number;
  note?: string;
  createdBy?: string;
  type?: string;
  lossReason?: string;
};

const ISSUE_TYPES = [
  {
    value: "spoilage",
    label: "Spoilage / Expiry",
    hint: "Stock went bad before selling: recorded as business loss",
    type: "wastage" as const,
    lossReason: "spoilage" as const,
  },
  {
    value: "customer_return_spoiled",
    label: "Customer Return (Damaged)",
    hint: "Customer brought damaged item: loss recorded, item not restocked",
    type: "wastage" as const,
    lossReason: "customer_return_spoiled" as const,
  },
  {
    value: "customer_return_good",
    label: "Customer Return (Resaleable)",
    hint: "Undamaged item returned: returned to inventory with zero loss",
    type: "return" as const,
    lossReason: undefined,
  },
  {
    value: "owner_replacement",
    label: "Owner Replacement",
    hint: "Free replacement provided to customer: recorded at product cost",
    type: "wastage" as const,
    lossReason: "owner_replacement" as const,
  },
];

function getDefaultDateRange() {
  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - 29);
  return {
    from: start.toISOString().split("T")[0] + "T00:00:00.000Z",
    to: end.toISOString().split("T")[0] + "T23:59:59.999Z",
  };
}

function moneyImpact(row: LedgerMovement): {
  label: string;
  value: number;
  tone: "profit" | "loss" | "muted";
} {
  if (row.isLoss && row.costLoss > 0) {
    return { label: "Loss", value: -row.costLoss, tone: "loss" };
  }
  if (row.category === "sale" && row.realizedProfit !== 0) {
    return {
      label: "Real Profit",
      value: row.realizedProfit,
      tone: row.realizedProfit >= 0 ? "profit" : "loss",
    };
  }
  if (row.category === "stock_in" && row.potentialMargin !== 0) {
    return { label: "Potential Margin", value: row.potentialMargin, tone: "muted" };
  }
  if (row.realizedRevenue > 0) {
    return { label: "Revenue", value: row.realizedRevenue, tone: "profit" };
  }
  return { label: "Neutral", value: 0, tone: "muted" };
}

export default function ProfitPage() {
  const { user, token, outletId } = useAuth();
  const currency = user?.currency || "INR";
  const qc = useQueryClient();
  const defaults = React.useMemo(getDefaultDateRange, []);

  const [query, setQuery] = useQueryStates({
    from: parseAsString.withDefault(defaults.from),
    to: parseAsString.withDefault(defaults.to),
    ledgerSearch: parseAsString.withDefault(""),
    page: parseAsInteger.withDefault(1),
    limit: parseAsInteger.withDefault(10),
  });

  const [searchTerm, setSearchTerm] = React.useState(query.ledgerSearch);

  // Sync internal search input when query changes externally
  React.useEffect(() => {
    setSearchTerm(query.ledgerSearch);
  }, [query.ledgerSearch]);

  // Debounce search so keystrokes do not spam requests
  React.useEffect(() => {
    if (searchTerm === query.ledgerSearch) return;
    const timer = setTimeout(() => {
      setQuery({ ledgerSearch: searchTerm, page: 1 });
    }, 350);
    return () => clearTimeout(timer);
  }, [searchTerm, query.ledgerSearch, setQuery]);

  const [activeTab, setActiveTab] = React.useState<"all" | "sales" | "losses" | "inflow">("all");
  const [showIssueModal, setShowIssueModal] = React.useState(false);
  const [prodSearch, setProdSearch] = React.useState("");
  const [selectedProduct, setSelectedProduct] = React.useState<Product | null>(null);
  const [issueType, setIssueType] = React.useState(ISSUE_TYPES[0].value);
  const [issueQty, setIssueQty] = React.useState("1");
  const [issueUnitKey, setIssueUnitKey] = React.useState("base");
  const [issueCost, setIssueCost] = React.useState("");
  const [issueNote, setIssueNote] = React.useState("");

  // Ledger item editing & deleting
  const [editEntry, setEditEntry] = React.useState<LedgerMovement | null>(null);
  const [deleteEntry, setDeleteEntry] = React.useState<LedgerMovement | null>(null);
  const [editQty, setEditQty] = React.useState("");
  const [editReason, setEditReason] = React.useState("");
  const [editNote, setEditNote] = React.useState("");

  const { data, isLoading, refetch } = useQuery({
    queryKey: [
      "profit-ledger",
      outletId,
      query.from,
      query.to,
      query.ledgerSearch,
      query.page,
      query.limit,
    ],
    queryFn: () =>
      reportService.getProfitLedger(token!, {
        outletId: outletId ?? undefined,
        from: query.from,
        to: query.to,
        search: query.ledgerSearch || undefined,
        page: query.page,
        limit: query.limit,
      }),
    placeholderData: keepPreviousData,
    staleTime: 30 * 1000,
    enabled: Boolean(token),
  });

  const { data: prodData } = useQuery({
    queryKey: ["products-profit-picker", outletId, prodSearch],
    queryFn: () =>
      productService.getProductsWithOffset(token!, {
        outletId: outletId ?? undefined,
        search: prodSearch || undefined,
        limit: 30,
      }),
    enabled: Boolean(token) && showIssueModal,
  });

  const products = prodData?.data ?? [];
  const summary: LedgerSummary | undefined = data?.data?.summary;
  const rawMovements: LedgerMovement[] = data?.data?.movements ?? [];

  const movements = React.useMemo(() => {
    if (activeTab === "sales") return rawMovements.filter((m) => m.category === "sale");
    if (activeTab === "losses") return rawMovements.filter((m) => m.isLoss);
    if (activeTab === "inflow")
      return rawMovements.filter((m) => m.category === "stock_in" || m.category === "purchase");
    return rawMovements;
  }, [rawMovements, activeTab]);

  const issueConfig = ISSUE_TYPES.find((t) => t.value === issueType) ?? ISSUE_TYPES[0];
  const unitOptions = selectedProduct ? buildStockUnitOptions(selectedProduct) : [];
  const selectedUnit = unitOptions.find((u) => u.key === issueUnitKey) ?? unitOptions[0];
  const issueCount = Number(issueQty) || 0;
  const baseQty = issueCount * (selectedUnit?.conversionFactor ?? 1);
  const isGoodReturn = issueType === "customer_return_good";
  const costNum = Number(issueCost) || 0;
  const lossPreview = !isGoodReturn && issueCount > 0 ? issueCount * costNum : 0;

  React.useEffect(() => {
    if (!selectedProduct) return;
    const defaults = getStockPriceDefaults(selectedProduct, issueUnitKey);
    setIssueCost(String(defaults.costPrice || ""));
  }, [selectedProduct, issueUnitKey]);

  const issueMutation = useMutation({
    mutationFn: (body: any) => stockService.adjustStock(body, token!),
    onSuccess: () => {
      toast.success("Stock adjustment recorded successfully");
      setShowIssueModal(false);
      setIssueQty("1");
      setIssueNote("");
      setSelectedProduct(null);
      qc.invalidateQueries({ queryKey: ["profit-ledger"] });
      qc.invalidateQueries({ queryKey: ["products"] });
      refetch();
    },
    onError: (err) => toast.error(getErrorMessage(err, "Failed to record issue")),
  });

  const editMutation = useMutation({
    mutationFn: (body: any) => stockService.updateStockEntry(editEntry!._id, body, token!),
    onSuccess: () => {
      toast.success("Ledger entry updated");
      setEditEntry(null);
      qc.invalidateQueries({ queryKey: ["profit-ledger"] });
      qc.invalidateQueries({ queryKey: ["products"] });
      refetch();
    },
    onError: (err) => toast.error(getErrorMessage(err, "Failed to update entry")),
  });

  const deleteMutation = useMutation({
    mutationFn: () => stockService.deleteStockEntry(deleteEntry!._id, token!),
    onSuccess: () => {
      toast.success("Ledger entry reverted and stock restored");
      setDeleteEntry(null);
      qc.invalidateQueries({ queryKey: ["profit-ledger"] });
      qc.invalidateQueries({ queryKey: ["products"] });
      refetch();
    },
    onError: (err) => toast.error(getErrorMessage(err, "Failed to delete entry")),
  });

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editEntry) return;
    const qtyNum = Number(editQty);
    if (isNaN(qtyNum)) return toast.error("Invalid quantity");
    editMutation.mutate({
      qty: editEntry.qty < 0 ? -Math.abs(qtyNum) : Math.abs(qtyNum),
      lossReason: editReason,
      note: editNote,
    });
  };

  const handleRecordIssue = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct || !outletId || issueCount <= 0) return;

    const baseUnit = getProductUnitLabel(selectedProduct);
    const packagingMeta =
      selectedUnit && selectedUnit.key !== "base"
        ? {
          soldQty: issueCount,
          soldUnit: selectedUnit.soldUnit,
          packagingUnitId: selectedUnit.packagingUnitId,
          conversionFactor: selectedUnit.conversionFactor,
          baseUnit,
        }
        : { baseUnit, soldQty: issueCount, soldUnit: selectedUnit?.soldUnit ?? baseUnit };

    if (isGoodReturn) {
      issueMutation.mutate({
        productId: selectedProduct._id,
        outletId,
        qty: baseQty,
        type: "return",
        note: issueNote || "Customer return: good condition, restocked into inventory",
        soldUnitCost: costNum,
        ...packagingMeta,
      });
      return;
    }

    issueMutation.mutate({
      productId: selectedProduct._id,
      outletId,
      qty: -baseQty,
      type: "wastage",
      lossReason: issueConfig.lossReason,
      soldUnitCost: costNum,
      note: issueNote || issueConfig.label,
      ...packagingMeta,
    });
  };

  const marginPercent =
    summary && summary.realizedRevenue > 0
      ? ((summary.netProfit / summary.realizedRevenue) * 100).toFixed(1)
      : null;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Profit & Loss Ledger
            </h1>
            <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 text-xs">
              Accounting
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">
            Track realized revenue, cost of goods sold, shrinkage losses, and unrealized inventory margins.
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
                setQuery({ from: defaults.from, to: defaults.to });
              }
            }}
          />

          <Button
            onClick={() => setShowIssueModal(true)}
            className="h-10 px-4 text-xs font-semibold gap-1.5 shadow-xs cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>Record Stock Issue</span>
          </Button>
        </div>
      </div>

      {/* Guide Pill Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
        <div className="p-3 rounded-xl border border-border/70 bg-card shadow-2xs">
          <div className="flex items-center gap-1.5 text-xs font-bold text-foreground">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            Realized Profit
          </div>
          <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed">
            Collected when a customer pays minus direct product COGS.
          </p>
        </div>

        <div className="p-3 rounded-xl border border-border/70 bg-card shadow-2xs">
          <div className="flex items-center gap-1.5 text-xs font-bold text-foreground">
            <span className="h-2 w-2 rounded-full bg-rose-500" />
            Shrinkage & Losses
          </div>
          <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed">
            Spoiled goods, damaged returns, or free replacements.
          </p>
        </div>

        <div className="p-3 rounded-xl border border-border/70 bg-card shadow-2xs">
          <div className="flex items-center gap-1.5 text-xs font-bold text-foreground">
            <span className="h-2 w-2 rounded-full bg-blue-500" />
            Inventory at Cost
          </div>
          <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed">
            Capital invested in active unsold inventory on hand.
          </p>
        </div>

        <div className="p-3 rounded-xl border border-border/70 bg-card shadow-2xs">
          <div className="flex items-center gap-1.5 text-xs font-bold text-foreground">
            <span className="h-2 w-2 rounded-full bg-amber-500" />
            Potential Margin
          </div>
          <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed">
            Projected gross markup if unsold stock clears at catalog price.
          </p>
        </div>
      </div>

      {/* Main KPI Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Sales Revenue */}
        <Card className="border border-border/70 bg-card shadow-2xs hover:shadow-xs transition-shadow">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                Sales Revenue
              </p>
              <p className="text-xl font-extrabold text-foreground tracking-tight mt-1 truncate">
                {isLoading ? "..." : formatCurrency(summary?.realizedRevenue ?? 0, currency)}
              </p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                {summary?.ordersCount ?? 0} customer orders settled
              </p>
            </div>
            <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0 border border-primary/20">
              <DollarSign className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        {/* COGS */}
        <Card className="border border-border/70 bg-card shadow-2xs hover:shadow-xs transition-shadow">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                Cost of Goods Sold
              </p>
              <p className="text-xl font-extrabold text-amber-600 dark:text-amber-400 tracking-tight mt-1 truncate">
                {isLoading ? "..." : formatCurrency(summary?.realizedCost ?? 0, currency)}
              </p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Acquisition cost of sold units
              </p>
            </div>
            <div className="h-10 w-10 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 border border-amber-500/20">
              <Package className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        {/* Net Profit */}
        <Card className="border border-border/70 bg-card shadow-2xs hover:shadow-xs transition-shadow">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  Net Realized Profit
                </p>
                {marginPercent && (
                  <span
                    className={cn(
                      "text-[10px] font-mono font-bold px-1.5 py-0.2 rounded border",
                      Number(marginPercent) >= 0
                        ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20"
                        : "bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/20"
                    )}
                  >
                    {marginPercent}%
                  </span>
                )}
              </div>
              <p
                className={cn(
                  "text-xl font-extrabold tracking-tight mt-1 truncate",
                  (summary?.netProfit ?? 0) >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600"
                )}
              >
                {isLoading ? "..." : formatCurrency(summary?.netProfit ?? 0, currency)}
              </p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Revenue minus COGS and losses
              </p>
            </div>
            <div
              className={cn(
                "h-10 w-10 rounded-xl flex items-center justify-center shrink-0 border",
                (summary?.netProfit ?? 0) >= 0
                  ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                  : "bg-rose-500/10 text-rose-600 border-rose-500/20"
              )}
            >
              {(summary?.netProfit ?? 0) >= 0 ? (
                <ArrowUpRight className="h-5 w-5" />
              ) : (
                <ArrowDownRight className="h-5 w-5" />
              )}
            </div>
          </CardContent>
        </Card>

        {/* Shrinkage & Loss */}
        <Card className="border border-border/70 bg-card shadow-2xs hover:shadow-xs transition-shadow">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                Losses & Shrinkage
              </p>
              <p className="text-xl font-extrabold text-rose-600 dark:text-rose-400 tracking-tight mt-1 truncate">
                {isLoading ? "..." : formatCurrency(summary?.totalLoss ?? 0, currency)}
              </p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Spoilage, damage & replacements
              </p>
            </div>
            <div className="h-10 w-10 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0 border border-rose-500/20">
              <AlertTriangle className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Secondary Valuation & Loss Breakdown Bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
        <Card className="border border-border/70 bg-card p-4 flex items-center justify-between shadow-2xs">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              On-Hand Inventory (Cost)
            </p>
            <p className="text-base font-extrabold text-foreground mt-0.5 font-mono">
              {formatCurrency(summary?.onHandCostValue ?? 0, currency)}
            </p>
            <p className="text-[10px] text-muted-foreground">Capital tied in warehouse/shelf</p>
          </div>
          <Package className="h-5 w-5 text-muted-foreground" />
        </Card>

        <Card className="border border-border/70 bg-card p-4 flex items-center justify-between shadow-2xs">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              Unsold Potential Margin
            </p>
            <p className="text-base font-extrabold text-indigo-600 dark:text-indigo-400 mt-0.5 font-mono">
              {formatCurrency(summary?.onHandPotentialMargin ?? 0, currency)}
            </p>
            <p className="text-[10px] text-muted-foreground">Expected profit upon total stock sale</p>
          </div>
          <Sparkles className="h-5 w-5 text-indigo-500" />
        </Card>

        <Card className="border border-border/70 bg-card p-4 flex items-center justify-between shadow-2xs">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              Period Stock Invested
            </p>
            <p className="text-base font-extrabold text-foreground mt-0.5 font-mono">
              {formatCurrency(summary?.stockInvested ?? 0, currency)}
            </p>
            <p className="text-[10px] text-muted-foreground">Inward goods purchased in timeframe</p>
          </div>
          <Layers className="h-5 w-5 text-muted-foreground" />
        </Card>
      </div>

      {/* Movement Ledger Table */}
      <DataTable
        title="Stock & Money Movements"
        description="Comprehensive audit of sales, stock adjustments, customer returns, and write-offs."
        isLoading={isLoading}
        data={movements}
        keyExtractor={(m) => m._id}
        onRefetch={() => refetch()}
        searchQuery={searchTerm}
        onSearchChange={setSearchTerm}
        placeholderText="Search product name, note, reason..."
        totalItems={data?.meta?.pagination?.total ?? 0}
        page={query.page}
        limit={query.limit}
        onPageChange={(p) => setQuery({ page: p })}
        onLimitChange={(l) => setQuery({ limit: l, page: 1 })}
        emptyStateText="No stock movements recorded in this period."
        filters={
          <Tabs
            value={activeTab}
            onValueChange={(v) => setActiveTab(v as "all" | "sales" | "losses" | "inflow")}
          >
            <TabsList className="h-9 bg-muted/60 p-0.5 border border-border/40">
              <TabsTrigger
                value="all"
                className="text-xs px-3 font-semibold text-muted-foreground hover:text-foreground data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-xs transition-all"
              >
                All Movements ({rawMovements.length})
              </TabsTrigger>
              <TabsTrigger
                value="sales"
                className="text-xs px-3 font-semibold text-muted-foreground hover:text-foreground data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-xs transition-all"
              >
                Sales ({rawMovements.filter((m) => m.category === "sale").length})
              </TabsTrigger>
              <TabsTrigger
                value="losses"
                className="text-xs px-3 font-semibold text-muted-foreground hover:text-foreground data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-xs transition-all"
              >
                Losses ({rawMovements.filter((m) => m.isLoss).length})
              </TabsTrigger>
              <TabsTrigger
                value="inflow"
                className="text-xs px-3 font-semibold text-muted-foreground hover:text-foreground data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-xs transition-all"
              >
                Inward ({rawMovements.filter((m) => m.category === "stock_in" || m.category === "purchase").length})
              </TabsTrigger>
            </TabsList>
          </Tabs>
        }
        columns={[
          {
            key: "time",
            header: "Timestamp",
            render: (m) => (
              <span className="text-xs text-muted-foreground font-mono whitespace-nowrap">
                {formatDateTime(m.createdAt)}
              </span>
            ),
          },
          {
            key: "category",
            header: "Event",
            render: (m) => (
              <div>
                <Badge
                  variant={
                    m.isLoss
                      ? "danger"
                      : m.category === "sale"
                        ? "soft"
                        : "secondary"
                  }
                  className="text-[10px] capitalize font-semibold"
                >
                  {m.categoryLabel}
                </Badge>
                {m.categoryHint && (
                  <p className="text-[10px] text-muted-foreground mt-0.5 max-w-[200px] truncate">
                    {m.categoryHint}
                  </p>
                )}
              </div>
            ),
          },
          {
            key: "product",
            header: "Product",
            render: (m) => (
              <div className="min-w-[140px]">
                <p className="font-semibold text-sm text-foreground">{m.productName}</p>
                {m.note && (
                  <p className="text-[11px] text-muted-foreground truncate max-w-[220px]" title={m.note}>
                    {m.note}
                  </p>
                )}
              </div>
            ),
          },
          {
            key: "qty",
            header: "Qty",
            render: (m) => (
              <span
                className={cn(
                  "text-xs font-bold font-mono",
                  m.qty >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600"
                )}
              >
                {m.qty >= 0 ? "+" : ""}
                {formatNumber(m.qty)}
                {m.soldUnit ? ` (${m.soldQty ?? ""} ${m.soldUnit})` : ""}
              </span>
            ),
          },
          {
            key: "costSell",
            header: "Valuation Rate",
            render: (m) =>
              m.costValue > 0 || m.sellValue > 0 ? (
                <div className="text-[11px] font-mono text-muted-foreground whitespace-nowrap">
                  <span>Cost: {formatCurrency(m.costValue, currency)}</span>
                  <span className="block text-foreground font-semibold">
                    Sell: {formatCurrency(m.sellValue, currency)}
                  </span>
                </div>
              ) : m.realizedRevenue > 0 ? (
                <div className="text-[11px] font-mono text-muted-foreground whitespace-nowrap">
                  <span>COGS: {formatCurrency(m.realizedCost, currency)}</span>
                  <span className="block text-foreground font-semibold">
                    Rev: {formatCurrency(m.realizedRevenue, currency)}
                  </span>
                </div>
              ) : (
                <span className="text-xs text-muted-foreground">Neutral</span>
              ),
          },
          {
            key: "impact",
            header: "Financial Impact",
            render: (m) => {
              const impact = moneyImpact(m);
              return (
                <div>
                  <span
                    className={cn(
                      "text-xs font-bold font-mono",
                      impact.tone === "profit"
                        ? "text-emerald-600 dark:text-emerald-400"
                        : impact.tone === "loss"
                          ? "text-rose-600"
                          : "text-muted-foreground"
                    )}
                  >
                    {impact.value === 0
                      ? "Neutral"
                      : `${impact.value > 0 ? "+" : "-"}${formatCurrency(Math.abs(impact.value), currency)}`}
                  </span>
                  <p className="text-[10px] text-muted-foreground">{impact.label}</p>
                </div>
              );
            },
          },
          {
            key: "actions",
            header: "",
            className: "text-right",
            render: (m) => {
              const canEdit = m.type === "wastage" || m.type === "adjustment" || Boolean(m.lossReason);
              if (!canEdit) return null;
              return (
                <div className="flex items-center justify-end gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground cursor-pointer"
                    onClick={() => {
                      setEditQty(Math.abs(m.qty).toString());
                      setEditReason(m.lossReason || "");
                      setEditNote(m.note || "");
                      setEditEntry(m);
                    }}
                    title="Edit Entry"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive hover:border-destructive/30 cursor-pointer"
                    onClick={() => setDeleteEntry(m)}
                    title="Delete Entry"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              );
            },
          },
        ]}
      />

      {/* Record Stock Issue Modal */}
      <Modal
        open={showIssueModal}
        onClose={() => setShowIssueModal(false)}
        title="Record Stock Issue or Return"
        description="Write off expired or damaged goods, document owner replacements, or record customer returns."
        size="lg"
      >
        <form className="space-y-4" onSubmit={handleRecordIssue}>
          <div>
            <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Issue Classification *
            </label>
            <Select
              value={issueType}
              onValueChange={setIssueType}
              options={ISSUE_TYPES.map((t) => ({ value: t.value, label: t.label }))}
            />
            <p className="text-[11px] text-muted-foreground mt-1">{issueConfig.hint}</p>
          </div>

          <div>
            <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Select Product *
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="pl-9 h-10 text-sm"
                placeholder="Search product by title or barcode..."
                value={prodSearch}
                onChange={(e) => setProdSearch(e.target.value)}
              />
            </div>
            <div className="mt-2 max-h-40 overflow-y-auto space-y-1 rounded-xl border border-border/60 p-1.5 bg-muted/20">
              {products.map((p) => (
                <button
                  key={p._id}
                  type="button"
                  onClick={() => {
                    setSelectedProduct(p);
                    setIssueUnitKey("base");
                  }}
                  className={cn(
                    "w-full rounded-lg px-3 py-2 text-left text-sm transition flex items-center justify-between",
                    selectedProduct?._id === p._id
                      ? "bg-primary/10 ring-1 ring-primary/30 text-primary font-semibold"
                      : "hover:bg-muted/60 text-foreground"
                  )}
                >
                  <span className="truncate">{p.name}</span>
                  <Badge variant="outline" className="text-[11px] font-mono ml-2 shrink-0">
                    Stock: {p.onHandQty}
                  </Badge>
                </button>
              ))}
              {!products.length && (
                <p className="text-xs text-muted-foreground text-center py-4">
                  Type a product name in the box above to choose
                </p>
              )}
            </div>
          </div>

          {selectedProduct && unitOptions.length > 1 && (
            <div>
              <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Unit of Measure
              </label>
              <div className="flex flex-wrap gap-2">
                {unitOptions.map((opt) => (
                  <button
                    key={opt.key}
                    type="button"
                    onClick={() => setIssueUnitKey(opt.key)}
                    className={cn(
                      "rounded-lg px-3 py-1.5 text-xs font-semibold transition cursor-pointer border",
                      issueUnitKey === opt.key
                        ? "bg-primary text-white border-primary"
                        : "bg-muted/60 text-muted-foreground border-border/60 hover:text-foreground"
                    )}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Quantity ({selectedUnit?.soldUnit ?? "units"}) *
              </label>
              <Input
                type="number"
                min={1}
                required
                value={issueQty}
                onChange={(e) => setIssueQty(e.target.value)}
                className="h-10 text-sm font-mono"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Cost per Unit ({currency})
              </label>
              <Input
                type="number"
                min={0}
                step="0.01"
                value={issueCost}
                onChange={(e) => setIssueCost(e.target.value)}
                className="h-10 text-sm font-mono"
              />
            </div>
          </div>

          {!isGoodReturn && lossPreview > 0 && (
            <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-sm flex items-start gap-2.5">
              <TrendingDown className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-rose-700 dark:text-rose-400 font-bold">
                  Loss Impact: {formatCurrency(lossPreview, currency)}
                </p>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  This directly reduces your net accounting profit for this period.
                </p>
              </div>
            </div>
          )}

          {isGoodReturn && (
            <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-800 dark:text-emerald-300">
              Good resaleable returns are added back to inventory. No business loss is incurred.
            </div>
          )}

          <div>
            <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Reference / Note (Optional)
            </label>
            <Input
              value={issueNote}
              onChange={(e) => setIssueNote(e.target.value)}
              placeholder="e.g. Milk carton punctured during unloading"
              className="h-10 text-sm"
            />
          </div>

          <div className="flex gap-3 pt-3 border-t border-border/60">
            <Button
              type="button"
              variant="outline"
              className="flex-1 h-10 font-semibold cursor-pointer"
              onClick={() => setShowIssueModal(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1 h-10 font-semibold shadow-xs cursor-pointer"
              disabled={!selectedProduct || issueMutation.isPending}
            >
              {issueMutation.isPending ? "Saving..." : "Record Adjustment"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Edit Entry Modal */}
      <Modal
        open={Boolean(editEntry)}
        onClose={() => setEditEntry(null)}
        title="Edit Ledger Entry"
        description="Update recorded quantity or note for this stock adjustment."
        size="md"
      >
        {editEntry && (
          <form className="space-y-4" onSubmit={handleEditSubmit}>
            <div className="p-3 rounded-xl border border-border/60 bg-muted/30">
              <p className="text-sm font-bold text-foreground">{editEntry.productName}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{editEntry.categoryLabel}</p>
            </div>

            <div>
              <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Quantity *
              </label>
              <Input
                type="number"
                min={0}
                required
                value={editQty}
                onChange={(e) => setEditQty(e.target.value)}
                className="h-10 text-sm font-mono"
              />
              <p className="text-[11px] text-muted-foreground mt-1">
                The product inventory level will adjust based on this difference.
              </p>
            </div>

            <div>
              <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Classification Reason
              </label>
              <Select
                value={editReason}
                onValueChange={setEditReason}
                options={ISSUE_TYPES.map((t) => ({ label: t.label, value: t.value }))}
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Remarks / Note
              </label>
              <Input
                placeholder="Reason for change..."
                value={editNote}
                onChange={(e) => setEditNote(e.target.value)}
                className="h-10 text-sm"
              />
            </div>

            <div className="flex gap-3 pt-3 border-t border-border/60">
              <Button
                type="button"
                variant="outline"
                className="flex-1 h-10 font-semibold cursor-pointer"
                onClick={() => setEditEntry(null)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="flex-1 h-10 font-semibold shadow-xs cursor-pointer"
                disabled={editMutation.isPending}
              >
                {editMutation.isPending ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </form>
        )}
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        open={Boolean(deleteEntry)}
        onClose={() => setDeleteEntry(null)}
        title="Revert Ledger Entry"
        description="Delete this entry and revert its impact on stock inventory."
        size="md"
      >
        {deleteEntry && (
          <div className="space-y-4">
            <p className="text-sm text-foreground">
              Are you sure you want to revert this {deleteEntry.categoryLabel} entry for{" "}
              <strong>{deleteEntry.productName}</strong>?
            </p>
            <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3.5 flex gap-2.5 text-amber-800 dark:text-amber-300 items-start text-xs">
              <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
              <p>
                Deleting this record will restore{" "}
                <strong>{Math.abs(deleteEntry.qty)} units</strong> back to on-hand product inventory.
              </p>
            </div>
            <div className="flex gap-3 pt-2">
              <Button
                variant="outline"
                className="flex-1 h-10 font-semibold cursor-pointer"
                onClick={() => setDeleteEntry(null)}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                className="flex-1 h-10 font-semibold shadow-xs cursor-pointer"
                onClick={() => deleteMutation.mutate()}
                disabled={deleteMutation.isPending}
              >
                {deleteMutation.isPending ? "Reverting..." : "Revert & Delete"}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
