"use client";

import * as React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Package, ArrowLeftRight, History, Play, AlertTriangle, Check, Plus,
  ChevronRight, RefreshCw, Send, CheckCircle2, XCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { Select } from "@/components/ui/select";
import { DataTable } from "@/components/ui/data-table";
import { StatsCard } from "@/components/ui/stats-card";
import { useAuth } from "@/components/auth/auth-provider";
import { getJson, apiFetch } from "@/lib/api-client";
import { formatNumber, formatDate } from "@/lib/format";
import type { Product, StockTransfer, Outlet } from "@/lib/types";

type StockHistoryEntry = {
  _id: string;
  productId: { _id: string; name: string; unit: string };
  type: string;
  qty: number;
  qtyBefore: number;
  qtyAfter: number;
  note?: string;
  createdAt: string;
};

type StockSummary = { totalSkus: number; onHandTotal: number; lowStock: number };

const TRANSFER_STATUS_COLORS: Record<string, "soft" | "warning" | "default" | "danger"> = {
  pending: "warning",
  approved: "soft",
  completed: "soft",
  rejected: "danger"
};

export default function StockPage() {
  const { token, outletId } = useAuth();
  const qc = useQueryClient();
  const [activeTab, setActiveTab] = React.useState<"overview" | "start-of-day" | "history" | "transfers">("overview");

  // Adjust Dialog State
  const [showAdjustModal, setShowAdjustModal] = React.useState(false);
  const [selectedProduct, setSelectedProduct] = React.useState<Product | null>(null);
  const [adjustQty, setAdjustQty] = React.useState("");
  const [adjustType, setAdjustType] = React.useState<"add" | "set">("add");
  const [adjustNote, setAdjustNote] = React.useState("");

  // Transfer Dialog State
  const [showTransferModal, setShowTransferModal] = React.useState(false);
  const [transferTargetOutlet, setTransferTargetOutlet] = React.useState("");
  const [transferItems, setTransferItems] = React.useState<{ productId: string; qty: number }[]>([]);
  const [transferNote, setTransferNote] = React.useState("");

  // Start of day count state
  const [startOfDayCounts, setStartOfDayCounts] = React.useState<Record<string, number>>({});

  // API Queries
  const { data: prodData, isLoading: loadingProds } = useQuery({
    queryKey: ["products", outletId],
    queryFn: () => getJson<{ products: Product[] }>("/products", token, { outletId: outletId ?? undefined }),
    enabled: Boolean(token && outletId)
  });

  const { data: summaryData } = useQuery({
    queryKey: ["stock-summary", outletId],
    queryFn: () => getJson<{ data: StockSummary }>("/stock/summary", token, { outletId: outletId ?? undefined }),
    enabled: Boolean(token && outletId)
  });

  const { data: historyData, isLoading: loadingHistory } = useQuery({
    queryKey: ["stock-history", outletId],
    queryFn: () => getJson<{ entries: StockHistoryEntry[] }>("/stock/history", token, { outletId: outletId ?? undefined }),
    enabled: Boolean(token && outletId)
  });

  const { data: transfersData, isLoading: loadingTransfers } = useQuery({
    queryKey: ["stock-transfers"],
    queryFn: () => getJson<{ transfers: StockTransfer[] }>("/stock/transfers", token),
    enabled: Boolean(token)
  });

  const { data: outletsData } = useQuery({
    queryKey: ["outlets"],
    queryFn: () => getJson<{ outlets: Outlet[] }>("/outlets", token),
    enabled: Boolean(token)
  });

  // API Mutations
  const adjustMutation = useMutation({
    mutationFn: (body: unknown) => apiFetch("/stock/adjust", { method: "POST", body, token }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["products"] });
      qc.invalidateQueries({ queryKey: ["stock-summary"] });
      qc.invalidateQueries({ queryKey: ["stock-history"] });
      setShowAdjustModal(false);
      setAdjustQty("");
      setAdjustNote("");
    }
  });

  const transferMutation = useMutation({
    mutationFn: (body: unknown) => apiFetch("/stock/transfers", { method: "POST", body, token }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["stock-transfers"] });
      setShowTransferModal(false);
      setTransferTargetOutlet("");
      setTransferItems([]);
      setTransferNote("");
    }
  });

  const approveTransferMutation = useMutation({
    mutationFn: (id: string) => apiFetch(`/stock/transfers/${id}/approve`, { method: "POST", token }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["stock-transfers"] });
      qc.invalidateQueries({ queryKey: ["products"] });
      qc.invalidateQueries({ queryKey: ["stock-summary"] });
      qc.invalidateQueries({ queryKey: ["stock-history"] });
    }
  });

  const saveOpeningStockMutation = useMutation({
    mutationFn: (body: unknown) => apiFetch("/stock/adjust", { method: "POST", body, token }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["products"] });
      qc.invalidateQueries({ queryKey: ["stock-summary"] });
      qc.invalidateQueries({ queryKey: ["stock-history"] });
      setActiveTab("overview");
    }
  });

  const products = prodData?.products ?? [];
  const summary = summaryData?.data;
  const history = historyData?.entries ?? [];
  const transfers = transfersData?.transfers ?? [];
  const outlets = (outletsData?.outlets ?? []).filter((o) => o._id !== outletId);

  // Initialize start of day counts
  React.useEffect(() => {
    if (products.length && Object.keys(startOfDayCounts).length === 0) {
      const counts: Record<string, number> = {};
      products.forEach((p) => { counts[p._id] = p.onHandQty; });
      setStartOfDayCounts(counts);
    }
  }, [products, startOfDayCounts]);

  const handleAdjustSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;
    const qtyVal = Number(adjustQty);
    adjustMutation.mutate({
      productId: selectedProduct._id,
      outletId,
      qty: qtyVal,
      type: adjustType === "set" ? "adjustment" : "purchase",
      note: adjustNote || "Manual stock adjustment"
    });
  };

  const handleTransferSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!transferTargetOutlet || transferItems.length === 0) return;
    transferMutation.mutate({
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
            loading={loadingProds}
            data={products}
            keyExtractor={(p) => p._id}
            emptyMessage="No products in catalog."
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
                  <div className="flex items-center gap-2">
                    <span className={`font-bold ${p.onHandQty <= p.lowStockThreshold ? "text-danger" : ""}`}>
                      {p.onHandQty}
                    </span>
                    {p.onHandQty <= p.lowStockThreshold && (
                      <Badge variant="warning" className="text-[10px]">Low Stock</Badge>
                    )}
                  </div>
                )
              },
              { key: "lowStockThreshold", header: "Low Stock Alert" },
              {
                key: "actions", header: "",
                render: (p) => (
                  <Button variant="outline" size="sm" onClick={() => { setSelectedProduct(p); setShowAdjustModal(true); }}>
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
        <DataTable
          loading={loadingHistory}
          data={history}
          keyExtractor={(e) => e._id}
          emptyMessage="No stock ledger entries yet."
          columns={[
            {
              key: "createdAt", header: "Time",
              render: (e) => <span className="text-xs text-muted">{new Date(e.createdAt).toLocaleString("en-IN")}</span>
            },
            {
              key: "product", header: "Product",
              render: (e) => <span className="font-medium">{e.productId?.name || "Deleted Product"}</span>
            },
            {
              key: "type", header: "Transaction Type",
              render: (e) => <Badge variant="secondary" className="capitalize">{e.type.replace(/_/g, " ")}</Badge>
            },
            {
              key: "qty", header: "Qty Change",
              render: (e) => (
                <span className={`font-semibold ${e.qty >= 0 ? "text-green-600" : "text-danger"}`}>
                  {e.qty >= 0 ? `+${e.qty}` : e.qty} {e.productId?.unit}
                </span>
              )
            },
            {
              key: "ledger", header: "Ledger State",
              render: (e) => <span className="text-xs text-muted">{e.qtyBefore} → {e.qtyAfter}</span>
            },
            {
              key: "note", header: "Note",
              render: (e) => <span className="text-xs text-muted truncate max-w-xs block">{e.note || "—"}</span>
            }
          ]}
        />
      )}

      {/* TAB CONTENT: Transfers */}
      {activeTab === "transfers" && (
        <DataTable
          loading={loadingTransfers}
          data={transfers}
          keyExtractor={(t) => t._id}
          emptyMessage="No inventory transfers logged."
          columns={[
            {
              key: "createdAt", header: "Date Requested",
              render: (t) => <span className="text-xs text-muted">{new Date(t.createdAt).toLocaleDateString("en-IN")}</span>
            },
            {
              key: "route", header: "Route",
              render: (t) => (
                <span className="text-xs font-semibold">
                  {t.fromOutletId?.name} ➔ {t.toOutletId?.name}
                </span>
              )
            },
            {
              key: "items", header: "Items (Qty)",
              render: (t) => (
                <div className="flex flex-col gap-0.5">
                  {t.items.map((item, idx) => (
                    <span key={idx} className="text-xs text-muted">
                      • {item.productName} ({item.qty} {item.unit})
                    </span>
                  ))}
                </div>
              )
            },
            {
              key: "status", header: "Status",
              render: (t) => <Badge variant={TRANSFER_STATUS_COLORS[t.status] || "secondary"} className="capitalize text-xs">{t.status}</Badge>
            },
            {
              key: "requestedBy", header: "Requested By",
              render: (t) => <span className="text-xs text-muted">{t.requestedBy?.name || "System"}</span>
            },
            {
              key: "actions", header: "",
              render: (t) => (
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
      )}

      {/* MODAL: Quick Adjust Stock */}
      <Modal open={showAdjustModal} onClose={() => setShowAdjustModal(false)} title="Adjust Stock Inventory" size="sm">
        <form onSubmit={handleAdjustSubmit} className="space-y-4">
          <div>
            <p className="text-sm font-semibold">{selectedProduct?.name}</p>
            <p className="text-xs text-muted">Current Stock: {selectedProduct?.onHandQty} {selectedProduct?.unit}</p>
          </div>
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
            <label className="mb-1 block text-xs font-medium text-muted">Quantity *</label>
            <Input id="adjust-qty" required type="number" value={adjustQty} onChange={(e) => setAdjustQty(e.target.value)} placeholder="e.g. 50 or -10" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-muted">Note</label>
            <Input id="adjust-note" value={adjustNote} onChange={(e) => setAdjustNote(e.target.value)} placeholder="e.g. Received shipment" />
          </div>
          <div className="flex gap-3 pt-2">
            <Button variant="outline" type="button" className="flex-1" onClick={() => setShowAdjustModal(false)}>Cancel</Button>
            <Button type="submit" className="flex-1" disabled={adjustMutation.isPending}>
              {adjustMutation.isPending ? "Adjusting..." : "Apply Adjustment"}
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
            <Button type="submit" className="flex-1" disabled={transferMutation.isPending || transferItems.length === 0 || !transferTargetOutlet}>
              {transferMutation.isPending ? "Sending..." : "Submit Transfer Request"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
