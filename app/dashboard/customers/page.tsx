"use client";

import * as React from "react";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Plus,
  Users,
  IndianRupee,
  Phone,
  FileText,
  AlertCircle,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  RefreshCw,
  Search,
  Pencil,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Modal } from "@/components/ui/modal";
import { Select } from "@/components/ui/select";
import { DataTable } from "@/components/ui/data-table";
import { useAuth } from "@/components/auth/auth-provider";
import { useFeature } from "@/hooks/useFeature";
import { customerService } from "@/services/customer.service";
import { formatCurrency } from "@/lib/format";
import type { Customer } from "@/lib/types";
import toast from "react-hot-toast";
import { getErrorMessage } from "@/lib/error";
import { APP_ROUTES } from "@/lib/routes";
import { useQueryStates, parseAsString, parseAsInteger } from "nuqs";
import { JollyDateRangePicker } from "@/components/ui/jolly-date-picker";
import { parseDate } from "@internationalized/date";
import { cn } from "@/lib/utils";

function getCustomerInitials(name: string): string {
  if (!name) return "CU";
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

export default function CustomersPage() {
  const { user, token, outletId } = useAuth();
  const currency = user?.currency || "INR";
  const qc = useQueryClient();
  const hasCustomers = useFeature("customers");

  const [query, setQuery] = useQueryStates({
    page: parseAsInteger.withDefault(1),
    limit: parseAsInteger.withDefault(50),
    search: parseAsString.withDefault(""),
    balanceFilter: parseAsString.withDefault(""),
    from: parseAsString.withDefault(""),
    to: parseAsString.withDefault(""),
  });

  const [showModal, setShowModal] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState<"all" | "due" | "clear">("all");

  const [editingCustomer, setEditingCustomer] = React.useState<Customer | null>(null);
  const [editForm, setEditForm] = React.useState({
    name: "",
    phone: "",
    gstin: "",
    address: "",
    creditLimit: "",
    defaultTaxMode: "exclusive",
  });

  const [deletingCustomer, setDeletingCustomer] = React.useState<Customer | null>(null);

  const [payingCustomer, setPayingCustomer] = React.useState<Customer | null>(null);
  const [payForm, setPayForm] = React.useState({
    amount: "",
    method: "cash",
    note: "",
  });

  const emptyForm = {
    name: "",
    phone: "",
    gstin: "",
    address: "",
    creditLimit: "",
    openingBalance: "",
    defaultTaxMode: "exclusive",
  };
  const [form, setForm] = React.useState(emptyForm);

  const { data, isLoading, refetch } = useQuery({
    queryKey: [
      "customers",
      outletId,
      query.search,
      query.balanceFilter,
      query.page,
      query.limit,
      query.from,
      query.to,
    ],
    queryFn: () =>
      customerService.getCustomers(token, {
        outletId: outletId ?? undefined,
        search: query.search || undefined,
        hasBalance: query.balanceFilter === "due" ? "true" : undefined,
        page: query.page,
        limit: query.limit,
        from: query.from || undefined,
        to: query.to || undefined,
      }),
    enabled: Boolean(token) && hasCustomers,
  });

  const saveMutation = useMutation({
    mutationFn: (body: unknown) => customerService.createCustomer(body, token),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["customers"] });
      setShowModal(false);
      setForm({ ...emptyForm });
      toast.success("Customer account registered successfully");
    },
    onError: (err) => toast.error(getErrorMessage(err, "Failed to register customer")),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: unknown }) =>
      customerService.updateCustomer(id, data, token),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["customers"] });
      setEditingCustomer(null);
      toast.success("Customer profile updated successfully");
    },
    onError: (err) => toast.error(getErrorMessage(err, "Failed to update customer")),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => customerService.deleteCustomer(id, token),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["customers"] });
      setDeletingCustomer(null);
      toast.success("Customer account removed successfully");
    },
    onError: (err) => toast.error(getErrorMessage(err, "Failed to delete customer")),
  });

  const payMutation = useMutation({
    mutationFn: ({ id, body }: { id: string; body: unknown }) =>
      customerService.addPayment(id, body, token),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["customers"] });
      setPayingCustomer(null);
      toast.success("Payment recorded successfully in khata ledger");
    },
    onError: (err) => toast.error(getErrorMessage(err, "Failed to record payment")),
  });

  const customers: Customer[] = React.useMemo(() => data?.customers ?? [], [data?.customers]);
  const totalOutstanding = data?.totalOutstanding ?? 0;

  const dueCustomers = React.useMemo(
    () => customers.filter((c) => (c.outstandingBalance ?? 0) > 0),
    [customers]
  );
  const clearCustomers = React.useMemo(
    () => customers.filter((c) => (c.outstandingBalance ?? 0) <= 0),
    [customers]
  );

  const displayedCustomers = React.useMemo(() => {
    if (activeTab === "due") return dueCustomers;
    if (activeTab === "clear") return clearCustomers;
    return customers;
  }, [activeTab, customers, dueCustomers, clearCustomers]);

  if (!hasCustomers) {
    return (
      <div className="rounded-2xl border border-border/70 bg-card p-10 text-center max-w-lg mx-auto my-12 shadow-sm">
        <div className="h-14 w-14 rounded-2xl bg-primary/10 text-primary mx-auto flex items-center justify-center border border-primary/20 mb-4">
          <Users className="h-7 w-7" />
        </div>
        <h1 className="text-xl font-bold text-foreground">Customer Accounts</h1>
        <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
          Customer directory and khata credit ledgers are not enabled for your subscription plan.
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
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Customers</h1>
            <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 text-xs">
              Khata Ledger
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">
            Manage customer directories, track credit ledgers, and monitor receivables.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
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

          <Button
            onClick={() => setShowModal(true)}
            className="h-10 px-4 text-xs font-semibold gap-1.5 shadow-xs cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>Add Customer</span>
          </Button>
        </div>
      </div>

      {/* KPI Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        <Card className="border border-border/70 bg-card shadow-2xs hover:shadow-xs transition-shadow">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                Total Customers
              </p>
              <p className="text-xl font-extrabold text-foreground tracking-tight mt-1 truncate">
                {data?.total ?? customers.length} Accounts
              </p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Registered in customer khata
              </p>
            </div>
            <div className="h-10 w-10 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 border border-indigo-500/20">
              <Users className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border border-border/70 bg-card shadow-2xs hover:shadow-xs transition-shadow">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                Total Outstanding
              </p>
              <p className="text-xl font-extrabold text-amber-600 dark:text-amber-400 tracking-tight mt-1 truncate">
                {formatCurrency(totalOutstanding, currency)}
              </p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Total uncollected khata dues
              </p>
            </div>
            <div className="h-10 w-10 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 border border-amber-500/20">
              <IndianRupee className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border border-border/70 bg-card shadow-2xs hover:shadow-xs transition-shadow">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                Accounts with Dues
              </p>
              <p className="text-xl font-extrabold text-amber-600 dark:text-amber-400 tracking-tight mt-1 truncate">
                {dueCustomers.length} Customers
              </p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Payment collection pending
              </p>
            </div>
            <div className="h-10 w-10 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 border border-amber-500/20">
              <AlertTriangle className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border border-border/70 bg-card shadow-2xs hover:shadow-xs transition-shadow">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                Settled / Clear
              </p>
              <p className="text-xl font-extrabold text-emerald-600 dark:text-emerald-400 tracking-tight mt-1 truncate">
                {clearCustomers.length} Customers
              </p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Zero balance or advance
              </p>
            </div>
            <div className="h-10 w-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/20">
              <CheckCircle2 className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Table */}
      <DataTable
        isLoading={isLoading}
        data={displayedCustomers}
        keyExtractor={(c) => c._id}
        totalItems={data?.total ?? customers.length}
        page={query.page}
        limit={query.limit}
        onPageChange={(p) => setQuery({ page: p })}
        onLimitChange={(size) => setQuery({ limit: size, page: 1 })}
        searchQuery={query.search}
        onSearchChange={(s) => setQuery({ search: s, page: 1 })}
        onRefetch={() => refetch()}
        placeholderText="Search customer name, phone, GSTIN..."
        emptyStateText="No customers found matching the selected filters."
        filters={
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 w-full">
            <Tabs
              value={activeTab}
              onValueChange={(v) => setActiveTab(v as "all" | "due" | "clear")}
              className="w-auto shrink-0"
            >
              <TabsList className="h-9 bg-muted/60 p-0.5 border border-border/40 shrink-0">
                <TabsTrigger
                  value="all"
                  className="h-full text-xs px-3.5 font-semibold whitespace-nowrap shrink-0 text-muted-foreground hover:text-foreground data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-xs transition-all"
                >
                  All ({customers.length})
                </TabsTrigger>
                <TabsTrigger
                  value="due"
                  className="h-full text-xs px-3.5 font-semibold whitespace-nowrap shrink-0 text-muted-foreground hover:text-foreground data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-xs transition-all"
                >
                  Balance Due ({dueCustomers.length})
                </TabsTrigger>
                <TabsTrigger
                  value="clear"
                  className="h-full text-xs px-3.5 font-semibold whitespace-nowrap shrink-0 text-muted-foreground hover:text-foreground data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-xs transition-all"
                >
                  Clear ({clearCustomers.length})
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        }
        columns={[
          {
            key: "customer",
            header: "Customer Account",
            render: (c) => (
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary font-bold text-sm tracking-wide border border-primary/20 shadow-2xs">
                  {getCustomerInitials(c.name)}
                </div>
                <div className="min-w-0">
                  <Link
                    href={APP_ROUTES.customerDetail(c._id)}
                    className="font-semibold text-sm text-foreground hover:text-primary transition-colors truncate block"
                  >
                    {c.name}
                  </Link>
                  <div className="flex items-center gap-2 mt-0.5">
                    {c.phone ? (
                      <span className="text-[11px] text-muted-foreground font-mono flex items-center gap-1">
                        <Phone className="h-3 w-3" />
                        {c.phone}
                      </span>
                    ) : (
                      <span className="text-[11px] text-muted-foreground">No phone</span>
                    )}
                    {c.gstin && (
                      <span className="inline-flex items-center text-[10px] font-mono font-medium text-muted-foreground bg-muted/60 px-1.5 py-0.2 rounded border border-border/40">
                        GST: {c.gstin}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ),
          },
          {
            key: "creditLimit",
            header: "Credit Limit",
            render: (c) => (
              <div className="text-xs">
                <span className="font-semibold text-foreground">
                  {c.creditLimit ? formatCurrency(c.creditLimit, currency) : "No Limit"}
                </span>
                <span className="text-[11px] text-muted-foreground block mt-0.5">
                  Tax: {c.defaultTaxMode === "inclusive" ? "GST Included" : "GST Extra"}
                </span>
              </div>
            ),
          },
          {
            key: "balance",
            header: "Khata Balance",
            render: (c) => {
              const due = c.outstandingBalance ?? 0;
              return due > 0 ? (
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/25">
                  <AlertCircle className="h-3.5 w-3.5" />
                  <span>{formatCurrency(due, currency)} Due</span>
                </div>
              ) : (
                <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-xs font-semibold bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  <span>Settled</span>
                </div>
              );
            },
          },
          {
            key: "actions",
            header: "Actions",
            className: "text-right",
            render: (c) => (
              <div className="flex items-center justify-end gap-1.5">
                {(c.outstandingBalance ?? 0) > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 px-2.5 text-xs font-semibold gap-1 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 border-emerald-500/30 cursor-pointer"
                    onClick={(e) => {
                      e.stopPropagation();
                      setPayingCustomer(c);
                      setPayForm({
                        amount: String(c.outstandingBalance),
                        method: "cash",
                        note: "",
                      });
                    }}
                    title="Receive Khata Payment"
                  >
                    <IndianRupee className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">Pay</span>
                  </Button>
                )}
                <Link href={APP_ROUTES.customerDetail(c._id)}>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 px-2.5 text-xs font-semibold gap-1 cursor-pointer"
                    title="View Customer Ledger"
                  >
                    <span>Ledger</span>
                    <ArrowRight className="h-3 w-3" />
                  </Button>
                </Link>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground cursor-pointer"
                  onClick={(e) => {
                    e.stopPropagation();
                    setEditingCustomer(c);
                    setEditForm({
                      name: c.name,
                      phone: c.phone || "",
                      gstin: c.gstin || "",
                      address: c.address || "",
                      creditLimit: c.creditLimit ? String(c.creditLimit) : "",
                      defaultTaxMode: c.defaultTaxMode || "exclusive",
                    });
                  }}
                  title="Edit Customer Details"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive hover:border-destructive/30 cursor-pointer"
                  onClick={(e) => {
                    e.stopPropagation();
                    setDeletingCustomer(c);
                  }}
                  title="Delete Customer Account"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            ),
          },
        ]}
      />

      {/* Add Customer Modal */}
      <Modal
        open={showModal}
        onClose={() => setShowModal(false)}
        title="Register Customer Account"
        description="Add a customer profile with contact information, credit limits, and default GST preferences."
        size="lg"
      >
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            saveMutation.mutate({
              outletId: outletId ?? undefined,
              name: form.name,
              phone: form.phone || undefined,
              gstin: form.gstin || undefined,
              address: form.address || undefined,
              defaultTaxMode: form.defaultTaxMode,
              creditLimit: form.creditLimit ? Number(form.creditLimit) : undefined,
              openingBalance: form.openingBalance ? Number(form.openingBalance) : undefined,
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
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="e.g. Ramesh Sharma"
                className="h-10 text-sm"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Contact Phone
              </label>
              <Input
                value={form.phone}
                onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                placeholder="+91 98765 43210"
                className="h-10 text-sm font-mono"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Customer GSTIN
              </label>
              <Input
                value={form.gstin}
                onChange={(e) => setForm((f) => ({ ...f, gstin: e.target.value }))}
                placeholder="24ABCDE1234F1Z5"
                className="h-10 text-sm font-mono uppercase"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Billing Address
              </label>
              <Input
                value={form.address}
                onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
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
                value={form.creditLimit}
                onChange={(e) => setForm((f) => ({ ...f, creditLimit: e.target.value }))}
                placeholder="0 for unlimited"
                className="h-10 text-sm font-mono"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Opening Balance ({currency})
              </label>
              <Input
                type="number"
                min={0}
                value={form.openingBalance}
                onChange={(e) => setForm((f) => ({ ...f, openingBalance: e.target.value }))}
                placeholder="Existing khata dues"
                className="h-10 text-sm font-mono"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Default GST Mode
              </label>
              <Select
                value={form.defaultTaxMode}
                onValueChange={(v) => setForm((f) => ({ ...f, defaultTaxMode: v }))}
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
              onClick={() => setShowModal(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1 h-10 font-semibold shadow-xs cursor-pointer"
              disabled={saveMutation.isPending}
            >
              {saveMutation.isPending ? "Registering..." : "Add Customer"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Edit Customer Modal */}
      <Modal
        open={Boolean(editingCustomer)}
        onClose={() => setEditingCustomer(null)}
        title="Edit Customer Profile"
        description="Update customer contact information, GST details, and credit terms."
        size="lg"
      >
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            if (!editingCustomer) return;
            updateMutation.mutate({
              id: editingCustomer._id,
              data: {
                name: editForm.name,
                phone: editForm.phone || undefined,
                gstin: editForm.gstin || undefined,
                address: editForm.address || undefined,
                defaultTaxMode: editForm.defaultTaxMode,
                creditLimit: editForm.creditLimit ? Number(editForm.creditLimit) : 0,
              },
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
                onValueChange={(v) => setEditForm((f) => ({ ...f, defaultTaxMode: v }))}
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
              onClick={() => setEditingCustomer(null)}
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
        open={Boolean(deletingCustomer)}
        onClose={() => setDeletingCustomer(null)}
        title="Delete Customer Account"
        description="Permanently archive this customer profile from your active customer directory."
        size="md"
      >
        {deletingCustomer && (
          <div className="space-y-4">
            <div className="p-4 rounded-xl border border-border/70 bg-muted/40 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-foreground">{deletingCustomer.name}</span>
                {deletingCustomer.phone && (
                  <span className="text-xs text-muted-foreground font-mono">{deletingCustomer.phone}</span>
                )}
              </div>
              <div className="flex items-center justify-between pt-1 border-t border-border/40 text-xs">
                <span className="text-muted-foreground">Outstanding Balance:</span>
                <span className={cn("font-bold font-mono", (deletingCustomer.outstandingBalance ?? 0) > 0 ? "text-amber-600" : "text-emerald-600")}>
                  {formatCurrency(deletingCustomer.outstandingBalance ?? 0, currency)}
                </span>
              </div>
            </div>

            {(deletingCustomer.outstandingBalance ?? 0) > 0 ? (
              <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/25 text-amber-800 dark:text-amber-300 text-xs flex items-start gap-2.5">
                <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
                <p>
                  This customer has an outstanding balance of{" "}
                  <strong>{formatCurrency(deletingCustomer.outstandingBalance, currency)}</strong>. You must settle or clear all khata dues before deleting this customer account.
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
                onClick={() => setDeletingCustomer(null)}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                type="button"
                className="flex-1 h-10 font-semibold shadow-xs cursor-pointer"
                disabled={deleteMutation.isPending || (deletingCustomer.outstandingBalance ?? 0) > 0}
                onClick={() => {
                  if (deletingCustomer) {
                    deleteMutation.mutate(deletingCustomer._id);
                  }
                }}
              >
                {deleteMutation.isPending ? "Deleting..." : "Delete Customer"}
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Quick Collect Payment Modal */}
      <Modal
        open={Boolean(payingCustomer)}
        onClose={() => setPayingCustomer(null)}
        title="Record Khata Payment"
        description={payingCustomer ? `Record payment settlement for ${payingCustomer.name}.` : ""}
        size="md"
      >
        {payingCustomer && (
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              const amt = Number(payForm.amount);
              if (!amt || amt <= 0) {
                toast.error("Please enter a valid payment amount");
                return;
              }
              if (amt > (payingCustomer.outstandingBalance ?? 0)) {
                toast.error(`Amount exceeds outstanding balance of ${formatCurrency(payingCustomer.outstandingBalance, currency)}`);
                return;
              }
              payMutation.mutate({
                id: payingCustomer._id,
                body: {
                  amount: amt,
                  method: payForm.method,
                  note: payForm.note || undefined,
                  outletId: outletId ?? undefined,
                },
              });
            }}
          >
            <div className="p-3.5 rounded-xl border border-border/70 bg-muted/40 flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Current Balance Due:</span>
              <span className="text-base font-extrabold text-amber-600 dark:text-amber-400 font-mono">
                {formatCurrency(payingCustomer.outstandingBalance ?? 0, currency)}
              </span>
            </div>

            <div>
              <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Payment Amount ({currency}) *
              </label>
              <Input
                type="number"
                min={1}
                max={payingCustomer.outstandingBalance ?? undefined}
                step="any"
                required
                value={payForm.amount}
                onChange={(e) => setPayForm((f) => ({ ...f, amount: e.target.value }))}
                placeholder="Enter amount"
                className="h-10 text-base font-mono font-bold"
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
                  { value: "upi", label: "UPI / QR Transfer" },
                  { value: "card", label: "Debit / Credit Card" },
                  { value: "wallet", label: "Wallet" },
                ]}
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Reference / Note (Optional)
              </label>
              <Input
                value={payForm.note}
                onChange={(e) => setPayForm((f) => ({ ...f, note: e.target.value }))}
                placeholder="e.g. Cash collected by cashier"
                className="h-10 text-sm"
              />
            </div>

            <div className="flex items-center gap-3 pt-3 border-t border-border/60">
              <Button
                variant="outline"
                type="button"
                className="flex-1 h-10 font-semibold cursor-pointer"
                onClick={() => setPayingCustomer(null)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="flex-1 h-10 font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs cursor-pointer"
                disabled={payMutation.isPending}
              >
                {payMutation.isPending ? "Recording..." : "Confirm Payment"}
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
