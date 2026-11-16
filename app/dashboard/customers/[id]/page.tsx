"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  IndianRupee,
  Phone,
  Building2,
  FileText,
  CreditCard,
  Plus,
  Receipt,
  Calendar,
  CheckCircle2,
  AlertCircle,
  MapPin,
  Clock,
  Sparkles,
  Pencil,
  Trash2,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Modal } from "@/components/ui/modal";
import { Select } from "@/components/ui/select";
import { DataTable } from "@/components/ui/data-table";
import { useAuth } from "@/components/auth/auth-provider";
import { useFeature } from "@/hooks/useFeature";
import { customerService } from "@/services/customer.service";
import { formatCurrency, formatDateTime } from "@/lib/format";
import type { Customer, CustomerTransaction } from "@/lib/types";
import { toast } from "react-hot-toast";
import { getErrorMessage } from "@/lib/error";
import { APP_ROUTES } from "@/lib/routes";
import { useQueryStates, parseAsString, parseAsInteger } from "nuqs";
import { JollyDateRangePicker } from "@/components/ui/jolly-date-picker";
import { parseDate } from "@internationalized/date";
import { cn } from "@/lib/utils";

const TX_CONFIG: Record<
  string,
  { label: string; variant: "soft" | "warning" | "danger" | "secondary"; icon: any }
> = {
  sale: { label: "Credit Sale", variant: "warning", icon: Receipt },
  payment: { label: "Payment Received", variant: "soft", icon: IndianRupee },
  credit_note: { label: "Credit Note", variant: "secondary", icon: FileText },
  opening_balance: { label: "Opening Balance", variant: "secondary", icon: Sparkles },
  void_reversal: { label: "Void Reversal", variant: "danger", icon: AlertCircle },
};

