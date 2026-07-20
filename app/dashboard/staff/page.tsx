"use client";

import * as React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Drawer } from "@/components/ui/drawer";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Avatar } from "@/components/ui/avatar";
import { Select } from "@/components/ui/select";
import { DataTable } from "@/components/ui/data-table";
import { useAuth } from "@/components/auth/auth-provider";
import { cn } from "@/lib/utils";
import { userService } from "@/services/user.service";
import { roleService } from "@/services/role.service";
import { outletService } from "@/services/outlet.service";
import type { StaffUser } from "@/lib/types";
import toast from "react-hot-toast";
import { getErrorMessage } from "@/lib/error";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useQueryState, parseAsString } from "nuqs";

const ALL_MODULES = ["billing", "inventory", "products", "reports", "expenses", "users", "outlets", "roles", "dashboard", "settings", "transactions", "analytics", "stock_transfers", "audit_logs", "categories", "units", "customers", "invoices"];
const ALL_ACTIONS = ["create", "read", "update", "delete", "refund", "print", "export", "approve", "void", "collect"];
const MODULE_ICONS: Record<string, string> = {
  billing: "🧾", inventory: "📦", products: "🏷️", reports: "📊", expenses: "💸",
  users: "👥", outlets: "🏪", roles: "🛡️", dashboard: "🏠", settings: "⚙️",
  transactions: "💰", analytics: "📈", stock_transfers: "🔄", audit_logs: "📋", categories: "📁"
};

const staffSchema = z.object({
  name: z.string().min(1, "Full name is required"),
  phone: z.string().min(10, "Phone number must be at least 10 characters"),
  email: z.string().email("Invalid email address"),
  role: z.string().min(1, "Role is required"),
  roleId: z.string().optional(),
  outletIds: z.array(z.string()),
  customPermissions: z.record(z.string(), z.array(z.string())).optional()
});

type StaffFormValues = z.infer<typeof staffSchema>;

