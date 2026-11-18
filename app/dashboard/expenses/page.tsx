"use client";

import * as React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Plus,
  Ban,
  DollarSign,
  TrendingDown,
  Calendar,
  Building2,
  User,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  RefreshCw,
  Sparkles,
  Receipt,
  FileText,
  Tag,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Modal } from "@/components/ui/modal";
import { Select } from "@/components/ui/select";
import { DataTable } from "@/components/ui/data-table";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/components/auth/auth-provider";
import { expenseService } from "@/services/expense.service";
import { formatCurrency, formatDateTime } from "@/lib/format";
import type { Expense } from "@/lib/types";
import toast from "react-hot-toast";
import { getErrorMessage } from "@/lib/error";
import { useQueryStates, parseAsString, parseAsInteger, parseAsStringEnum } from "nuqs";
import { JollyDateRangePicker } from "@/components/ui/jolly-date-picker";
import { parseDate } from "@internationalized/date";
import { cn } from "@/lib/utils";

const CATEGORIES = [
  { value: "rent", label: "Rent & Lease", icon: "🏢" },
  { value: "salary", label: "Payroll & Salaries", icon: "💼" },
  { value: "utilities", label: "Electricity & Utilities", icon: "⚡" },
  { value: "supplies", label: "Store Supplies & Packing", icon: "📦" },
  { value: "marketing", label: "Promotions & Marketing", icon: "📢" },
  { value: "maintenance", label: "Equipment Maintenance", icon: "🔧" },
  { value: "other", label: "Other Overheads", icon: "🏷️" },
];

const catOptions = [{ value: "", label: "All Categories" }, ...CATEGORIES];

const catBadgeStyles: Record<string, string> = {
  rent: "bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/20",
  salary: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20",
  utilities: "bg-sky-500/10 text-sky-700 dark:text-sky-400 border-sky-500/20",
  supplies: "bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border-indigo-500/20",
  marketing: "bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-500/20",
  maintenance: "bg-orange-500/10 text-orange-700 dark:text-orange-400 border-orange-500/20",
  other: "bg-muted text-muted-foreground border-border/60",
};

const VOID_REASON_PRESETS = [
  "Entered wrong amount",
  "Duplicate expense entry",
  "Incorrect category classification",
  "Vendor payment cancelled",
];

type RecordFilter = "active" | "voided" | "all";

