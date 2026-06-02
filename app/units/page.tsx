"use client";

import * as React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Pencil, Trash2, Loader2, Zap, RefreshCw } from "lucide-react";
import { toast } from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { DataTable } from "@/components/ui/data-table";
import { useAuth } from "@/components/auth/auth-provider";
import { getJson, apiFetch } from "@/lib/api-client";
import { getErrorMessage } from "@/lib/error";
import type { Unit } from "@/lib/types";

export default function UnitsPage() {
  const { token } = useAuth();
  const qc = useQueryClient();
  const timeoutRef = React.useRef<NodeJS.Timeout | null>(null);
  const [showModal, setShowModal] = React.useState(false);
  const [editId, setEditId] = React.useState<string | null>(null);
  const [deleteId, setDeleteId] = React.useState<string | null>(null);
  const [isRefetching, setIsRefetching] = React.useState(false);
  const [cooldownSeconds, setCooldownSeconds] = React.useState(0);
  const [form, setForm] = React.useState({ name: "", key: "", abbreviation: "", sortOrder: "0" });

  const { data, isLoading, refetch: refetchUnits } = useQuery({
    queryKey: ["units"],
    queryFn: () => getJson<{ data?: any[]; meta?: any }>("/units", token, { flat: "true", page: 1, limit: 100 }),
    enabled: Boolean(token)
  });

  React.useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const handleRefetch = () => {
    setIsRefetching(true);
    setCooldownSeconds(15);
    refetchUnits();
    
    let seconds = 15;
    timeoutRef.current = setInterval(() => {
      seconds -= 1;
      setCooldownSeconds(seconds);
      if (seconds === 0) {
        setIsRefetching(false);
        if (timeoutRef.current) clearInterval(timeoutRef.current);
      }
    }, 1000);
  };

  const save = useMutation({
    mutationFn: (body: unknown) => editId
      ? apiFetch(`/units/${editId}`, { method: "PATCH", body, token })
      : apiFetch("/units", { method: "POST", body, token }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["units"] });
      setShowModal(false);
      setEditId(null);
      toast.success(editId ? "Unit updated" : "Unit created");
    },
    onError: (err: any) => {
      toast.error(getErrorMessage(err, "Failed to save unit"));
    }
  });

  const remove = useMutation({
    mutationFn: (id: string) => apiFetch(`/units/${id}`, { method: "DELETE", token }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["units"] });
      setDeleteId(null);
      toast.success("Unit deleted");
    },
    onError: (err: any) => {
      toast.error(getErrorMessage(err, "Failed to delete unit"));
    }
  });

  const units = data?.data ?? [];

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
    save.mutate({ ...form, sortOrder: Number(form.sortOrder) });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Units</h1>
          <p className="text-sm text-muted">Manage measurement units (kg, liter, pcs, etc.)</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleRefetch} disabled={isRefetching} id="refetch-units-btn">
            <RefreshCw className={`h-4 w-4 ${isRefetching ? "animate-spin" : ""}`} />
            {isRefetching ? `Refetch (${cooldownSeconds}s)` : "Refetch"}
          </Button>
          <Button id="create-unit-btn" onClick={openCreate}>
            <Plus className="h-4 w-4" /> Add Unit
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-16 animate-pulse rounded-2xl bg-border/40" />
          ))}
        </div>
      ) : units.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-3xl border border-border/60 py-20 text-center">
          <Zap className="h-12 w-12 text-muted/30" />
          <p className="mt-3 font-medium text-muted">No units yet</p>
          <p className="text-sm text-muted/60">Create your first unit like "kg", "liter", "pieces"</p>
          <Button className="mt-4" onClick={openCreate}>
            <Plus className="h-4 w-4" /> Create Unit
          </Button>
        </div>
      ) : (
        <DataTable
          loading={isLoading}
          data={units}
          keyExtractor={(u) => u._id}
          emptyMessage="No units found"
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
      )}

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
            <Button type="submit" className="flex-1" disabled={save.isPending}>
              {save.isPending ? "Saving..." : editId ? "Save Changes" : "Create Unit"}
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={() => deleteId && remove.mutate(deleteId)}
        title="Delete Unit?"
        message="Products using this unit will retain the unit name but won't be linked to a new unit."
        confirmLabel="Delete"
        loading={remove.isPending}
      />
    </div>
  );
}
