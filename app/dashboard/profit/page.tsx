"use client";

import * as React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  TrendingUp, TrendingDown, Package, AlertTriangle, RotateCcw,
  Gift, Trash2, Plus, Calendar, Search, Info
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { Select } from "@/components/ui/select";
import { DataTable } from "@/components/ui/data-table";
import { StatsCard } from "@/components/ui/stats-card";
import { useAuth } from "@/components/auth/auth-provider";
import { reportService } from "@/services/report.service";
import { apiFetch } from "@/lib/api-client";
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
  getStockPriceDefaults
} from "@/lib/productUtils";
import type { Product } from "@/lib/types";

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
};

const ISSUE_TYPES = [
  {
    value: "spoilage",
    label: "Spoilage / expiry",
    hint: "Stock went bad before selling — recorded as loss",
    type: "wastage" as const,
    lossReason: "spoilage" as const
  },
  {
    value: "customer_return_spoiled",
    label: "Customer return (spoiled)",
    hint: "Customer brought spoiled item — loss, not restocked",
    type: "wastage" as const,
    lossReason: "customer_return_spoiled" as const
  },
  {
    value: "customer_return_good",
    label: "Customer return (good)",
    hint: "Good item returned — restocked, no loss",
    type: "return" as const,
    lossReason: undefined
  },
  {
    value: "owner_replacement",
    label: "Owner replacement",
    hint: "You replaced spoiled item for customer — your cost",
    type: "wastage" as const,
    lossReason: "owner_replacement" as const
  }
];

function getDefaultDateRange() {
  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - 29);
  return {
    from: start.toISOString().split("T")[0] + "T00:00:00.000Z",
    to: end.toISOString().split("T")[0] + "T23:59:59.999Z"
  };
}

function moneyImpact(row: LedgerMovement): { label: string; value: number; tone: "profit" | "loss" | "muted" } {
  if (row.isLoss && row.costLoss > 0) {
    return { label: "Loss", value: -row.costLoss, tone: "loss" };
  }
  if (row.category === "sale" && row.realizedProfit !== 0) {
    return { label: "Real profit", value: row.realizedProfit, tone: row.realizedProfit >= 0 ? "profit" : "loss" };
  }
  if (row.category === "stock_in" && row.potentialMargin !== 0) {
    return { label: "Potential margin", value: row.potentialMargin, tone: "muted" };
  }
  if (row.realizedRevenue > 0) {
    return { label: "Revenue", value: row.realizedRevenue, tone: "profit" };
  }
  return { label: "—", value: 0, tone: "muted" };
}