export default function ExpensesPage() {
  const { token, outletId, user } = useAuth();
  const currency = user?.currency || "INR";
  const qc = useQueryClient();
  const canVoid = user?.role === "owner" || user?.role === "manager" || user?.role === "superadmin";

  const [query, setQuery] = useQueryStates({
    page: parseAsInteger.withDefault(1),
    limit: parseAsInteger.withDefault(10),
    category: parseAsString.withDefault(""),
    status: parseAsStringEnum<RecordFilter>(["active", "voided", "all"]).withDefault("active"),
    from: parseAsString.withDefault(""),
    to: parseAsString.withDefault(""),
  });

  const [showModal, setShowModal] = React.useState(false);
  const [voidTarget, setVoidTarget] = React.useState<Expense | null>(null);
  const [voidReason, setVoidReason] = React.useState("");

  const [form, setForm] = React.useState({
    category: "rent",
    amount: "",
    note: "",
    date: new Date().toISOString().split("T")[0],
    outletId: outletId ?? "",
  });

  const { data, isLoading, refetch } = useQuery({
    queryKey: [
      "expenses",
      outletId,
      query.category,
      query.status,
      query.page,
      query.limit,
      query.from,
      query.to,
    ],
    queryFn: () =>
      expenseService.getExpenses(token, {
        outletId: outletId ?? undefined,
        category: query.category || undefined,
        recordStatus: query.status,
        page: query.page,
        limit: query.limit,
        from: query.from || undefined,
        to: query.to || undefined,
      }),
    enabled: Boolean(token),
  });

  const saveMutation = useMutation({
    mutationFn: (body: unknown) => expenseService.createExpense(body, token),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["expenses"] });
      setShowModal(false);
      setForm({
        category: "rent",
        amount: "",
        note: "",
        date: new Date().toISOString().split("T")[0],
        outletId: outletId ?? "",
      });
      toast.success("Expense recorded successfully");
    },
    onError: (err) => toast.error(getErrorMessage(err, "Failed to record expense")),
  });

  const voidMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      expenseService.voidExpense(id, reason, token),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["expenses"] });
      setVoidTarget(null);
      setVoidReason("");
      toast.success("Expense record voided");
    },
    onError: (err) => toast.error(getErrorMessage(err, "Failed to void expense")),
  });

  const expenses = React.useMemo(() => data?.expenses ?? [], [data?.expenses]);
  const totalAmount = data?.totalAmount ?? 0;

  const activeExpenses = React.useMemo(
    () => expenses.filter((e) => e.status !== "voided"),
    [expenses]
  );
  const voidedExpenses = React.useMemo(
    () => expenses.filter((e) => e.status === "voided"),
    [expenses]
  );

  const categoryTotals = React.useMemo(() => {
    return activeExpenses.reduce(
      (acc, e) => {
        acc[e.category] = (acc[e.category] ?? 0) + e.amount;
        return acc;
      },
      {} as Record<string, number>
    );
  }, [activeExpenses]);

  const topCategory = React.useMemo(() => {
    const entries = Object.entries(categoryTotals);
    if (entries.length === 0) return null;
    entries.sort((a, b) => b[1] - a[1]);
    return entries[0];
  }, [categoryTotals]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Operating Expenses</h1>
            <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 text-xs">
              Overheads
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">
            Track store overhead, utility payments, vendor disbursements, and petty cash.
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
            id="add-expense-btn"
            onClick={() => setShowModal(true)}
            className="h-10 px-4 text-xs font-semibold gap-1.5 shadow-xs cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>Add Expense</span>
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        <Card className="border border-border/70 bg-card shadow-2xs hover:shadow-xs transition-shadow">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                Total Expenses
              </p>
              <p className="text-xl font-extrabold text-foreground tracking-tight mt-1 truncate">
                {formatCurrency(totalAmount, currency)}
              </p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Active overheads in period
              </p>
            </div>
            <div className="h-10 w-10 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0 border border-rose-500/20">
              <TrendingDown className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border border-border/70 bg-card shadow-2xs hover:shadow-xs transition-shadow">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                Active Entries
              </p>
              <p className="text-xl font-extrabold text-emerald-600 dark:text-emerald-400 tracking-tight mt-1 truncate">
                {activeExpenses.length} Records
              </p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Recorded operational costs
              </p>
            </div>
            <div className="h-10 w-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/20">
              <CheckCircle2 className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border border-border/70 bg-card shadow-2xs hover:shadow-xs transition-shadow">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                Voided Entries
              </p>
              <p className={cn("text-xl font-extrabold tracking-tight mt-1 truncate", voidedExpenses.length > 0 ? "text-amber-600" : "text-foreground")}>
                {voidedExpenses.length} Voided
              </p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Excluded from store totals
              </p>
            </div>
            <div className="h-10 w-10 rounded-xl bg-muted/60 text-muted-foreground flex items-center justify-center shrink-0 border border-border/60">
              <Ban className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border border-border/70 bg-card shadow-2xs hover:shadow-xs transition-shadow">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                Top Spending Head
              </p>
              <p className="text-xl font-extrabold text-foreground tracking-tight mt-1 truncate capitalize">
                {topCategory ? topCategory[0] : "None"}
              </p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                {topCategory ? formatCurrency(topCategory[1], currency) : "No expenses yet"}
              </p>
            </div>
            <div className="h-10 w-10 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 border border-blue-500/20">
              <Building2 className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Table */}
      <DataTable
        isLoading={isLoading}
        data={expenses}
        keyExtractor={(e) => e._id}
        totalItems={data?.total ?? expenses.length}
        page={query.page}
        limit={query.limit}
        onPageChange={(p) => setQuery({ page: p })}
        onLimitChange={(size) => setQuery({ limit: size, page: 1 })}
        onRefetch={() => refetch()}
        emptyStateText="No expenses recorded yet in this date range."
        filters={
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 w-full">
            <Tabs
              value={query.status}
              onValueChange={(v) => setQuery({ status: v as RecordFilter, page: 1 })}
              className="w-auto shrink-0"
            >
              <TabsList className="h-9 bg-muted/60 p-0.5 border border-border/40 shrink-0">
                <TabsTrigger
                  value="active"
                  className="h-full text-xs px-3.5 font-semibold whitespace-nowrap shrink-0 text-muted-foreground hover:text-foreground data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-xs transition-all"
                >
                  Active ({activeExpenses.length})
                </TabsTrigger>
                <TabsTrigger
                  value="voided"
                  className="h-full text-xs px-3.5 font-semibold whitespace-nowrap shrink-0 text-muted-foreground hover:text-foreground data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-xs transition-all"
                >
                  Voided ({voidedExpenses.length})
                </TabsTrigger>
                <TabsTrigger
                  value="all"
                  className="h-full text-xs px-3.5 font-semibold whitespace-nowrap shrink-0 text-muted-foreground hover:text-foreground data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-xs transition-all"
                >
                  All Records ({expenses.length})
                </TabsTrigger>
              </TabsList>
            </Tabs>

            <div className="w-full sm:w-48">
              <Select
                value={query.category}
                onValueChange={(v) => setQuery({ category: v, page: 1 })}
                options={catOptions}
                size="sm"
              />
            </div>
          </div>
        }
        columns={[
          {
            key: "date",
            header: "Date",
            render: (e: Expense) => (
              <div className="text-xs">
                <span
                  className={cn(
                    "font-semibold block",
                    e.status === "voided" ? "text-muted-foreground line-through" : "text-foreground"
                  )}
                >
                  {new Date(e.date).toLocaleDateString("en-IN", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })}
                </span>
                <span className="text-[10px] text-muted-foreground font-mono">
                  {e.createdAt ? formatDateTime(e.createdAt).split(",")[1] || "" : ""}
                </span>
              </div>
            ),
          },
          {
            key: "category",
            header: "Category",
            render: (e: Expense) => {
              const catDef = CATEGORIES.find((c) => c.value === e.category);
              return (
                <div
                  className={cn(
                    "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border",
                    catBadgeStyles[e.category] ?? catBadgeStyles.other
                  )}
                >
                  <span>{catDef?.icon || "🏷️"}</span>
                  <span className="capitalize">{catDef?.label || e.category}</span>
                </div>
              );
            },
          },
          {
            key: "note",
            header: "Expense Note",
            render: (e: Expense) => (
              <div className="min-w-0 max-w-sm">
                <p
                  className={cn(
                    "text-xs truncate",
                    e.status === "voided"
                      ? "text-muted-foreground line-through"
                      : "text-foreground font-medium"
                  )}
                >
                  {e.note || "No note recorded"}
                </p>
                {e.voidReason && (
                  <p className="text-[10px] text-rose-600 dark:text-rose-400 font-semibold mt-0.5 flex items-center gap-1">
                    <Ban className="h-3 w-3" />
                    <span>Void Reason: {e.voidReason}</span>
                  </p>
                )}
              </div>
            ),
          },
          {
            key: "amount",
            header: "Amount",
            render: (e: Expense) => (
              <span
                className={cn(
                  "font-mono text-sm font-bold",
                  e.status === "voided"
                    ? "text-muted-foreground line-through opacity-70"
                    : "text-foreground"
                )}
              >
                {formatCurrency(e.amount, currency)}
              </span>
            ),
          },
          {
            key: "status",
            header: "Status",
            render: (e: Expense) => (
              <Badge
                variant={e.status === "voided" ? "danger" : "soft"}
                className={cn(
                  "text-[10px] font-bold px-2 py-0.5",
                  e.status === "voided"
                    ? "bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-500/20"
                    : "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20"
                )}
              >
                {e.status === "voided" ? "Voided" : "Active"}
              </Badge>
            ),
          },
          {
            key: "createdBy",
            header: "Added By",
            render: (e: Expense) => (
              <span className="text-xs text-muted-foreground font-medium">
                {e.createdBy?.name || "System"}
              </span>
            ),
          },
          {
            key: "actions",
            header: "",
            className: "text-right",
            render: (e: Expense) =>
              canVoid && e.status !== "voided" ? (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 px-2.5 text-xs text-destructive/80 hover:text-destructive hover:bg-destructive/10 cursor-pointer"
                  onClick={() => setVoidTarget(e)}
                >
                  <Ban className="h-3.5 w-3.5 mr-1" />
                  <span>Void</span>
                </Button>
              ) : null,
          },
        ]}
      />

      {/* Add Expense Modal */}
      <Modal
        open={showModal}
        onClose={() => setShowModal(false)}
        title="Record Operating Expense"
        description="Enter payment details for store overhead, utilities, or vendor settlements."
        size="md"
      >
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            saveMutation.mutate({ ...form, amount: Number(form.amount) });
          }}
        >
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Expense Category *
              </label>
              <Select
                id="exp-cat"
                value={form.category}
                onValueChange={(v) => setForm((f) => ({ ...f, category: v }))}
                options={CATEGORIES.map((c) => ({
                  value: c.value,
                  label: `${c.icon} ${c.label}`,
                }))}
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Amount ({currency}) *
              </label>
              <Input
                id="exp-amount"
                type="number"
                min={1}
                required
                value={form.amount}
                onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
                placeholder="0.00"
                className="h-10 text-sm font-mono"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Payment Date
              </label>
              <Input
                id="exp-date"
                type="date"
                value={form.date}
                onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
                className="h-10 text-sm"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Expense Note / Reference
            </label>
            <Textarea
              id="exp-note"
              rows={2}
              value={form.note}
              onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))}
              placeholder="e.g. October store electricity bill, office stationeries"
              className="text-sm"
            />
          </div>

          <div className="flex items-center gap-3 pt-3 border-t border-border/60">
            <Button
              variant="outline"
              type="button"
              className="flex-1 h-10 font-semibold"
              onClick={() => setShowModal(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1 h-10 font-semibold shadow-xs"
              disabled={saveMutation.isPending || !form.amount}
            >
              {saveMutation.isPending ? "Recording..." : "Add Expense"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Void Confirmation Modal */}
      <Modal
        open={Boolean(voidTarget)}
        onClose={() => {
          setVoidTarget(null);
          setVoidReason("");
        }}
        title="Void Expense Entry"
        description="This expense record will be marked voided and excluded from store totals. It remains preserved for accounting audit."
        size="sm"
      >
        <div className="space-y-4">
          <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground font-medium">Category:</span>
              <span className="font-bold text-foreground capitalize">{voidTarget?.category}</span>
            </div>
            <div className="flex justify-between items-center mt-1">
              <span className="text-muted-foreground font-medium">Amount:</span>
              <span className="font-mono font-bold text-rose-600 dark:text-rose-400">
                {voidTarget ? formatCurrency(voidTarget.amount, currency) : "0"}
              </span>
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Reason for Voiding *
            </label>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {VOID_REASON_PRESETS.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setVoidReason(preset)}
                  className={cn(
                    "px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors cursor-pointer",
                    voidReason === preset
                      ? "bg-rose-500/15 border-rose-500/40 text-rose-700 dark:text-rose-300 font-semibold"
                      : "bg-muted/40 border-border/60 text-muted-foreground hover:bg-muted"
                  )}
                >
                  {preset}
                </button>
              ))}
            </div>

            <Input
              value={voidReason}
              onChange={(e) => setVoidReason(e.target.value)}
              placeholder="Type specific void explanation..."
              minLength={2}
              required
              className="h-10 text-sm"
            />
          </div>

          <div className="flex items-center gap-3 pt-2">
            <Button
              variant="outline"
              className="flex-1 h-10 font-semibold"
              onClick={() => {
                setVoidTarget(null);
                setVoidReason("");
              }}
            >
              Cancel
            </Button>
            <Button
              className="flex-1 h-10 font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-xs"
              disabled={voidReason.trim().length < 2 || voidMutation.isPending}
              onClick={() =>
                voidTarget && voidMutation.mutate({ id: voidTarget._id, reason: voidReason.trim() })
              }
            >
              {voidMutation.isPending ? "Voiding..." : "Confirm Void"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
