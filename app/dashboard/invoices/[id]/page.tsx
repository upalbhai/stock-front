"use client";

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Printer, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
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
    enabled: Boolean(token && id)
  });

  if (isLoading) return <p className="text-sm text-muted">Loading invoice...</p>;

  if (!data?.order) {
    return (
      <div className="space-y-4">
        <Link href={APP_ROUTES.INVOICES} className="inline-flex items-center gap-1 text-sm text-muted hover:text-text">
          <ArrowLeft className="h-4 w-4" /> Invoices
        </Link>
        <p className="text-muted">Invoice not found.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 no-print">
        <Link href={APP_ROUTES.INVOICES} className="inline-flex items-center gap-1 text-sm text-muted hover:text-text">
          <ArrowLeft className="h-4 w-4" /> Back to invoices
        </Link>
        <div className="flex gap-2">
          <Button
            variant="outline"
            className="gap-1"
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
            <Download className="h-4 w-4" /> {exporting ? "Exporting…" : "Download PDF"}
          </Button>
          <Button className="gap-1" onClick={() => printGstInvoice()}>
            <Printer className="h-4 w-4" /> Print Invoice
          </Button>
        </div>
      </div>

      <div className="rounded-2xl border border-border/70 bg-white shadow-soft overflow-hidden">
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
