"use client";

import * as React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Ban, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { Select } from "@/components/ui/select";
import { DataTable } from "@/components/ui/data-table";
import { StatsCard } from "@/components/ui/stats-card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/components/auth/auth-provider";
import { getJson, apiFetch } from "@/lib/api-client";
import { formatCurrency } from "@/lib/format";
import type { Expense } from "@/lib/types";

const CATEGORIES = ["rent", "salary", "utilities", "supplies", "marketing", "maintenance", "other"];
const catOptions = CATEGORIES.map((c) => ({ value: c, label: c.charAt(0).toUpperCase() + c.slice(1) }));
const catColors: Record<string, string> = {
  rent: "danger",
  salary: "warning",
  utilities: "info",
  supplies: "soft",
  marketing: "soft",
  maintenance: "warning",
  other: "secondary"
};

type RecordFilter = "active" | "voided" | "all";

export default function ExpensesPage() {
  const { token, outletId, user } = useAuth();
  const qc = useQueryClient();
  const canVoid = user?.role === "owner" || user?.role === "manager" || user?.role === "superadmin";

  const [showModal, setShowModal] = React.useState(false);
  const [voidTarget, setVoidTarget] = React.useState<Expense | null>(null);
  const [voidReason, setVoidReason] = React.useState("");
  const [catFilter, setCatFilter] = React.useState("");
  const [recordFilter, setRecordFilter] = React.useState<RecordFilter>("active");
  const [form, setForm] = React.useState({
    category: "rent",
    amount: "",
    note: "",
    date: new Date().toISOString().split("T")[0],
    outletId: outletId ?? ""
  });

  const { data, isLoading } = useQuery({
    queryKey: ["expenses", outletId, catFilter, recordFilter],
    queryFn: () =>
      getJson<{ expenses: Expense[]; total: number; totalAmount: number }>("/expenses", token, {
        outletId: outletId ?? undefined,
        category: catFilter || undefined,
        recordStatus: recordFilter
      }),
    enabled: Boolean(token)
  });

  const save = useMutation({
    mutationFn: (body: unknown) => apiFetch("/expenses", { method: "POST", body, token }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["expenses"] });
      setShowModal(false);
      setForm({
        category: "rent",
        amount: "",
        note: "",
        date: new Date().toISOString().split("T")[0],
        outletId: outletId ?? ""
      });
    }
  });

  const voidExpense = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      apiFetch(`/expenses/${id}/void`, { method: "POST", body: { reason }, token }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["expenses"] });
      setVoidTarget(null);
      setVoidReason("");
    }
  });

  const expenses = data?.expenses ?? [];
  const totalAmount = data?.totalAmount ?? 0;

  const categoryTotals = expenses
    .filter((e) => e.status !== "voided")
    .reduce(
      (acc, e) => {
        acc[e.category] = (acc[e.category] ?? 0) + e.amount;
        return acc;
      },
      {} as Record<string, number>
    );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Expenses</h1>
          <p className="text-sm text-muted">Track operational costs — voided entries stay in history</p>
        </div>
        <Button id="add-expense-btn" onClick={() => setShowModal(true)}>
          <Plus className="h-4 w-4" /> Add Expense
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard label="Total Expenses" value={formatCurrency(totalAmount)} icon={<DollarSign className="h-5 w-5" />} />
        {Object.entries(categoryTotals)
          .slice(0, 3)
          .map(([cat, amt]) => (
            <StatsCard key={cat} label={cat.charAt(0).toUpperCase() + cat.slice(1)} value={formatCurrency(amt)} />
          ))}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Select
          value={catFilter}
          onValueChange={setCatFilter}
          options={[{ value: "", label: "All Categories" }, ...catOptions]}
          className="w-48"
        />
        <Tabs value={recordFilter} onValueChange={(v) => setRecordFilter(v as RecordFilter)}>
          <TabsList>
            <TabsTrigger value="active">Active</TabsTrigger>
            <TabsTrigger value="voided">Voided</TabsTrigger>
            <TabsTrigger value="all">All</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <DataTable
        loading={isLoading}
        data={expenses}
        keyExtractor={(e) => e._id}
        emptyMessage="No expenses recorded yet."
        columns={[
          {
            key: "date",
            header: "Date",
            render: (e) => (
              <span className={`text-sm ${e.status === "voided" ? "text-muted line-through" : ""}`}>
                {new Date(e.date).toLocaleDateString("en-IN")}
              </span>
            )
          },
          {
            key: "category",
            header: "Category",
            render: (e) => (
              <Badge
                variant={(catColors[e.category] ?? "secondary") as "danger" | "warning" | "soft" | "secondary"}
                className="capitalize"
              >
                {e.category}
              </Badge>
            )
          },
          {
            key: "status",
            header: "Status",
            render: (e) =>
              e.status === "voided" ? (
                <div>
                  <Badge variant="danger">Voided</Badge>
                  {e.voidReason && (
                    <p className="mt-0.5 max-w-[140px] truncate text-[10px] text-muted" title={e.voidReason}>
                      {e.voidReason}
                    </p>
                  )}
                </div>
              ) : (
                <Badge variant="soft">Active</Badge>
              )
          },
          {
            key: "note",
            header: "Note",
            render: (e) => <span className="text-sm text-muted">{e.note || "—"}</span>
          },
          {
            key: "createdBy",
            header: "Added by",
            render: (e) => <span className="text-sm text-muted">{e.createdBy?.name || "—"}</span>
          },
          {
            key: "amount",
            header: "Amount",
            render: (e) => (
              <span className={`font-bold ${e.status === "voided" ? "text-muted line-through" : ""}`}>
                {formatCurrency(e.amount)}
              </span>
            )
          },
          {
            key: "actions",
            header: "",
            render: (e) =>
              canVoid && e.status !== "voided" ? (
                <Button variant="ghost" size="icon" className="text-danger" onClick={() => setVoidTarget(e)}>
                  <Ban className="h-3.5 w-3.5" />
                </Button>
              ) : null
          }
        ]}
      />

      <Modal open={showModal} onClose={() => setShowModal(false)} title="Add Expense" size="sm">
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            save.mutate({ ...form, amount: Number(form.amount) });
          }}
        >
          <div>
            <label className="mb-1 block text-xs font-medium text-muted">Category *</label>
            <Select
              id="exp-cat"
              value={form.category}
              onValueChange={(v) => setForm((f) => ({ ...f, category: v }))}
              options={catOptions}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-muted">Amount (₹) *</label>
            <Input
              id="exp-amount"
              type="number"
              min={1}
              required
              value={form.amount}
              onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
              placeholder="0.00"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-muted">Date</label>
            <Input
              id="exp-date"
              type="date"
              value={form.date}
              onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-muted">Note</label>
            <Input
              id="exp-note"
              value={form.note}
              onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))}
              placeholder="Details..."
            />
          </div>
          <div className="flex gap-3 pt-2">
            <Button variant="outline" type="button" className="flex-1" onClick={() => setShowModal(false)}>
              Cancel
            </Button>
            <Button type="submit" className="flex-1" disabled={save.isPending}>
              {save.isPending ? "Saving..." : "Add Expense"}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        open={!!voidTarget}
        onClose={() => {
          setVoidTarget(null);
          setVoidReason("");
        }}
        title="Void Expense?"
        size="sm"
      >
        <p className="mb-4 text-sm text-muted">
          This expense will be marked voided and excluded from totals. The record stays visible for audit.
        </p>
        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-muted">Reason *</label>
            <Input
              value={voidReason}
              onChange={(e) => setVoidReason(e.target.value)}
              placeholder="e.g. Entered wrong amount"
              minLength={2}
              required
            />
          </div>
          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => {
                setVoidTarget(null);
                setVoidReason("");
              }}
            >
              Cancel
            </Button>
            <Button
              className="flex-1"
              variant="destructive"
              disabled={voidReason.trim().length < 2 || voidExpense.isPending}
              onClick={() => voidTarget && voidExpense.mutate({ id: voidTarget._id, reason: voidReason.trim() })}
            >
              {voidExpense.isPending ? "Voiding..." : "Void Expense"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
