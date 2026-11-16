"use client";

import * as React from "react";
import { useAppSelector } from "@/store/hooks";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import {
  Package, ArrowLeftRight, History, Play, AlertTriangle,
  Calendar, ArrowDownToLine, ArrowUpFromLine, List, Search, RefreshCw, Trash2
} from "lucide-react";
import { apiFetch } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { Select } from "@/components/ui/select";
import { DataTable } from "@/components/ui/data-table";
import { StatsCard } from "@/components/ui/stats-card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Pagination } from "@/components/ui/pagination";
import { useAuth } from "@/components/auth/auth-provider";
import { useFeature } from "@/hooks/useFeature";
import { getJson, getJsonWithMeta } from "@/lib/api-client";
import { stockService } from "@/services/stock.service";
import { formatNumber, formatDateTime, formatCurrency } from "@/lib/format";
import { getErrorMessage } from "@/lib/error";
import toast from "react-hot-toast";
import { buildStockUnitOptions, formatStockMovementQty, getProductUnitLabel, getStockPriceDefaults, calcStockEntryProfit } from "@/lib/productUtils";
import { Switch } from "@/components/ui/switch";
import type { Product, StockTransfer, Outlet } from "@/lib/types";
import { useQueryStates, parseAsString, parseAsInteger } from "nuqs";
import { JollyDateRangePicker } from "@/components/ui/jolly-date-picker";
import { parseDate } from "@internationalized/date";

type StockHistoryEntry = {
  _id: string;
  productId: { _id: string; name: string; unit: string };
  type: string;
  qty: number;
  qtyBefore: number;
  qtyAfter: number;
  soldQty?: number;
  soldUnit?: string;
  conversionFactor?: number;
  baseUnit?: string;
  packagingUnitId?: { name?: string; abbreviation?: string };
  soldUnitCost?: number;
  soldUnitPrice?: number;
  costValue?: number;
  sellValue?: number;
  expectedProfit?: number;
  costLoss?: number;
  realizedProfit?: number;
  lossReason?: string;
  referenceType?: string;
  note?: string;
  createdAt: string;
  createdBy?: { name?: string };
};

type StockHistorySummary = {
  totalInQty: number;
  totalOutQty: number;
  entriesIn: number;
  entriesOut: number;
  totalCostValue?: number;
  totalSellValue?: number;
  totalExpectedProfit?: number;
};

type StockSummary = { totalSkus: number; onHandTotal: number; lowStock: number };

const HISTORY_DIRECTION_FILTERS = [
  { value: "all", label: "All Ledger", icon: List },
  { value: "in", label: "Stock In", icon: ArrowDownToLine },
  { value: "out", label: "Stock Out", icon: ArrowUpFromLine }
] as const;

const HISTORY_DATE_PRESETS = [
  { key: "today", label: "Today" },
  { key: "week", label: "Last 7 days" },
  { key: "month", label: "Last 30 days" }
] as const;

function getHistoryDatePreset(preset: "today" | "week" | "month") {
  const end = new Date();
  const start = new Date();
  if (preset === "week") start.setDate(start.getDate() - 6);
  if (preset === "month") start.setDate(start.getDate() - 29);
  start.setHours(0, 0, 0, 0);
  return {
    startDate: start.toISOString().split("T")[0],
    endDate: end.toISOString().split("T")[0]
  };
}

