"use client";

import * as React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Pencil, Trash2, Shield, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Drawer } from "@/components/ui/drawer";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useAuth } from "@/components/auth/auth-provider";
import { getJson, apiFetch } from "@/lib/api-client";
import type { Role } from "@/lib/types";
import { cn } from "@/lib/utils";

const ALL_MODULES = ["billing","inventory","products","reports","expenses","users","outlets","roles","dashboard","settings","transactions","analytics","stock_transfers","audit_logs","categories"];
const ALL_ACTIONS = ["create","read","update","delete","refund","print","export","approve"];

const MODULE_ICONS: Record<string, string> = {
  billing: "🧾", inventory: "📦", products: "🏷️", reports: "📊", expenses: "💸",
  users: "👥", outlets: "🏪", roles: "🛡️", dashboard: "🏠", settings: "⚙️",
  transactions: "💰", analytics: "📈", stock_transfers: "🔄", audit_logs: "📋", categories: "📁"
};

export default function RolesPage() {
  const { token } = useAuth();
  const qc = useQueryClient();
  const [showModal, setShowModal] = React.useState(false);
  const [editId, setEditId] = React.useState<string | null>(null);
  const [deleteId, setDeleteId] = React.useState<string | null>(null);
  const [form, setForm] = React.useState({ name: "", description: "", permissions: {} as Record<string, string[]> });

  const { data, isLoading } = useQuery({
    queryKey: ["roles"],
    queryFn: () => getJson<{ roles: Role[] }>("/roles", token),
    enabled: Boolean(token)
  });

  const save = useMutation({
    mutationFn: (body: unknown) => editId
      ? apiFetch(`/roles/${editId}`, { method: "PATCH", body, token })
      : apiFetch("/roles", { method: "POST", body, token }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["roles"] }); setShowModal(false); setEditId(null); }
  });
  const remove = useMutation({
    mutationFn: (id: string) => apiFetch(`/roles/${id}`, { method: "DELETE", token }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["roles"] }); setDeleteId(null); }
  });

  const roles = data?.roles ?? [];

  const openCreate = () => {
    setEditId(null);
    setForm({ name: "", description: "", permissions: {} });
    setShowModal(true);
  };
  const openEdit = (role: Role) => {
    setEditId(role._id);
    const perms: Record<string, string[]> = {};
    for (const p of role.permissions) { perms[p.module] = p.actions; }
    setForm({ name: role.name, description: role.description ?? "", permissions: perms });
    setShowModal(true);
  };

  const toggleAction = (module: string, action: string) => {
    setForm((f) => {
      const cur = f.permissions[module] ?? [];
      const next = cur.includes(action) ? cur.filter((a) => a !== action) : [...cur, action];
      return { ...f, permissions: { ...f.permissions, [module]: next } };
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const permissions = Object.entries(form.permissions)
      .filter(([, actions]) => actions.length > 0)
      .map(([module, actions]) => ({ module, actions }));
    save.mutate({ name: form.name, description: form.description, permissions });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div><h1 className="text-2xl font-bold">Roles & Permissions</h1><p className="text-sm text-muted">Control what each role can access</p></div>
        <Button id="create-role-btn" onClick={openCreate}><Plus className="h-4 w-4" /> Create Role</Button>
      </div>

      {isLoading ? (
        <div className="space-y-3">{[...Array(3)].map((_, i) => <div key={i} className="h-24 animate-pulse rounded-3xl bg-border/40" />)}</div>
      ) : (
        <div className="space-y-4">
          {roles.map((role) => (
            <div key={role._id} className="animate-rise glass-panel rounded-3xl border border-border/70 p-5 shadow-soft">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                    <Shield className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="font-semibold">{role.name}</h2>
                      {role.isSystem && <Badge variant="secondary" className="text-xs">System</Badge>}
                    </div>
                    <p className="text-xs text-muted">{role.description || "No description"}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => openEdit(role)} id={`edit-role-${role._id}`}><Pencil className="h-3.5 w-3.5" /></Button>
                  {!role.isSystem && (
                    <Button variant="ghost" size="sm" className="text-danger" onClick={() => setDeleteId(role._id)} id={`delete-role-${role._id}`}><Trash2 className="h-3.5 w-3.5" /></Button>
                  )}
                </div>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {role.permissions.map((p) => (
                  <div key={p.module} className="rounded-xl bg-surface border border-border px-3 py-1.5">
                    <span className="text-xs font-medium">{MODULE_ICONS[p.module]} {p.module}</span>
                    <div className="flex gap-1 mt-1">{p.actions.map((a) => <Badge key={a} variant="soft" className="text-[10px]">{a}</Badge>)}</div>
                  </div>
                ))}
                {role.permissions.length === 0 && <p className="text-xs text-muted">No permissions configured</p>}
              </div>
            </div>
          ))}
        </div>
      )}

      <Drawer open={showModal} onClose={() => setShowModal(false)} title={editId ? "Edit Role" : "Create Role"} size="lg">
        <form className="flex flex-col h-full overflow-hidden" onSubmit={handleSubmit}>
          {/* Scrollable Body */}
          <div className="flex-1 overflow-y-auto p-6 space-y-5">
            <div className="grid grid-cols-2 gap-3">
              <div><label className="mb-1 block text-xs font-medium text-muted">Role Name *</label><Input id="role-name" required value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="e.g. Senior Cashier" /></div>
              <div><label className="mb-1 block text-xs font-medium text-muted">Description</label><Input id="role-desc" value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} placeholder="What this role can do" /></div>
            </div>
            <div>
              <p className="mb-3 text-sm font-semibold">Permissions Matrix</p>
              <div className="overflow-x-auto rounded-2xl border border-border">
                <table className="w-full text-xs">
                  <thead><tr className="border-b border-border bg-surface/60">
                    <th className="px-3 py-2 text-left font-semibold text-muted">Module</th>
                    {ALL_ACTIONS.map((a) => <th key={a} className="px-2 py-2 text-center font-semibold text-muted capitalize">{a}</th>)}
                  </tr></thead>
                  <tbody className="divide-y divide-border/40">
                    {ALL_MODULES.map((mod) => (
                      <tr key={mod} className="hover:bg-surface/60">
                        <td className="px-3 py-2 font-medium">{MODULE_ICONS[mod]} {mod}</td>
                        {ALL_ACTIONS.map((action) => {
                          const checked = (form.permissions[mod] ?? []).includes(action);
                          return (
                            <td key={action} className="px-2 py-2 text-center">
                              <button type="button" onClick={() => toggleAction(mod, action)}
                                className={cn("h-5 w-5 rounded-md border transition mx-auto flex items-center justify-center",
                                  checked ? "bg-primary border-primary text-white" : "border-border hover:border-primary/50"
                                )}>
                                {checked && <span className="text-[10px]">✓</span>}
                              </button>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Sticky Footer */}
          <div className="p-6 border-t border-border/60 bg-surface flex gap-3">
            <Button variant="outline" type="button" className="flex-1" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button type="submit" className="flex-1" disabled={save.isPending}>{save.isPending ? "Saving..." : (editId ? "Save Changes" : "Create Role")}</Button>
          </div>
        </form>
      </Drawer>

      <ConfirmDialog open={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={() => deleteId && remove.mutate(deleteId)}
        title="Delete Role?" message="Any staff with this role will lose their permissions." confirmLabel="Delete" loading={remove.isPending} />
    </div>
  );
}