function getCustomerInitials(name: string): string {
  if (!name) return "CU";
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

export default function CustomerDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const { token, outletId, user } = useAuth();
  const currency = user?.currency || "INR";
  const qc = useQueryClient();
  const hasCreditKhata = useFeature("credit_khata");
  const canCollect =
    hasCreditKhata &&
    (user?.role === "owner" || user?.role === "manager" || user?.role === "superadmin");

  const [query, setQuery] = useQueryStates({
    page: parseAsInteger.withDefault(1),
    limit: parseAsInteger.withDefault(50),
    from: parseAsString.withDefault(""),
    to: parseAsString.withDefault(""),
  });

  const EMPTY_FORM = { amount: "", method: "cash", note: "" };
  const [showPay, setShowPay] = React.useState(false);
  const [payForm, setPayForm] = React.useState(EMPTY_FORM);

  const [showEdit, setShowEdit] = React.useState(false);
  const [editForm, setEditForm] = React.useState({
    name: "",
    phone: "",
    gstin: "",
    address: "",
    creditLimit: "",
    defaultTaxMode: "exclusive" as "exclusive" | "inclusive",
  });

  const [showDelete, setShowDelete] = React.useState(false);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["customer-details", id, query.page, query.limit, query.from, query.to],
    queryFn: () =>
      customerService.getCustomerLedger(id, token, {
        page: query.page,
        limit: query.limit,
        from: query.from || undefined,
        to: query.to || undefined,
      }),
    enabled: Boolean(token && id),
  });

  const saveMutation = useMutation({
    mutationFn: (body: unknown) => customerService.addPayment(id, body, token),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["customer-details"] });
      qc.invalidateQueries({ queryKey: ["customers"] });
      setShowPay(false);
      setPayForm(EMPTY_FORM);
      toast.success("Payment recorded successfully in khata ledger");
    },
    onError: (err) => toast.error(getErrorMessage(err, "Failed to record payment")),
  });

  const updateMutation = useMutation({
    mutationFn: (body: unknown) => customerService.updateCustomer(id, body, token),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["customer-details", id] });
      qc.invalidateQueries({ queryKey: ["customers"] });
      setShowEdit(false);
      toast.success("Customer profile updated successfully");
    },
    onError: (err) => toast.error(getErrorMessage(err, "Failed to update customer")),
  });

  const deleteMutation = useMutation({
    mutationFn: () => customerService.deleteCustomer(id, token),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["customers"] });
      setShowDelete(false);
      toast.success("Customer account removed successfully");
      router.push(APP_ROUTES.CUSTOMERS);
    },
    onError: (err) => toast.error(getErrorMessage(err, "Failed to delete customer")),
  });

  const customer = data?.customer;
  const transactions: CustomerTransaction[] = data?.transactions ?? [];

  const availableCredit = React.useMemo(() => {
    if (!customer?.creditLimit) return null;
    return Math.max(0, customer.creditLimit - (customer.outstandingBalance || 0));
  }, [customer?.creditLimit, customer?.outstandingBalance]);

  if (isLoading) {
    return (
      <div className="p-8 text-center">
        <p className="text-sm text-muted-foreground animate-pulse">Loading customer ledger...</p>
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="space-y-4 max-w-lg mx-auto my-12 text-center p-8 rounded-2xl border border-border/70 bg-card">
        <Link
          href={APP_ROUTES.CUSTOMERS}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline mb-2"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Customers
        </Link>
        <h2 className="text-lg font-bold text-foreground">Customer Not Found</h2>
        <p className="text-xs text-muted-foreground">The requested customer record does not exist or has been removed.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Navigation Breadcrumb */}
      <div>
        <Link
          href={APP_ROUTES.CUSTOMERS}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors mb-3"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back to Customers Directory</span>
        </Link>
      </div>

      {/* Customer Header Identity Card */}
      <Card className="border border-border/70 bg-card shadow-2xs">
        <CardContent className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary font-bold text-xl tracking-wide border border-primary/20 shadow-2xs">
              {getCustomerInitials(customer.name)}
            </div>
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="text-2xl font-black tracking-tight text-foreground">{customer.name}</h1>
                <Badge
                  variant={customer.outstandingBalance > 0 ? "warning" : "soft"}
                  className="text-xs font-semibold px-2.5 py-0.5"
                >
                  {customer.outstandingBalance > 0 ? "Khata Active" : "Balance Settled"}
                </Badge>
              </div>

              <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground pt-0.5">
                {customer.phone && (
                  <span className="font-mono flex items-center gap-1">
                    <Phone className="h-3.5 w-3.5" />
                    {customer.phone}
                  </span>
                )}
                {customer.gstin && (
                  <span className="font-mono bg-muted/60 px-2 py-0.5 rounded border border-border/50">
                    GSTIN: {customer.gstin}
                  </span>
                )}
                {customer.address && (
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5" />
                    {customer.address}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <JollyDateRangePicker
              label="Filter Ledger"
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

            {canCollect && customer.outstandingBalance > 0 && (
              <Button
                onClick={() => {
                  setPayForm({
                    amount: String(customer.outstandingBalance),
                    method: "cash",
                    note: "",
                  });
                  setShowPay(true);
                }}
                className="h-10 px-4 text-xs font-bold gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs cursor-pointer"
              >
                <IndianRupee className="h-4 w-4" />
                <span>Receive Payment</span>
              </Button>
            )}

            <Button
              variant="outline"
              onClick={() => {
                setEditForm({
                  name: customer.name,
                  phone: customer.phone || "",
                  gstin: customer.gstin || "",
                  address: customer.address || "",
                  creditLimit: customer.creditLimit ? String(customer.creditLimit) : "",
                  defaultTaxMode: customer.defaultTaxMode || "exclusive",
                });
                setShowEdit(true);
              }}
              className="h-10 px-3.5 text-xs font-semibold gap-1.5 cursor-pointer"
            >
              <Pencil className="h-3.5 w-3.5" />
              <span>Edit Profile</span>
            </Button>

            <Button
              variant="outline"
              onClick={() => setShowDelete(true)}
              className="h-10 px-3 text-xs font-semibold gap-1.5 text-muted-foreground hover:text-destructive hover:border-destructive/30 cursor-pointer"
              title="Delete Customer Account"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Delete</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* KPI Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        <Card className="border border-border/70 bg-card shadow-2xs hover:shadow-xs transition-shadow">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                Outstanding Balance
              </p>
              <p
                className={cn(
                  "text-xl font-extrabold tracking-tight mt-1 truncate",
                  customer.outstandingBalance > 0 ? "text-amber-600 dark:text-amber-400" : "text-emerald-600"
                )}
              >
                {formatCurrency(customer.outstandingBalance, currency)}
              </p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                {customer.outstandingBalance > 0 ? "Payment collection pending" : "All dues settled"}
              </p>
            </div>
            <div
              className={cn(
                "h-10 w-10 rounded-xl flex items-center justify-center shrink-0 border",
                customer.outstandingBalance > 0
                  ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20"
                  : "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
              )}
            >
              <IndianRupee className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border border-border/70 bg-card shadow-2xs hover:shadow-xs transition-shadow">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                Credit Limit
              </p>
              <p className="text-xl font-extrabold text-foreground tracking-tight mt-1 truncate">
                {customer.creditLimit ? formatCurrency(customer.creditLimit, currency) : "No Limit"}
              </p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                {availableCredit !== null
                  ? `${formatCurrency(availableCredit, currency)} available`
                  : "Unlimited khata ceiling"}
              </p>
            </div>
            <div className="h-10 w-10 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 border border-indigo-500/20">
              <CreditCard className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border border-border/70 bg-card shadow-2xs hover:shadow-xs transition-shadow">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                Ledger Entries
              </p>
              <p className="text-xl font-extrabold text-foreground tracking-tight mt-1 truncate">
                {data?.total ?? transactions.length} Transactions
              </p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                In this account history
              </p>
            </div>
            <div className="h-10 w-10 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 border border-blue-500/20">
              <Receipt className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border border-border/70 bg-card shadow-2xs hover:shadow-xs transition-shadow">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                Default GST Mode
              </p>
              <p className="text-xl font-extrabold text-foreground tracking-tight mt-1 truncate">
                {customer.defaultTaxMode === "inclusive" ? "GST Included" : "GST Extra"}
              </p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Applied on cashier checkout
              </p>
            </div>
            <div className="h-10 w-10 rounded-xl bg-muted/60 text-muted-foreground flex items-center justify-center shrink-0 border border-border/60">
              <Building2 className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Ledger Table */}
      <DataTable
        isLoading={isLoading}
        data={transactions}
        keyExtractor={(t) => t._id}
        totalItems={data?.total ?? transactions.length}
        page={query.page}
        limit={query.limit}
        onPageChange={(p) => setQuery({ page: p })}
        onLimitChange={(size) => setQuery({ limit: size, page: 1 })}
        onRefetch={() => refetch()}
        emptyStateText="No transactions found in this date range."
        columns={[
          {
            key: "date",
            header: "Date & Time",
            render: (t) => (
              <div className="text-xs">
                <span className="font-semibold text-foreground block">
                  {formatDateTime(t.createdAt)}
                </span>
              </div>
            ),
          },
          {
            key: "type",
            header: "Transaction Type",
            render: (t) => {
              const cfg = TX_CONFIG[t.type] || {
                label: t.type,
                variant: "secondary",
                icon: FileText,
              };
              const Icon = cfg.icon;
              return (
                <Badge
                  variant={cfg.variant}
                  className="gap-1 text-[11px] font-semibold px-2 py-0.5 capitalize"
                >
                  <Icon className="h-3 w-3" />
                  <span>{cfg.label}</span>
                </Badge>
              );
            },
          },
          {
            key: "order",
            header: "Bill Ref",
            render: (t) => {
              const order = typeof t.orderId === "object" ? t.orderId : null;
              return order ? (
                <span className="font-mono text-xs font-bold text-primary">
                  {order.orderNumber}
                </span>
              ) : (
                <span className="text-xs text-muted-foreground font-mono">None</span>
              );
            },
          },
          {
            key: "debit",
            header: "Debit (+Bill)",
            render: (t) => (
              <span
                className={cn(
                  "font-mono text-xs",
                  t.debit > 0 ? "font-bold text-amber-600 dark:text-amber-400" : "text-muted-foreground"
                )}
              >
                {t.debit > 0 ? `+${formatCurrency(t.debit, currency)}` : "None"}
              </span>
            ),
          },
          {
            key: "credit",
            header: "Credit (-Paid)",
            render: (t) => (
              <span
                className={cn(
                  "font-mono text-xs",
                  t.credit > 0 ? "font-bold text-emerald-600 dark:text-emerald-400" : "text-muted-foreground"
                )}
              >
                {t.credit > 0 ? `-${formatCurrency(t.credit, currency)}` : "None"}
              </span>
            ),
          },
          {
            key: "balance",
            header: "Running Balance",
            render: (t) => (
              <span className="font-mono text-xs font-black text-foreground">
                {formatCurrency(t.balanceAfter, currency)}
              </span>
            ),
          },
          {
            key: "note",
            header: "Settlement Note",
            render: (t) => (
              <span className="text-xs text-muted-foreground max-w-[200px] truncate block">
                {t.note || "No note recorded"}
              </span>
            ),
          },
        ]}
      />

      {/* Receive Payment Modal */}
      <Modal
        open={showPay}
        onClose={() => setShowPay(false)}
        title="Record Khata Payment"
        description="Receive cash, UPI, or card payment towards customer's outstanding balance."
        size="md"
      >
        <div className="rounded-xl border border-border/80 bg-muted/20 p-3.5 mb-4 space-y-1">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground font-medium">Customer:</span>
            <span className="font-bold text-foreground">{customer.name}</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground font-medium">Current Outstanding:</span>
            <span className="font-mono font-bold text-amber-600 dark:text-amber-400">
              {formatCurrency(customer.outstandingBalance, currency)}
            </span>
          </div>
        </div>

        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            saveMutation.mutate({
              amount: Number(payForm.amount),
              method: payForm.method,
              note: payForm.note || undefined,
              outletId: outletId ?? undefined,
            });
          }}
        >
          {/* Quick Amount Chips */}
          <div>
            <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Quick Preset
            </label>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="h-8 text-xs font-semibold"
                onClick={() => setPayForm((f) => ({ ...f, amount: String(customer.outstandingBalance) }))}
              >
                Full Due ({formatCurrency(customer.outstandingBalance, currency)})
              </Button>
              {customer.outstandingBalance > 500 && (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="h-8 text-xs font-semibold"
                  onClick={() =>
                    setPayForm((f) => ({
                      ...f,
                      amount: String(Math.round(customer.outstandingBalance / 2)),
                    }))
                  }
                >
                  Half Due
                </Button>
              )}
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Amount Received ({currency}) *
            </label>
            <Input
              type="number"
              min={1}
              max={customer.outstandingBalance}
              required
              value={payForm.amount}
              onChange={(e) => setPayForm((f) => ({ ...f, amount: e.target.value }))}
              className="h-10 text-sm font-mono"
              placeholder="0.00"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Payment Method
            </label>
            <Select
              value={payForm.method}
              onValueChange={(v) => setPayForm((f) => ({ ...f, method: v }))}
              options={[
                { value: "cash", label: "Cash" },
                { value: "upi", label: "UPI" },
                { value: "card", label: "Card" },
                { value: "bank_transfer", label: "Bank Transfer" },
              ]}
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Payment Note (Optional)
            </label>
            <Input
              value={payForm.note}
              onChange={(e) => setPayForm((f) => ({ ...f, note: e.target.value }))}
              placeholder="e.g. UPI ref no, receipt remarks"
              className="h-10 text-sm"
            />
          </div>

          <div className="flex items-center gap-3 pt-3 border-t border-border/60">
            <Button
              variant="outline"
              type="button"
              className="flex-1 h-10 font-semibold"
              onClick={() => setShowPay(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1 h-10 font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs"
              disabled={saveMutation.isPending || !payForm.amount}
            >
              {saveMutation.isPending ? "Recording..." : "Record Payment"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Edit Customer Profile Modal */}
      <Modal
        open={showEdit}
        onClose={() => setShowEdit(false)}
        title="Edit Customer Profile"
        description="Update customer contact information, GSTIN, and credit terms."
        size="lg"
      >
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            updateMutation.mutate({
              name: editForm.name,
              phone: editForm.phone || undefined,
              gstin: editForm.gstin || undefined,
              address: editForm.address || undefined,
              defaultTaxMode: editForm.defaultTaxMode,
              creditLimit: editForm.creditLimit ? Number(editForm.creditLimit) : 0,
            });
          }}
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Customer Name *
              </label>
              <Input
                required
                value={editForm.name}
                onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="e.g. Ramesh Sharma"
                className="h-10 text-sm"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Contact Phone
              </label>
              <Input
                value={editForm.phone}
                onChange={(e) => setEditForm((f) => ({ ...f, phone: e.target.value }))}
                placeholder="+91 98765 43210"
                className="h-10 text-sm font-mono"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Customer GSTIN
              </label>
              <Input
                value={editForm.gstin}
                onChange={(e) => setEditForm((f) => ({ ...f, gstin: e.target.value.toUpperCase() }))}
                placeholder="24ABCDE1234F1Z5"
                className="h-10 text-sm font-mono uppercase"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Billing Address
              </label>
              <Input
                value={editForm.address}
                onChange={(e) => setEditForm((f) => ({ ...f, address: e.target.value }))}
                placeholder="Street address, City, Pincode"
                className="h-10 text-sm"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Credit Limit ({currency})
              </label>
              <Input
                type="number"
                min={0}
                value={editForm.creditLimit}
                onChange={(e) => setEditForm((f) => ({ ...f, creditLimit: e.target.value }))}
                placeholder="0 for unlimited"
                className="h-10 text-sm font-mono"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Default GST Mode
              </label>
              <Select
                value={editForm.defaultTaxMode}
                onValueChange={(v) => setEditForm((f) => ({ ...f, defaultTaxMode: v as "exclusive" | "inclusive" }))}
                options={[
                  { value: "exclusive", label: "GST Extra (Exclusive)" },
                  { value: "inclusive", label: "GST Included (Inclusive)" },
                ]}
              />
            </div>
          </div>

          <div className="flex items-center gap-3 pt-3 border-t border-border/60">
            <Button
              variant="outline"
              type="button"
              className="flex-1 h-10 font-semibold cursor-pointer"
              onClick={() => setShowEdit(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1 h-10 font-semibold shadow-xs cursor-pointer"
              disabled={updateMutation.isPending}
            >
              {updateMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Customer Confirmation Modal */}
      <Modal
        open={showDelete}
        onClose={() => setShowDelete(false)}
        title="Delete Customer Account"
        description="Permanently archive this customer profile from your active customer directory."
        size="md"
      >
        <div className="space-y-4">
          <div className="p-4 rounded-xl border border-border/70 bg-muted/40 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-foreground">{customer.name}</span>
              {customer.phone && (
                <span className="text-xs text-muted-foreground font-mono">{customer.phone}</span>
              )}
            </div>
            <div className="flex items-center justify-between pt-1 border-t border-border/40 text-xs">
              <span className="text-muted-foreground">Outstanding Balance:</span>
              <span className={cn("font-bold font-mono", (customer.outstandingBalance ?? 0) > 0 ? "text-amber-600" : "text-emerald-600")}>
                {formatCurrency(customer.outstandingBalance ?? 0, currency)}
              </span>
            </div>
          </div>

          {(customer.outstandingBalance ?? 0) > 0 ? (
            <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/25 text-amber-800 dark:text-amber-300 text-xs flex items-start gap-2.5">
              <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
              <p>
                This customer has an outstanding balance of{" "}
                <strong>{formatCurrency(customer.outstandingBalance, currency)}</strong>. You must settle or clear all khata dues before deleting this customer account.
              </p>
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">
              Historical invoices, bills, and ledger records created for this customer will be preserved for accounting and audit compliance.
            </p>
          )}

          <div className="flex items-center gap-3 pt-2">
            <Button
              variant="outline"
              type="button"
              className="flex-1 h-10 font-semibold cursor-pointer"
              onClick={() => setShowDelete(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              type="button"
              className="flex-1 h-10 font-semibold shadow-xs cursor-pointer"
              disabled={deleteMutation.isPending || (customer.outstandingBalance ?? 0) > 0}
              onClick={() => deleteMutation.mutate()}
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete Customer"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
