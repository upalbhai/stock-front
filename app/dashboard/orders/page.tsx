"use client";

import * as React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Ban, Receipt, FileText } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { DataTable } from "@/components/ui/data-table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/components/auth/auth-provider";
import { useFeature } from "@/hooks/useFeature";
import { orderService } from "@/services/order.service";
import { invoiceService } from "@/services/invoice.service";
import { formatCurrency, formatDateTime } from "@/lib/format";
import type { Order } from "@/lib/types";
import toast from "react-hot-toast";
import { getErrorMessage } from "@/lib/error";
import { APP_ROUTES } from "@/lib/routes";

type RecordFilter = "active" | "voided" | "all";

const statusVariant: Record<string, "soft" | "danger" | "warning" | "secondary"> = {
  completed: "soft",
  voided: "danger",
  refunded: "warning",
  cancelled: "secondary",
  pending: "secondary"
};

export default function OrdersPage() {
  const { token, outletId, user } = useAuth();
  const qc = useQueryClient();
  const hasHistory = useFeature("order_history");
  const hasGstInvoices = useFeature("gst_invoices");
  const canVoid = useFeature("order_void") && (user?.role === "owner" || user?.role === "manager" || user?.role === "superadmin");

  const [recordFilter, setRecordFilter] = React.useState<RecordFilter>("active");
  const [voidTarget, setVoidTarget] = React.useState<Order | null>(null);
  const [voidReason, setVoidReason] = React.useState("");

  const [page, setPage] = React.useState(1);
  const [limit, setLimit] = React.useState(10);
  const [searchQuery, setSearchQuery] = React.useState("");

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["orders", outletId, recordFilter, page, limit, searchQuery],
    queryFn: () =>
      orderService.getOrders(token, {
        outletId: outletId ?? undefined,
        recordStatus: recordFilter,
        page,
        limit,
        search: searchQuery || undefined
      }),
    enabled: Boolean(token) && hasHistory
  });

  const voidMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      orderService.voidOrder(id, reason, token),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["orders"] });
      setVoidTarget(null);
      setVoidReason("");
      toast.success("Order voided successfully");
    },
    onError: (err) => toast.error(getErrorMessage(err, "Failed to void order"))
  });

  const generateInvoiceMutation = useMutation({
    mutationFn: (id: string) => invoiceService.generateInvoice(id, token),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["orders"] });
      toast.success("Invoice generated");
    },
    onError: (err) => toast.error(getErrorMessage(err, "Failed to generate invoice"))
  });

  if (!hasHistory) {
    return (
      <div className="rounded-3xl border border-border/70 bg-surface/50 p-8 text-center">
        <Receipt className="mx-auto h-10 w-10 text-muted" />
        <h1 className="mt-4 text-xl font-bold">Order History</h1>
        <p className="mt-2 text-sm text-muted">Order history is not available on your current plan.</p>
      </div>
    );
  }

  const orders = data?.orders ?? [];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Order History</h1>
          <p className="text-sm text-muted">View past bills — void wrong entries with audit trail</p>
        </div>
      </div>

      <DataTable
        isLoading={isLoading}
        data={orders}
        keyExtractor={(o) => o._id}
        emptyStateText="No orders found."
        totalItems={data?.total ?? 0}
        page={page}
        limit={limit}
        onPageChange={setPage}
        onLimitChange={setLimit}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onRefetch={() => refetch()}
        filters={
          <Tabs value={recordFilter} onValueChange={(v) => { setRecordFilter(v as RecordFilter); setPage(1); }}>
            <TabsList>
              <TabsTrigger value="active">Active</TabsTrigger>
              <TabsTrigger value="voided">Voided</TabsTrigger>
              <TabsTrigger value="all">All</TabsTrigger>
            </TabsList>
          </Tabs>
        }
        columns={[
          {
            key: "orderNumber",
            header: "Bill #",
            render: (o) => (
              <span className={o.status === "voided" ? "text-muted line-through" : "font-medium"}>
                {o.orderNumber}
              </span>
            )
          },
          {
            key: "createdAt",
            header: "Date",
            render: (o) => <span className="text-sm text-muted">{formatDateTime(o.createdAt)}</span>
          },
          {
            key: "billingMode",
            header: "Mode",
            render: (o) => (
              <Badge variant="soft" className="capitalize">
                {o.billingMode.replace("_", " ")}
              </Badge>
            )
          },
          {
            key: "items",
            header: "Items",
            render: (o) => <span className="text-sm">{o.items.length}</span>
          },
          {
            key: "total",
            header: "Total",
            render: (o) => (
              <span className={`font-bold ${o.status === "voided" ? "text-muted line-through" : ""}`}>
                {formatCurrency(o.total)}
              </span>
            )
          },
          {
            key: "status",
            header: "Status",
            render: (o) => (
              <div className="space-y-1">
                <Badge variant={statusVariant[o.status] ?? "secondary"} className="capitalize">
                  {o.status}
                </Badge>
                {o.status === "voided" && o.voidReason && (
                  <p className="max-w-[180px] truncate text-[10px] text-muted" title={o.voidReason}>
                    {o.voidReason}
                  </p>
                )}
              </div>
            )
          },
          {
            key: "createdBy",
            header: "Staff",
            render: (o) => <span className="text-sm text-muted">{o.createdBy?.name || "—"}</span>
          },
          {
            key: "invoice",
            header: "Invoice",
            render: (o) =>
              o.invoiceNumber ? (
                <Link href={APP_ROUTES.invoiceDetail(o._id)} className="text-xs text-primary hover:underline">
                  {o.invoiceNumber}
                </Link>
              ) : hasGstInvoices && o.tax > 0 && o.status === "completed" ? (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-[10px] h-7 gap-1"
                  disabled={generateInvoiceMutation.isPending}
                  onClick={() => generateInvoiceMutation.mutate(o._id)}
                >
                  <FileText className="h-3 w-3" /> GST
                </Button>
              ) : (
                <span className="text-xs text-muted">—</span>
              )
          },
          {
            key: "actions",
            header: "",
            render: (o) =>
              canVoid && o.status === "completed" ? (
                <Button variant="ghost" size="sm" className="text-danger" onClick={() => setVoidTarget(o)}>
                  <Ban className="mr-1 h-3.5 w-3.5" /> Void
                </Button>
              ) : null
          }
        ]}
      />

      <Modal open={!!voidTarget} onClose={() => { setVoidTarget(null); setVoidReason(""); }} title="Void Bill?" size="sm">
        <p className="mb-4 text-sm text-muted">
          Bill <strong>{voidTarget?.orderNumber}</strong> will be marked voided and stock will be restored. This cannot be undone.
        </p>
        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-muted">Reason *</label>
            <Input
              value={voidReason}
              onChange={(e) => setVoidReason(e.target.value)}
              placeholder="e.g. Wrong qty entered"
              minLength={2}
              required
            />
          </div>
          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={() => { setVoidTarget(null); setVoidReason(""); }}>
              Cancel
            </Button>
            <Button
              className="flex-1"
              variant="destructive"
              disabled={voidReason.trim().length < 2 || voidMutation.isPending}
              onClick={() => voidTarget && voidMutation.mutate({ id: voidTarget._id, reason: voidReason.trim() })}
            >
              {voidMutation.isPending ? "Voiding..." : "Void Bill"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
