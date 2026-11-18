"use client";

import * as React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Pencil, Trash2, Scale, Zap, Hash, ArrowUpDown } from "lucide-react";
import { toast } from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Modal } from "@/components/ui/modal";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { DataTable } from "@/components/ui/data-table";
import { useAuth } from "@/components/auth/auth-provider";
import { unitService } from "@/services/unit.service";
import { getErrorMessage } from "@/lib/error";
import type { Unit } from "@/lib/types";
import { useQueryStates, parseAsString, parseAsInteger } from "nuqs";
import { cn } from "@/lib/utils";

export default function UnitsPage() {
  const { token } = useAuth();
  const qc = useQueryClient();
  const [showModal, setShowModal] = React.useState(false);
  const [editId, setEditId] = React.useState<string | null>(null);
  const [deleteId, setDeleteId] = React.useState<string | null>(null);

  const [query, setQuery] = useQueryStates({
    search: parseAsString.withDefault(""),
    page: parseAsInteger.withDefault(1),
    limit: parseAsInteger.withDefault(10),
  });

  const emptyForm = { name: "", key: "", abbreviation: "", sortOrder: "0" };
  const [form, setForm] = React.useState(emptyForm);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["units", query.page, query.limit, query.search],
    queryFn: () =>
      unitService.getUnitsWithMeta(token, {
        flat: "true",
        page: query.page,
        limit: query.limit,
        search: query.search || undefined,
      }),
    enabled: Boolean(token),
  });

  const saveMutation = useMutation({
    mutationFn: (body: unknown) =>
      editId ? unitService.updateUnit(editId, body, token) : unitService.createUnit(body, token),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["units"] });
      setShowModal(false);
      setEditId(null);
      setForm({ ...emptyForm });
      toast.success(editId ? "Measurement unit updated" : "Measurement unit created");
    },
    onError: (err: any) => toast.error(getErrorMessage(err, "Failed to save unit")),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => unitService.deleteUnit(id, token),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["units"] });
      setDeleteId(null);
      toast.success("Measurement unit deleted");
    },
    onError: (err: any) => toast.error(getErrorMessage(err, "Failed to delete unit")),
  });

  const units: Unit[] = data?.data ?? [];
  const pagination = data?.meta?.pagination ?? {
    page: 1,
    limit: query.limit,
    total: units.length,
    totalPages: 1,
  };

  const openCreate = () => {
    setEditId(null);
    setForm({ name: "", key: "", abbreviation: "", sortOrder: "0" });
    setShowModal(true);
  };

  const openEdit = (u: any) => {
    setEditId(u._id);
    setForm({
      name: u.name,
      key: u.key,
      abbreviation: u.abbreviation ?? "",
      sortOrder: String(u.sortOrder ?? 0),
    });
    setShowModal(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveMutation.mutate({ ...form, sortOrder: Number(form.sortOrder) });
  };

  const autoGenerateKey = (name: string) => {
    const key = name.trim().toLowerCase().replace(/[^a-z0-9]/g, "_");
    setForm((f) => ({ ...f, name, key: f.key ? f.key : key }));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Measurement Units
            </h1>
            <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 text-xs">
              Catalog Master
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">
            Configure units of measure (kg, litre, pieces, grams) for loose pricing and inventory packaging.
          </p>
        </div>

        <Button
          id="create-unit-btn"
          onClick={openCreate}
          className="h-10 px-4 text-xs font-semibold gap-1.5 shadow-xs cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          <span>Add Measurement Unit</span>
        </Button>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        <Card className="border border-border/70 bg-card shadow-2xs hover:shadow-xs transition-shadow">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                Total Units
              </p>
              <p className="text-xl font-extrabold text-foreground tracking-tight mt-1 truncate">
                {units.length} Defined
              </p>
              <p className="text-[11px] text-muted-foreground mt-0.5">Measurement types available</p>
            </div>
            <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0 border border-primary/20">
              <Scale className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border border-border/70 bg-card shadow-2xs hover:shadow-xs transition-shadow">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                Standard Symbols
              </p>
              <p className="text-xl font-extrabold text-indigo-600 dark:text-indigo-400 tracking-tight mt-1 truncate">
                {units.filter((u) => u.abbreviation).length} Short Codes
              </p>
              <p className="text-[11px] text-muted-foreground mt-0.5">Printed on customer receipts</p>
            </div>
            <div className="h-10 w-10 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 border border-indigo-500/20">
              <Zap className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border border-border/70 bg-card shadow-2xs hover:shadow-xs transition-shadow">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                Catalog Usage
              </p>
              <p className="text-xl font-extrabold text-emerald-600 dark:text-emerald-400 tracking-tight mt-1 truncate">
                Active in POS
              </p>
              <p className="text-[11px] text-muted-foreground mt-0.5">Applied to product catalog</p>
            </div>
            <div className="h-10 w-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-500/20">
              <Hash className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border border-border/70 bg-card shadow-2xs hover:shadow-xs transition-shadow">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                Sorting Order
              </p>
              <p className="text-xl font-extrabold text-foreground tracking-tight mt-1 truncate">
                Custom Priority
              </p>
              <p className="text-[11px] text-muted-foreground mt-0.5">Indexed for fast selection</p>
            </div>
            <div className="h-10 w-10 rounded-xl bg-muted/60 text-muted-foreground flex items-center justify-center shrink-0 border border-border/60">
              <ArrowUpDown className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Units Table */}
      <DataTable
        title="Configured Units"
        description="Standard measurement units used across retail checkouts, stock inwarding, and wholesale packaging."
        isLoading={isLoading}
        data={units}
        keyExtractor={(u) => u._id}
        totalItems={pagination.total}
        page={query.page}
        limit={query.limit}
        onPageChange={(p) => setQuery({ page: p })}
        onLimitChange={(l) => setQuery({ limit: l, page: 1 })}
        searchQuery={query.search}
        onSearchChange={(s) => setQuery({ search: s, page: 1 })}
        onRefetch={() => refetch()}
        placeholderText="Search measurement units..."
        emptyStateIcon={<Scale className="h-12 w-12 text-muted-foreground/30" />}
        emptyStateText="No measurement units found. Create your first unit like kg, liter, or pcs."
        columns={[
          {
            key: "name",
            header: "Unit Name",
            render: (u) => (
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary font-bold text-xs border border-primary/20">
                  {u.abbreviation ? u.abbreviation.toUpperCase() : u.name.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <p className="font-semibold text-sm text-foreground">{u.name}</p>
                  <p className="text-xs text-muted-foreground font-mono">key: {u.key}</p>
                </div>
              </div>
            ),
          },
          {
            key: "abbreviation",
            header: "Receipt Symbol",
            render: (u) => (
              <span className="font-mono font-bold text-xs bg-muted/60 px-2 py-0.5 rounded border border-border/40 text-foreground">
                {u.abbreviation || "None"}
              </span>
            ),
          },
          {
            key: "sortOrder",
            header: "Display Sequence",
            render: (u) => (
              <span className="text-xs text-muted-foreground font-mono">
                Order: #{u.sortOrder ?? 0}
              </span>
            ),
          },
          {
            key: "actions",
            header: "",
            className: "text-right",
            render: (u) => (
              <div className="flex items-center justify-end gap-1.5">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground cursor-pointer"
                  onClick={() => openEdit(u)}
                  id={`edit-unit-${u._id}`}
                  title="Edit Unit"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive hover:border-destructive/30 cursor-pointer"
                  onClick={() => setDeleteId(u._id)}
                  id={`delete-unit-${u._id}`}
                  title="Delete Unit"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            ),
          },
        ]}
      />

      {/* Add / Edit Unit Modal */}
      <Modal
        open={showModal}
        onClose={() => setShowModal(false)}
        title={editId ? "Edit Measurement Unit" : "Add Measurement Unit"}
        description="Define standard units and abbreviations for loose product quantities and packaging."
        size="md"
      >
        <form className="space-y-4" onSubmit={handleSubmit}>
          {/* Live Preview Card */}
          <div className="p-3.5 rounded-xl border border-border/70 bg-muted/30 flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Receipt Label Preview:</span>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-foreground">{form.name || "Unit Name"}</span>
              <Badge variant="outline" className="font-mono text-xs">
                {form.abbreviation || form.key || "pc"}
              </Badge>
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Unit Name *
            </label>
            <Input
              id="unit-name"
              required
              value={form.name}
              onChange={(e) => autoGenerateKey(e.target.value)}
              placeholder="e.g. Kilogram, Litre, Pieces, Grams"
              className="h-10 text-sm"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-muted-foreground">
              System Key (Identifier) *
            </label>
            <Input
              id="unit-key"
              required
              value={form.key}
              onChange={(e) => setForm((f) => ({ ...f, key: e.target.value.toLowerCase() }))}
              placeholder="e.g. kg, liter, pcs, gm"
              className="h-10 text-sm font-mono"
            />
            <p className="text-[11px] text-muted-foreground mt-1">
              Internal system identifier used in API and database calculations.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Short Symbol / Abbr
              </label>
              <Input
                id="unit-abbr"
                value={form.abbreviation}
                onChange={(e) => setForm((f) => ({ ...f, abbreviation: e.target.value }))}
                placeholder="e.g. kg, L, pc"
                className="h-10 text-sm font-mono"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Display Sort Order
              </label>
              <Input
                id="unit-sort"
                type="number"
                value={form.sortOrder}
                onChange={(e) => setForm((f) => ({ ...f, sortOrder: e.target.value }))}
                placeholder="0"
                className="h-10 text-sm font-mono"
              />
            </div>
          </div>

          <div className="flex gap-3 pt-3 border-t border-border/60">
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
              {saveMutation.isPending ? "Saving..." : editId ? "Save Changes" : "Create Unit"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={Boolean(deleteId)}
        onClose={() => setDeleteId(null)}
        onConfirm={() => deleteId && deleteMutation.mutate(deleteId)}
        title="Delete Measurement Unit?"
        message="Are you sure you want to delete this measurement unit? Products currently assigned to this unit may display fallback unit labels."
        confirmLabel="Delete Unit"
        loading={deleteMutation.isPending}
      />
    </div>
  );
}
