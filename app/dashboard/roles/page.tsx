"use client";

import * as React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Plus,
  Pencil,
  Trash2,
  Shield,
  Lock,
  CheckCircle2,
  Users,
  Settings,
  Sparkles,
  Layers,
  KeyRound,
  ChevronDown,
  Check,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Modal } from "@/components/ui/modal";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { DataTable } from "@/components/ui/data-table";
import { useAuth } from "@/components/auth/auth-provider";
import { roleService } from "@/services/role.service";
import type { Role } from "@/lib/types";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";
import { getErrorMessage } from "@/lib/error";

const emptyForm = { name: "", description: "", permissions: {} as Record<string, string[]> };

type ModuleGroup = {
  groupName: string;
  icon: string;
  modules: {
    key: string;
    label: string;
    actions: string[];
  }[];
};

const MODULE_GROUPS: ModuleGroup[] = [
  {
    groupName: "Sales & POS Operations",
    icon: "🛒",
    modules: [
      { key: "billing", label: "Billing & Register", actions: ["create", "read", "update", "refund", "void", "print"] },
      { key: "invoices", label: "GST Tax Invoices", actions: ["create", "read", "print", "export"] },
      { key: "customers", label: "Customer Khata Accounts", actions: ["create", "read", "update", "delete", "collect"] },
      { key: "transactions", label: "Cash Transactions", actions: ["read", "export"] },
    ],
  },
  {
    groupName: "Inventory & Catalog",
    icon: "📦",
    modules: [
      { key: "products", label: "Products & Pricing", actions: ["create", "read", "update", "delete", "export"] },
      { key: "categories", label: "Categories", actions: ["create", "read", "update", "delete"] },
      { key: "units", label: "Measurement Units", actions: ["create", "read", "update", "delete"] },
      { key: "inventory", label: "Stock Adjustments", actions: ["create", "read", "update"] },
      { key: "stock_transfers", label: "Inter-Outlet Transfers", actions: ["create", "read", "approve", "void"] },
    ],
  },
  {
    groupName: "Finance & Performance",
    icon: "📊",
    modules: [
      { key: "expenses", label: "Operating Expenses", actions: ["create", "read", "void"] },
      { key: "reports", label: "Financial Reports", actions: ["read", "export", "print"] },
      { key: "analytics", label: "Analytics Insights", actions: ["read"] },
    ],
  },
  {
    groupName: "Administration & Control",
    icon: "⚙️",
    modules: [
      { key: "users", label: "Staff & Users", actions: ["create", "read", "update", "delete"] },
      { key: "outlets", label: "Store Outlets", actions: ["create", "read", "update"] },
      { key: "roles", label: "Roles & RBAC", actions: ["create", "read", "update", "delete"] },
      { key: "settings", label: "Franchise Settings", actions: ["read", "update"] },
      { key: "audit_logs", label: "System Audit Logs", actions: ["read", "export"] },
      { key: "dashboard", label: "Dashboard Overview", actions: ["read"] },
    ],
  },
];

const MODULE_ICONS: Record<string, string> = {
  billing: "🧾",
  inventory: "📦",
  products: "🏷️",
  reports: "📊",
  expenses: "💸",
  users: "👥",
  outlets: "🏪",
  roles: "🛡️",
  dashboard: "🏠",
  settings: "⚙️",
  transactions: "💰",
  analytics: "📈",
  stock_transfers: "🔄",
  audit_logs: "📋",
  categories: "📁",
  units: "⚖️",
  customers: "👤",
  invoices: "📄",
};