function buildHistoryColumns(currency: string, onDelete?: (e: StockHistoryEntry) => void): Parameters<typeof DataTable<StockHistoryEntry>>[0]["columns"] {
  const cols: Parameters<typeof DataTable<StockHistoryEntry>>[0]["columns"] = [
    {
      key: "createdAt",
      header: "Time",
      render: (e: StockHistoryEntry) => (
        <span className="text-xs text-muted whitespace-nowrap">{formatDateTime(e.createdAt)}</span>
      )
    },
    {
      key: "direction",
      header: "Flow",
      render: (e: StockHistoryEntry) => (
        <Badge variant={e.qty >= 0 ? "soft" : "danger"} className="text-[10px]">
          {e.qty >= 0 ? "IN" : "OUT"}
        </Badge>
      )
    },
    {
      key: "product",
      header: "Product",
      render: (e: StockHistoryEntry) => <span className="font-medium">{e.productId?.name || "Deleted Product"}</span>
    },
    {
      key: "type",
      header: "Type",
      render: (e: StockHistoryEntry) => (
        <Badge variant={e.type === "sale" ? "danger" : e.type === "purchase" ? "soft" : "secondary"} className="capitalize text-[10px]">
          {e.type.replace(/_/g, " ")}
        </Badge>
      )
    },
    {
      key: "qty",
      header: "Quantity",
      render: (e: StockHistoryEntry) => (
        <span className={`font-semibold ${e.qty >= 0 ? "text-green-600" : "text-danger"}`}>
          {formatStockMovementQty({
            qty: e.qty,
            soldQty: e.soldQty,
            soldUnit: e.soldUnit,
            baseUnit: e.baseUnit,
            productUnit: e.productId?.unit
          })}
        </span>
      )
    },
    {
      key: "ledger",
      header: "Balance",
      render: (e: StockHistoryEntry) => (
        <span className="text-xs text-muted whitespace-nowrap">
          {e.qtyBefore} → {e.qtyAfter} {e.baseUnit || e.productId?.unit}
        </span>
      )
    },
    {
      key: "profit",
      header: "Potential margin",
      render: (e: StockHistoryEntry) =>
        e.qty > 0 && e.expectedProfit != null ? (
          <span className="text-xs text-muted-foreground">{formatCurrency(e.expectedProfit, currency)}</span>
        ) : (
          <span className="text-xs text-muted-foreground">None</span>
        )
    },
    {
      key: "loss",
      header: "Loss",
      render: (e: StockHistoryEntry) =>
        e.qty > 0 && e.costLoss != null && e.costLoss > 0 ? (
          <span className="text-xs font-semibold text-danger">{formatCurrency(e.costLoss, currency)}</span>
        ) : (
          <span className="text-xs text-muted-foreground">None</span>
        )
    },
    {
      key: "profit",
      header: "Real profit",
      render: (e: StockHistoryEntry) =>
        e.type === "sale" && e.realizedProfit != null ? (
          <span className={`text-xs font-semibold ${e.realizedProfit >= 0 ? "text-green-600" : "text-danger"}`}>
            {formatCurrency(e.realizedProfit, currency)}
          </span>
        ) : (
          <span className="text-xs text-muted-foreground">None</span>
        )
    },
    {
      key: "value",
      header: "Cost / Sell",
      render: (e: StockHistoryEntry) =>
        e.qty > 0 && (e.costValue != null || e.sellValue != null) ? (
          <span className="text-[10px] text-muted-foreground whitespace-nowrap">
            {formatCurrency(e.costValue ?? 0, currency)} → {formatCurrency(e.sellValue ?? 0, currency)}
          </span>
        ) : (
          <span className="text-xs text-muted-foreground">None</span>
        )
    },
    {
      key: "by",
      header: "By",
      render: (e: StockHistoryEntry) => (
        <span className="text-xs text-muted-foreground">{e.createdBy?.name || (e.referenceType === "Order" ? "Billing" : "System")}</span>
      )
    },
    {
      key: "note",
      header: "Note",
      render: (e: StockHistoryEntry) => (
        <span className="text-xs text-muted-foreground truncate max-w-[180px] block" title={e.note || ""}>
          {e.note || "No note"}
        </span>
      )
    }
  ];

  if (onDelete) {
    cols.push({
      key: "actions",
      header: "",
      render: (e: StockHistoryEntry) => {
        if (!e.referenceType && ["purchase", "opening", "wastage", "adjustment", "return"].includes(e.type)) {
          return (
            <Button variant="ghost" size="icon" className="h-6 w-6 text-danger hover:bg-danger/10" onClick={() => onDelete(e)}>
              <Trash2 className="h-3 w-3" />
            </Button>
          );
        }
        return null;
      }
    });
  }

  return cols;
}


const HISTORY_TYPE_FILTERS = [
  { value: "", label: "All" },
  { value: "purchase", label: "Purchases" },
  { value: "sale", label: "Sales" },
  { value: "adjustment", label: "Adjustments" },
  { value: "wastage", label: "Wastage" },
  { value: "return", label: "Returns" }
];

const ENTRY_TYPE_OPTIONS = [
  { value: "purchase", label: "Receive stock", hint: "Add purchased stock (peti/crate or loose)" },
  { value: "wastage", label: "Remove / wastage", hint: "Reduce stock for damage or loss" },
  // { value: "adjustment", label: "Set exact count", hint: "Set total stock to an exact amount" }
] as const;

