"use client";

import * as React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Package, ArrowLeftRight, History, Play, AlertTriangle,
  Calendar, ArrowDownToLine, ArrowUpFromLine, List, Search, RefreshCw
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { Select } from "@/components/ui/select";
import { DataTable } from "@/components/ui/data-table";
import { StatsCard } from "@/components/ui/stats-card";
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

function buildHistoryColumns(): Parameters<typeof DataTable<StockHistoryEntry>>[0]["columns"] {
  return [
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
          <span className="text-xs text-muted">{formatCurrency(e.expectedProfit)}</span>
        ) : (
          <span className="text-xs text-muted">—</span>
        )
    },
    {
      key: "loss",
      header: "Loss",
      render: (e: StockHistoryEntry) =>
        e.qty > 0 && e.costLoss != null && e.costLoss > 0 ? (
          <span className="text-xs font-semibold text-danger">{formatCurrency(e.costLoss)}</span>
        ) : (
          <span className="text-xs text-muted">—</span>
        )
    },
    {
      key: "profit",
      header: "Real profit",
      render: (e: StockHistoryEntry) =>
        e.type === "sale" && e.realizedProfit != null ? (
          <span className={`text-xs font-semibold ${e.realizedProfit >= 0 ? "text-green-600" : "text-danger"}`}>
            {formatCurrency(e.realizedProfit)}
          </span>
        ) : (
          <span className="text-xs text-muted">—</span>
        )
    },
    {
      key: "value",
      header: "Cost / Sell",
      render: (e: StockHistoryEntry) =>
        e.qty > 0 && (e.costValue != null || e.sellValue != null) ? (
          <span className="text-[10px] text-muted whitespace-nowrap">
            {formatCurrency(e.costValue ?? 0)} → {formatCurrency(e.sellValue ?? 0)}
          </span>
        ) : (
          <span className="text-xs text-muted">—</span>
        )
    },
    {
      key: "by",
      header: "By",
      render: (e: StockHistoryEntry) => (
        <span className="text-xs text-muted">{e.createdBy?.name || (e.referenceType === "Order" ? "Billing" : "—")}</span>
      )
    },
    {
      key: "note",
      header: "Note",
      render: (e: StockHistoryEntry) => (
        <span className="text-xs text-muted truncate max-w-[180px] block" title={e.note || ""}>
          {e.note || "—"}
        </span>
      )
    }
  ];
}

const TRANSFER_STATUS_COLORS: Record<string, "soft" | "warning" | "default" | "danger"> = {
  pending: "warning",
  approved: "soft",
  completed: "soft",
  rejected: "danger"
};

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
  { value: "adjustment", label: "Set exact count", hint: "Set total stock to an exact amount" }
] as const;

