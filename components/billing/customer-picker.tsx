"use client";

import * as React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Search, UserPlus, X } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { getJson, apiFetch, apiFetchData } from "@/lib/api-client";
import { formatCurrency } from "@/lib/format";
import type { Customer } from "@/lib/types";

type CustomerPickerProps = {
  token: string | null;
  outletId: string | null;
  selectedId: string | null;
  required?: boolean;
  onSelect: (customer: Customer | null) => void;
};

export function CustomerPicker({ token, outletId, selectedId, required, onSelect }: CustomerPickerProps) {
  const qc = useQueryClient();
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState("");
  const [showAdd, setShowAdd] = React.useState(false);
  const [form, setForm] = React.useState({ name: "", phone: "", gstin: "" });

  const { data, isLoading } = useQuery({
    queryKey: ["customers", outletId, search],
    queryFn: () =>
      getJson<{ customers: Customer[] }>("/customers", token, {
        outletId: outletId ?? undefined,
        search: search || undefined,
        limit: 20
      }),
    enabled: Boolean(token) && open
  });

  const { data: selectedData } = useQuery({
    queryKey: ["customer", selectedId],
    queryFn: () => getJson<{ customer: Customer }>(`/customers/${selectedId}`, token),
    enabled: Boolean(token && selectedId)
  });

  const createCustomer = useMutation({
    mutationFn: (body: unknown) =>
      apiFetchData<{ customer: Customer }>("/customers", { method: "POST", body, token }),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ["customers"] });
      setShowAdd(false);
      setForm({ name: "", phone: "", gstin: "" });
      const c = res?.customer;
      if (c) {
        onSelect(c);
        setOpen(false);
      }
    }
  });

  const customers = data?.customers ?? [];
  const selected = selectedData?.customer ?? null;

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-2">
        <label className="text-xs font-medium text-muted-foreground">
          Customer {required && <span className="text-destructive">*</span>}
        </label>
        {selectedId && (
          <button type="button" className="text-[9px] text-muted hover:text-danger" onClick={() => onSelect(null)}>
            Clear
          </button>
        )}
      </div>

      {selected ? (
        <div className="rounded-xl border border-primary/30 bg-primary/5 px-3 py-3">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">{selected.name}</p>
              {selected.phone && <p className="text-xs text-muted-foreground">{selected.phone}</p>}
              {selected.outstandingBalance > 0 && (
                <p className="mt-1 text-sm font-semibold text-amber-600 dark:text-amber-400">
                  Due: {formatCurrency(selected.outstandingBalance)}
                </p>
              )}
            </div>
            <Button variant="ghost" size="icon" className="h-9 w-9 shrink-0" onClick={() => setOpen(true)}>
              <Search className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ) : (
        <Button variant="outline" className="h-11 w-full gap-2 text-sm" onClick={() => setOpen(true)}>
          <Search className="h-4 w-4" /> Select customer
        </Button>
      )}

      <Modal open={open} onClose={() => { setOpen(false); setShowAdd(false); }} title="Select Customer" size="md">
        <div className="space-y-3">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted" />
              <Input
                className="pl-8 h-9 text-sm"
                placeholder="Search name, phone, GSTIN..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Button variant="outline" size="sm" onClick={() => setShowAdd(true)}>
              <UserPlus className="h-3.5 w-3.5" />
            </Button>
          </div>

          {showAdd ? (
            <form
              className="rounded-xl border border-border p-3 space-y-2"
              onSubmit={(e) => {
                e.preventDefault();
                createCustomer.mutate({ ...form, outletId: outletId ?? undefined });
              }}
            >
              <p className="text-xs font-semibold">Quick add customer</p>
              <Input placeholder="Name *" required value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
              <Input placeholder="Phone" value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} />
              <Input placeholder="GSTIN" value={form.gstin} onChange={(e) => setForm((f) => ({ ...f, gstin: e.target.value }))} />
              <div className="flex gap-2 pt-1">
                <Button type="button" variant="outline" size="sm" className="flex-1" onClick={() => setShowAdd(false)}>Cancel</Button>
                <Button type="submit" size="sm" className="flex-1" disabled={createCustomer.isPending}>
                  {createCustomer.isPending ? "Saving..." : "Add & select"}
                </Button>
              </div>
            </form>
          ) : (
            <div className="max-h-64 overflow-y-auto space-y-1">
              {isLoading ? (
                <p className="text-center text-xs text-muted py-4">Loading...</p>
              ) : customers.length === 0 ? (
                <p className="text-center text-xs text-muted py-4">No customers found</p>
              ) : (
                customers.map((c) => (
                  <button
                    key={c._id}
                    type="button"
                    onClick={() => { onSelect(c); setOpen(false); }}
                    className="w-full rounded-lg border border-border px-3 py-2 text-left hover:border-primary/40 hover:bg-surface/60 transition"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <p className="text-sm font-medium">{c.name}</p>
                        {c.phone && <p className="text-[10px] text-muted">{c.phone}</p>}
                      </div>
                      {c.outstandingBalance > 0 && (
                        <Badge variant="warning" className="text-[9px] shrink-0">
                          {formatCurrency(c.outstandingBalance)}
                        </Badge>
                      )}
                    </div>
                  </button>
                ))
              )}
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}
