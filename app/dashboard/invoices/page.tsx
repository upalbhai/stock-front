"use client";

import * as React from "react";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { FileText, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { DataTable } from "@/components/ui/data-table";
import { useAuth } from "@/components/auth/auth-provider";
import { useFeature } from "@/hooks/useFeature";
import { getJson, apiFetch } from "@/lib/api-client";
import { formatCurrency, formatDateTime } from "@/lib/format";
import { GstInvoicePrint, printGstInvoice } from "@/components/invoices/gst-invoice-print";
import type { Order, Customer } from "@/lib/types";
import { APP_ROUTES } from "@/lib/routes";
import { useQueryStates, parseAsString, parseAsInteger } from "nuqs";
import { JollyDateRangePicker } from "@/components/ui/jolly-date-picker";
import { parseDate } from "@internationalized/date";

type InvoicePayload = {
  order: Order & { customerId?: Customer | null };
  business?: { name?: string; gstNumber?: string; address?: string; phone?: string };
  outlet?: { name?: string; address?: string; phone?: string };
};

export default function InvoicesPage() {
  const { user, token, outletId } = useAuth();
  const currency = user?.currency || "INR";
  const qc = useQueryClient();
  const hasGstInvoices = useFeature("gst_invoices");
  
  const [query, setQuery] = useQueryStates({
    page: parseAsInteger.withDefault(1),
    limit: parseAsInteger.withDefault(50),
    search: parseAsString.withDefault(""),
    from: parseAsString.withDefault(""),
    to: parseAsString.withDefault("")
  });

  const [printId, setPrintId] = React.useState<string | null>(null);
  const printRef = React.useRef<HTMLDivElement>(null);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["invoices", outletId, query.page, query.limit, query.from, query.to],
    queryFn: () =>
      getJson<{ invoices: Order[]; total: number }>("/invoices", token, {
        outletId: outletId ?? undefined,
        page: query.page,
        limit: query.limit,
        from: query.from || undefined,
        to: query.to || undefined
      }),
    enabled: Boolean(token) && hasGstInvoices
  });

  const { data: printData } = useQuery({
    queryKey: ["invoice", printId],
    queryFn: () => getJson<InvoicePayload>(`/invoices/${printId}`, token),
    enabled: Boolean(token && printId)
  });

  const invoices = (data?.invoices ?? []).filter((inv) => {
    if (!query.search.trim()) return true;
    const q = query.search.toLowerCase();
    return (
      inv.invoiceNumber?.toLowerCase().includes(q) ||
      inv.orderNumber?.toLowerCase().includes(q) ||
      inv.customerName?.toLowerCase().includes(q)
    );
  });

  if (!hasGstInvoices) {
    return (
      <div className="rounded-xl border border-border/70 bg-surface/50 p-8 text-center">
        <FileText className="mx-auto h-10 w-10 text-muted" />
        <h1 className="mt-4 text-xl font-bold">GST Invoices</h1>
        <p className="mt-2 text-sm text-muted">GST invoicing is not available on your current plan.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">GST Invoices</h1>
          <p className="text-sm text-muted">Tax invoices with CGST/SGST breakdown — print or share</p>
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
        data={invoices}
        keyExtractor={(inv) => inv._id}
        totalItems={data?.total ?? invoices.length}
        page={query.page}
        limit={query.limit}
        onPageChange={(p) => setQuery({ page: p })}
        onLimitChange={(l) => setQuery({ limit: l, page: 1 })}
        searchQuery={query.search}
        onSearchChange={(s) => setQuery({ search: s, page: 1 })}
        onRefetch={() => refetch()}
        placeholderText="Search invoice #, bill #, customer..."
        emptyStateText="No GST invoices yet. Generate one from Billing or Orders."
        columns={[
          {
            key: "invoiceNumber",
            header: "Invoice #",
            render: (inv) => <span className="font-semibold">{inv.invoiceNumber}</span>
          },
          {
            key: "orderNumber",
            header: "Bill #",
            render: (inv) => <span className="text-sm text-muted">{inv.orderNumber}</span>
          },
          {
            key: "date",
            header: "Date",
            render: (inv) => (
              <span className="text-sm text-muted">
                {formatDateTime(inv.invoiceGeneratedAt || inv.createdAt)}
              </span>
            )
          },
          {
            key: "customer",
            header: "Customer",
            render: (inv) => <span className="text-sm">{inv.customerName || "—"}</span>
          },
          {
            key: "tax",
            header: "Tax",
            render: (inv) => <span className="text-sm">{formatCurrency(inv.tax, currency)}</span>
          },
          {
            key: "total",
            header: "Total",
            render: (inv) => <span className="font-bold">{formatCurrency(inv.total, currency)}</span>
          },
          {
            key: "status",
            header: "Status",
            render: (inv) => (
              <Badge variant={inv.status === "completed" ? "soft" : "warning"} className="capitalize text-[10px]">
                {inv.status}
              </Badge>
            )
          },
          {
            key: "actions",
            header: "",
            render: (inv) => (
              <div className="flex gap-1 justify-end">
                <Button variant="ghost" size="sm" className="text-xs gap-1" onClick={() => setPrintId(inv._id)}>
                  <Printer className="h-3 w-3" /> Print
                </Button>
                <Link href={APP_ROUTES.invoiceDetail(inv._id)}>
                  <Button variant="ghost" size="sm" className="text-xs">View</Button>
                </Link>
              </div>
            )
          }
        ]}
      />

      <Modal
        open={!!printId && !!printData}
        onClose={() => setPrintId(null)}
        title="GST Invoice Preview"
        size="lg"
      >
        {printData && (
          <div className="space-y-4">
            <GstInvoicePrint
              printRef={printRef}
              order={printData.order as InvoicePayload["order"]}
              business={printData.business}
              outlet={printData.outlet}
            />
            <div className="flex gap-2 no-print">
              <Button variant="outline" className="flex-1" onClick={() => setPrintId(null)}>Close</Button>
              <Button className="flex-1 gap-1" onClick={() => printGstInvoice()}>
                <Printer className="h-4 w-4" /> Print
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
