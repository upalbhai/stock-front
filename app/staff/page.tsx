"use client";

import * as React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Avatar } from "@/components/ui/avatar";
import { Select } from "@/components/ui/select";
import { DataTable } from "@/components/ui/data-table";
import { useAuth } from "@/components/auth/auth-provider";
import { userService } from "@/services/user.service";
import { roleService } from "@/services/role.service";
import { outletService } from "@/services/outlet.service";
import type { StaffUser, Role, Outlet } from "@/lib/types";
import toast from "react-hot-toast";
import { getErrorMessage } from "@/lib/error";

export default function StaffPage() {
  const { token } = useAuth();
  const qc = useQueryClient();
  const [search, setSearch] = React.useState("");
  const [showModal, setShowModal] = React.useState(false);
  const [editId, setEditId] = React.useState<string | null>(null);
  const [deleteId, setDeleteId] = React.useState<string | null>(null);
  const [form, setForm] = React.useState({ name: "", phone: "", email: "", role: "staff", roleId: "", outletIds: [] as string[], pin: "" });

  const { data: staffData, isLoading, refetch } = useQuery({
    queryKey: ["staff", search],
    queryFn: () => userService.getUsers(token, { search: search || undefined }),
    enabled: Boolean(token)
  });
  const { data: rolesData } = useQuery({ queryKey: ["roles"], queryFn: () => roleService.getRoles(token), enabled: Boolean(token) });
  const { data: outletsData } = useQuery({ queryKey: ["outlets"], queryFn: () => outletService.getOutlets(token), enabled: Boolean(token) });

  const saveMutation = useMutation({
    mutationFn: (body: unknown) => editId ? userService.updateUser(editId, body, token) : userService.createUser(body, token),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["staff"] });
      setShowModal(false);
      toast.success(editId ? "Staff updated" : "Staff invited");
    },
    onError: (err: any) => toast.error(getErrorMessage(err, "Failed to save staff"))
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => userService.deleteUser(id, token),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["staff"] });
      toast.success("Staff deleted");
    },
    onError: (err: any) => toast.error(getErrorMessage(err, "Failed to delete staff"))
  });

  const users = staffData?.users ?? [];
  const roles = rolesData?.roles ?? [];
  const outlets = outletsData?.outlets ?? [];

  const openCreate = () => { setEditId(null); setForm({ name: "", phone: "", email: "", role: "staff", roleId: "", outletIds: [], pin: "" }); setShowModal(true); };
  const openEdit = (u: StaffUser) => { setEditId(u._id); setForm({ name: u.name, phone: u.phone, email: u.email ?? "", role: u.role, roleId: typeof u.roleId === "object" ? u.roleId?._id ?? "" : u.roleId ?? "", outletIds: u.outletIds, pin: "" }); setShowModal(true); };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div><h1 className="text-2xl font-bold">Staff</h1><p className="text-sm text-muted">{users.length} team members</p></div>
      </div>

      <DataTable
        isLoading={isLoading}
        data={users}
        keyExtractor={(u) => u._id}
        searchQuery={search}
        onSearchChange={setSearch}
        onRefetch={() => refetch()}
        placeholderText="Search by name or phone..."
        emptyStateText="No staff members yet."
        filters={
          <Button id="add-staff-btn" onClick={openCreate}>
            <Plus className="h-4 w-4 mr-1.5" /> Add Staff
          </Button>
        }
        columns={[
          { key: "name", header: "Staff Member", render: (u) => (<div className="flex items-center gap-3"><Avatar name={u.name} size="sm" /><div><p className="font-medium">{u.name}</p><p className="text-xs text-muted">{u.phone}</p></div></div>) },
          { key: "role", header: "Role", render: (u) => <Badge variant="soft" className="capitalize">{u.role}</Badge> },
          { key: "outletIds", header: "Outlets", render: (u) => <span className="text-sm text-muted">{u.outletIds.length === 0 ? "All" : `${u.outletIds.length} outlet(s)`}</span> },
          { key: "isActive", header: "Status", render: (u) => <Badge variant={u.isActive ? "soft" : "danger"}>{u.isActive ? "Active" : "Inactive"}</Badge> },
          { key: "actions", header: "", render: (u) => (<div className="flex gap-2"><Button variant="ghost" size="icon" onClick={() => openEdit(u)}><Pencil className="h-3.5 w-3.5" /></Button><Button variant="ghost" size="icon" className="text-danger" onClick={() => setDeleteId(u._id)}><Trash2 className="h-3.5 w-3.5" /></Button></div>) }
        ]}
      />

      <Modal open={showModal} onClose={() => setShowModal(false)} title={editId ? "Edit Staff" : "Add Staff"} size="md">
        <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); saveMutation.mutate(form); }}>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="mb-1 block text-xs font-medium text-muted">Full Name *</label><Input id="staff-name" required value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} /></div>
            <div><label className="mb-1 block text-xs font-medium text-muted">Phone *</label><Input id="staff-phone" required value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} /></div>
          </div>
          <div><label className="mb-1 block text-xs font-medium text-muted">PIN {editId ? "(leave blank to keep)" : "*"}</label><Input id="staff-pin" type="password" value={form.pin} onChange={(e) => setForm((f) => ({ ...f, pin: e.target.value }))} required={!editId} placeholder="4–6 digit PIN" /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="mb-1 block text-xs font-medium text-muted">Role</label><Select id="staff-role" value={form.role} onValueChange={(v) => setForm((f) => ({ ...f, role: v }))} options={[{ value: "manager", label: "Manager" }, { value: "staff", label: "Staff" }]} /></div>
            <div><label className="mb-1 block text-xs font-medium text-muted">Permission Set</label><Select id="staff-role-id" value={form.roleId} onValueChange={(v) => setForm((f) => ({ ...f, roleId: v }))} options={[{ value: "", label: "Default" }, ...roles.map((r) => ({ value: r._id, label: r.name }))]} /></div>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-muted">Outlets</label>
            <div className="flex flex-wrap gap-2 mt-1">{outlets.map((o) => (<button key={o._id} type="button" onClick={() => setForm((f) => ({ ...f, outletIds: f.outletIds.includes(o._id) ? f.outletIds.filter((id) => id !== o._id) : [...f.outletIds, o._id] }))} className={`rounded-xl border px-3 py-1.5 text-xs font-medium transition ${form.outletIds.includes(o._id) ? "bg-primary text-white border-primary" : "border-border text-muted"}`}>{o.name}</button>))}</div>
          </div>
          <div className="flex gap-3 pt-2">
            <Button variant="outline" type="button" className="flex-1" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button type="submit" className="flex-1" disabled={saveMutation.isPending}>{saveMutation.isPending ? "Saving..." : (editId ? "Save Changes" : "Add Staff")}</Button>
          </div>
        </form>
      </Modal>
      <ConfirmDialog open={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={() => deleteId && deleteMutation.mutate(deleteId)} title="Deactivate Staff?" message="This user will lose access immediately." confirmLabel="Deactivate" loading={deleteMutation.isPending} />
    </div>
  );
}
