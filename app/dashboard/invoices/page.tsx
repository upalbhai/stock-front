"use client";

import * as React from "react";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  FileText,
  Printer,
  Receipt,
  Download,
  IndianRupee,
  CheckCircle2,
  Calendar,
  Building2,
  ArrowRight,
  Search,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
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
import { cn } from "@/lib/utils";

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
    to: parseAsString.withDefault(""),
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
        to: query.to || undefined,
      }),
    enabled: Boolean(token) && hasGstInvoices,
  });

  const { data: printData } = useQuery({
    queryKey: ["invoice", printId],
    queryFn: () => getJson<InvoicePayload>(`/invoices/${printId}`, token),
    enabled: Boolean(token && printId),
  });

  const invoices = React.useMemo(() => {
    const raw = data?.invoices ?? [];
    if (!query.search.trim()) return raw;
    const q = query.search.toLowerCase();
    return raw.filter(
      (inv) =>
        inv.invoiceNumber?.toLowerCase().includes(q) ||
        inv.orderNumber?.toLowerCase().includes(q) ||
        inv.customerName?.toLowerCase().includes(q)
    );
  }, [data?.invoices, query.search]);

  const totalInvoicesCount = data?.total ?? invoices.length;

  const totalTaxCollected = React.useMemo(() => {
    return invoices.reduce((acc, inv) => acc + (inv.tax || 0), 0);
  }, [invoices]);

  const totalGrossValue = React.useMemo(() => {
    return invoices.reduce((acc, inv) => acc + (inv.total || 0), 0);
  }, [invoices]);

  const distinctCustomersCount = React.useMemo(() => {
    return new Set(invoices.map((inv) => inv.customerName || "Walk-in")).size;
  }, [invoices]);

  if (!hasGstInvoices) {
    return (
      <div className="rounded-2xl border border-border/70 bg-card p-10 text-center max-w-lg mx-auto my-12 shadow-sm">
        <div className="h-14 w-14 rounded-2xl bg-primary/10 text-primary mx-auto flex items-center justify-center border border-primary/20 mb-4">
          <FileText className="h-7 w-7" />
        </div>
        <h1 className="text-xl font-bold text-foreground">GST Invoicing</h1>
        <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
          GST tax invoicing is not enabled on your current subscription plan.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">GST Tax Invoices</h1>
            <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 text-xs">
              Tax Reports
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">
            Official B2B and retail tax invoices with CGST, SGST, and IGST breakdowns.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <JollyDateRangePicker
            label="Filter Date"
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
                  page: 1,
                });
              } else {
                setQuery({ from: "", to: "", page: 1 });
              }
            }}
          />
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        <Card className="border border-border/70 bg-card shadow-2xs hover:shadow-xs transition-shadow">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                Total Invoices
              </p>
              <p className="text-xl font-extrabold text-foreground tracking-tight mt-1 truncate">
                {totalInvoicesCount} Invoices
              </p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Generated in billing period
              </p>
            </div>
            <div className="h-10 w-10 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 border border-indigo-500/20">
              <FileText className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border border-border/70 bg-card shadow-2xs hover:shadow-xs transition-shadow">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                GST Tax Collected
              </p>
              <p className="text-xl font-extrabold text-emerald-600 dark:text-emerald-400 tracking-tight mt-1 truncate">
                {formatCurrency(totalTaxCollected, currency)}
              </p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                CGST + SGST tax output
              </p>
            </div>
            <div className="h-10 w-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/20">
              <Receipt className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border border-border/70 bg-card shadow-2xs hover:shadow-xs transition-shadow">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                Invoiced Volume
              </p>
              <p className="text-xl font-extrabold text-foreground tracking-tight mt-1 truncate">
                {formatCurrency(totalGrossValue, currency)}
              </p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Gross invoice revenue
              </p>
            </div>
            <div className="h-10 w-10 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 border border-blue-500/20">
              <IndianRupee className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border border-border/70 bg-card shadow-2xs hover:shadow-xs transition-shadow">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                Invoiced Customers
              </p>
              <p className="text-xl font-extrabold text-foreground tracking-tight mt-1 truncate">
                {distinctCustomersCount} Accounts
              </p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                B2B and retail recipients
              </p>
            </div>
            <div className="h-10 w-10 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 border border-amber-500/20">
              <Building2 className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Table */}
      <DataTable
        isLoading={isLoading}
        data={invoices}
        keyExtractor={(inv) => inv._id}
        totalItems={totalInvoicesCount}
        page={query.page}
        limit={query.limit}
        onPageChange={(p) => setQuery({ page: p })}
        onLimitChange={(l) => setQuery({ limit: l, page: 1 })}
        searchQuery={query.search}
        onSearchChange={(s) => setQuery({ search: s, page: 1 })}
        onRefetch={() => refetch()}
        placeholderText="Search invoice #, bill #, customer..."
        emptyStateText="No GST invoices generated yet. Create one by marking 'Generate GST Tax Invoice' during checkout."
        columns={[
          {
            key: "invoiceNumber",
            header: "Invoice #",
            render: (inv: Order) => (
              <div>
                <span className="font-mono text-xs font-bold text-primary block">
                  {inv.invoiceNumber}
                </span>
                <span className="font-mono text-[11px] text-muted-foreground">
                  Bill: {inv.orderNumber}
                </span>
              </div>
            ),
          },
          {
            key: "date",
            header: "Invoice Date",
            render: (inv: Order) => (
              <div className="text-xs">
                <span className="font-semibold text-foreground block">
                  {formatDateTime(inv.invoiceGeneratedAt || inv.createdAt).split(",")[0]}
                </span>
                <span className="text-[10px] text-muted-foreground font-mono">
                  {formatDateTime(inv.invoiceGeneratedAt || inv.createdAt).split(",")[1] || ""}
                </span>
              </div>
            ),
          },
          {
            key: "customer",
            header: "Customer / Recipient",
            render: (inv: Order) => (
              <div className="min-w-0">
                <p className="text-xs font-semibold text-foreground truncate">
                  {inv.customerName || "Walk-in Retail Customer"}
                </p>
                {inv.customerPhone && (
                  <span className="text-[10px] font-mono text-muted-foreground block">
                    {inv.customerPhone}
                  </span>
                )}
              </div>
            ),
          },
          {
            key: "tax",
            header: "GST Tax",
            render: (inv: Order) => (
              <span className="font-mono text-xs font-bold text-foreground">
                {formatCurrency(inv.tax, currency)}
              </span>
            ),
          },
          {
            key: "total",
            header: "Invoice Total",
            render: (inv: Order) => (
              <span className="font-mono text-sm font-black text-foreground">
                {formatCurrency(inv.total, currency)}
              </span>
            ),
          },
          {
            key: "status",
            header: "Status",
            render: (inv: Order) => (
              <Badge
                variant={inv.status === "completed" ? "soft" : "warning"}
                className={cn(
                  "text-[10px] font-bold px-2 py-0.5 capitalize",
                  inv.status === "completed"
                    ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20"
                    : "bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20"
                )}
              >
                {inv.status}
              </Badge>
            ),
          },
          {
            key: "actions",
            header: "",
            className: "text-right",
            render: (inv: Order) => (
              <div className="flex items-center gap-1.5 justify-end">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 px-2.5 text-xs font-semibold gap-1 cursor-pointer"
                  onClick={() => setPrintId(inv._id)}
                >
                  <Printer className="h-3 w-3" />
                  <span>Print</span>
                </Button>
                <Link href={APP_ROUTES.invoiceDetail(inv._id)}>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 px-2.5 text-xs font-semibold gap-1 cursor-pointer"
                  >
                    <span>View</span>
                    <ArrowRight className="h-3 w-3" />
                  </Button>
                </Link>
              </div>
            ),
          },
        ]}
      />

      {/* Print Preview Modal */}
      <Modal
        open={Boolean(printId && printData)}
        onClose={() => setPrintId(null)}
        title="Official GST Tax Invoice Preview"
        size="lg"
      >
        {printData && (
          <div className="space-y-4">
            <div className="rounded-xl border border-border/80 bg-white p-2 overflow-x-auto shadow-sm">
              <GstInvoicePrint
                printRef={printRef}
                order={printData.order as InvoicePayload["order"]}
                business={printData.business}
                outlet={printData.outlet}
              />
            </div>
            <div className="flex items-center gap-3 no-print pt-2 border-t border-border/60">
              <Button
                variant="outline"
                className="flex-1 h-10 font-semibold"
                onClick={() => setPrintId(null)}
              >
                Close Preview
              </Button>
              <Button
                className="flex-1 h-10 font-bold gap-2 shadow-xs cursor-pointer"
                onClick={() => printGstInvoice()}
              >
                <Printer className="h-4 w-4" />
                <span>Print Official Invoice</span>
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
