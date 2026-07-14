"use client";

import * as React from "react";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { Select } from "@/components/ui/select";
import { DataTable } from "@/components/ui/data-table";
import { StatsCard } from "@/components/ui/stats-card";
import { CardSwiper } from "@/components/ui/card-swiper";
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
    to: parseAsString.withDefault("")
  });

  const [showModal, setShowModal] = React.useState(false);
  const emptyForm = {
    name: "",
    phone: "",
    gstin: "",
    address: "",
    creditLimit: "",
    openingBalance: "",
    defaultTaxMode: "exclusive"
  };
  const [form, setForm] = React.useState(emptyForm);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["customers", outletId, query.search, query.balanceFilter, query.page, query.limit, query.from, query.to],
    queryFn: () =>
      customerService.getCustomers(token, {
        outletId: outletId ?? undefined,
        search: query.search || undefined,
        hasBalance: query.balanceFilter === "due" ? "true" : undefined,
        page: query.page,
        limit: query.limit,
        from: query.from || undefined,
        to: query.to || undefined
      }),
    enabled: Boolean(token) && hasCustomers
  });

  const saveMutation = useMutation({
    mutationFn: (body: unknown) => customerService.createCustomer(body, token),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["customers"] });
      setShowModal(false);
      setForm({ ...emptyForm });
      toast.success("Customer added successfully");
    },
    onError: (err) => toast.error(getErrorMessage(err, "Failed to add customer"))
  });

  if (!hasCustomers) {
    return (
      <div className="rounded-xl border border-border/70 bg-surface/50 p-8 text-center">
        <Users className="mx-auto h-10 w-10 text-muted" />
        <h1 className="mt-4 text-xl font-bold">Customers</h1>
        <p className="mt-2 text-sm text-muted">Customer directory is not available on your current plan.</p>
      </div>
    );
  }

  const customers: Customer[] = data?.customers ?? [];
  const totalOutstanding = data?.totalOutstanding ?? 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Customers</h1>
          <p className="text-sm text-muted">Khata ledger — track who owes what</p>
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

      <CardSwiper>
        <StatsCard label="Total Customers" value={String(data?.total ?? customers.length)} icon={<Users className="h-5 w-5" />} />
        <StatsCard label="Total Outstanding" value={formatCurrency(totalOutstanding, currency)} />
        <StatsCard
          label="With Balance Due"
          value={String(customers.filter((c) => c.outstandingBalance > 0).length)}
        />
      </CardSwiper>

      <DataTable
        isLoading={isLoading}
        data={customers}
        keyExtractor={(c) => c._id}
        totalItems={data?.total ?? customers.length}
        page={query.page}
        limit={query.limit}
        onPageChange={(p) => setQuery({ page: p })}
        onLimitChange={(size) => setQuery({ limit: size, page: 1 })}
        searchQuery={query.search}
        onSearchChange={(s) => setQuery({ search: s, page: 1 })}
        onRefetch={() => refetch()}
        placeholderText="Search name, phone, GSTIN..."
        emptyStateText="No customers yet in this date range."
        headerActions={
          <Button onClick={() => setShowModal(true)} size="sm" className="h-9">
            <Plus className="h-4 w-4 sm:mr-1.5" /> <span className="hidden sm:inline">Add Customer</span>
          </Button>
        }
        filters={
          <Select
            value={query.balanceFilter}
            onValueChange={(v) => setQuery({ balanceFilter: v, page: 1 })}
            className="w-44 h-9"
            options={[
              { value: "", label: "All customers" },
              { value: "due", label: "With balance due" }
            ]}
          />
        }
        columns={[
          {
            key: "name",
            header: "Name",
            render: (c) => (
              <Link href={APP_ROUTES.customerDetail(c._id)} className="font-medium hover:text-primary hover:underline">
                {c.name}
              </Link>
            )
          },
          { key: "phone", header: "Phone", render: (c) => <span className="text-sm text-muted">{c.phone || "—"}</span> },
          { key: "gstin", header: "GSTIN", render: (c) => <span className="text-sm text-muted">{c.gstin || "—"}</span> },
          {
            key: "balance",
            header: "Balance Due",
            render: (c) =>
              c.outstandingBalance > 0 ? (
                <Badge variant="warning">{formatCurrency(c.outstandingBalance, currency)}</Badge>
              ) : (
                <Badge variant="soft">Clear</Badge>
              )
          },
          {
            key: "actions",
            header: "",
            render: (c) => (
              <Link href={APP_ROUTES.customerDetail(c._id)}>
                <Button variant="ghost" size="sm" className="text-xs">Ledger</Button>
              </Link>
            )
          }
        ]}
      />

      <Modal open={showModal} onClose={() => setShowModal(false)} title="Add Customer" size="md">
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
              openingBalance: form.openingBalance ? Number(form.openingBalance) : undefined
            });
          }}
        >
          <div>
            <label className="mb-1 block text-xs font-medium text-muted">Name *</label>
            <Input required value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-medium text-muted">Phone</label>
              <Input value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted">GSTIN</label>
              <Input value={form.gstin} onChange={(e) => setForm((f) => ({ ...f, gstin: e.target.value }))} />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-muted">Address</label>
            <Input value={form.address} onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))} />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-medium text-muted">Credit limit ({currency})</label>
              <Input type="number" min={0} value={form.creditLimit} onChange={(e) => setForm((f) => ({ ...f, creditLimit: e.target.value }))} placeholder="0 = no limit" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted">Opening balance ({currency})</label>
              <Input type="number" min={0} value={form.openingBalance} onChange={(e) => setForm((f) => ({ ...f, openingBalance: e.target.value }))} placeholder="Existing khata" />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-muted">Default GST mode</label>
            <Select
              value={form.defaultTaxMode}
              onValueChange={(v) => setForm((f) => ({ ...f, defaultTaxMode: v }))}
              options={[
                { value: "exclusive", label: "GST Extra (exclusive)" },
                { value: "inclusive", label: "GST Included" }
              ]}
            />
          </div>
          <div className="flex gap-3 pt-2">
            <Button variant="outline" type="button" className="flex-1" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button type="submit" className="flex-1" disabled={saveMutation.isPending}>{saveMutation.isPending ? "Saving..." : "Add Customer"}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