export default function StockPage() {
  const { token, outletId } = useAuth();
  const hasPackaging = useFeature("packaging_units");
  const qc = useQueryClient();
  const [activeTab, setActiveTab] = React.useState<"overview" | "start-of-day" | "history" | "transfers">("overview");

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

  // Transfer Dialog State
  const [showTransferModal, setShowTransferModal] = React.useState(false);
  const [transferTargetOutlet, setTransferTargetOutlet] = React.useState("");
  const [transferItems, setTransferItems] = React.useState<{ productId: string; qty: number }[]>([]);
  const [transferNote, setTransferNote] = React.useState("");

  // Start of day count state
  const [startOfDayCounts, setStartOfDayCounts] = React.useState<Record<string, number>>({});

  // Overview Tab State
  const [prodSearch, setProdSearch] = React.useState("");
  const [prodPage, setProdPage] = React.useState(1);
  const [prodLimit, setProdLimit] = React.useState(10);
  // History Tab State
  const [historySearch, setHistorySearch] = React.useState("");
  const [historyDirection, setHistoryDirection] = React.useState<"all" | "in" | "out">("all");
  const [historyTypeFilter, setHistoryTypeFilter] = React.useState("");
  const [historyStartDate, setHistoryStartDate] = React.useState("");
  const [historyEndDate, setHistoryEndDate] = React.useState("");
  const [historyPage, setHistoryPage] = React.useState(1);
  const [historyLimit, setHistoryLimit] = React.useState(50);
  // Transfers Tab State
  const [transferSearch, setTransferSearch] = React.useState("");
  const [transferPage, setTransferPage] = React.useState(1);
  const [transferLimit, setTransferLimit] = React.useState(50);

  // API Queries
  const { data: prodData, isLoading: loadingProds, refetch: refetchProducts } = useQuery({
    queryKey: ["products", outletId, prodSearch, prodPage, prodLimit],
    queryFn: () => getJsonWithMeta<Product[]>("/products", token, { outletId: outletId ?? undefined, search: prodSearch || undefined, page: prodPage, limit: prodLimit }),
    // enable when we have a token and the tab needs it
    enabled: Boolean(token) && activeTab !== "history"
  });

  const { data: summaryData } = useQuery({
    queryKey: ["stock-summary", outletId],
    queryFn: () => getJson<StockSummary>("/stock/summary", token, { outletId: outletId ?? undefined }),
    enabled: Boolean(token && outletId) && activeTab === "overview"
  });

  const { data: historyData, isLoading: loadingHistory, refetch: refetchHistory } = useQuery({
    queryKey: ["stock-history", outletId, historySearch, historyDirection, historyTypeFilter, historyStartDate, historyEndDate, historyPage, historyLimit],
    queryFn: () =>
      getJson<{ entries: StockHistoryEntry[]; total: number; summary: StockHistorySummary }>("/stock/history", token, {
        outletId: outletId ?? undefined,
        search: historySearch || undefined,
        direction: historyDirection === "all" ? undefined : historyDirection,
        type: historyTypeFilter || undefined,
        startDate: historyStartDate || undefined,
        endDate: historyEndDate || undefined,
        page: historyPage,
        limit: historyLimit
      }),
    enabled: Boolean(token && outletId) && activeTab === "history"
  });

  const { data: transfersData, isLoading: loadingTransfers, refetch: refetchTransfers } = useQuery({
    queryKey: ["stock-transfers", transferSearch, transferPage, transferLimit],
    queryFn: () => getJson<{ transfers: StockTransfer[]; total: number }>("/stock/transfers", token, { search: transferSearch || undefined, page: transferPage, limit: transferLimit }),
    enabled: Boolean(token) && activeTab === "transfers"
  });

  const { data: outletsData } = useQuery({
    queryKey: ["outlets"],
    queryFn: () => getJson<{ outlets: Outlet[] }>("/outlets", token),
    enabled: Boolean(token) && activeTab === "transfers"
  });

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

  const transferStockMutation = useMutation({
    mutationFn: (body: unknown) => stockService.createTransfer(body, token),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["products"] });
      qc.invalidateQueries({ queryKey: ["stock-transfers"] });
      setShowTransferModal(false);
      toast.success("Transfer request submitted");
    },
    onError: (err) => toast.error(getErrorMessage(err, "Failed to transfer stock"))
  });

  const approveTransferMutation = useMutation({
    mutationFn: (id: string) => stockService.approveTransfer(id, token),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["products"] });
      qc.invalidateQueries({ queryKey: ["stock-transfers"] });
      toast.success("Transfer approved");
    },
    onError: (err) => toast.error(getErrorMessage(err, "Failed to approve transfer"))
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
      setActiveTab("overview");
      toast.success("Opening stock saved");
    },
    onError: (err: unknown) => toast.error(getErrorMessage(err, "Failed to save opening stock"))
  });

  const products: Product[] = prodData?.data ?? [];
  const summary = summaryData;
  const history = historyData?.entries ?? [];
  const historyTotal = historyData?.total ?? 0;
  const historySummary = historyData?.summary;
  const historyTotalPages = Math.ceil(historyTotal / historyLimit) || 1;
  const historyColumns = React.useMemo(() => buildHistoryColumns(), []);
  const historyInEntries = history.filter((e) => e.qty > 0);
  const historyOutEntries = history.filter((e) => e.qty < 0);

  const transfers = transfersData?.transfers ?? [];
  const transferTotal = transfersData?.total ?? 0;

  const prodMeta = prodData?.meta?.pagination;
  const prodTotal = prodMeta?.total ?? products.length;
  const outlets = (outletsData?.outlets ?? []).filter((o) => o._id !== outletId);

  const historyFilters = (
    <>
      <div className="flex flex-wrap items-center gap-2">
        <Calendar className="h-4 w-4 text-muted shrink-0" />
        <Input
          type="date"
          value={historyStartDate}
          onChange={(e) => { setHistoryStartDate(e.target.value); setHistoryPage(1); }}
          className="w-36 h-9"
        />
        <span className="text-xs text-muted">to</span>
        <Input
          type="date"
          value={historyEndDate}
          onChange={(e) => { setHistoryEndDate(e.target.value); setHistoryPage(1); }}
          className="w-36 h-9"
        />
        {(historyStartDate || historyEndDate || historySearch || historyTypeFilter) && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setHistorySearch("");
              setHistoryStartDate("");
              setHistoryEndDate("");
              setHistoryTypeFilter("");
              setHistoryPage(1);
            }}
          >
            Clear
          </Button>
        )}
      </div>
      <div className="flex flex-wrap gap-2">
        {HISTORY_DATE_PRESETS.map((p) => (
          <button
            key={p.key}
            type="button"
            onClick={() => {
              const { startDate, endDate } = getHistoryDatePreset(p.key);
              setHistoryStartDate(startDate);
              setHistoryEndDate(endDate);
              setHistoryPage(1);
            }}
            className="rounded-full border border-border px-3 py-1 text-[10px] font-semibold text-muted hover:text-text hover:border-primary/40 transition"
          >
            {p.label}
          </button>
        ))}
      </div>
      <div className="flex flex-wrap gap-2">
        {HISTORY_TYPE_FILTERS.map((f) => (
          <button
            key={f.value || "all"}
            type="button"
            onClick={() => { setHistoryTypeFilter(f.value); setHistoryPage(1); }}
            className={`rounded-full px-3 py-1 text-[10px] font-semibold transition ${historyTypeFilter === f.value ? "bg-primary/10 text-primary border border-primary/30" : "bg-surface border border-border text-muted hover:text-text"}`}
          >
            {f.label}
          </button>
        ))}
      </div>
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
        note: adjustNote || `${adjustEntryType === "purchase" ? "Stock received" : adjustEntryType === "wastage" ? "Stock removed" : "Stock count set"}${selectedAdjustUnit.key !== "base" ? ` — ${adjustCount} ${selectedAdjustUnit.soldUnit}` : ""}`,
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

  const handleTransferSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!transferTargetOutlet || transferItems.length === 0) return;
    transferStockMutation.mutate({
      fromOutletId: outletId,
      toOutletId: transferTargetOutlet,
      items: transferItems.map((item) => {
        const prod = products.find((p) => p._id === item.productId);
        return {
          productId: item.productId,
          productName: prod?.name || "Unknown",
          qty: item.qty,
          unit: prod?.unit || "pcs"
        };
      }),
      note: transferNote
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

  const addTransferItemRow = () => {
    if (products.length === 0) return;
    setTransferItems([...transferItems, { productId: products[0]._id, qty: 1 }]);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Inventory</h1>
          <p className="text-sm text-muted">Monitor stock levels, adjustments, and transfers</p>
        </div>
        <div className="flex gap-2">
          {activeTab === "transfers" && (
            <Button id="new-transfer-btn" onClick={() => setShowTransferModal(true)}>
              <ArrowLeftRight className="h-4 w-4" /> Request Transfer
            </Button>
          )}
        </div>
      </div>

      {/* Tabs Menu */}
      <div className="flex gap-1.5 rounded-2xl border border-border bg-surface/60 p-1 backdrop-blur max-w-lg">
        {[
          { id: "overview", label: "Overview", icon: Package },
          { id: "start-of-day", label: "Start of Day", icon: Play },
          { id: "history", label: "History", icon: History },
          { id: "transfers", label: "Transfers", icon: ArrowLeftRight }
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`flex-1 flex items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-semibold transition ${activeTab === tab.id ? "bg-primary text-white shadow-soft" : "text-muted hover:text-text"}`}
            >
              <Icon className="h-3.5 w-3.5" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* TAB CONTENT: Overview */}
      {activeTab === "overview" && (
        <div className="space-y-6 animate-rise">
          <div className="grid gap-4 sm:grid-cols-3">
            <StatsCard label="Total SKUs" value={formatNumber(summary?.totalSkus || 0)} icon={<Package className="h-5 w-5" />} />
            <StatsCard label="On Hand Total" value={formatNumber(summary?.onHandTotal || 0)} />
            <StatsCard label="Low Stock Items" value={summary?.lowStock || 0} color={summary?.lowStock ? "danger" : "default"} icon={<AlertTriangle className="h-5 w-5" />} />
          </div>

          <DataTable
            isLoading={loadingProds}
            data={products}
            keyExtractor={(p) => p._id}
            totalItems={prodTotal}
            page={prodPage}
            limit={prodLimit}
            onPageChange={setProdPage}
            onLimitChange={(size) => { setProdLimit(size); setProdPage(1); }}
            searchQuery={prodSearch}
            onSearchChange={setProdSearch}
            onRefetch={() => refetchProducts()}
            placeholderText="Search products by name..."
            emptyStateText="No products in catalog."
            columns={[
              {
                key: "name", header: "Item Details",
                render: (p) => (
                  <div>
                    <p className="font-semibold">{p.name}</p>
                    <p className="text-xs text-muted">SKU: {p.sku || "—"}</p>
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
          <div className="glass-panel rounded-3xl border border-border/70 p-5 shadow-soft space-y-4">
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
                  onClick={() => { setHistoryDirection(f.value); setHistoryPage(1); }}
                  className={`flex flex-1 items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-semibold transition ${historyDirection === f.value ? "bg-primary text-white shadow-soft" : "text-muted hover:text-text"}`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {f.label}
                </button>
              );
            })}
          </div>

          {/* Summary cards for filtered period */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
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
              hint={historyStartDate || historyEndDate ? `${historyStartDate || "…"} → ${historyEndDate || "…"}` : "All time in filter"}
              icon={<History className="h-5 w-5" />}
            />
            <StatsCard
              label="Stock Cost"
              value={formatCurrency(historySummary?.totalCostValue ?? 0)}
              hint="Money spent on stock in"
              color="warning"
            />
            <StatsCard
              label="Expected Revenue"
              value={formatCurrency(historySummary?.totalSellValue ?? 0)}
              hint="If all stock in sells at entry price"
              color="primary"
            />
            <StatsCard
              label="Potential margin"
              value={formatCurrency(historySummary?.totalExpectedProfit ?? 0)}
              hint="If stock-in sells at entry price — NOT profit yet"
              color={(historySummary?.totalExpectedProfit ?? 0) >= 0 ? "success" : "danger"}
            />
          </div>

          {/* Split view when All Ledger selected */}
          {historyDirection === "all" ? (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-3 items-center justify-between flex-wrap rounded-xl border border-border bg-card p-4">
                <div className="flex-1 flex items-center gap-2 min-w-0">
                  <Search className="h-4 w-4 text-muted shrink-0" />
                  <Input
                    type="text"
                    placeholder="Search product, SKU, or note..."
                    value={historySearch}
                    onChange={(e) => { setHistorySearch(e.target.value); setHistoryPage(1); }}
                    className="flex-1 h-9"
                  />
                </div>
                <Button variant="outline" size="sm" onClick={() => refetchHistory()} disabled={loadingHistory}>
                  <RefreshCw className={`h-4 w-4 ${loadingHistory ? "animate-spin" : ""}`} />
                  Refetch
                </Button>
              </div>
              <div className="rounded-xl border border-border bg-card p-4 space-y-3">
                {historyFilters}
              </div>
              <div className="grid gap-6 xl:grid-cols-2">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <ArrowDownToLine className="h-4 w-4 text-green-600" />
                    <h3 className="text-sm font-semibold">Stock In</h3>
                    <Badge variant="soft" className="text-[10px]">{historyInEntries.length} on page</Badge>
                  </div>
                  <DataTable
                    isLoading={loadingHistory}
                    data={historyInEntries}
                    keyExtractor={(e: StockHistoryEntry) => e._id}
                    emptyStateText="No stock in entries for this filter."
                    hidePagination
                    columns={historyColumns}
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <ArrowUpFromLine className="h-4 w-4 text-danger" />
                    <h3 className="text-sm font-semibold">Stock Out</h3>
                    <Badge variant="danger" className="text-[10px]">{historyOutEntries.length} on page</Badge>
                  </div>
                  <DataTable
                    isLoading={loadingHistory}
                    data={historyOutEntries}
                    keyExtractor={(e: StockHistoryEntry) => e._id}
                    emptyStateText="No stock out entries for this filter."
                    hidePagination
                    columns={historyColumns}
                  />
                </div>
              </div>
              {historyTotal > 0 && (
                <Pagination
                  page={historyPage}
                  totalPages={historyTotalPages}
                  pageSize={historyLimit}
                  onPageChange={setHistoryPage}
                  onPageSizeChange={(size) => { setHistoryLimit(size); setHistoryPage(1); }}
                />
              )}
            </div>
          ) : (
            <DataTable
              isLoading={loadingHistory}
              data={history}
              keyExtractor={(e: StockHistoryEntry) => e._id}
              totalItems={historyTotal}
              page={historyPage}
              limit={historyLimit}
              onPageChange={setHistoryPage}
              onLimitChange={(size) => { setHistoryLimit(size); setHistoryPage(1); }}
              searchQuery={historySearch}
              onSearchChange={setHistorySearch}
              onRefetch={() => refetchHistory()}
              placeholderText="Search product, SKU, or note..."
              emptyStateText={historyDirection === "in" ? "No stock in entries for this filter." : "No stock out entries for this filter."}
              filters={historyFilters}
              columns={historyColumns}
            />
          )}
        </div>
      )}

      {/* TAB CONTENT: Transfers */}
      {activeTab === "transfers" && (
        <div className="space-y-6 animate-rise">
          <DataTable
            isLoading={loadingTransfers}
            data={transfers}
            keyExtractor={(t: StockTransfer) => t._id}
            totalItems={transferTotal}
            page={transferPage}
            limit={transferLimit}
            onPageChange={setTransferPage}
            onLimitChange={(size) => { setTransferLimit(size); setTransferPage(1); }}
            searchQuery={transferSearch}
            onSearchChange={setTransferSearch}
            onRefetch={() => refetchTransfers()}
            placeholderText="Search transfers..."
            emptyStateText="No inventory transfers logged."
            columns={[
              {
                key: "createdAt", header: "Date Requested",
                render: (t: StockTransfer) => <span className="text-xs text-muted">{new Date(t.createdAt).toLocaleDateString("en-IN")}</span>
              },
              {
                key: "route", header: "Route",
                render: (t: StockTransfer) => (
                  <span className="text-xs font-semibold">
                    {t.fromOutletId?.name} ➔ {t.toOutletId?.name}
                  </span>
                )
              },
              {
                key: "items", header: "Items (Qty)",
                render: (t: StockTransfer) => (
                  <div className="flex flex-col gap-0.5">
                    {t.items.map((item: any, idx: number) => (
                      <span key={idx} className="text-xs text-muted">
                        • {item.productName} ({item.qty} {item.unit})
                      </span>
                    ))}
                  </div>
                )
              },
              {
                key: "status", header: "Status",
                render: (t: StockTransfer) => <Badge variant={TRANSFER_STATUS_COLORS[t.status] || "secondary"} className="capitalize text-xs">{t.status}</Badge>
              },
              {
                key: "requestedBy", header: "Requested By",
                render: (t: StockTransfer) => <span className="text-xs text-muted">{t.requestedBy?.name || "System"}</span>
              },
              {
                key: "actions", header: "",
                render: (t: StockTransfer) => (
                  <div className="flex gap-2">
                    {t.status === "pending" && t.toOutletId?._id === outletId && (
                      <Button variant="default" size="sm" onClick={() => approveTransferMutation.mutate(t._id)}
                        disabled={approveTransferMutation.isPending}>
                        Approve & Receive
                      </Button>
                    )}
                  </div>
                )
              }
            ]}
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
                  Prefilled from product defaults — change if supplier rates went up or down.
                </p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-medium text-muted">
                    Cost price per {adjustPriceUnit} (₹)
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
                    Sell price per {adjustPriceUnit} (₹)
                  </label>
                  <Input
                    type="number"
                    min={0}
                    step="0.01"
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
                    <span>{formatCurrency(adjustProfitPreview.costValue)}</span>
                  </div>
                  <div className="flex justify-between text-muted">
                    <span>Expected revenue</span>
                    <span>{formatCurrency(adjustProfitPreview.sellValue)}</span>
                  </div>
                  <div className="flex justify-between font-semibold pt-1 border-t border-border/40">
                    <span>Potential margin</span>
                    <span className={adjustProfitPreview.expectedProfit >= 0 ? "text-muted" : "text-danger"}>
                      {formatCurrency(adjustProfitPreview.expectedProfit)}
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
                  Cost per {adjustPriceUnit} (₹) — for loss calculation
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
                  Loss: {formatCurrency(adjustEntryCount * adjustCostNum)}
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

      {/* MODAL: Create Stock Transfer Request */}
      <Modal open={showTransferModal} onClose={() => setShowTransferModal(false)} title="Request Stock Transfer" size="md">
        <form onSubmit={handleTransferSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-muted">Destination Outlet *</label>
            <Select id="transfer-target" value={transferTargetOutlet} onValueChange={setTransferTargetOutlet}
              options={outlets.map((o) => ({ value: o._id, label: o.name }))} placeholder="Select destination location..." />
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-xs font-medium text-muted">Products & Quantities</label>
              <Button type="button" variant="soft" size="xs" onClick={addTransferItemRow}>Add Item</Button>
            </div>

            <div className="space-y-2 max-h-48 overflow-y-auto">
              {transferItems.map((item, idx) => (
                <div key={idx} className="flex gap-2 items-center">
                  <div className="flex-1">
                    <Select
                      options={products.map((p) => ({ value: p._id, label: p.name }))}
                      value={item.productId}
                      onValueChange={(val) => {
                        const copy = [...transferItems];
                        copy[idx].productId = val;
                        setTransferItems(copy);
                      }}
                    />
                  </div>
                  <Input
                    type="number"
                    min={1}
                    value={item.qty}
                    onChange={(e) => {
                      const copy = [...transferItems];
                      copy[idx].qty = Number(e.target.value);
                      setTransferItems(copy);
                    }}
                    className="w-20"
                  />
                  <Button type="button" variant="ghost" size="icon" className="text-danger"
                    onClick={() => setTransferItems(transferItems.filter((_, i) => i !== idx))}>
                    ✕
                  </Button>
                </div>
              ))}
              {transferItems.length === 0 && (
                <p className="text-xs text-muted italic">Click "Add Item" to add products to transfer list.</p>
              )}
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-muted">Transfer Note</label>
            <Input id="transfer-note" value={transferNote} onChange={(e) => setTransferNote(e.target.value)} placeholder="e.g. Urgent stock shortage" />
          </div>

          <div className="flex gap-3 pt-2">
            <Button variant="outline" type="button" className="flex-1" onClick={() => setShowTransferModal(false)}>Cancel</Button>
            <Button type="submit" className="flex-1" disabled={transferStockMutation.isPending || transferItems.length === 0 || !transferTargetOutlet}>
              {transferStockMutation.isPending ? "Sending..." : "Submit Transfer Request"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
