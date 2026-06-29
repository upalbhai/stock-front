"use client";

import * as React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Pencil, Trash2, Store } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Switch } from "@/components/ui/switch";
import { DataTable } from "@/components/ui/data-table";
import { useAuth } from "@/components/auth/auth-provider";
import { outletService } from "@/services/outlet.service";
import type { Outlet } from "@/lib/types";
import toast from "react-hot-toast";
import { getErrorMessage } from "@/lib/error";

const emptyForm = {
  name: "", address: "", phone: "", email: "",
  taxEnabled: false, defaultTaxRate: 0,
  billingModes: ["takeaway", "quick"]
};

export default function OutletsPage() {
  const { token } = useAuth();
  const qc = useQueryClient();
  const [form, setForm] = React.useState({ ...emptyForm });
  const [editId, setEditId] = React.useState<string | null>(null);
  const [deleteId, setDeleteId] = React.useState<string | null>(null);
  const [showModal, setShowModal] = React.useState(false);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["outlets"],
    queryFn: () => outletService.getOutlets(token),
    enabled: Boolean(token)
  });

  const saveMutation = useMutation({
    mutationFn: (body: unknown) => {
      if (editId) return outletService.updateOutlet(editId, body, token);
      return outletService.createOutlet(body, token);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["outlets"] });
      setShowModal(false);
      setEditId(null);
      setForm({ ...emptyForm });
      toast.success(editId ? "Outlet updated" : "Outlet created");
    },
    onError: (err: any) => toast.error(getErrorMessage(err, "Failed to save outlet"))
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => outletService.deleteOutlet(id, token),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["outlets"] });
      setDeleteId(null);
      toast.success("Outlet deleted");
    },
    onError: (err: any) => toast.error(getErrorMessage(err, "Failed to delete outlet"))
  });

  const outlets = data?.outlets ?? [];

  const openEdit = (outlet: Outlet) => {
    setEditId(outlet._id);
    setForm({ name: outlet.name, address: outlet.address ?? "", phone: outlet.phone ?? "", email: outlet.email ?? "", taxEnabled: outlet.taxEnabled, defaultTaxRate: outlet.defaultTaxRate, billingModes: outlet.billingModes });
    setShowModal(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Outlets</h1>
          <p className="text-sm text-muted">Manage all your business locations</p>
        </div>
        <Button id="create-outlet-btn" onClick={() => { setEditId(null); setForm({ ...emptyForm }); setShowModal(true); }}>
          <Plus className="h-4 w-4 mr-1.5" /> Add Outlet
        </Button>
      </div>

      <DataTable
        isLoading={isLoading}
        data={outlets}
        keyExtractor={(o) => o._id}
        onRefetch={() => refetch()}
        emptyStateIcon={<Store className="h-12 w-12 text-muted/30" />}
        emptyStateText="No outlets yet. Add your first business location."
        columns={[
          {
            key: "name",
            header: "Outlet",
            render: (outlet) => (
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Store className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-semibold">{outlet.name}</p>
                  <p className="text-xs text-muted">{outlet.address || "No address"}</p>
                </div>
              </div>
            )
          },
          {
            key: "contact",
            header: "Contact",
            render: (outlet) => (
              <div className="text-xs text-muted">
                {outlet.phone && <p>{outlet.phone}</p>}
                {outlet.email && <p>{outlet.email}</p>}
                {!outlet.phone && !outlet.email && <span>—</span>}
              </div>
            )
          },
          {
            key: "billingModes",
            header: "Billing Modes",
            render: (outlet) => (
              <div className="flex gap-1 flex-wrap">
                {outlet.billingModes.map((m) => (
                  <Badge key={m} variant="secondary" className="text-xs capitalize">{m.replace("_", " ")}</Badge>
                ))}
              </div>
            )
          },
          {
            key: "tax",
            header: "Tax",
            render: (outlet) =>
              outlet.taxEnabled ? (
                <Badge variant="warning" className="text-xs">GST {outlet.defaultTaxRate}%</Badge>
              ) : (
                <span className="text-xs text-muted">Off</span>
              )
          },
          {
            key: "status",
            header: "Status",
            render: (outlet) => {
              if (outlet.status === "pending") {
                return <Badge variant="warning">Pending Approval</Badge>;
              }
              return (
                <Badge variant={outlet.isActive ? "soft" : "danger"}>
                  {outlet.isActive ? "Active" : "Inactive"}
                </Badge>
              );
            }
          },
          {
            key: "actions",
            header: "",
            render: (outlet) => (
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => openEdit(outlet)} id={`edit-outlet-${outlet._id}`}>
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
                <Button variant="ghost" size="icon" className="text-danger" onClick={() => setDeleteId(outlet._id)} id={`delete-outlet-${outlet._id}`}>
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            )
          }
        ]}
      />

      <Modal open={showModal} onClose={() => setShowModal(false)}
        title={editId ? "Edit Outlet" : "Create Outlet"} size="md">
        <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); saveMutation.mutate(form); }}>
          <div>
            <label className="mb-1 block text-xs font-medium text-muted">Outlet Name *</label>
            <Input id="outlet-name" required value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="e.g. Anand Outlet" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-muted">Address</label>
            <Input id="outlet-address" value={form.address} onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))} placeholder="Street, City" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-muted">Phone</label>
              <Input id="outlet-phone" value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} placeholder="+91..." />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted">Email</label>
              <Input id="outlet-email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} placeholder="outlet@..." />
            </div>
          </div>
          <div className="flex items-center justify-between rounded-2xl border border-border p-3">
            <div>
              <p className="text-sm font-medium">Enable GST/Tax</p>
              <p className="text-xs text-muted">Apply tax on all bills</p>
            </div>
            <Switch id="outlet-tax-toggle" checked={form.taxEnabled} onCheckedChange={(v) => setForm((f) => ({ ...f, taxEnabled: v }))} />
          </div>
          {form.taxEnabled && (
            <div>
              <label className="mb-1 block text-xs font-medium text-muted">Default Tax Rate (%)</label>
              <Input id="outlet-tax-rate" type="number" min={0} max={100} value={form.defaultTaxRate}
                onChange={(e) => setForm((f) => ({ ...f, defaultTaxRate: Number(e.target.value) }))} />
            </div>
          )}
          <div className="flex gap-3 pt-2">
            <Button variant="outline" type="button" className="flex-1" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button type="submit" className="flex-1" disabled={saveMutation.isPending}>
              {saveMutation.isPending ? "Saving..." : (editId ? "Save Changes" : "Create Outlet")}
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog open={!!deleteId} onClose={() => setDeleteId(null)}
        onConfirm={() => deleteId && deleteMutation.mutate(deleteId)}
        title="Deactivate Outlet?"
        message="This outlet will be hidden from billing and operations. You can re-enable it later."
        confirmLabel="Deactivate" loading={deleteMutation.isPending} />
    </div>
  );
}
