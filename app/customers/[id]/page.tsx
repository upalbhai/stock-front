"use client";

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, IndianRupee } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { Select } from "@/components/ui/select";
import { DataTable } from "@/components/ui/data-table";
import { StatsCard } from "@/components/ui/stats-card";
import { useAuth } from "@/components/auth/auth-provider";
import { useFeature } from "@/hooks/useFeature";
import { getJson, apiFetch } from "@/lib/api-client";
import { formatCurrency, formatDateTime } from "@/lib/format";
import type { Customer, CustomerTransaction } from "@/lib/types";

const TX_LABELS: Record<string, string> = {
  sale: "Credit sale",
  payment: "Payment received",
  credit_note: "Credit note",
  opening_balance: "Opening balance",
  void_reversal: "Void reversal"
};

export default function CustomerDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const { token, outletId, user } = useAuth();
  const qc = useQueryClient();
  const hasCreditKhata = useFeature("credit_khata");
  const canCollect =
    hasCreditKhata &&
    (user?.role === "owner" || user?.role === "manager" || user?.role === "superadmin");

  const [showPay, setShowPay] = React.useState(false);
  const [payForm, setPayForm] = React.useState({ amount: "", method: "cash", note: "" });

  const { data, isLoading } = useQuery({
    queryKey: ["customer-ledger", id],
    queryFn: () =>
      getJson<{ customer: Customer; transactions: CustomerTransaction[] }>(`/customers/${id}/ledger`, token),
    enabled: Boolean(token && id)
  });

  const recordPayment = useMutation({
    mutationFn: (body: unknown) => apiFetch(`/customers/${id}/payments`, { method: "POST", body, token }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["customer-ledger", id] });
      qc.invalidateQueries({ queryKey: ["customers"] });
      setShowPay(false);
      setPayForm({ amount: "", method: "cash", note: "" });
    }
  });

  const customer = data?.customer;
  const transactions = data?.transactions ?? [];

  if (isLoading) {
    return <p className="text-sm text-muted">Loading customer...</p>;
  }

  if (!customer) {
    return (
      <div className="space-y-4">
        <Link href="/customers" className="inline-flex items-center gap-1 text-sm text-muted hover:text-text">
          <ArrowLeft className="h-4 w-4" /> Back to customers
        </Link>
        <p className="text-muted">Customer not found.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link href="/customers" className="inline-flex items-center gap-1 text-sm text-muted hover:text-text mb-2">
            <ArrowLeft className="h-4 w-4" /> Customers
          </Link>
          <h1 className="text-2xl font-bold">{customer.name}</h1>
          <div className="mt-1 flex flex-wrap gap-2 text-sm text-muted">
            {customer.phone && <span>{customer.phone}</span>}
            {customer.gstin && <span>· GSTIN: {customer.gstin}</span>}
          </div>
        </div>
        {canCollect && customer.outstandingBalance > 0 && (
          <Button onClick={() => setShowPay(true)}>
            <IndianRupee className="h-4 w-4" /> Receive Payment
          </Button>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatsCard label="Outstanding Balance" value={formatCurrency(customer.outstandingBalance)} />
        <StatsCard
          label="Credit Limit"
          value={customer.creditLimit ? formatCurrency(customer.creditLimit) : "No limit"}
        />
        <StatsCard label="Default GST" value={customer.defaultTaxMode === "inclusive" ? "Included" : "Extra"} />
      </div>

      <div>
        <h2 className="text-lg font-semibold mb-3">Khata Ledger</h2>
        <DataTable
          loading={false}
          data={transactions}
          keyExtractor={(t) => t._id}
          emptyMessage="No transactions yet."
          columns={[
            {
              key: "date",
              header: "Date",
              render: (t) => <span className="text-sm text-muted">{formatDateTime(t.createdAt)}</span>
            },
            {
              key: "type",
              header: "Type",
              render: (t) => (
                <Badge variant={t.type === "payment" || t.type === "void_reversal" ? "soft" : "warning"} className="text-[10px]">
                  {TX_LABELS[t.type] ?? t.type}
                </Badge>
              )
            },
            {
              key: "order",
              header: "Bill",
              render: (t) => {
                const order = typeof t.orderId === "object" ? t.orderId : null;
                return order ? (
                  <span className="text-sm">{order.orderNumber}</span>
                ) : (
                  <span className="text-sm text-muted">—</span>
                );
              }
            },
            {
              key: "debit",
              header: "Debit",
              render: (t) => (
                <span className={t.debit > 0 ? "text-sm font-medium text-warning" : "text-sm text-muted"}>
                  {t.debit > 0 ? formatCurrency(t.debit) : "—"}
                </span>
              )
            },
            {
              key: "credit",
              header: "Credit",
              render: (t) => (
                <span className={t.credit > 0 ? "text-sm font-medium text-green-600" : "text-sm text-muted"}>
                  {t.credit > 0 ? formatCurrency(t.credit) : "—"}
                </span>
              )
            },
            {
              key: "balance",
              header: "Balance",
              render: (t) => <span className="text-sm font-semibold">{formatCurrency(t.balanceAfter)}</span>
            },
            {
              key: "note",
              header: "Note",
              render: (t) => <span className="text-xs text-muted max-w-[160px] truncate block">{t.note || "—"}</span>
            }
          ]}
        />
      </div>

      <Modal open={showPay} onClose={() => setShowPay(false)} title="Receive Payment" size="sm">
        <p className="mb-4 text-sm text-muted">
          Outstanding: <strong>{formatCurrency(customer.outstandingBalance)}</strong>
        </p>
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            recordPayment.mutate({
              amount: Number(payForm.amount),
              method: payForm.method,
              note: payForm.note || undefined,
              outletId: outletId ?? undefined
            });
          }}
        >
          <div>
            <label className="mb-1 block text-xs font-medium text-muted">Amount (₹) *</label>
            <Input
              type="number"
              min={1}
              max={customer.outstandingBalance}
              required
              value={payForm.amount}
              onChange={(e) => setPayForm((f) => ({ ...f, amount: e.target.value }))}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-muted">Method</label>
            <Select
              value={payForm.method}
              onValueChange={(v) => setPayForm((f) => ({ ...f, method: v }))}
              options={[
                { value: "cash", label: "Cash" },
                { value: "upi", label: "UPI" },
                { value: "card", label: "Card" }
              ]}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-muted">Note</label>
            <Input value={payForm.note} onChange={(e) => setPayForm((f) => ({ ...f, note: e.target.value }))} placeholder="Optional" />
          </div>
          <div className="flex gap-3">
            <Button variant="outline" type="button" className="flex-1" onClick={() => setShowPay(false)}>Cancel</Button>
            <Button type="submit" className="flex-1" disabled={recordPayment.isPending}>
              {recordPayment.isPending ? "Saving..." : "Record Payment"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
