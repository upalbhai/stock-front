"use client";

import * as React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Ban, Receipt, FileText, Info, Printer } from "lucide-react";
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
import { businessService } from "@/services/business.service";
import { outletService } from "@/services/outlet.service";
import { formatCurrency, formatDateTime } from "@/lib/format";
import type { Order } from "@/lib/types";
import toast from "react-hot-toast";
import { getErrorMessage } from "@/lib/error";
import { APP_ROUTES } from "@/lib/routes";
import { useQueryStates, parseAsString, parseAsInteger, parseAsStringEnum } from "nuqs";
import { JollyDateRangePicker } from "@/components/ui/jolly-date-picker";
import { parseDate } from "@internationalized/date";
import { usePOSPrinter } from "@/hooks/use-pos-printer";

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
  const printer = usePOSPrinter(token);

  const [query, setQuery] = useQueryStates({
    page: parseAsInteger.withDefault(1),
    limit: parseAsInteger.withDefault(10),
    search: parseAsString.withDefault(""),
    status: parseAsStringEnum<RecordFilter>(["active", "voided", "all"]).withDefault("active"),
    from: parseAsString.withDefault(""),
    to: parseAsString.withDefault("")
  });

  const [voidTarget, setVoidTarget] = React.useState<Order | null>(null);
  const [voidReason, setVoidReason] = React.useState("");
  
  const [viewOrderId, setViewOrderId] = React.useState<string | null>(null);

  const { data: bizData } = useQuery({
    queryKey: ["business-mine"],
    queryFn: () => businessService.getMyBusiness(token),
    enabled: Boolean(token),
  });

  const { data: outletsData } = useQuery({
    queryKey: ["outlets"],
    queryFn: () => outletService.getOutlets(token),
    enabled: Boolean(token),
  });

  const { data: orderDetailsData, isLoading: isLoadingOrder } = useQuery({
    queryKey: ["order", viewOrderId],
    queryFn: () => orderService.getOrder(viewOrderId!, token),
    enabled: !!viewOrderId && !!token
  });

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["orders", outletId, query.status, query.page, query.limit, query.search, query.from, query.to],
    queryFn: () =>
      orderService.getOrders(token, {
        outletId: outletId ?? undefined,
        recordStatus: query.status,
        page: query.page,
        limit: query.limit,
        search: query.search || undefined,
        from: query.from || undefined,
        to: query.to || undefined
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
      <div className="rounded-xl border border-border/70 bg-surface/50 p-8 text-center">
        <Receipt className="mx-auto h-10 w-10 text-muted" />
        <h1 className="mt-4 text-xl font-bold">Order History</h1>
        <p className="mt-2 text-sm text-muted">Order history is not available on your current plan.</p>
      </div>
    );
  }

  const orders = data?.orders ?? [];

  const handleReprint = async () => {
    if (!orderDetailsData?.order) return;
    const order = orderDetailsData.order;
    const currentOutlet = outletsData?.outlets?.find(o => o._id === order.outletId);
    
    try {
      await printer.print({
        businessName: bizData?.business?.name ?? "Shop",
        outletName: currentOutlet?.name ?? undefined,
        businessPhone: bizData?.business?.phone ?? undefined,
        businessAddress: bizData?.business?.address ?? undefined,
        businessGst: bizData?.business?.gstNumber ?? undefined,
        orderNumber: order.orderNumber,
        createdAt: order.createdAt,
        customerName: order.customerName || undefined,
        customerPhone: order.customerPhone || undefined,
        items: order.items.map((i: any) => ({
          name: i.name,
          qty: i.qty,
          unit: i.unit,
          price: i.price,
          lineTotal: i.lineTotal ?? (i.price * i.qty)
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
      toast.success("Reprinting...");
    } catch (e: any) {
      toast.error(e.message || "Failed to reprint");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Order History</h1>
          <p className="text-sm text-muted">View past bills — void wrong entries with audit trail</p>
        </div>
        <JollyDateRangePicker 
          label="Date Filter"
          value={(query.from && query.to) ? { start: parseDate(query.from.split('T')[0]), end: parseDate(query.to.split('T')[0]) } : null}
          onChange={(val) => {
            if (val) {
              setQuery({ 
                from: val.start.toString() + "T00:00:00.000Z", 
                to: val.end.toString() + "T23:59:59.999Z", 
                page: 1 
              });
            } else {
              setQuery({ from: "", to: "", page: 1 });
            }
          }}
        />
      </div>

      <DataTable
        isLoading={isLoading}
        data={orders}
        keyExtractor={(o) => o._id}
        emptyStateText="No orders found in the selected date range."
        totalItems={data?.total ?? 0}
        page={query.page}
        limit={query.limit}
        onPageChange={(p) => setQuery({ page: p })}
        onLimitChange={(l) => setQuery({ limit: l, page: 1 })}
        searchQuery={query.search}
        onSearchChange={(s) => setQuery({ search: s, page: 1 })}
        onRefetch={() => refetch()}
        filters={
          <Tabs value={query.status} onValueChange={(v) => setQuery({ status: v as RecordFilter, page: 1 })}>
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
            render: (o) => (
              <div className="flex gap-1 justify-end">
                <Button variant="ghost" size="sm" onClick={() => setViewOrderId(o._id)}>
                  <Info className="mr-1 h-3.5 w-3.5" /> Details
                </Button>
                {canVoid && o.status === "completed" && (
                  <Button variant="ghost" size="sm" className="text-danger" onClick={() => setVoidTarget(o)}>
                    <Ban className="mr-1 h-3.5 w-3.5" /> Void
                  </Button>
                )}
              </div>
            )
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

      <Modal open={!!viewOrderId} onClose={() => setViewOrderId(null)} title="Order Details" size="md">
        {isLoadingOrder ? (
          <div className="flex justify-center p-8 text-muted">Loading details...</div>
        ) : orderDetailsData?.order ? (
          <div className="space-y-4">
            <div className="flex justify-between items-center border-b pb-4">
              <div>
                <h3 className="font-bold text-lg">{orderDetailsData.order.orderNumber}</h3>
                <p className="text-sm text-muted">{formatDateTime(orderDetailsData.order.createdAt)}</p>
              </div>
              <Badge variant={statusVariant[orderDetailsData.order.status] ?? "secondary"} className="capitalize">
                {orderDetailsData.order.status}
              </Badge>
            </div>
            
            <div className="space-y-2 max-h-[40vh] overflow-y-auto pr-2">
              {orderDetailsData.order.items.map((item: any, idx: number) => (
                <div key={idx} className="flex justify-between items-center text-sm border-b border-border/50 pb-2">
                  <div className="flex flex-col">
                    <span className="font-medium">{item.name}</span>
                    <span className="text-xs text-muted">
                      {item.qty} {item.unit} x {formatCurrency(item.price)}
                    </span>
                  </div>
                  <span className="font-medium">{formatCurrency(item.lineTotal ?? (item.price * item.qty))}</span>
                </div>
              ))}
            </div>

            <div className="space-y-1 text-sm border-t pt-4">
              <div className="flex justify-between">
                <span className="text-muted">Subtotal</span>
                <span>{formatCurrency(orderDetailsData.order.subtotal)}</span>
              </div>
              {orderDetailsData.order.discount > 0 && (
                <div className="flex justify-between text-success">
                  <span>Discount</span>
                  <span>-{formatCurrency(orderDetailsData.order.discount)}</span>
                </div>
              )}
              {orderDetailsData.order.tax > 0 && (
                <div className="flex justify-between text-muted">
                  <span>Tax</span>
                  <span>{formatCurrency(orderDetailsData.order.tax)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-base pt-2">
                <span>Total</span>
                <span>{formatCurrency(orderDetailsData.order.total)}</span>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t mt-4">
              <Button variant="outline" onClick={() => setViewOrderId(null)}>
                Close
              </Button>
              <Button onClick={handleReprint} disabled={printer.status === 'printing'}>
                <Printer className="w-4 h-4 mr-2" /> Reprint Bill
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex justify-center p-8 text-destructive">Failed to load order</div>
        )}
      </Modal>
    </div>
  );
}
