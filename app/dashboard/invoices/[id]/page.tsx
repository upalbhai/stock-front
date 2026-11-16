"use client";

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Printer, Download, FileText, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/components/auth/auth-provider";
import { getJson } from "@/lib/api-client";
import { GstInvoicePrint, printGstInvoice } from "@/components/invoices/gst-invoice-print";
import { exportInvoicePdf } from "@/lib/exportInvoicePdf";
import type { Order, Customer } from "@/lib/types";
import { APP_ROUTES } from "@/lib/routes";

type InvoicePayload = {
  order: Order & { customerId?: Customer | null };
  business?: { name?: string; gstNumber?: string; address?: string; phone?: string };
  outlet?: { name?: string; address?: string; phone?: string };
};

export default function InvoiceDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const { token } = useAuth();
  const printRef = React.useRef<HTMLDivElement>(null);
  const [exporting, setExporting] = React.useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["invoice", id],
    queryFn: () => getJson<InvoicePayload>(`/invoices/${id}`, token),
    enabled: Boolean(token && id),
  });

  if (isLoading) {
    return (
      <div className="p-8 text-center">
        <p className="text-sm text-muted-foreground animate-pulse">Loading GST invoice details...</p>
      </div>
    );
  }

  if (!data?.order) {
    return (
      <div className="space-y-4 max-w-lg mx-auto my-12 text-center p-8 rounded-2xl border border-border/70 bg-card">
        <Link
          href={APP_ROUTES.INVOICES}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline mb-2"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Invoices
        </Link>
        <h2 className="text-lg font-bold text-foreground">Invoice Not Found</h2>
        <p className="text-xs text-muted-foreground">The requested tax invoice could not be located.</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 no-print border-b border-border/60 pb-4">
        <div>
          <Link
            href={APP_ROUTES.INVOICES}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors mb-2"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Back to Invoices Directory</span>
          </Link>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black tracking-tight text-foreground">
              {data.order.invoiceNumber}
            </h1>
            <Badge variant="soft" className="text-xs font-bold bg-primary/10 text-primary border border-primary/20">
              Tax Invoice
            </Badge>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            className="h-10 px-4 text-xs font-semibold gap-1.5 cursor-pointer"
            disabled={exporting}
            onClick={async () => {
              setExporting(true);
              try {
                await exportInvoicePdf(printRef.current, data.order.invoiceNumber);
              } finally {
                setExporting(false);
              }
            }}
          >
            <Download className="h-4 w-4" />
            <span>{exporting ? "Generating PDF..." : "Download PDF"}</span>
          </Button>

          <Button
            className="h-10 px-4 text-xs font-bold gap-1.5 shadow-xs cursor-pointer"
            onClick={() => printGstInvoice()}
          >
            <Printer className="h-4 w-4" />
            <span>Print Invoice</span>
          </Button>
        </div>
      </div>

      {/* Invoice Document Paper Container */}
      <div className="rounded-2xl border border-border/80 bg-white shadow-soft overflow-hidden p-2 sm:p-4">
        <GstInvoicePrint
          printRef={printRef}
          order={data.order}
          business={data.business}
          outlet={data.outlet}
        />
      </div>
    </div>
  );
}
