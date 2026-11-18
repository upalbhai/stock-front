"use client";

import * as React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useQueryStates, parseAsString, parseAsInteger } from "nuqs";
import { ArrowLeft, ArrowLeftRight } from "lucide-react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

import { useAppSelector } from "@/store/hooks";
import { useAuth } from "@/components/auth/auth-provider";
import { DataTable } from "@/components/ui/data-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Select } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { getJson, getJsonWithMeta } from "@/lib/api-client";
import { stockService } from "@/services/stock.service";
import { getErrorMessage } from "@/lib/error";
import type { StockTransfer, Product } from "@/lib/types";

const TRANSFER_STATUS_COLORS: Record<string, "soft" | "warning" | "default" | "danger"> = {
  pending: "warning",
  approved: "soft",
  completed: "soft",
  rejected: "danger"
};

export default function TransfersPage() {
  const router = useRouter();
  const { token, outletId } = useAuth();
  const qc = useQueryClient();

  const authOutlets = useAppSelector((state) => state.auth.outlets);
  const outlets = (authOutlets ?? []).filter((o) => o._id !== outletId);

  const [query, setQuery] = useQueryStates({
    search: parseAsString.withDefault(""),
    page: parseAsInteger.withDefault(1),
    limit: parseAsInteger.withDefault(10),
  });

  const [showTransferModal, setShowTransferModal] = React.useState(false);
  const [transferTargetOutlet, setTransferTargetOutlet] = React.useState("");
  const [transferItems, setTransferItems] = React.useState<{ productId: string; qty: number }[]>([]);
  const [transferNote, setTransferNote] = React.useState("");

  const { data: prodData } = useQuery({
    queryKey: ["products", outletId, "", 1, 1000],
    queryFn: () => getJsonWithMeta<Product[]>("/products", token, { outletId: outletId ?? undefined, page: 1, limit: 1000 }),
    enabled: Boolean(token && showTransferModal)
  });
  const products: Product[] = prodData?.data ?? [];

  const { data: transfersData, isLoading: loadingTransfers, refetch: refetchTransfers } = useQuery({
    queryKey: ["stock-transfers", query.search, query.page, query.limit],
    queryFn: () => getJson<{ transfers: StockTransfer[]; total: number }>("/stock/transfers", token, { search: query.search || undefined, page: query.page, limit: query.limit }),
    enabled: Boolean(token)
  });

  const transferStockMutation = useMutation({
    mutationFn: (body: unknown) => stockService.createTransfer(body, token),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["products"] });
      qc.invalidateQueries({ queryKey: ["stock-transfers"] });
      setShowTransferModal(false);
      setTransferItems([]);
      setTransferTargetOutlet("");
      setTransferNote("");
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

  const addTransferItemRow = () => {
    if (products.length === 0) {
      toast.error("No products available to transfer.");
      return;
    }
    setTransferItems([...transferItems, { productId: products[0]._id, qty: 1 }]);
  };

  const transfers = transfersData?.transfers ?? [];
  const transferTotal = transfersData?.total ?? 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Inventory Transfers</h1>
          <p className="text-sm text-muted-foreground">
            Manage incoming and outgoing stock transfers across outlets.
          </p>
        </div>
        <Button variant="outline" onClick={() => router.push("/dashboard/stock")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Stock
        </Button>
      </div>

      <DataTable
        title="Stock Transfers"
        isLoading={loadingTransfers}
        data={transfers}
        keyExtractor={(t: StockTransfer) => t._id}
        totalItems={transferTotal}
        page={query.page}
        limit={query.limit}
        onPageChange={(p) => setQuery({ page: p })}
        onLimitChange={(size) => setQuery({ limit: size, page: 1 })}
        searchQuery={query.search}
        onSearchChange={(s) => setQuery({ search: s, page: 1 })}
        onRefetch={() => refetchTransfers()}
        placeholderText="Search transfers..."
        emptyStateText="No inventory transfers logged."
        headerActions={
          <Button id="new-transfer-btn" onClick={() => setShowTransferModal(true)}>
            <ArrowLeftRight className="h-4 w-4 mr-2" /> Request Transfer
          </Button>
        }
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
