"use client";

import * as React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Pencil, Trash2, Zap } from "lucide-react";
import { toast } from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { DataTable } from "@/components/ui/data-table";
import { useAuth } from "@/components/auth/auth-provider";
import { unitService } from "@/services/unit.service";
import { getErrorMessage } from "@/lib/error";
import type { Unit } from "@/lib/types";

export default function UnitsPage() {
  const { token } = useAuth();
  const qc = useQueryClient();
  const [showModal, setShowModal] = React.useState(false);
  const [editId, setEditId] = React.useState<string | null>(null);
  const [deleteId, setDeleteId] = React.useState<string | null>(null);
  const [page, setPage] = React.useState(1);
  const [limit, setLimit] = React.useState(50);
  const [search, setSearch] = React.useState("");
  const emptyForm = { name: "", key: "", abbreviation: "", sortOrder: "0" };
  const [form, setForm] = React.useState(emptyForm);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["units", page, limit, search],
    queryFn: () => unitService.getUnitsWithMeta(token, { flat: "true", page, limit, search: search || undefined }),
    enabled: Boolean(token)
  });

  const saveMutation = useMutation({
    mutationFn: (body: unknown) =>
      editId
      ? unitService.updateUnit(editId, body, token)
      : unitService.createUnit(body, token),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["units"] });
      setShowModal(false);
      setEditId(null);
      setForm({ ...emptyForm });
      toast.success(editId ? "Unit updated" : "Unit created");
    },
    onError: (err: any) => toast.error(getErrorMessage(err, "Failed to save unit"))
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => unitService.deleteUnit(id, token),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["units"] });
      setDeleteId(null);
      toast.success("Unit deleted");
    },
    onError: (err: any) => toast.error(getErrorMessage(err, "Failed to delete unit"))
  });

  const units: Unit[] = data?.data ?? [];
  const pagination = data?.meta?.pagination ?? { page: 1, limit, total: units.length, totalPages: 1 };

  const openCreate = () => {
    setEditId(null);
    setForm({ name: "", key: "", abbreviation: "", sortOrder: "0" });
    setShowModal(true);
  };

  const openEdit = (u: any) => {
    setEditId(u._id);
    setForm({ name: u.name, key: u.key, abbreviation: u.abbreviation ?? "", sortOrder: String(u.sortOrder) });
    setShowModal(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveMutation.mutate({ ...form, sortOrder: Number(form.sortOrder) });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Units</h1>
          <p className="text-sm text-muted">Manage measurement units (kg, liter, pcs, etc.)</p>
        </div>
      </div>

      <DataTable
        isLoading={isLoading}
        data={units}
        keyExtractor={(u) => u._id}
        totalItems={pagination.total}
        page={page}
        limit={limit}
        onPageChange={setPage}
        onLimitChange={setLimit}
        searchQuery={search}
        onSearchChange={setSearch}
        onRefetch={() => refetch()}
        placeholderText="Search units..."
        emptyStateIcon={<Zap className="h-12 w-12 text-muted/30" />}
        emptyStateText='No units yet. Create your first unit like "kg", "liter", "pieces".'
        filters={
          <Button id="create-unit-btn" onClick={openCreate}>
            <Plus className="h-4 w-4 mr-1.5" /> Add Unit
          </Button>
        }
        columns={[
          { key: "name", header: "Unit Name", render: (u) => <span className="font-medium">{u.name}</span> },
          { key: "key", header: "Key", render: (u) => <code className="text-xs bg-border/40 px-2 py-1 rounded">{u.key}</code> },
          { key: "abbreviation", header: "Abbreviation", render: (u) => <span className="text-sm">{u.abbreviation || "—"}</span> },
          { key: "sortOrder", header: "Sort Order", render: (u) => <span className="text-xs text-muted">{u.sortOrder}</span> },
          {
            key: "actions",
            header: "",
            render: (u) => (
              <div className="flex gap-2">
                <Button variant="ghost" size="icon" onClick={() => openEdit(u)} id={`edit-unit-${u._id}`}>
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-danger"
                  onClick={() => setDeleteId(u._id)}
                  id={`delete-unit-${u._id}`}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            )
          }
        ]}
      />

      <Modal open={showModal} onClose={() => setShowModal(false)} title={editId ? "Edit Unit" : "Add Unit"} size="md">
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="mb-1 block text-xs font-medium text-muted">Unit Name *</label>
            <Input
              id="unit-name"
              required
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="e.g. Kilogram, Liter, Pieces"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-muted">Key (identifier) *</label>
            <Input
              id="unit-key"
              required
              value={form.key}
              onChange={(e) => setForm((f) => ({ ...f, key: e.target.value.toLowerCase() }))}
              placeholder="e.g. kg, liter, pcs"
            />
            <p className="text-xs text-muted/60 mt-1">Will be auto-generated based on name if left empty</p>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-muted">Abbreviation</label>
            <Input
              id="unit-abbr"
              value={form.abbreviation}
              onChange={(e) => setForm((f) => ({ ...f, abbreviation: e.target.value }))}
              placeholder="e.g. kg, L, pc"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-muted">Sort Order</label>
            <Input
              id="unit-sort"
              type="number"
              value={form.sortOrder}
              onChange={(e) => setForm((f) => ({ ...f, sortOrder: e.target.value }))}
              placeholder="0"
            />
          </div>
          <div className="flex gap-3 pt-2">
            <Button variant="outline" type="button" className="flex-1" onClick={() => setShowModal(false)}>
              Cancel
            </Button>
            <Button type="submit" className="flex-1" disabled={saveMutation.isPending}>
              {saveMutation.isPending ? "Saving..." : editId ? "Save Changes" : "Create Unit"}
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={() => deleteId && deleteMutation.mutate(deleteId)}
        title="Delete Unit?"
        message="Are you sure you want to delete this unit? This might affect products that use it."
        confirmLabel="Delete"
        loading={deleteMutation.isPending}
      />
    </div>
  );
}