export default function RolesPage() {
  const { token } = useAuth();
  const qc = useQueryClient();
  const [showModal, setShowModal] = React.useState(false);
  const [editId, setEditId] = React.useState<string | null>(null);
  const [deleteId, setDeleteId] = React.useState<string | null>(null);
  const [form, setForm] = React.useState(emptyForm);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["roles"],
    queryFn: () => roleService.getRoles(token),
    enabled: Boolean(token),
  });

  const saveMutation = useMutation({
    mutationFn: (body: unknown) =>
      editId
        ? roleService.updateRole(editId, body, token)
        : roleService.createRole(body, token),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["roles"] });
      setShowModal(false);
      setEditId(null);
      setForm({ ...emptyForm });
      toast.success(editId ? "Role updated successfully" : "Role created successfully");
    },
    onError: (err: any) => toast.error(getErrorMessage(err, "Failed to save role")),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => roleService.deleteRole(id, token),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["roles"] });
      setDeleteId(null);
      toast.success("Role deleted successfully");
    },
    onError: (err: any) => toast.error(getErrorMessage(err, "Failed to delete role")),
  });

  const roles = data?.roles ?? [];

  const systemRoles = React.useMemo(() => roles.filter((r) => r.isSystem), [roles]);
  const customRoles = React.useMemo(() => roles.filter((r) => !r.isSystem), [roles]);

  const openCreate = () => {
    setEditId(null);
    setForm(emptyForm);
    setShowModal(true);
  };

  const openEdit = (role: Role) => {
    setEditId(role._id);
    const perms: Record<string, string[]> = {};
    for (const p of role.permissions) {
      perms[p.module] = p.actions;
    }
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

  const toggleAllModuleActions = (module: string, allActions: string[]) => {
    setForm((f) => {
      const cur = f.permissions[module] ?? [];
      const hasAll = allActions.every((a) => cur.includes(a));
      const next = hasAll ? [] : [...allActions];
      return { ...f, permissions: { ...f.permissions, [module]: next } };
    });
  };

  const applyPreset = (preset: "read_only" | "full_access" | "clear") => {
    if (preset === "clear") {
      setForm((f) => ({ ...f, permissions: {} }));
      return;
    }
    const newPerms: Record<string, string[]> = {};
    for (const group of MODULE_GROUPS) {
      for (const mod of group.modules) {
        if (preset === "full_access") {
          newPerms[mod.key] = [...mod.actions];
        } else if (preset === "read_only") {
          if (mod.actions.includes("read")) {
            newPerms[mod.key] = ["read"];
          }
        }
      }
    }
    setForm((f) => ({ ...f, permissions: newPerms }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const permissions = Object.entries(form.permissions)
      .filter(([, actions]) => actions.length > 0)
      .map(([module, actions]) => ({ module, actions }));
    saveMutation.mutate({ name: form.name, description: form.description, permissions });
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Roles & Permissions
            </h1>
            <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 text-xs">
              Access Control
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">
            Configure role-based access control (RBAC), module permissions, and staff operational boundaries.
          </p>
        </div>

        <Button
          id="create-role-btn"
          onClick={openCreate}
          className="h-10 px-4 text-xs font-semibold gap-1.5 shadow-xs cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          <span>Create Custom Role</span>
        </Button>
      </div>

      {/* Overview KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        <Card className="border border-border/70 bg-card shadow-2xs hover:shadow-xs transition-shadow">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                Total Roles
              </p>
              <p className="text-xl font-extrabold text-foreground tracking-tight mt-1 truncate">
                {roles.length} Defined
              </p>
              <p className="text-[11px] text-muted-foreground mt-0.5">Active access profiles</p>
            </div>
            <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0 border border-primary/20">
              <Shield className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border border-border/70 bg-card shadow-2xs hover:shadow-xs transition-shadow">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                System Roles
              </p>
              <p className="text-xl font-extrabold text-indigo-600 dark:text-indigo-400 tracking-tight mt-1 truncate">
                {systemRoles.length} Protected
              </p>
              <p className="text-[11px] text-muted-foreground mt-0.5">Core POS system templates</p>
            </div>
            <div className="h-10 w-10 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 border border-indigo-500/20">
              <Lock className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border border-border/70 bg-card shadow-2xs hover:shadow-xs transition-shadow">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                Custom Roles
              </p>
              <p className="text-xl font-extrabold text-foreground tracking-tight mt-1 truncate">
                {customRoles.length} Created
              </p>
              <p className="text-[11px] text-muted-foreground mt-0.5">Custom staff permission sets</p>
            </div>
            <div className="h-10 w-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-500/20">
              <Users className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border border-border/70 bg-card shadow-2xs hover:shadow-xs transition-shadow">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                Security Modules
              </p>
              <p className="text-xl font-extrabold text-foreground tracking-tight mt-1 truncate">
                18 Modules
              </p>
              <p className="text-[11px] text-muted-foreground mt-0.5">Granular action permissions</p>
            </div>
            <div className="h-10 w-10 rounded-xl bg-muted/60 text-muted-foreground flex items-center justify-center shrink-0 border border-border/60">
              <KeyRound className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Roles Directory Table */}
      <DataTable
        title="Role Profiles & Permissions"
        description="Click any role row to inspect its active module permissions and authorized action privileges."
        isLoading={isLoading}
        data={roles}
        keyExtractor={(role) => role._id}
        onRefetch={() => refetch()}
        emptyStateIcon={<Shield className="h-12 w-12 text-muted-foreground/30" />}
        emptyStateText="No roles configured yet."
        expandable
        columns={[
          {
            key: "name",
            header: "Role Profile",
            render: (role) => (
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl font-bold text-sm border shadow-2xs",
                    role.isSystem
                      ? "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20"
                      : "bg-primary/10 text-primary border-primary/20"
                  )}
                >
                  <Shield className="h-5 w-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-sm text-foreground">{role.name}</p>
                    {role.isSystem ? (
                      <Badge variant="outline" className="text-[10px] font-semibold text-indigo-600 border-indigo-500/30 bg-indigo-500/5">
                        System Protected
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-[10px] font-semibold text-emerald-600 border-emerald-500/30 bg-emerald-500/5">
                        Custom
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {role.description || "No description provided"}
                  </p>
                </div>
              </div>
            ),
          },
          {
            key: "permissions",
            header: "Module Scope",
            render: (role) => (
              <div className="flex items-center gap-1.5">
                <span className="font-mono font-bold text-xs bg-muted/60 px-2 py-0.5 rounded border border-border/40 text-foreground">
                  {role.permissions.length} modules
                </span>
                <span className="text-xs text-muted-foreground">
                  ({role.permissions.reduce((acc, p) => acc + p.actions.length, 0)} actions)
                </span>
              </div>
            ),
          },
          {
            key: "actions",
            header: "",
            className: "text-right",
            render: (role) => (
              <div className="flex items-center justify-end gap-1.5">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 px-2.5 text-xs font-semibold gap-1 cursor-pointer"
                  onClick={(e) => {
                    e.stopPropagation();
                    openEdit(role);
                  }}
                  id={`edit-role-${role._id}`}
                >
                  <Pencil className="h-3.5 w-3.5" />
                  <span>Edit</span>
                </Button>
                {!role.isSystem && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive hover:border-destructive/30 cursor-pointer"
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeleteId(role._id);
                    }}
                    id={`delete-role-${role._id}`}
                    title="Delete Role"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                )}
              </div>
            ),
          },
        ]}
        renderSubComponent={(role) => (
          <div className="p-4 bg-muted/20 border-t border-border/40 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Configured Permissions Breakdown ({role.name})
              </p>
              <span className="text-[11px] text-muted-foreground">
                {role.isSystem ? "Read-only system template" : "Customizable staff role"}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5">
              {role.permissions.map((p) => (
                <div
                  key={p.module}
                  className="rounded-xl bg-card border border-border/70 p-2.5 shadow-2xs space-y-1.5"
                >
                  <div className="flex items-center gap-1.5 text-xs font-bold text-foreground capitalize">
                    <span>{MODULE_ICONS[p.module] || "🔹"}</span>
                    <span>{p.module.replace("_", " ")}</span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {p.actions.map((a) => (
                      <span
                        key={a}
                        className="inline-flex items-center text-[10px] font-mono font-semibold px-1.5 py-0.2 rounded bg-muted/60 text-foreground border border-border/40"
                      >
                        {a}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
              {role.permissions.length === 0 && (
                <p className="text-xs text-muted-foreground py-2">No permissions active for this role</p>
              )}
            </div>
          </div>
        )}
      />

      {/* Role Create / Edit Modal */}
      <Modal
        open={showModal}
        onClose={() => setShowModal(false)}
        title={editId ? "Edit Role & Permissions" : "Create Security Role"}
        description="Set authorized functional areas and operational privileges for this user role."
        size="lg"
      >
        <form className="space-y-5" onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Role Title *
              </label>
              <Input
                id="role-name"
                required
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="e.g. Senior Shift Supervisor"
                className="h-10 text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Description / Purpose
              </label>
              <Input
                id="role-desc"
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                placeholder="e.g. Can manage registers, issue refunds, and adjust inventory"
                className="h-10 text-sm"
              />
            </div>
          </div>

          {/* Quick Presets Bar */}
          <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-xl border border-border/70 bg-muted/30">
            <span className="text-xs font-semibold text-muted-foreground">Quick Configuration:</span>
            <div className="flex items-center gap-1.5">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => applyPreset("full_access")}
                className="h-7 px-2.5 text-xs font-semibold cursor-pointer"
              >
                Select Full Access
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => applyPreset("read_only")}
                className="h-7 px-2.5 text-xs font-semibold cursor-pointer"
              >
                Read Only
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => applyPreset("clear")}
                className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground cursor-pointer"
              >
                Clear All
              </Button>
            </div>
          </div>

          {/* Categorized Permissions Grid */}
          <div className="max-h-[50vh] overflow-y-auto pr-1 space-y-4">
            {MODULE_GROUPS.map((group) => (
              <div key={group.groupName} className="space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  <span>{group.icon}</span>
                  <span>{group.groupName}</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                  {group.modules.map((mod) => {
                    const activeActions = form.permissions[mod.key] ?? [];
                    const allSelected = mod.actions.every((a) => activeActions.includes(a));
                    return (
                      <div
                        key={mod.key}
                        className={cn(
                          "p-3 rounded-xl border transition-all",
                          activeActions.length > 0
                            ? "border-primary/30 bg-primary/5"
                            : "border-border/60 bg-card hover:border-border"
                        )}
                      >
                        <div className="flex items-center justify-between pb-1.5 border-b border-border/40">
                          <span className="font-semibold text-xs text-foreground flex items-center gap-1.5">
                            <span>{MODULE_ICONS[mod.key] || "🔹"}</span>
                            <span>{mod.label}</span>
                          </span>
                          <button
                            type="button"
                            onClick={() => toggleAllModuleActions(mod.key, mod.actions)}
                            className="text-[10px] font-semibold text-muted-foreground hover:text-primary transition-colors cursor-pointer"
                          >
                            {allSelected ? "Deselect" : "Select All"}
                          </button>
                        </div>

                        <div className="flex flex-wrap gap-1 mt-2">
                          {mod.actions.map((act) => {
                            const checked = activeActions.includes(act);
                            return (
                              <button
                                key={act}
                                type="button"
                                onClick={() => toggleAction(mod.key, act)}
                                className={cn(
                                  "inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-1 rounded-lg border transition-all cursor-pointer",
                                  checked
                                    ? "bg-primary text-white border-primary shadow-2xs"
                                    : "bg-muted/60 text-muted-foreground border-border/50 hover:text-foreground"
                                )}
                              >
                                {checked && <Check className="h-3 w-3" />}
                                <span>{act}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* Modal Actions */}
          <div className="flex items-center gap-3 pt-3 border-t border-border/60">
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
              {saveMutation.isPending ? "Saving..." : editId ? "Save Changes" : "Create Role"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={Boolean(deleteId)}
        onClose={() => setDeleteId(null)}
        onConfirm={() => deleteId && deleteMutation.mutate(deleteId)}
        title="Delete Security Role?"
        message="Staff members assigned to this custom role will lose their custom operational permissions. This action cannot be undone."
        confirmLabel="Delete Role"
        loading={deleteMutation.isPending}
      />
    </div>
  );
}
