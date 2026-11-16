"use client";

import * as React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Plus,
  Pencil,
  Trash2,
  Key,
  Users,
  Shield,
  Store,
  CheckCircle2,
  Lock,
  Mail,
  Phone,
  Building2,
  Check,
  ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Modal } from "@/components/ui/modal";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { ChangePasswordDialog } from "@/components/users/change-password-dialog";
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

const ALL_MODULES = [
  "billing",
  "inventory",
  "products",
  "reports",
  "expenses",
  "users",
  "outlets",
  "roles",
  "dashboard",
  "settings",
  "transactions",
  "analytics",
  "stock_transfers",
  "audit_logs",
  "categories",
  "units",
  "customers",
  "invoices",
];
const ALL_ACTIONS = ["create", "read", "update", "delete", "refund", "print", "export", "approve", "void", "collect"];

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

const staffSchema = z.object({
  name: z.string().min(1, "Full name is required"),
  phone: z.string().min(10, "Phone number must be at least 10 characters"),
  email: z.string().email("Invalid email address"),
  role: z.string().min(1, "Role is required"),
  roleId: z.string().optional(),
  outletIds: z.array(z.string()),
  customPermissions: z.record(z.string(), z.array(z.string())).optional(),
});

type StaffFormValues = z.infer<typeof staffSchema>;

