"use client";

import * as React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Search, UserPlus, X, User, Check, Phone, FileText } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { customerService } from "@/services/customer.service";
import { formatCurrency } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Customer } from "@/lib/types";

type CustomerPickerProps = {
  token: string | null;
  outletId: string | null;
  selectedId: string | null;
  required?: boolean;
  onSelect: (customer: Customer | null) => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  showLabel?: boolean;
  placeholder?: string;
  buttonClassName?: string;
};

export function CustomerPicker({
  token,
  outletId,
  selectedId,
  required,
  onSelect,
  open: externalOpen,
  onOpenChange,
  showLabel = true,
  placeholder = "Select or register customer...",
  buttonClassName,
}: CustomerPickerProps) {
  const qc = useQueryClient();
  const [internalOpen, setInternalOpen] = React.useState(false);
  const isOpen = externalOpen !== undefined ? externalOpen : internalOpen;

  const setOpen = (val: boolean) => {
    if (onOpenChange) onOpenChange(val);
    setInternalOpen(val);
  };

  const [search, setSearch] = React.useState("");
  const [showAdd, setShowAdd] = React.useState(false);
  const [form, setForm] = React.useState({ name: "", phone: "", gstin: "" });

  const { data, isLoading } = useQuery({
    queryKey: ["customers", outletId, search],
    queryFn: () =>
      customerService.getCustomers(token, {
        outletId: outletId ?? undefined,
        search: search || undefined,
        limit: 20,
      }),
    enabled: Boolean(token) && isOpen,
  });

  const { data: selectedData } = useQuery({
    queryKey: ["customer", selectedId],
    queryFn: () => customerService.getCustomer(selectedId!, token),
    enabled: Boolean(token && selectedId),
  });

  const createCustomer = useMutation({
    mutationFn: (body: unknown) => customerService.createCustomer(body, token),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ["customers"] });
      setShowAdd(false);
      setForm({ name: "", phone: "", gstin: "" });
      const c = res?.customer;
      if (c) {
        onSelect(c);
        setOpen(false);
      }
    },
  });

  const customers = data?.customers ?? [];
  const selected = selectedData?.customer ?? null;

  return (
    <div className="space-y-1.5">
      {showLabel && (
        <div className="flex items-center justify-between gap-2">
          <label className="text-xs font-semibold text-foreground flex items-center gap-1">
            <User className="h-3.5 w-3.5 text-primary" />
            <span>Customer</span>
            {required && <span className="text-destructive">*</span>}
          </label>
          {selectedId && (
            <button
              type="button"
              className="text-[10px] font-semibold text-muted-foreground hover:text-destructive transition-colors cursor-pointer"
              onClick={() => onSelect(null)}
            >
              Clear
            </button>
          )}
        </div>
      )}

      {selected ? (
        <div className="flex items-center justify-between gap-2 rounded-xl border border-primary/40 bg-primary/5 p-2.5 shadow-2xs">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <p className="truncate text-xs font-bold text-foreground">{selected.name}</p>
              {!showLabel && selectedId && (
                <button
                  type="button"
                  className="text-[10px] font-semibold text-muted-foreground hover:text-destructive transition-colors cursor-pointer"
                  onClick={() => onSelect(null)}
                >
                  Clear
                </button>
              )}
            </div>
            {selected.phone && (
              <p className="text-[11px] text-muted-foreground font-mono flex items-center gap-1 mt-0.5">
                <Phone className="h-3 w-3" />
                {selected.phone}
              </p>
            )}
            {selected.outstandingBalance > 0 && (
              <p className="mt-1 text-[11px] font-bold text-amber-600 dark:text-amber-400">
                Outstanding Due: {formatCurrency(selected.outstandingBalance)}
              </p>
            )}
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8 px-2.5 text-xs rounded-lg shrink-0"
            onClick={() => setOpen(true)}
          >
            Change
          </Button>
        </div>
      ) : (
        <Button
          type="button"
          variant="outline"
          className={cn(
            "h-10 w-full justify-start gap-2 text-xs font-medium rounded-xl border-dashed border-border/80 bg-background hover:bg-muted/50 cursor-pointer",
            buttonClassName
          )}
          onClick={() => setOpen(true)}
        >
          <Search className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-muted-foreground">{placeholder}</span>
        </Button>
      )}

      {/* Customer Modal */}
      <Modal
        open={isOpen}
        onClose={() => {
          setOpen(false);
          setShowAdd(false);
        }}
        title="Select Customer"
        size="md"
      >
        <div className="space-y-3 p-1">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="pl-8 h-9 text-xs rounded-lg"
                placeholder="Search by name, phone or GSTIN..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
            <Button
              type="button"
              variant={showAdd ? "soft" : "outline"}
              size="sm"
              className="h-9 px-3 text-xs gap-1.5 rounded-lg cursor-pointer"
              onClick={() => setShowAdd(!showAdd)}
            >
              <UserPlus className="h-3.5 w-3.5" />
              <span>{showAdd ? "Cancel" : "New"}</span>
            </Button>
          </div>

          {showAdd ? (
            <form
              className="rounded-xl border border-primary/30 bg-primary/[0.03] p-3 space-y-2.5"
              onSubmit={(e) => {
                e.preventDefault();
                createCustomer.mutate({ ...form, outletId: outletId ?? undefined });
              }}
            >
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold text-foreground">Quick Add New Customer</p>
                <span className="text-[10px] text-muted-foreground">Will be auto-selected</span>
              </div>
              <Input
                placeholder="Customer Name *"
                required
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                className="h-8.5 text-xs bg-background rounded-lg"
              />
              <Input
                placeholder="Phone Number (10 digits)"
                value={form.phone}
                onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                className="h-8.5 text-xs bg-background rounded-lg"
              />
              <Input
                placeholder="GSTIN (Optional)"
                value={form.gstin}
                onChange={(e) => setForm((f) => ({ ...f, gstin: e.target.value }))}
                className="h-8.5 text-xs bg-background rounded-lg font-mono"
              />
              <div className="flex gap-2 pt-1">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="flex-1 text-xs h-8.5 rounded-lg"
                  onClick={() => setShowAdd(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  className="flex-1 text-xs h-8.5 rounded-lg font-bold"
                  disabled={createCustomer.isPending}
                >
                  {createCustomer.isPending ? "Saving..." : "Add & Select"}
                </Button>
              </div>
            </form>
          ) : (
            <div className="max-h-64 overflow-y-auto space-y-1 scrollbar-thin">
              {isLoading ? (
                <div className="flex justify-center py-6">
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                </div>
              ) : customers.length === 0 ? (
                <div className="py-6 text-center text-xs text-muted-foreground">
                  <p>No customers found matching &quot;{search}&quot;</p>
                  <Button
                    type="button"
                    variant="soft"
                    size="sm"
                    className="mt-2 text-xs"
                    onClick={() => {
                      setForm((f) => ({ ...f, name: search }));
                      setShowAdd(true);
                    }}
                  >
                    Create &quot;{search}&quot;
                  </Button>
                </div>
              ) : (
                customers.map((c: Customer) => (
                  <button
                    key={c._id}
                    type="button"
                    onClick={() => {
                      onSelect(c);
                      setOpen(false);
                    }}
                    className="w-full flex items-center justify-between gap-2 rounded-xl border border-border/70 p-2.5 text-left transition-all duration-150 hover:border-primary/50 hover:bg-muted/50 cursor-pointer"
                  >
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-foreground truncate">{c.name}</p>
                      <div className="flex items-center gap-2 mt-0.5 text-[11px] text-muted-foreground font-mono">
                        {c.phone && <span>{c.phone}</span>}
                        {c.gstin && <span>GST: {c.gstin}</span>}
                      </div>
                    </div>
                    {c.outstandingBalance > 0 && (
                      <Badge variant="warning" className="text-[10px] shrink-0 font-bold">
                        Due: {formatCurrency(c.outstandingBalance)}
                      </Badge>
                    )}
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