export default function StaffPage() {
  const { token } = useAuth();
  const qc = useQueryClient();
  const [search, setSearch] = useQueryState("search", parseAsString.withDefault(""));
  const [showModal, setShowModal] = React.useState(false);
  const [editId, setEditId] = React.useState<string | null>(null);
  const [deleteId, setDeleteId] = React.useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<StaffFormValues>({
    resolver: zodResolver(staffSchema),
    defaultValues: {
      name: "",
      phone: "",
      email: "",
      role: "staff",
      roleId: "",
      outletIds: [],
      customPermissions: {}
    },
  });

  const watchedRole = watch("role");
  const watchedRoleId = watch("roleId");
  const watchedOutletIds = watch("outletIds") || [];
  const watchedCustomPermissions = watch("customPermissions") || {};

  const toggleAction = (module: string, action: string) => {
    const cur = watchedCustomPermissions[module] || [];
    const next = cur.includes(action) ? cur.filter((a) => a !== action) : [...cur, action];
    setValue("customPermissions", { ...watchedCustomPermissions, [module]: next });
  };

  const { data: staffData, isLoading, refetch } = useQuery({
    queryKey: ["staff", search],
    queryFn: () => userService.getUsers(token, { search: search || undefined }),
    enabled: Boolean(token)
  });
  const { data: rolesData } = useQuery({ queryKey: ["roles"], queryFn: () => roleService.getRoles(token), enabled: Boolean(token) });
  const { data: outletsData } = useQuery({ queryKey: ["outlets"], queryFn: () => outletService.getOutlets(token), enabled: Boolean(token) });

  const saveMutation = useMutation({
    mutationFn: (body: StaffFormValues) => {
      const cleanBody: any = { ...body };
      cleanBody.roleId = cleanBody.roleId || null;

      const permissionsArray = Object.entries(cleanBody.customPermissions || {})
        .filter(([, actions]: any) => actions.length > 0)
        .map(([module, actions]) => ({ module, actions }));
      cleanBody.customPermissions = permissionsArray;

      return editId ? userService.updateUser(editId, cleanBody, token) : userService.createUser(cleanBody, token);
    },
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
      setDeleteId(null);
      toast.success("Staff deleted");
    },
    onError: (err: any) => toast.error(getErrorMessage(err, "Failed to delete staff"))
  });

  const users = staffData?.users ?? [];
  const roles = rolesData?.roles ?? [];
  const outlets = outletsData?.data?.outlets ?? [];

  const selectedRoleObj = roles.find((r: any) => r._id === watchedRoleId);

  const openCreate = () => {
    setEditId(null);
    reset({ name: "", phone: "", email: "", role: "staff", roleId: "", outletIds: [], customPermissions: {} });
    setShowModal(true);
  };

  const openEdit = (u: StaffUser) => {
    setEditId(u._id);
    const perms: Record<string, string[]> = {};
    for (const p of (u.customPermissions || [])) {
      perms[p.module] = p.actions;
    }
    reset({
      name: u.name,
      phone: u.phone,
      email: u.email ?? "",
      role: u.role,
      roleId: typeof u.roleId === "object" ? u.roleId?._id ?? "" : u.roleId ?? "",
      outletIds: u.outletIds || [],
      customPermissions: perms
    });
    setShowModal(true);
  };

  const onSubmit = (data: StaffFormValues) => {
    saveMutation.mutate(data);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Staff</h1>
          <p className="text-sm text-muted">{users.length} team members</p>
        </div>
        <Button id="add-staff-btn" onClick={openCreate}>
          <Plus className="h-4 w-4 mr-1.5" /> Add Staff
        </Button>
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
        columns={[
          {
            key: "name",
            header: "Staff Member",
            render: (u) => (
              <div className="flex items-center gap-3">
                <Avatar name={u.name} size="sm" />
                <div>
                  <p className="font-medium">{u.name}</p>
                  <p className="text-xs text-muted">
                    {u.phone} {u.email ? `• ${u.email}` : ""}
                  </p>
                </div>
              </div>
            )
          },
          { key: "role", header: "Role", render: (u) => <Badge variant="soft" className="capitalize">{u.role}</Badge> },
          { key: "outletIds", header: "Outlets", render: (u) => <span className="text-sm text-muted">{u.outletIds.length === 0 ? "All" : `${u.outletIds.length} outlet(s)`}</span> },
          { key: "isActive", header: "Status", render: (u) => <Badge variant={u.isActive ? "soft" : "danger"}>{u.isActive ? "Active" : "Inactive"}</Badge> },
          {
            key: "actions",
            header: "",
            render: (u) => (
              <div className="flex gap-2">
                <Button variant="ghost" size="icon" onClick={() => openEdit(u)}>
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
                <Button variant="ghost" size="icon" className="text-danger" onClick={() => setDeleteId(u._id)}>
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            )
          }
        ]}
      />

      <Drawer open={showModal} onClose={() => setShowModal(false)} title={editId ? "Edit Staff" : "Add Staff"} size="lg">
        <form className="flex flex-col h-full overflow-hidden" onSubmit={handleSubmit(onSubmit)}>
          {/* Scrollable Body */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1 block text-xs font-medium text-muted">Full Name *</label>
                <Input id="staff-name" {...register("name")} />
                {errors.name && <p className="text-[10px] text-danger mt-1">{errors.name.message}</p>}
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-muted">Phone *</label>
                <Input id="staff-phone" {...register("phone")} />
                {errors.phone && <p className="text-[10px] text-danger mt-1">{errors.phone.message}</p>}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1 block text-xs font-medium text-muted">Email *</label>
                <Input id="staff-email" type="email" placeholder="e.g. staff@business.com" {...register("email")} />
                {errors.email && <p className="text-[10px] text-danger mt-1">{errors.email.message}</p>}
              </div>
              <div>
                <label className="mb-0.5 block text-xs font-medium text-muted">Role</label>
                <p className="mb-2 text-[10px] text-muted-foreground leading-snug">Select a role or custom permission template.</p>
                <Select
                  id="staff-combined-role"
                  value={watchedRole === "owner" ? "owner" : watchedRoleId}
                  onValueChange={(v) => {
                    if (v === "owner") {
                      setValue("role", "owner", { shouldValidate: true });
                      setValue("roleId", "", { shouldValidate: true });
                    } else {
                      const selected = roles.find((r: any) => r._id === v);
                      const isManager = selected?.name.toLowerCase().includes("manager");
                      setValue("role", isManager ? "manager" : "staff", { shouldValidate: true });
                      setValue("roleId", v, { shouldValidate: true });
                    }
                  }}
                  options={[
                    ...(watchedRole === "owner" ? [{ value: "owner", label: "Owner" }] : []),
                    ...roles.map((r: any) => ({ value: r._id, label: r.name }))
                  ]}
                  disabled={watchedRole === "owner"}
                />
                {errors.role && <p className="text-[10px] text-danger mt-1">{errors.role.message}</p>}
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-muted">Outlets</label>
                <div className="flex flex-wrap gap-2 mt-1">
                  {outlets.map((o) => {
                    const isSelected = watchedOutletIds.includes(o._id);
                    return (
                      <button
                        key={o._id}
                        type="button"
                        onClick={() => {
                          const nextOutlets = isSelected
                            ? watchedOutletIds.filter((id) => id !== o._id)
                            : [...watchedOutletIds, o._id];
                          setValue("outletIds", nextOutlets, { shouldValidate: true });
                        }}
                        className={`rounded-xl border px-3 py-1.5 text-xs font-medium transition ${isSelected
                          ? "bg-primary text-white border-primary"
                          : "border-border text-muted"
                          }`}
                      >
                        {o.name}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div>
              <div className="mb-3 flex justify-between items-center">
                <p className="text-sm font-semibold">Custom User Permissions</p>
                <p className="text-xs text-muted">Permissions selected here will be combined with the Assigned Role.</p>
              </div>
              <div className="overflow-x-auto rounded-xl border border-border shadow-sm max-h-[400px]">
                <table className="w-full text-xs">
                  <thead className="sticky top-0 z-20 bg-surface/95 backdrop-blur shadow-sm">
                    <tr>
                      <th className="px-3 py-3 text-left font-semibold text-muted sticky left-0 bg-surface/95 z-20 backdrop-blur">Module</th>
                      {ALL_ACTIONS.map((a) => <th key={a} className="px-2 py-3 text-center font-semibold text-muted capitalize min-w-[60px]">{a}</th>)}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/40">
                    {ALL_MODULES.map((mod) => (
                      <tr key={mod} className="hover:bg-muted/30 transition-colors">
                        <td className="px-3 py-2.5 font-medium sticky left-0 bg-surface z-10 border-r border-border/40 whitespace-nowrap">
                          {MODULE_ICONS[mod]} {mod}
                        </td>
                        {ALL_ACTIONS.map((action) => {
                          const isCustomChecked = (watchedCustomPermissions[mod] ?? []).includes(action);
                          const isRoleChecked = selectedRoleObj?.permissions?.find((p: any) => p.module === mod)?.actions.includes(action) ?? false;
                          const checked = isCustomChecked || isRoleChecked;

                          return (
                            <td key={action} className="px-2 py-2.5 text-center border-b border-border/20">
                              <button
                                type="button"
                                onClick={() => {
                                  if (!isRoleChecked) toggleAction(mod, action);
                                }}
                                disabled={isRoleChecked}
                                title={isRoleChecked ? "Inherited from Assigned Role" : "Click to toggle custom permission"}
                                className={cn(
                                  "h-5 w-5 rounded border transition-all mx-auto flex items-center justify-center",
                                  isRoleChecked
                                    ? "bg-primary/40 border-primary/40 text-white cursor-not-allowed opacity-70"
                                    : isCustomChecked
                                      ? "bg-primary border-primary text-white shadow-sm"
                                      : "border-border/80 hover:border-primary/50 bg-card hover:bg-muted/50"
                                )}>
                                {checked && <span className="text-[11px] font-bold">✓</span>}
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
          <div className="p-3 border-t border-border/60 bg-surface flex justify-end gap-3">
            <Button variant="outline" type="button" className="" onClick={() => setShowModal(false)}>
              Cancel
            </Button>
            <Button type="submit" className="" disabled={saveMutation.isPending}>
              {saveMutation.isPending ? "Saving..." : (editId ? "Save Changes" : "Add Staff")}
            </Button>
          </div>
        </form>
      </Drawer>

      <ConfirmDialog
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={() => deleteId && deleteMutation.mutate(deleteId)}
        title="Deactivate Staff?"
        message="This user will lose access immediately."
        confirmLabel="Deactivate"
        loading={deleteMutation.isPending}
      />
    </div>
  );
}