export default function StockPage() {
  const { user, token, outletId } = useAuth();
  const currency = user?.currency || "INR";
  const hasPackaging = useFeature("packaging_units");
  const qc = useQueryClient();
  const router = useRouter();

  const [query, setQuery] = useQueryStates({
    tab: parseAsString.withDefault("overview"),
    prodSearch: parseAsString.withDefault(""),
    prodPage: parseAsInteger.withDefault(1),
    prodLimit: parseAsInteger.withDefault(10),
    historySearch: parseAsString.withDefault(""),
    historyDirection: parseAsString.withDefault("all"),
    historyType: parseAsString.withDefault(""),
    from: parseAsString.withDefault(""),
    to: parseAsString.withDefault(""),
    historyPage: parseAsInteger.withDefault(1),
    historyLimit: parseAsInteger.withDefault(50),
  });

  const [deleteEntryId, setDeleteEntryId] = React.useState<string | null>(null);

  const activeTab = query.tab;

  // Adjust Dialog State
  const [showAdjustModal, setShowAdjustModal] = React.useState(false);
  const [selectedProduct, setSelectedProduct] = React.useState<Product | null>(null);
  const [adjustQty, setAdjustQty] = React.useState("");
  const [adjustType, setAdjustType] = React.useState<"add" | "set">("add");
  const [adjustEntryType, setAdjustEntryType] = React.useState<"purchase" | "wastage" | "adjustment">("purchase");
  const [adjustUnitKey, setAdjustUnitKey] = React.useState("base");
  const [adjustNote, setAdjustNote] = React.useState("");
  const [adjustError, setAdjustError] = React.useState<string | null>(null);
  const [adjustSellPrice, setAdjustSellPrice] = React.useState("");
  const [adjustCostPrice, setAdjustCostPrice] = React.useState("");
  const [adjustUpdateProductPrices, setAdjustUpdateProductPrices] = React.useState(false);
  const [adjustLossReason, setAdjustLossReason] = React.useState("spoilage");


  // Start of day count state
  const [startOfDayCounts, setStartOfDayCounts] = React.useState<Record<string, number>>({});

  // Use state from nuqs query object directly.

  // API Queries
  const { data: prodData, isLoading: loadingProds, refetch: refetchProducts } = useQuery({
    queryKey: ["products", outletId, query.prodSearch, query.prodPage, query.prodLimit],
    queryFn: () => getJsonWithMeta<Product[]>("/products", token, { outletId: outletId ?? undefined, search: query.prodSearch || undefined, page: query.prodPage, limit: query.prodLimit }),
    // enable when we have a token and the tab needs it
    enabled: Boolean(token) && activeTab !== "history"
  });

  const { data: summaryData } = useQuery({
    queryKey: ["stock-summary", outletId],
    queryFn: () => getJson<StockSummary>("/stock/summary", token, { outletId: outletId ?? undefined }),
    enabled: Boolean(token && outletId) && activeTab === "overview"
  });

  const { data: historyData, isLoading: loadingHistory, refetch: refetchHistory } = useQuery({
    queryKey: ["stock-history", outletId, query.historySearch, query.historyDirection, query.historyType, query.from, query.to, query.historyPage, query.historyLimit],
    queryFn: () =>
      getJson<{ entries: StockHistoryEntry[]; total: number; summary: StockHistorySummary }>("/stock/history", token, {
        outletId: outletId ?? undefined,
        search: query.historySearch || undefined,
        direction: query.historyDirection === "all" ? undefined : query.historyDirection,
        type: query.historyType || undefined,
        startDate: query.from || undefined,
        endDate: query.to || undefined,
        page: query.historyPage,
        limit: query.historyLimit
      }),
    enabled: Boolean(token && outletId) && activeTab === "history"
  });


  const authOutlets = useAppSelector((state) => state.auth.outlets);
  const outletsData = { outlets: authOutlets };

  const adjustStockMutation = useMutation({
    mutationFn: (body: unknown) => stockService.adjustStock(body, token),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["products"] });
      qc.invalidateQueries({ queryKey: ["stock-history"] });
      setShowAdjustModal(false);
      toast.success("Stock adjusted successfully");
    },
    onError: (err) => toast.error(getErrorMessage(err, "Failed to adjust stock"))
  });


  const resolveDiffMutation = useMutation({
    mutationFn: (body: unknown) => stockService.adjustStock(body, token),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["products"] });
      qc.invalidateQueries({ queryKey: ["stock-audits"] });
      toast.success("Discrepancy resolved");
    },
    onError: (err) => toast.error(getErrorMessage(err, "Failed to resolve discrepancy"))
  });

  const saveOpeningStockMutation = useMutation({
    mutationFn: (body: unknown) => stockService.adjustStock(body, token),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["products"] });
      qc.invalidateQueries({ queryKey: ["stock-summary"] });
      qc.invalidateQueries({ queryKey: ["stock-history"] });
      setQuery({ tab: "overview" });
      toast.success("Opening stock saved");
    },
    onError: (err: unknown) => toast.error(getErrorMessage(err, "Failed to save opening stock"))
  });

  const deleteEntryMutation = useMutation({
    mutationFn: (id: string) => apiFetch(`/stock/entries/${id}`, { method: "DELETE", token }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["stock-history"] });
      qc.invalidateQueries({ queryKey: ["products"] });
      qc.invalidateQueries({ queryKey: ["stock-summary"] });
      toast.success("Stock entry reverted successfully");
      setDeleteEntryId(null);
    },
    onError: (err: unknown) => toast.error(getErrorMessage(err, "Failed to revert entry"))
  });

  const products: Product[] = prodData?.data ?? [];
  const summary = summaryData;
  const history = historyData?.entries ?? [];
  const historyTotal = historyData?.total ?? 0;
  const historySummary = historyData?.summary;
  const historyTotalPages = Math.ceil(historyTotal / query.historyLimit) || 1;
  const historyColumns = React.useMemo(() => buildHistoryColumns(currency, (e) => setDeleteEntryId(e._id)), []);

  const prodMeta = prodData?.meta?.pagination;
  const prodTotal = prodMeta?.total ?? products.length;
  const outlets = (outletsData?.outlets ?? []).filter((o) => o._id !== outletId);

  const historyFilters = (
    <>
      <div className="flex flex-wrap items-center gap-2">
        <JollyDateRangePicker
          label="Date Filter"
          value={(query.from && query.to) ? { start: parseDate(query.from.split('T')[0]), end: parseDate(query.to.split('T')[0]) } : null}
          onChange={(val) => {
            if (val) {
              setQuery({
                from: val.start.toString() + "T00:00:00.000Z",
                to: val.end.toString() + "T23:59:59.999Z",
                historyPage: 1
              });
            } else {
              setQuery({ from: "", to: "", historyPage: 1 });
            }
          }}
        />
        {(query.from || query.to || query.historySearch || query.historyType) && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setQuery({
                historySearch: "",
                from: "",
                to: "",
                historyType: "",
                historyPage: 1
              });
            }}
          >
            Clear
          </Button>
        )}
      </div>
      <div className="flex flex-wrap gap-2 hidden">
        {HISTORY_DATE_PRESETS.map((p) => (
          <button
            key={p.key}
            type="button"
            onClick={() => {
              const { startDate, endDate } = getHistoryDatePreset(p.key);
              setQuery({
                from: startDate + "T00:00:00.000Z",
                to: endDate + "T23:59:59.999Z",
                historyPage: 1
              });
            }}
            className="rounded-full border border-border px-3 py-1 text-[10px] font-semibold text-muted hover:text-text hover:border-primary/40 transition"
          >
            {p.label}
          </button>
        ))}
      </div>
      <Select
        value={query.historyType}
        onValueChange={(val) => setQuery({ historyType: val, historyPage: 1 })}
        options={HISTORY_TYPE_FILTERS}
        className="w-[180px] h-9"
      />
    </>
  );

  // Initialize start of day counts
  React.useEffect(() => {
    if (products.length && Object.keys(startOfDayCounts).length === 0) {
      const counts: Record<string, number> = {};
      products.forEach((p) => { counts[p._id] = p.onHandQty; });
      setStartOfDayCounts(counts);
    }
  }, [products, startOfDayCounts]);

  const openAdjustModal = (product: Product) => {
    setSelectedProduct(product);
    setAdjustQty("");
    setAdjustNote("");
    setAdjustType("add");
    setAdjustEntryType("purchase");
    setAdjustUnitKey("base");
    setAdjustUpdateProductPrices(false);
    setAdjustLossReason("spoilage");
    setAdjustError(null);
    const defaults = getStockPriceDefaults(product, "base");
    setAdjustSellPrice(String(defaults.sellPrice || ""));
    setAdjustCostPrice(String(defaults.costPrice || ""));
    setShowAdjustModal(true);
  };

  const adjustUnitOptions = React.useMemo(
    () => (selectedProduct ? buildStockUnitOptions(selectedProduct) : []),
    [selectedProduct]
  );
  const selectedAdjustUnit = adjustUnitOptions.find((o) => o.key === adjustUnitKey) ?? adjustUnitOptions[0];
  const usePackagingEntry = hasPackaging && adjustUnitOptions.length > 1;
  const adjustCount = Number(adjustQty) || 0;
  const adjustBaseUnit = selectedProduct ? getProductUnitLabel(selectedProduct) : "pcs";
  const adjustBaseAmount = adjustCount * (selectedAdjustUnit?.conversionFactor ?? 1);
  const isStockInEntry = usePackagingEntry
    ? adjustEntryType === "purchase"
    : adjustType === "add" && Number(adjustQty) > 0;
  const isLossEntry = usePackagingEntry
    ? adjustEntryType === "wastage"
    : adjustType === "add" && Number(adjustQty) < 0;
  const adjustPriceUnit = selectedAdjustUnit?.soldUnit ?? adjustBaseUnit;
  const adjustSellNum = Number(adjustSellPrice) || 0;
  const adjustCostNum = Number(adjustCostPrice) || 0;
  const adjustEntryCount = usePackagingEntry ? adjustCount : Math.abs(Number(adjustQty) || 0);
  const adjustProfitPreview = isStockInEntry && adjustEntryCount > 0
    ? calcStockEntryProfit(adjustEntryCount, adjustCostNum, adjustSellNum)
    : null;

  React.useEffect(() => {
    if (!selectedProduct || !showAdjustModal) return;
    const defaults = getStockPriceDefaults(selectedProduct, adjustUnitKey);
    setAdjustSellPrice(String(defaults.sellPrice || ""));
    setAdjustCostPrice(String(defaults.costPrice || ""));
  }, [selectedProduct, adjustUnitKey, showAdjustModal]);

  const buildPricePayload = () => {
    if (isLossEntry && adjustEntryCount > 0) {
      return {
        soldUnitCost: adjustCostNum,
        lossReason: adjustLossReason,
        ...(usePackagingEntry && selectedAdjustUnit?.key !== "base" ? { soldQty: adjustCount } : {})
      };
    }
    if (!isStockInEntry || adjustEntryCount <= 0) return {};
    return {
      soldUnitCost: adjustCostNum,
      soldUnitPrice: adjustSellNum,
      updateProductPrices: adjustUpdateProductPrices,
      ...(usePackagingEntry && selectedAdjustUnit?.key !== "base"
        ? { soldQty: adjustCount }
        : {})
    };
  };

  const handleAdjustSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;

    const baseUnit = getProductUnitLabel(selectedProduct);
    const packagingMeta =
      selectedAdjustUnit && selectedAdjustUnit.key !== "base"
        ? {
          soldQty: adjustCount,
          soldUnit: selectedAdjustUnit.soldUnit,
          packagingUnitId: selectedAdjustUnit.packagingUnitId,
          conversionFactor: selectedAdjustUnit.conversionFactor,
          baseUnit
        }
        : { baseUnit };

    if (usePackagingEntry) {
      let apiQty = adjustBaseAmount;
      let apiType = adjustEntryType;
      if (adjustEntryType === "wastage") apiQty = -adjustBaseAmount;
      adjustStockMutation.mutate({
        productId: selectedProduct._id,
        outletId: outletId ?? undefined,
        qty: apiQty,
        type: apiType,
        note: adjustNote || `${adjustEntryType === "purchase" ? "Stock received" : adjustEntryType === "wastage" ? "Stock removed" : "Stock count set"}${selectedAdjustUnit.key !== "base" ? ` (${adjustCount} ${selectedAdjustUnit.soldUnit})` : ""}`,
        ...packagingMeta,
        ...buildPricePayload()
      });
      return;
    }

    const qtyVal = Number(adjustQty);
    adjustStockMutation.mutate({
      productId: selectedProduct._id,
      outletId: outletId ?? undefined,
      qty: qtyVal,
      type: adjustType === "set" ? "adjustment" : "purchase",
      note: adjustNote || "Manual stock adjustment",
      ...packagingMeta,
      ...buildPricePayload()
    });
  };


  const handleSaveOpeningStock = () => {
    // Save starting stock sequentially as adjustments
    products.forEach((p) => {
      const targetQty = startOfDayCounts[p._id] ?? p.onHandQty;
      if (targetQty !== p.onHandQty) {
        saveOpeningStockMutation.mutate({
          productId: p._id,
          outletId,
          qty: targetQty,
          type: "adjustment",
          note: "Start of Day count adjustment"
        });
      }
    });
  };


  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Inventory & Stock Management
            </h1>
            <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 text-xs">
              Live Stock
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">
            Monitor real-time stock balances, inventory transfers, batch purchases, and shrinkage logs.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            className="h-10 px-3.5 text-xs font-semibold gap-1.5 cursor-pointer"
            onClick={() => router.push("/dashboard/stock/transfers")}
          >
            <ArrowLeftRight className="h-4 w-4" />
            <span>Inter-Outlet Transfers</span>
          </Button>
        </div>
      </div>

      {/* Tabs Menu */}
      <Tabs value={activeTab} onValueChange={(v) => setQuery({ tab: v })}>
        <TabsList className="h-10 bg-muted/60 p-0.5 border border-border/40 max-w-md">
          <TabsTrigger
            value="overview"
            className="text-xs px-3.5 py-1.5 font-semibold text-muted-foreground hover:text-foreground data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-xs transition-all gap-1.5 cursor-pointer"
          >
            <Package className="h-3.5 w-3.5" />
            <span>Stock Levels</span>
          </TabsTrigger>
          <TabsTrigger
            value="history"
            className="text-xs px-3.5 py-1.5 font-semibold text-muted-foreground hover:text-foreground data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-xs transition-all gap-1.5 cursor-pointer"
          >
            <History className="h-3.5 w-3.5" />
            <span>Movement History</span>
          </TabsTrigger>
          <TabsTrigger
            value="start-of-day"
            className="text-xs px-3.5 py-1.5 font-semibold text-muted-foreground hover:text-foreground data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-xs transition-all gap-1.5 cursor-pointer"
          >
            <Play className="h-3.5 w-3.5" />
            <span>Start of Day Count</span>
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* TAB CONTENT: Overview */}
      {activeTab === "overview" && (
        <div className="space-y-6 animate-rise">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            <StatsCard
              label="Total Catalog SKUs"
              value={formatNumber(summary?.totalSkus || 0)}
              icon={<Package className="h-5 w-5" />}
              color="primary"
            />
            <StatsCard
              label="On-Hand Total Quantity"
              value={formatNumber(summary?.onHandTotal || 0)}
              icon={<Package className="h-5 w-5" />}
            />
            <StatsCard
              label="Low Stock Alerts"
              value={summary?.lowStock || 0}
              color={summary?.lowStock ? "danger" : "default"}
              icon={<AlertTriangle className="h-5 w-5" />}
            />
          </div>

          <DataTable
            isLoading={loadingProds}
            data={products}
            keyExtractor={(p) => p._id}
            totalItems={prodTotal}
            page={query.prodPage}
            limit={query.prodLimit}
            onPageChange={(p) => setQuery({ prodPage: p })}
            onLimitChange={(size) => setQuery({ prodLimit: size, prodPage: 1 })}
            searchQuery={query.prodSearch}
            onSearchChange={(s) => setQuery({ prodSearch: s, prodPage: 1 })}
            onRefetch={() => refetchProducts()}
            placeholderText="Search products by name..."
            emptyStateText="No products in catalog."
            columns={[
              {
                key: "name", header: "Item Details",
                render: (p) => (
                  <div>
                    <p className="font-semibold text-sm text-foreground">{p.name}</p>
                    <p className="text-xs text-muted-foreground font-mono">SKU: {p.sku || "N/A"}</p>
                  </div>
                )
              },
              { key: "unit", header: "Unit" },
              {
                key: "onHandQty", header: "Available Stock",
                render: (p) => (
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <span className={`font-bold ${p.onHandQty <= p.lowStockThreshold ? "text-danger" : ""}`}>
                        {p.onHandQty} {p.unit}
                      </span>
                      {p.onHandQty <= p.lowStockThreshold && (
                        <Badge variant="warning" className="text-[10px]">Low Stock</Badge>
                      )}
                    </div>
                    {p.packagingUnits?.filter((pkg: any) => pkg.isActive !== false).map((pkg: any, idx: number) => {
                      const label = typeof pkg.unitId === "object" ? pkg.unitId.name || pkg.unitId.abbreviation : "Bulk";
                      return (
                        <div key={idx} className="text-xs text-muted font-medium bg-muted/20 px-1.5 py-0.5 rounded-sm inline-block w-fit">
                          {pkg.onHandBulkQty ?? Math.floor(p.onHandQty / pkg.qtyPerUnit)} {label} left
                        </div>
                      );
                    })}
                  </div>
                )
              },
              { key: "lowStockThreshold", header: "Low Stock Alert" },
              {
                key: "actions", header: "",
                render: (p) => (
                  <Button variant="outline" size="sm" onClick={() => openAdjustModal(p)}>
                    Adjust Stock
                  </Button>
                )
              }
            ]}
          />
        </div>
      )}

      {/* TAB CONTENT: Start of Day */}
      {activeTab === "start-of-day" && (
        <div className="space-y-6 animate-rise">
          <div className="glass-panel rounded-xl border border-border/70 p-5 shadow-soft space-y-4">
            <div className="flex justify-between items-center flex-wrap gap-4">
              <div>
                <h3 className="font-semibold text-lg">Start of Day Counting</h3>
                <p className="text-sm text-muted">Enter verified stock quantities at opening</p>
              </div>
              <Button onClick={handleSaveOpeningStock} disabled={saveOpeningStockMutation.isPending}>
                {saveOpeningStockMutation.isPending ? "Saving..." : "Save Count Settings"}
              </Button>
            </div>

            <div className="divide-y divide-border/40">
              {products.map((p) => {
                const curCount = startOfDayCounts[p._id] ?? p.onHandQty;
                return (
                  <div key={p._id} className="flex justify-between items-center py-4 flex-wrap gap-3">
                    <div>
                      <p className="font-semibold">{p.name}</p>
                      <p className="text-xs text-muted">Expected System Stock: {p.onHandQty} {p.unit}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="soft" size="sm" onClick={() => setStartOfDayCounts(c => ({ ...c, [p._id]: Math.max(0, curCount - 5) }))}>-5</Button>
                      <Button variant="soft" size="sm" onClick={() => setStartOfDayCounts(c => ({ ...c, [p._id]: Math.max(0, curCount - 1) }))}>-1</Button>
                      <Input
                        type="number"
                        value={curCount}
                        onChange={(e) => setStartOfDayCounts(c => ({ ...c, [p._id]: Math.max(0, Number(e.target.value)) }))}
                        className="w-20 text-center"
                      />
                      <Button variant="soft" size="sm" onClick={() => setStartOfDayCounts(c => ({ ...c, [p._id]: curCount + 1 }))}>+1</Button>
                      <Button variant="soft" size="sm" onClick={() => setStartOfDayCounts(c => ({ ...c, [p._id]: curCount + 5 }))}>+5</Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT: History */}
      {activeTab === "history" && (
        <div className="space-y-6 animate-rise">
          {/* IN / OUT direction tabs */}
          <div className="flex gap-1.5 rounded-2xl border border-border bg-surface/60 p-1 max-w-lg">
            {HISTORY_DIRECTION_FILTERS.map((f) => {
              const Icon = f.icon;
              return (
                <button
                  key={f.value}
                  type="button"
                  onClick={() => setQuery({ historyDirection: f.value, historyPage: 1 })}
                  className={`flex flex-1 items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-semibold transition ${query.historyDirection === f.value ? "bg-primary text-white shadow-soft" : "text-muted hover:text-text"}`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {f.label}
                </button>
              );
            })}
          </div>

          {/* Summary cards for filtered period */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
            <StatsCard
              label="Stock In"
              value={formatNumber(historySummary?.totalInQty ?? 0)}
              hint={`${historySummary?.entriesIn ?? 0} entries`}
              icon={<ArrowDownToLine className="h-5 w-5" />}
              color="success"
            />
            <StatsCard
              label="Stock Out"
              value={formatNumber(historySummary?.totalOutQty ?? 0)}
              hint={`${historySummary?.entriesOut ?? 0} entries`}
              icon={<ArrowUpFromLine className="h-5 w-5" />}
              color="danger"
            />
            <StatsCard
              label="Net Movement"
              value={formatNumber((historySummary?.totalInQty ?? 0) - (historySummary?.totalOutQty ?? 0))}
              hint={query.from || query.to ? `Stock impact for period` : "All time in filter"}
              icon={<History className="h-5 w-5" />}
            />
            <StatsCard
              label="Stock Cost"
              value={formatCurrency(historySummary?.totalCostValue ?? 0, currency)}
              hint="Spent on stock in"
              color="warning"
            />
            <StatsCard
              label="Expected Revenue"
              value={formatCurrency(historySummary?.totalSellValue ?? 0, currency)}
              hint="If sold at retail"
              color="primary"
            />
            <StatsCard
              label="Potential margin"
              value={formatCurrency(historySummary?.totalExpectedProfit ?? 0, currency)}
              hint="Unrealized gross markup"
              color={(historySummary?.totalExpectedProfit ?? 0) >= 0 ? "success" : "danger"}
            />
          </div>

          <DataTable
            isLoading={loadingHistory}
            data={history}
            keyExtractor={(e: StockHistoryEntry) => e._id}
            totalItems={historyTotal}
            page={query.historyPage}
            limit={query.historyLimit}
            onPageChange={(p) => setQuery({ historyPage: p })}
            onLimitChange={(size) => setQuery({ historyLimit: size, historyPage: 1 })}
            searchQuery={query.historySearch}
            onSearchChange={(s) => setQuery({ historySearch: s, historyPage: 1 })}
            onRefetch={() => refetchHistory()}
            placeholderText="Search product, SKU, or note..."
            emptyStateText={
              query.historyDirection === "in" ? "No stock in entries for this filter."
                : query.historyDirection === "out" ? "No stock out entries for this filter."
                  : "No stock entries for this filter."
            }
            filters={historyFilters}
            columns={historyColumns}
          />
        </div>
      )}


      {/* MODAL: Quick Adjust Stock */}
      <Modal open={showAdjustModal} onClose={() => setShowAdjustModal(false)} title="Adjust Stock Inventory" size={isStockInEntry ? "lg" : usePackagingEntry ? "md" : "sm"}>
        <form onSubmit={handleAdjustSubmit} className="space-y-4">
          <div>
            <p className="text-sm font-semibold">{selectedProduct?.name}</p>
            <p className="text-xs text-muted">Current Stock: {selectedProduct?.onHandQty} {adjustBaseUnit}</p>
          </div>

          {usePackagingEntry ? (
            <>
              <div>
                <label className="mb-1 block text-xs font-medium text-muted">Transaction</label>
                <div className="grid gap-2">
                  {ENTRY_TYPE_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setAdjustEntryType(opt.value)}
                      className={`rounded-xl border px-3 py-2 text-left transition ${adjustEntryType === opt.value ? "border-primary bg-primary/5 ring-1 ring-primary/20" : "border-border hover:border-primary/40"}`}
                    >
                      <p className="text-xs font-semibold">{opt.label}</p>
                      <p className="text-[10px] text-muted mt-0.5">{opt.hint}</p>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-muted">Count in</label>
                <div className="flex flex-wrap gap-2">
                  {adjustUnitOptions.map((opt) => (
                    <button
                      key={opt.key}
                      type="button"
                      onClick={() => setAdjustUnitKey(opt.key)}
                      className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${adjustUnitKey === opt.key ? "bg-primary text-white" : "bg-border/40 text-muted hover:text-text"}`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-muted">
                  How many {selectedAdjustUnit?.soldUnit ?? adjustBaseUnit}? *
                </label>
                <Input
                  id="adjust-qty"
                  required
                  type="number"
                  min={0}
                  step="1"
                  value={adjustQty}
                  onChange={(e) => setAdjustQty(e.target.value)}
                  placeholder={selectedAdjustUnit?.key === "base" ? "e.g. 500" : "e.g. 10 peti"}
                />
              </div>

              {adjustCount > 0 && (
                <div className="rounded-xl border border-border/60 bg-surface/40 p-3 text-xs space-y-1">
                  <div className="flex justify-between text-muted">
                    <span>Base quantity</span>
                    <span className="font-semibold text-text">{adjustBaseAmount} {adjustBaseUnit}</span>
                  </div>
                  {selectedAdjustUnit?.key !== "base" && (
                    <p className="text-[10px] text-muted">
                      {adjustCount} {selectedAdjustUnit?.soldUnit} × {selectedAdjustUnit?.conversionFactor} {adjustBaseUnit}
                    </p>
                  )}
                  <div className="flex justify-between font-medium text-text pt-1 border-t border-border/40">
                    <span>{adjustEntryType === "adjustment" ? "Stock will become" : adjustEntryType === "purchase" ? "Stock will increase by" : "Stock will decrease by"}</span>
                    <span className={adjustEntryType === "wastage" ? "text-danger" : "text-primary"}>
                      {adjustEntryType === "adjustment"
                        ? `${adjustBaseAmount} ${adjustBaseUnit}`
                        : `${adjustEntryType === "wastage" ? "-" : "+"}${adjustBaseAmount} ${adjustBaseUnit}`}
                    </span>
                  </div>
                </div>
              )}
            </>
          ) : (
            <>
              <div>
                <label className="mb-1 block text-xs font-medium text-muted">Adjustment Mode</label>
                <div className="flex gap-2 bg-border/40 p-1 rounded-xl">
                  <button type="button" onClick={() => setAdjustType("add")}
                    className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition ${adjustType === "add" ? "bg-surface text-text shadow-sm" : "text-muted"}`}>
                    Add Quantity (+/-)
                  </button>
                  <button type="button" onClick={() => setAdjustType("set")}
                    className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition ${adjustType === "set" ? "bg-surface text-text shadow-sm" : "text-muted"}`}>
                    Set Exactly
                  </button>
                </div>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-muted">Quantity ({adjustBaseUnit}) *</label>
                <Input id="adjust-qty" required type="number" value={adjustQty} onChange={(e) => setAdjustQty(e.target.value)} placeholder="e.g. 50 or -10" />
              </div>
            </>
          )}

          {isStockInEntry && (
            <div className="space-y-3 rounded-xl border border-border/60 bg-surface/40 p-3">
              <div>
                <p className="text-xs font-semibold text-text">Pricing for this stock batch</p>
                <p className="text-[10px] text-muted mt-0.5">
                  Prefilled from product defaults (change if supplier rates went up or down).
                </p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-medium text-muted">
                    Cost price per {adjustPriceUnit} ({currency})
                  </label>
                  <Input
                    type="number"
                    min={0}
                    step="0.01"
                    value={adjustCostPrice}
                    onChange={(e) => setAdjustCostPrice(e.target.value)}
                    placeholder="What you paid"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-muted">
                    Sell price per {adjustPriceUnit} ({currency})
                  </label>
                  <Input
                    type="number"
                    min={0}
                    step="0.001"
                    value={adjustSellPrice}
                    onChange={(e) => setAdjustSellPrice(e.target.value)}
                    placeholder="What you will sell at"
                  />
                </div>
              </div>

              {adjustProfitPreview && adjustEntryCount > 0 && (
                <div className="rounded-lg border border-border/50 bg-surface/60 p-2.5 text-xs space-y-1">
                  <div className="flex justify-between text-muted">
                    <span>Total cost ({adjustEntryCount} {adjustPriceUnit})</span>
                    <span>{formatCurrency(adjustProfitPreview.costValue, currency)}</span>
                  </div>
                  <div className="flex justify-between text-muted">
                    <span>Expected revenue</span>
                    <span>{formatCurrency(adjustProfitPreview.sellValue, currency)}</span>
                  </div>
                  <div className="flex justify-between font-semibold pt-1 border-t border-border/40">
                    <span>Potential margin</span>
                    <span className={adjustProfitPreview.expectedProfit >= 0 ? "text-muted" : "text-danger"}>
                      {formatCurrency(adjustProfitPreview.expectedProfit, currency)}
                    </span>
                  </div>
                  <p className="text-[10px] text-muted">Not real profit until items are sold</p>
                </div>
              )}

              <label className="flex items-center justify-between gap-3 rounded-lg border border-border/50 px-3 py-2">
                <div>
                  <p className="text-xs font-medium">Update product default prices</p>
                  <p className="text-[10px] text-muted">Save these as the new default sell &amp; cost price</p>
                </div>
                <Switch
                  checked={adjustUpdateProductPrices}
                  onCheckedChange={setAdjustUpdateProductPrices}
                />
              </label>
            </div>
          )}

          {isLossEntry && (
            <div className="space-y-3 rounded-xl border border-danger/30 bg-danger/5 p-3">
              <div>
                <p className="text-xs font-semibold text-text">Record loss (not a sale)</p>
                <p className="text-[10px] text-muted mt-0.5">
                  This reduces net profit on the Profit &amp; Loss page.
                </p>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-muted">Loss reason</label>
                <Select
                  value={adjustLossReason}
                  onValueChange={setAdjustLossReason}
                  options={[
                    { value: "spoilage", label: "Spoilage" },
                    { value: "expiry", label: "Expired" },
                    { value: "damage", label: "Damaged" },
                    { value: "customer_return_spoiled", label: "Customer return (spoiled)" },
                    { value: "owner_replacement", label: "Owner replacement" },
                    { value: "other", label: "Other" }
                  ]}
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-muted">
                  Cost per {adjustPriceUnit} ({currency}) (for loss calculation)
                </label>
                <Input
                  type="number"
                  min={0}
                  step="0.01"
                  value={adjustCostPrice}
                  onChange={(e) => setAdjustCostPrice(e.target.value)}
                />
              </div>
              {adjustEntryCount > 0 && adjustCostNum > 0 && (
                <p className="text-sm font-semibold text-danger">
                  Loss: {formatCurrency(adjustEntryCount * adjustCostNum, currency)}
                </p>
              )}
            </div>
          )}

          <div>
            <label className="mb-1 block text-xs font-medium text-muted">Note</label>
            <Input id="adjust-note" value={adjustNote} onChange={(e) => setAdjustNote(e.target.value)} placeholder="e.g. Received shipment from supplier" />
          </div>
          {adjustError && <p className="text-xs text-danger">{adjustError}</p>}
          <div className="flex gap-3 pt-2">
            <Button variant="outline" type="button" className="flex-1" onClick={() => setShowAdjustModal(false)}>Cancel</Button>
            <Button type="submit" className="flex-1" disabled={adjustStockMutation.isPending || !adjustQty}>
              {adjustStockMutation.isPending ? "Adjusting..." : "Apply Adjustment"}
            </Button>
          </div>
        </form>
      </Modal>


      {/* MODAL: Delete Stock Entry */}
      <Modal open={!!deleteEntryId} onClose={() => setDeleteEntryId(null)} title="Revert Stock Entry" size="sm">
        <div className="space-y-4">
          <p className="text-sm text-muted">
            Are you sure you want to revert this stock entry? This will reverse the stock changes on this product and permanently delete this history record.
          </p>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" type="button" onClick={() => setDeleteEntryId(null)}>Cancel</Button>
            <Button variant="destructive" disabled={deleteEntryMutation.isPending} onClick={() => {
              if (deleteEntryId) {
                deleteEntryMutation.mutate(deleteEntryId);
              }
            }}>
              {deleteEntryMutation.isPending ? "Reverting..." : "Yes, Revert Entry"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