export default function ProfitPage() {
  const { user, token, outletId } = useAuth();
  const currency = user?.currency || "INR";
  const qc = useQueryClient();
  const defaults = React.useMemo(getDefaultDateRange, []);
  
  const [query, setQuery] = useQueryStates({
    from: parseAsString.withDefault(defaults.from),
    to: parseAsString.withDefault(defaults.to),
    ledgerSearch: parseAsString.withDefault("")
  });

  const [showIssueModal, setShowIssueModal] = React.useState(false);
  const [prodSearch, setProdSearch] = React.useState("");
  const [selectedProduct, setSelectedProduct] = React.useState<Product | null>(null);
  const [issueType, setIssueType] = React.useState(ISSUE_TYPES[0].value);
  const [issueQty, setIssueQty] = React.useState("1");
  const [issueUnitKey, setIssueUnitKey] = React.useState("base");
  const [issueCost, setIssueCost] = React.useState("");
  const [issueNote, setIssueNote] = React.useState("");

  // Ledger state
  const [editEntry, setEditEntry] = React.useState<LedgerMovement | null>(null);
  const [deleteEntry, setDeleteEntry] = React.useState<LedgerMovement | null>(null);

  // Edit form state
  const [editQty, setEditQty] = React.useState("");
  const [editReason, setEditReason] = React.useState("");
  const [editNote, setEditNote] = React.useState("");

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["profit-ledger", outletId, query.from, query.to, query.ledgerSearch],
    queryFn: () =>
      reportService.getProfitLedger(token!, {
        outletId: outletId ?? undefined,
        from: query.from,
        to: query.to,
        search: query.ledgerSearch || undefined,
        limit: 100
      }),
    enabled: Boolean(token)
  });

  const { data: prodData } = useQuery({
    queryKey: ["products-profit-picker", outletId, prodSearch],
    queryFn: () =>
      productService.getProductsWithOffset(token!, {
        outletId: outletId ?? undefined,
        search: prodSearch || undefined,
        limit: 30
      }),
    enabled: Boolean(token) && showIssueModal
  });

  const products = prodData?.data ?? [];
  const summary = data?.summary;
  const movements: any[] = data?.movements ?? [];

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
      toast.success("Stock issue recorded successfully");
      setShowIssueModal(false);
      setIssueQty("1");
      setIssueNote("");
      setSelectedProduct(null);
      qc.invalidateQueries({ queryKey: ["profit-ledger"] });
      qc.invalidateQueries({ queryKey: ["products"] });
      refetch();
    },
    onError: (err) => toast.error(getErrorMessage(err, "Failed to record issue"))
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
    onError: (err) => toast.error(getErrorMessage(err, "Failed to update entry"))
  });

  const deleteMutation = useMutation({
    mutationFn: () => stockService.deleteStockEntry(deleteEntry!._id, token!),
    onSuccess: () => {
      toast.success("Ledger entry deleted, stock reverted");
      setDeleteEntry(null);
      qc.invalidateQueries({ queryKey: ["profit-ledger"] });
      qc.invalidateQueries({ queryKey: ["products"] });
      refetch();
    },
    onError: (err) => toast.error(getErrorMessage(err, "Failed to delete entry"))
  });

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editEntry) return;
    const qtyNum = Number(editQty);
    if (isNaN(qtyNum)) return toast.error("Invalid quantity");
    editMutation.mutate({
      qty: editEntry.qty < 0 ? -Math.abs(qtyNum) : Math.abs(qtyNum), 
      lossReason: editReason,
      note: editNote
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
            baseUnit
          }
        : { baseUnit, soldQty: issueCount, soldUnit: selectedUnit?.soldUnit ?? baseUnit };

    if (isGoodReturn) {
      issueMutation.mutate({
        productId: selectedProduct._id,
        outletId,
        qty: baseQty,
        type: "return",
        note: issueNote || "Customer return — good condition, restocked",
        soldUnitCost: costNum,
        ...packagingMeta
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
      ...packagingMeta
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <TrendingUp className="h-6 w-6 text-primary" /> Profit &amp; Loss Ledger
          </h1>
          <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
            Separates <strong>potential margin</strong> (stock bought, not sold yet) from{" "}
            <strong>real profit</strong> (actual sales) and <strong>losses</strong> (spoilage, spoiled returns, replacements).
          </p>
        </div>
        <Button className="gap-1.5" onClick={() => setShowIssueModal(true)}>
          <Plus className="h-4 w-4" /> Record stock issue
        </Button>
      </div>

      <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4 text-sm space-y-2">
        <p className="font-semibold flex items-center gap-2">
          <Info className="h-4 w-4 text-primary" /> How to read this page
        </p>
        <ul className="text-muted-foreground text-xs space-y-1 list-disc pl-5">
          <li><span className="text-foreground font-medium">Stock received</span> — shows potential margin if everything sells. This is NOT profit yet.</li>
          <li><span className="text-foreground font-medium">Sales</span> — real profit only when a customer pays.</li>
          <li><span className="text-foreground font-medium">Spoilage / spoiled return</span> — money lost on unsold or bad stock.</li>
          <li><span className="text-foreground font-medium">Owner replacement</span> — you gave a free replacement; counts as your cost.</li>
        </ul>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <JollyDateRangePicker 
          label="Date Filter"
          value={(query.from && query.to) ? { start: parseDate(query.from.split('T')[0]), end: parseDate(query.to.split('T')[0]) } : null}
          onChange={(val) => {
            if (val) {
              setQuery({ 
                from: val.start.toString() + "T00:00:00.000Z", 
                to: val.end.toString() + "T23:59:59.999Z" 
              });
            } else {
              setQuery({ from: defaults.from, to: defaults.to });
            }
          }}
        />
      </div>

      <div>
        <p className="text-xs uppercase tracking-wide text-muted-foreground mb-3 font-semibold">Real money (sold &amp; lost)</p>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatsCard
            label="Sales revenue"
            value={isLoading ? "…" : formatCurrency(summary?.realizedRevenue ?? 0, currency)}
            hint={`${summary?.ordersCount ?? 0} completed bills`}
            icon={<TrendingUp className="h-5 w-5" />}
            color="primary"
          />
          <StatsCard
            label="Cost of goods sold"
            value={isLoading ? "…" : formatCurrency(summary?.realizedCost ?? 0, currency)}
            hint="Product cost on sold items"
            color="warning"
          />
          <StatsCard
            label="Gross profit (real)"
            value={isLoading ? "…" : formatCurrency(summary?.realizedGrossProfit ?? 0, currency)}
            hint="Revenue − COGS — only from sales"
            icon={<TrendingUp className="h-5 w-5" />}
            color="success"
          />
          <StatsCard
            label="Net after losses"
            value={isLoading ? "…" : formatCurrency(summary?.netProfit ?? 0, currency)}
            hint="Gross profit − spoilage/returns/replacements"
            color={(summary?.netProfit ?? 0) >= 0 ? "success" : "danger"}
          />
        </div>
      </div>

      <div>
        <p className="text-xs uppercase tracking-wide text-muted-foreground mb-3 font-semibold">Losses &amp; shrinkage</p>
        <div className="grid gap-4 sm:grid-cols-3">
          <StatsCard
            label="Spoilage / damage"
            value={isLoading ? "…" : formatCurrency(summary?.spoilageLoss ?? 0, currency)}
            hint="Expired or damaged before sale"
            icon={<Trash2 className="h-5 w-5" />}
            color="danger"
          />
          <StatsCard
            label="Spoiled returns"
            value={isLoading ? "…" : formatCurrency(summary?.returnLoss ?? 0, currency)}
            hint="Customer returned spoiled goods"
            icon={<RotateCcw className="h-5 w-5" />}
            color="danger"
          />
          <StatsCard
            label="Owner replacements"
            value={isLoading ? "…" : formatCurrency(summary?.replacementCost ?? 0, currency)}
            hint="Free replacements you gave"
            icon={<Gift className="h-5 w-5" />}
            color="warning"
          />
        </div>
      </div>

      <div>
        <p className="text-xs uppercase tracking-wide text-muted-foreground mb-3 font-semibold">Not sold yet (potential only)</p>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatsCard
            label="Stock invested (period)"
            value={isLoading ? "…" : formatCurrency(summary?.stockInvested ?? 0, currency)}
            hint="Cost of stock received in date range"
            icon={<Package className="h-5 w-5" />}
          />
          <StatsCard
            label="Potential margin (period)"
            value={isLoading ? "…" : formatCurrency(summary?.potentialMargin ?? 0, currency)}
            hint="If all received stock sells at entry price — NOT profit"
            icon={<AlertTriangle className="h-5 w-5" />}
            color="warning"
          />
          <StatsCard
            label="On-hand stock value (cost)"
            value={isLoading ? "…" : formatCurrency(summary?.onHandCostValue ?? 0, currency)}
            hint="Current inventory at cost price"
          />
          <StatsCard
            label="On-hand potential margin"
            value={isLoading ? "…" : formatCurrency(summary?.onHandPotentialMargin ?? 0, currency)}
            hint="If current stock all sells — still not realized"
            color="default"
          />
        </div>
      </div>

      <div className="space-y-3">
        <h2 className="text-lg font-semibold">Money movement ledger</h2>
        <DataTable
          isLoading={isLoading}
          data={movements}
          keyExtractor={(m) => m._id}
          onRefetch={() => refetch()}
          searchQuery={query.ledgerSearch}
          onSearchChange={(v) => setQuery({ ledgerSearch: v })}
          placeholderText="Search product, note, reason..."
          hidePagination
          emptyStateText="No stock money movements in this period."
          columns={[
            {
              key: "time",
              header: "Time",
              render: (m) => <span className="text-xs text-muted-foreground whitespace-nowrap">{formatDateTime(m.createdAt)}</span>
            },
            {
              key: "category",
              header: "Event",
              render: (m) => (
                <div>
                  <Badge
                    variant={m.isLoss ? "danger" : m.category === "sale" ? "soft" : "secondary"}
                    className="text-[10px] capitalize"
                  >
                    {m.categoryLabel}
                  </Badge>
                  {m.categoryHint && (
                    <p className="text-[10px] text-muted-foreground mt-0.5 max-w-[200px]">{m.categoryHint}</p>
                  )}
                </div>
              )
            },
            {
              key: "product",
              header: "Product",
              render: (m) => <span className="font-medium text-sm">{m.productName}</span>
            },
            {
              key: "qty",
              header: "Qty",
              render: (m) => (
                <span className={`text-sm font-semibold ${m.qty >= 0 ? "text-green-600" : "text-danger"}`}>
                  {m.qty >= 0 ? "+" : ""}{formatNumber(m.qty)}
                  {m.soldUnit ? ` (${m.soldQty ?? ""} ${m.soldUnit})` : ""}
                </span>
              )
            },
            {
              key: "costSell",
              header: "Cost → Sell",
              render: (m) =>
                m.costValue > 0 || m.sellValue > 0 ? (
                  <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                    {formatCurrency(m.costValue, currency)} → {formatCurrency(m.sellValue, currency)}
                  </span>
                ) : m.realizedRevenue > 0 ? (
                  <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                    COGS {formatCurrency(m.realizedCost, currency)} / Rev {formatCurrency(m.realizedRevenue, currency)}
                  </span>
                ) : (
                  <span className="text-xs text-muted-foreground">—</span>
                )
            },
            {
              key: "impact",
              header: "Money impact",
              render: (m) => {
                const impact = moneyImpact(m);
                return (
                  <div>
                    <span
                      className={`text-sm font-bold ${
                        impact.tone === "profit"
                          ? "text-green-600"
                          : impact.tone === "loss"
                            ? "text-danger"
                            : "text-muted-foreground"
                      }`}
                    >
                      {impact.value === 0 ? "—" : formatCurrency(Math.abs(impact.value), currency)}
                      {impact.tone === "loss" && impact.value !== 0 ? " −" : ""}
                    </span>
                    <p className="text-[10px] text-muted-foreground">{impact.label}</p>
                  </div>
                );
              }
            },
            {
              key: "note",
              header: "Note",
              render: (m) => (
                <span className="text-xs text-muted-foreground truncate max-w-[140px] block" title={m.note}>
                  {m.note || "—"}
                </span>
              )
            },
            {
              key: "actions",
              header: "",
              render: (m) => {
                const canEdit = m.type === "wastage" || m.type === "adjustment" || m.lossReason;
                if (!canEdit) return null;
                return (
                  <div className="flex gap-1 justify-end">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-7 w-7 text-muted-foreground hover:text-primary" 
                      onClick={() => {
                        setEditQty(Math.abs(m.qty).toString());
                        setEditReason(m.lossReason || "");
                        setEditNote(m.note || "");
                        setEditEntry(m);
                      }}
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-7 w-7 text-muted-foreground hover:text-danger" 
                      onClick={() => setDeleteEntry(m)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                );
              }
            }
          ]}
        />
      </div>

      <Modal
        open={showIssueModal}
        onClose={() => setShowIssueModal(false)}
        title="Record stock issue"
        size="lg"
        className="max-w-2xl"
      >
        <form className="space-y-4" onSubmit={handleRecordIssue}>
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">Issue type *</label>
            <Select
              value={issueType}
              onValueChange={setIssueType}
              options={ISSUE_TYPES.map((t) => ({ value: t.value, label: t.label }))}
            />
            <p className="text-[10px] text-muted-foreground mt-1">{issueConfig.hint}</p>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">Search product</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="pl-9"
                placeholder="Product name..."
                value={prodSearch}
                onChange={(e) => setProdSearch(e.target.value)}
              />
            </div>
            <div className="mt-2 max-h-36 overflow-y-auto space-y-1 rounded-xl border border-border/60 p-2">
              {products.map((p) => (
                <button
                  key={p._id}
                  type="button"
                  onClick={() => { setSelectedProduct(p); setIssueUnitKey("base"); }}
                  className={`w-full rounded-lg px-3 py-2 text-left text-sm transition ${
                    selectedProduct?._id === p._id ? "bg-primary/10 ring-1 ring-primary/30" : "hover:bg-border/30"
                  }`}
                >
                  <span className="font-medium">{p.name}</span>
                  <span className="text-xs text-muted-foreground ml-2">Stock: {p.onHandQty}</span>
                </button>
              ))}
              {!products.length && <p className="text-xs text-muted-foreground text-center py-2">Search for a product</p>}
            </div>
          </div>

          {selectedProduct && unitOptions.length > 1 && (
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Unit</label>
              <div className="flex flex-wrap gap-2">
                {unitOptions.map((opt) => (
                  <button
                    key={opt.key}
                    type="button"
                    onClick={() => setIssueUnitKey(opt.key)}
                    className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                      issueUnitKey === opt.key ? "bg-primary text-white" : "bg-border/40 text-muted-foreground"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">
                Quantity ({selectedUnit?.soldUnit ?? "units"}) *
              </label>
              <Input type="number" min={1} required value={issueQty} onChange={(e) => setIssueQty(e.target.value)} />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">
                Cost per unit ({currency}) {isGoodReturn ? "" : "— for loss calc"}
              </label>
              <Input type="number" min={0} step="0.01" value={issueCost} onChange={(e) => setIssueCost(e.target.value)} />
            </div>
          </div>

          {!isGoodReturn && lossPreview > 0 && (
            <div className="rounded-xl border border-danger/30 bg-danger/5 p-3 text-sm">
              <p className="text-danger font-semibold flex items-center gap-1">
                <TrendingDown className="h-4 w-4" /> Loss: {formatCurrency(lossPreview, currency)}
              </p>
              <p className="text-[10px] text-muted-foreground mt-1">This reduces your net profit — not potential margin.</p>
            </div>
          )}

          {isGoodReturn && (
            <div className="rounded-xl border border-green-500/30 bg-green-500/5 p-3 text-xs text-muted-foreground">
              Good returns are restocked. No loss recorded unless you refund the customer separately.
            </div>
          )}

          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">Note</label>
            <Input value={issueNote} onChange={(e) => setIssueNote(e.target.value)} placeholder="Optional details" />
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" className="flex-1" onClick={() => setShowIssueModal(false)}>
              Cancel
            </Button>
            <Button type="submit" className="flex-1" disabled={!selectedProduct || issueMutation.isPending}>
              {issueMutation.isPending ? "Saving..." : "Record issue"}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        open={!!editEntry}
        onClose={() => setEditEntry(null)}
        title="Edit Ledger Entry"
        size="md"
      >
        {editEntry && (
          <form className="space-y-4" onSubmit={handleEditSubmit}>
            <div>
              <p className="text-sm font-semibold">{editEntry.productName}</p>
              <p className="text-xs text-muted-foreground">{editEntry.categoryLabel}</p>
            </div>
            
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Quantity (absolute value) *</label>
              <Input
                type="number"
                min={0}
                required
                value={editQty}
                onChange={(e) => setEditQty(e.target.value)}
              />
              <p className="text-[10px] text-muted-foreground mt-1">
                The item's stock will be adjusted accordingly.
              </p>
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Reason</label>
              <Select
                value={editReason}
                onValueChange={setEditReason}
                options={ISSUE_TYPES.map(t => ({ label: t.label, value: t.value }))}
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Note (Optional)</label>
              <Input
                placeholder="Optional note..."
                value={editNote}
                onChange={(e) => setEditNote(e.target.value)}
              />
            </div>

            <Button type="submit" className="w-full" disabled={editMutation.isPending}>
              {editMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </form>
        )}
      </Modal>

      <Modal
        open={!!deleteEntry}
        onClose={() => setDeleteEntry(null)}
        title="Delete Ledger Entry"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Are you sure you want to delete this {deleteEntry?.categoryLabel} entry for <strong>{deleteEntry?.productName}</strong>?
          </p>
          <div className="rounded border border-warning/30 bg-warning/10 p-3 flex gap-2 text-warning items-start">
            <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
            <p className="text-xs">
              Deleting this entry will <strong>revert</strong> its stock impact. For example, if it subtracted {Math.abs(deleteEntry?.qty || 0)} items, they will be added back to inventory.
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={() => setDeleteEntry(null)}>Cancel</Button>
            <Button 
              variant="default" 
              className="flex-1 bg-danger hover:bg-danger/90 text-white" 
              onClick={() => deleteMutation.mutate()}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete Entry"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