function getStaffInitials(name: string): string {
  if (!name) return "ST";
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

export default function StaffPage() {
  const { token } = useAuth();
  const qc = useQueryClient();
  const [search, setSearch] = useQueryState("search", parseAsString.withDefault(""));
  const [showModal, setShowModal] = React.useState(false);
  const [editId, setEditId] = React.useState<string | null>(null);
  const [deleteId, setDeleteId] = React.useState<string | null>(null);
  const [showPermissions, setShowPermissions] = React.useState(false);

  // Password change states
  const [showPasswordModal, setShowPasswordModal] = React.useState(false);
  const [passwordUser, setPasswordUser] = React.useState<any | null>(null);

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
      customPermissions: {},
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
    enabled: Boolean(token),
  });
  const { data: rolesData } = useQuery({
    queryKey: ["roles"],
    queryFn: () => roleService.getRoles(token),
    enabled: Boolean(token),
  });
  const { data: outletsData } = useQuery({
    queryKey: ["outlets"],
    queryFn: () => outletService.getOutlets(token),
    enabled: Boolean(token),
  });

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
      toast.success(editId ? "Staff member profile updated" : "Staff member registered successfully");
    },
    onError: (err: any) => toast.error(getErrorMessage(err, "Failed to save staff")),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => userService.deleteUser(id, token),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["staff"] });
      setDeleteId(null);
      toast.success("Staff account deactivated successfully");
    },
    onError: (err: any) => toast.error(getErrorMessage(err, "Failed to delete staff")),
  });

  const handleChangePassword = async (userId: string, newPassword: string) => {
    await userService.changeUserPassword(userId, newPassword, token);
  };

  const users: StaffUser[] = staffData?.users ?? [];
  const roles = rolesData?.roles ?? [];
  const outlets = outletsData?.data?.outlets ?? [];

  const activeStaff = React.useMemo(() => users.filter((u) => u.isActive), [users]);
  const managersCount = React.useMemo(
    () => users.filter((u) => u.role === "manager" || u.role === "owner").length,
    [users]
  );

  const selectedRoleObj = roles.find((r: any) => r._id === watchedRoleId);

  const openCreate = () => {
    setEditId(null);
    setShowPermissions(false);
    reset({
      name: "",
      phone: "",
      email: "",
      role: "staff",
      roleId: roles.length > 0 ? roles[0]._id : "",
      outletIds: [],
      customPermissions: {},
    });
    setShowModal(true);
  };

  const openEdit = (u: StaffUser) => {
    setEditId(u._id);
    const perms: Record<string, string[]> = {};
    for (const p of u.customPermissions || []) {
      perms[p.module] = p.actions;
    }
    setShowPermissions(Object.keys(perms).length > 0);
    reset({
      name: u.name,
      phone: u.phone,
      email: u.email ?? "",
      role: u.role,
      roleId: typeof u.roleId === "object" ? u.roleId?._id ?? "" : u.roleId ?? "",
      outletIds: u.outletIds || [],
      customPermissions: perms,
    });
    setShowModal(true);
  };

  const onSubmit = (data: StaffFormValues) => {
    saveMutation.mutate(data);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Team & Staff Accounts
            </h1>
            <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 text-xs">
              Workforce
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">
            Manage cashier terminals, store managers, assigned outlets, and system credentials.
          </p>
        </div>

        <Button
          id="add-staff-btn"
          onClick={openCreate}
          className="h-10 px-4 text-xs font-semibold gap-1.5 shadow-xs cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          <span>Add Staff Member</span>
        </Button>
      </div>

      {/* Overview KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        <Card className="border border-border/70 bg-card shadow-2xs hover:shadow-xs transition-shadow">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                Total Staff
              </p>
              <p className="text-xl font-extrabold text-foreground tracking-tight mt-1 truncate">
                {users.length} Members
              </p>
              <p className="text-[11px] text-muted-foreground mt-0.5">Registered team accounts</p>
            </div>
            <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0 border border-primary/20">
              <Users className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border border-border/70 bg-card shadow-2xs hover:shadow-xs transition-shadow">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                Active Staff
              </p>
              <p className="text-xl font-extrabold text-emerald-600 dark:text-emerald-400 tracking-tight mt-1 truncate">
                {activeStaff.length} Online
              </p>
              <p className="text-[11px] text-muted-foreground mt-0.5">Authorized for POS checkouts</p>
            </div>
            <div className="h-10 w-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-500/20">
              <CheckCircle2 className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border border-border/70 bg-card shadow-2xs hover:shadow-xs transition-shadow">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                Managers & Leads
              </p>
              <p className="text-xl font-extrabold text-indigo-600 dark:text-indigo-400 tracking-tight mt-1 truncate">
                {managersCount} Leaders
              </p>
              <p className="text-[11px] text-muted-foreground mt-0.5">Store & franchise supervisors</p>
            </div>
            <div className="h-10 w-10 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 border border-indigo-500/20">
              <Shield className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border border-border/70 bg-card shadow-2xs hover:shadow-xs transition-shadow">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                Store Outlets
              </p>
              <p className="text-xl font-extrabold text-foreground tracking-tight mt-1 truncate">
                {outlets.length} Branches
              </p>
              <p className="text-[11px] text-muted-foreground mt-0.5">Active retail locations</p>
            </div>
            <div className="h-10 w-10 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 border border-amber-500/20">
              <Store className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Staff Directory Table */}
      <DataTable
        title="Staff Directory"
        description="Active terminal users, assigned security roles, and branch authorizations."
        isLoading={isLoading}
        data={users}
        keyExtractor={(u) => u._id}
        searchQuery={search}
        onSearchChange={setSearch}
        onRefetch={() => refetch()}
        placeholderText="Search team member by name, phone, or email..."
        emptyStateText="No staff members registered yet."
        columns={[
          {
            key: "name",
            header: "Staff Member",
            render: (u) => (
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary font-bold text-sm tracking-wide border border-primary/20 shadow-2xs">
                  {getStaffInitials(u.name)}
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-sm text-foreground truncate">{u.name}</p>
                  <div className="flex items-center gap-2 mt-0.5 text-xs text-muted-foreground">
                    <span className="font-mono flex items-center gap-1">
                      <Phone className="h-3 w-3" />
                      {u.phone}
                    </span>
                    {u.email && (
                      <span className="truncate hidden sm:inline flex items-center gap-1">
                        • {u.email}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ),
          },
          {
            key: "role",
            header: "Security Role",
            render: (u) => (
              <div>
                <Badge
                  variant={
                    u.role === "owner"
                      ? "default"
                      : u.role === "manager"
                      ? "soft"
                      : "secondary"
                  }
                  className="capitalize font-semibold text-xs"
                >
                  {typeof u.roleId === "object" && u.roleId?.name ? u.roleId.name : u.role}
                </Badge>
                {u.role === "owner" && (
                  <p className="text-[10px] text-muted-foreground mt-0.5">Full Franchise Access</p>
                )}
              </div>
            ),
          },
          {
            key: "outletIds",
            header: "Assigned Outlets",
            render: (u) => (
              <span className="text-xs font-mono font-medium text-foreground bg-muted/60 px-2 py-0.5 rounded border border-border/40">
                {u.outletIds.length === 0 ? "All Outlets" : `${u.outletIds.length} Outlet(s)`}
              </span>
            ),
          },
          {
            key: "isActive",
            header: "Status",
            render: (u) =>
              u.isActive ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg text-xs font-semibold bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  Active
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg text-xs font-semibold bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-500/20">
                  <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
                  Inactive
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
                  title="Edit Staff Member"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 w-8 p-0 text-muted-foreground hover:text-blue-600 hover:border-blue-500/30 cursor-pointer"
                  onClick={() => {
                    setPasswordUser(u);
                    setShowPasswordModal(true);
                  }}
                  title="Change Password"
                >
                  <Key className="h-3.5 w-3.5" />
                </Button>
                {u.role !== "owner" && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive hover:border-destructive/30 cursor-pointer"
                    onClick={() => setDeleteId(u._id)}
                    title="Deactivate Staff Account"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                )}
              </div>
            ),
          },
        ]}
      />

      {/* Add / Edit Staff Modal */}
      <Modal
        open={showModal}
        onClose={() => setShowModal(false)}
        title={editId ? "Edit Staff Account" : "Add Staff Member"}
        description="Configure employee credentials, security role, and authorized store outlets."
        size="lg"
      >
        <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Full Name *
              </label>
              <Input
                id="staff-name"
                {...register("name")}
                placeholder="e.g. Anand Patel"
                className="h-10 text-sm"
              />
              {errors.name && <p className="text-[11px] text-destructive mt-1">{errors.name.message}</p>}
            </div>

            <div>
              <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Phone Number *
              </label>
              <Input
                id="staff-phone"
                {...register("phone")}
                placeholder="+91 98765 43210"
                className="h-10 text-sm font-mono"
              />
              {errors.phone && <p className="text-[11px] text-destructive mt-1">{errors.phone.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Email Address *
              </label>
              <Input
                id="staff-email"
                type="email"
                placeholder="anand@store.com"
                {...register("email")}
                className="h-10 text-sm"
              />
              {errors.email && <p className="text-[11px] text-destructive mt-1">{errors.email.message}</p>}
            </div>

            <div>
              <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Security Role *
              </label>
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
                  ...(watchedRole === "owner" ? [{ value: "owner", label: "Owner (Full Admin Access)" }] : []),
                  ...roles.map((r: any) => ({ value: r._id, label: r.name })),
                ]}
                disabled={watchedRole === "owner"}
              />
              {errors.role && <p className="text-[11px] text-destructive mt-1">{errors.role.message}</p>}
            </div>
          </div>

          {/* Outlets Selection */}
          <div>
            <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Assigned Store Outlets (Leave empty for All Outlets)
            </label>
            <div className="flex flex-wrap gap-2 mt-1.5 p-3 rounded-xl border border-border/60 bg-muted/20">
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
                    className={cn(
                      "rounded-lg border px-3 py-1.5 text-xs font-semibold transition cursor-pointer flex items-center gap-1.5",
                      isSelected
                        ? "bg-primary text-white border-primary shadow-2xs"
                        : "bg-card border-border/70 text-muted-foreground hover:text-foreground hover:border-border"
                    )}
                  >
                    {isSelected && <Check className="h-3.5 w-3.5" />}
                    <span>{o.name}</span>
                  </button>
                );
              })}
              {outlets.length === 0 && (
                <p className="text-xs text-muted-foreground">No specific outlets configured.</p>
              )}
            </div>
          </div>

          {/* Optional Custom Permissions Collapsible */}
          <div className="pt-1">
            <button
              type="button"
              onClick={() => setShowPermissions(!showPermissions)}
              className="text-xs font-semibold text-primary hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>{showPermissions ? "Hide Custom Permission Overrides" : "Configure Custom Permission Overrides (Optional)"}</span>
              <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", showPermissions && "rotate-180")} />
            </button>

            {showPermissions && (
              <div className="mt-2.5 p-3 rounded-xl border border-border/70 bg-muted/20 space-y-2 max-h-56 overflow-y-auto">
                <p className="text-[11px] text-muted-foreground">
                  Permissions selected below are added on top of privileges inherited from the assigned role.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                  {ALL_MODULES.map((mod) => (
                    <div key={mod} className="p-2 rounded-lg border border-border/50 bg-card space-y-1">
                      <span className="text-[11px] font-bold text-foreground capitalize flex items-center gap-1">
                        <span>{MODULE_ICONS[mod] || "🔹"}</span>
                        <span>{mod.replace("_", " ")}</span>
                      </span>
                      <div className="flex flex-wrap gap-1">
                        {ALL_ACTIONS.slice(0, 6).map((action) => {
                          const isCustomChecked = (watchedCustomPermissions[mod] ?? []).includes(action);
                          const isRoleChecked =
                            selectedRoleObj?.permissions?.find((p: any) => p.module === mod)?.actions.includes(action) ?? false;
                          const checked = isCustomChecked || isRoleChecked;

                          return (
                            <button
                              key={action}
                              type="button"
                              onClick={() => {
                                if (!isRoleChecked) toggleAction(mod, action);
                              }}
                              disabled={isRoleChecked}
                              className={cn(
                                "text-[10px] font-mono px-1.5 py-0.5 rounded border transition-all cursor-pointer",
                                isRoleChecked
                                  ? "bg-primary/20 border-primary/30 text-primary font-semibold cursor-not-allowed"
                                  : isCustomChecked
                                  ? "bg-primary text-white border-primary"
                                  : "bg-muted/40 text-muted-foreground border-border/40 hover:text-foreground"
                              )}
                              title={isRoleChecked ? "Inherited from assigned role" : "Toggle custom permission"}
                            >
                              {action}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

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
              {saveMutation.isPending ? "Saving..." : editId ? "Save Changes" : "Register Staff"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Deactivate Confirmation Dialog */}
      <ConfirmDialog
        open={Boolean(deleteId)}
        onClose={() => setDeleteId(null)}
        onConfirm={() => deleteId && deleteMutation.mutate(deleteId)}
        title="Deactivate Staff Account?"
        message="This team member will immediately lose access to POS registers and business terminals. All historical bills recorded by them will be preserved."
        confirmLabel="Deactivate Account"
        loading={deleteMutation.isPending}
      />

      {/* Change Password Dialog */}
      {passwordUser && (
        <ChangePasswordDialog
          isOpen={showPasswordModal}
          onClose={() => {
            setShowPasswordModal(false);
            setPasswordUser(null);
          }}
          userId={passwordUser._id}
          userName={passwordUser.name}
          onChangePassword={handleChangePassword}
        />
      )}
    </div>
  );
}
