"use client";

import * as React from "react";
import dynamic from "next/dynamic";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Users,
  ShieldCheck,
  Building2,
  Key,
  Trash2,
  Plus,
  Flame,
  RefreshCw,
  Copy,
  Check,
  Search,
  AlertTriangle,
  CheckCircle2,
  Mail,
  Phone,
  Shield,
  UserCheck,
  Crown,
  Eye,
  EyeOff,
  Lock,
  Pencil,
  SlidersHorizontal,
  Sparkles,
  Info,
} from "lucide-react";
import Link from "next/link";
import { toast } from "react-hot-toast";
import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { useAuth } from "@/components/auth/auth-provider";
import { userService } from "@/services/user.service";
import { adminService } from "@/services/admin.service";
import { useQueryState, parseAsString } from "nuqs";
import { getErrorMessage } from "@/lib/error";
import { APP_ROUTES } from "@/lib/routes";

const Modal = dynamic(() => import("@/components/ui/modal").then((m) => ({ default: m.Modal })), { ssr: false });
import { ChangePasswordDialog } from "@/components/users/change-password-dialog";

const SYSTEM_MODULES = [
  { key: "dashboard", label: "Dashboard", desc: "Platform metrics & KPIs" },
  { key: "businesses", label: "Businesses & Tenants", desc: "Store lifecycle & approvals" },
  { key: "outlets", label: "Outlets Registry", desc: "Branch locations & stores" },
  { key: "subscriptions", label: "Subscriptions", desc: "Billing cycles & invoices" },
  { key: "plans", label: "Pricing Plans", desc: "Tier quotas & feature limits" },
  { key: "payments", label: "Manual Payments", desc: "Bank transfer verification" },
  { key: "agents", label: "Partner Agents", desc: "Commissions & sales payouts" },
  { key: "blogs", label: "Blog CMS", desc: "Marketing posts & SEO publishing" },
  { key: "audit_logs", label: "Audit Trails", desc: "Security & operation logs" },
  { key: "settings", label: "Platform Settings", desc: "Global config & maintenance" },
  { key: "users", label: "User Registry", desc: "Accounts & credential reset" },
];

export default function AdminUsersPage() {
  const { token, user: currentUser } = useAuth();
  const qc = useQueryClient();
  const [activeTab, setActiveTab] = React.useState<"users" | "roles">("users");
  const [search, setSearch] = useQueryState("search", parseAsString.withDefault(""));
  const [roleFilter, setRoleFilter] = React.useState<string>("all");
  const [copiedId, setCopiedId] = React.useState<string | null>(null);

  // System Admin creation modal state
  const [showModal, setShowModal] = React.useState(false);
  const [showAdminPassword, setShowAdminPassword] = React.useState(false);

  // Role creation/edit modal state
  const [showRoleModal, setShowRoleModal] = React.useState(false);
  const [editingRoleId, setEditingRoleId] = React.useState<string | null>(null);
  const [roleForm, setRoleForm] = React.useState({
    name: "",
    description: "",
    allowedModules: [] as string[],
  });

  // Role delete modal state
  const [deletingRole, setDeletingRole] = React.useState<any | null>(null);

  // Purge modal states
  const [showPurgeModal, setShowPurgeModal] = React.useState(false);
  const [purgeTarget, setPurgeTarget] = React.useState<any | null>(null);
  const [manualUserId, setManualUserId] = React.useState("");
  const [purgeResult, setPurgeResult] = React.useState<any | null>(null);

  // Change password modal states
  const [showPasswordModal, setShowPasswordModal] = React.useState(false);
  const [passwordUser, setPasswordUser] = React.useState<any | null>(null);

  const [form, setForm] = React.useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    roleId: "",
    allowedModules: [] as string[],
  });

  // Query: Users list
  const { data: usersData, isLoading: isUsersLoading, refetch: refetchUsers } = useQuery({
    queryKey: ["admin-users", search],
    queryFn: () => userService.getUsers(token, { search: search || undefined }),
    enabled: Boolean(token),
  });

  // Query: Platform Roles
  const { data: rolesResponse, isLoading: isRolesLoading, refetch: refetchRoles } = useQuery({
    queryKey: ["admin-platform-roles"],
    queryFn: () => adminService.getAdminRoles(token),
    enabled: Boolean(token),
  });

  const platformRoles = rolesResponse?.roles ?? [];

  const roleSelectOptions = React.useMemo(
    () => [
      { value: "", label: "Custom Scopes (No Preset Template)" },
      ...platformRoles.map((r: any) => ({
        value: r._id,
        label: `${r.name} ${r.isSystem ? "(System Preset)" : "(Custom Role)"}`,
      })),
    ],
    [platformRoles]
  );

  // Mutation: Create System Admin
  const createMutation = useMutation({
    mutationFn: (body: any) => adminService.createSystemAdmin(body, token),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-users"] });
      qc.invalidateQueries({ queryKey: ["admin-platform-roles"] });
      setShowModal(false);
      setForm({ name: "", email: "", phone: "", password: "", roleId: "", allowedModules: [] });
      toast.success("System Admin created successfully!");
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  // Mutation: Create or Update Admin Role
  const saveRoleMutation = useMutation({
    mutationFn: (body: any) =>
      editingRoleId
        ? adminService.updateAdminRole(editingRoleId, body, token)
        : adminService.createAdminRole(body, token),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-platform-roles"] });
      setShowRoleModal(false);
      setEditingRoleId(null);
      setRoleForm({ name: "", description: "", allowedModules: [] });
      toast.success(editingRoleId ? "Admin role updated successfully!" : "Custom admin role created successfully!");
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  // Mutation: Delete Admin Role
  const deleteRoleMutation = useMutation({
    mutationFn: (roleId: string) => adminService.deleteAdminRole(roleId, token),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-platform-roles"] });
      setDeletingRole(null);
      toast.success("Admin role deleted successfully!");
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  // Mutation: Purge user
  const purgeMutation = useMutation({
    mutationFn: (targetId: string) => adminService.purgeUserTestData(targetId, token),
    onSuccess: (res: any) => {
      qc.invalidateQueries({ queryKey: ["admin-users"] });
      qc.invalidateQueries({ queryKey: ["admin-platform-stats"] });
      qc.invalidateQueries({ queryKey: ["admin-businesses"] });
      qc.invalidateQueries({ queryKey: ["admin-outlets"] });
      setPurgeResult(res?.data || res);
      toast.success(res?.message || "User and associated data purged successfully!");
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  // Handle Role preset selection in Admin creation modal
  const handleSelectRolePreset = (roleId: string) => {
    if (!roleId) {
      setForm((prev) => ({ ...prev, roleId: "", allowedModules: [] }));
      return;
    }

    const selectedRole = platformRoles.find((r: any) => r._id === roleId);
    if (selectedRole) {
      const roleModules = (selectedRole.permissions || []).map((p: any) => p.module);
      setForm((prev) => ({
        ...prev,
        roleId,
        allowedModules: roleModules,
      }));
    } else {
      setForm((prev) => ({ ...prev, roleId }));
    }
  };

  const handleSubmitAdmin = (e: React.FormEvent) => {
    e.preventDefault();
    const customPermissions = form.allowedModules.map((mod) => ({
      module: mod,
      actions:
        mod === "blogs"
          ? ["read", "create", "update", "delete", "publish", "unpublish"]
          : ["read", "create", "update", "delete", "approve"],
    }));

    createMutation.mutate({
      name: form.name,
      email: form.email,
      phone: form.phone,
      password: form.password,
      roleId: form.roleId || undefined,
      customPermissions,
    });
  };

  const handleSaveRole = (e: React.FormEvent) => {
    e.preventDefault();
    if (!roleForm.name.trim()) {
      toast.error("Please provide a role name");
      return;
    }
    if (roleForm.allowedModules.length === 0) {
      toast.error("Please select at least one module for this role");
      return;
    }

    const permissions = roleForm.allowedModules.map((mod) => ({
      module: mod,
      actions:
        mod === "blogs"
          ? ["read", "create", "update", "delete", "publish", "unpublish"]
          : ["read", "create", "update", "delete", "approve"],
    }));

    saveRoleMutation.mutate({
      name: roleForm.name.trim(),
      description: roleForm.description.trim(),
      permissions,
    });
  };

  const openCreateRole = () => {
    setEditingRoleId(null);
    setRoleForm({ name: "", description: "", allowedModules: ["dashboard"] });
    setShowRoleModal(true);
  };

  const openEditRole = (role: any) => {
    setEditingRoleId(role._id);
    const roleModules = (role.permissions || []).map((p: any) => p.module);
    setRoleForm({
      name: role.name,
      description: role.description || "",
      allowedModules: roleModules,
    });
    setShowRoleModal(true);
  };

  const handleOpenPurge = (user?: any) => {
    setPurgeResult(null);
    if (user) {
      setPurgeTarget(user);
      setManualUserId(user._id);
    } else {
      setPurgeTarget(null);
      setManualUserId("");
    }
    setShowPurgeModal(true);
  };

  const handleConfirmPurge = (e: React.FormEvent) => {
    e.preventDefault();
    const idToPurge = purgeTarget?._id || manualUserId.trim();
    if (!idToPurge) {
      toast.error("Please enter or select a valid User ID to purge");
      return;
    }
    purgeMutation.mutate(idToPurge);
  };

  const toggleModule = (mod: string) => {
    setForm((prev) => ({
      ...prev,
      allowedModules: prev.allowedModules.includes(mod)
        ? prev.allowedModules.filter((m) => m !== mod)
        : [...prev.allowedModules, mod],
    }));
  };

  const toggleRoleModule = (mod: string) => {
    setRoleForm((prev) => ({
      ...prev,
      allowedModules: prev.allowedModules.includes(mod)
        ? prev.allowedModules.filter((m) => m !== mod)
        : [...prev.allowedModules, mod],
    }));
  };

  const handleChangePassword = async (userId: string, newPassword: string) => {
    await adminService.changeUserPassword(userId, newPassword, token);
  };

  const handleCopyId = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    toast.success("User ID copied");
    setTimeout(() => setCopiedId(null), 2000);
  };

  const allUsers = usersData?.users ?? [];

  const filteredUsers = React.useMemo(() => {
    if (roleFilter === "all") return allUsers;
    if (roleFilter === "superadmin") return allUsers.filter((u: any) => u.role === "superadmin");
    if (roleFilter === "owner") return allUsers.filter((u: any) => u.role === "owner");
    if (roleFilter === "staff") return allUsers.filter((u: any) => u.role === "manager" || u.role === "staff");
    return allUsers;
  }, [allUsers, roleFilter]);

  const totalCount = allUsers.length;
  const superadminCount = allUsers.filter((u: any) => u.role === "superadmin").length;
  const ownerCount = allUsers.filter((u: any) => u.role === "owner").length;
  const staffCount = allUsers.filter((u: any) => u.role === "manager" || u.role === "staff").length;

  return (
    <div className="space-y-4 animate-in fade-in duration-300">
      {/* ── SECTION HEADER & WORKSPACE NAVIGATION ────────────────────────── */}
      <div className="flex flex-col gap-3 rounded-xl border border-border/80 bg-card p-3 sm:p-3.5 shadow-2xs">
        <div className="flex flex-col gap-2.5 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-base sm:text-lg font-bold tracking-tight text-foreground sm:text-xl">
                Users & Administrative Access Control
              </h1>
              <span className="inline-flex items-center rounded-md bg-primary/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary border border-primary/20 shrink-0">
                RBAC Console
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5 hidden sm:block">
              Manage platform team roles, granular administrative scopes, system users directory, and testing account lifecycles.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                refetchUsers();
                refetchRoles();
              }}
              className="h-7 sm:h-8 gap-1 px-2 sm:px-2.5 text-xs cursor-pointer shadow-2xs hover:bg-accent shrink-0"
            >
              <RefreshCw className={`h-3 w-3 ${isUsersLoading || isRolesLoading ? "animate-spin text-primary" : "text-muted-foreground"}`} />
              <span className="hidden sm:inline">Refresh</span>
            </Button>

            {activeTab === "users" ? (
              <>
                <Button
                  onClick={() => handleOpenPurge()}
                  variant="outline"
                  size="sm"
                  className="h-7 sm:h-8 gap-1 px-2 sm:px-2.5 text-xs border-destructive/30 text-destructive hover:bg-destructive/10 cursor-pointer shadow-2xs shrink-0"
                >
                  <Flame className="h-3.5 w-3.5" />
                  <span>Purge</span>
                  <span className="hidden sm:inline">Test Data</span>
                </Button>

                <Button
                  onClick={() => setShowModal(true)}
                  size="sm"
                  className="h-7 sm:h-8 gap-1 px-2.5 sm:px-3 text-xs font-semibold cursor-pointer shadow-2xs shrink-0"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Add Admin</span>
                </Button>
              </>
            ) : (
              <Button
                onClick={openCreateRole}
                size="sm"
                className="h-7 sm:h-8 gap-1 px-2.5 sm:px-3 text-xs font-semibold cursor-pointer shadow-2xs shrink-0"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Create Admin Role</span>
              </Button>
            )}
          </div>
        </div>

        {/* ── WORKSPACE TABS SWITCHER ────────────────────────────────────── */}
        <div className="flex items-center gap-2 border-t border-border/60 pt-2.5">
          <div className="inline-flex rounded-lg bg-muted/60 p-0.5 border border-border/80">
            <button
              type="button"
              onClick={() => setActiveTab("users")}
              className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
                activeTab === "users"
                  ? "bg-background text-foreground shadow-2xs ring-1 ring-border/80"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Users className="h-3.5 w-3.5" />
              <span>Users Directory</span>
              <span className="ml-1 rounded-md bg-muted px-1.5 py-0.2 text-[10px] font-mono font-bold text-foreground">
                {totalCount}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("roles")}
              className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
                activeTab === "roles"
                  ? "bg-background text-foreground shadow-2xs ring-1 ring-border/80"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <ShieldCheck className="h-3.5 w-3.5" />
              <span>Platform Admin Roles (RBAC)</span>
              <span className="ml-1 rounded-md bg-muted px-1.5 py-0.2 text-[10px] font-mono font-bold text-foreground">
                {platformRoles.length}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* ── TAB 1: USERS DIRECTORY ───────────────────────────────────────── */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {activeTab === "users" && (
        <div className="space-y-4">
          {/* Filter Chips */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar scroll-smooth p-1 -mx-1 sm:mx-0 sm:flex-wrap">
            <button
              type="button"
              onClick={() => setRoleFilter("all")}
              className={`inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs transition-all cursor-pointer shrink-0 ${
                roleFilter === "all"
                  ? "bg-primary/10 text-primary border-primary/30 font-semibold shadow-2xs ring-1 ring-primary/20"
                  : "bg-muted/30 border-border/80 text-muted-foreground hover:text-foreground hover:bg-muted/60"
              }`}
            >
              <Users className="h-3.5 w-3.5" />
              <span>All Accounts</span>
              <span className="rounded-md bg-background px-1.5 py-0.2 text-[10px] font-mono font-bold text-foreground shadow-2xs">
                {totalCount}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setRoleFilter("superadmin")}
              className={`inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs transition-all cursor-pointer shrink-0 ${
                roleFilter === "superadmin"
                  ? "bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/30 font-semibold shadow-2xs ring-1 ring-purple-500/20"
                  : "bg-muted/30 border-border/80 text-muted-foreground hover:text-foreground hover:bg-muted/60"
              }`}
            >
              <Shield className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400" />
              <span>System Administrators</span>
              <span className="rounded-md bg-background px-1.5 py-0.2 text-[10px] font-mono font-bold text-foreground shadow-2xs">
                {superadminCount}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setRoleFilter("owner")}
              className={`inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs transition-all cursor-pointer shrink-0 ${
                roleFilter === "owner"
                  ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30 font-semibold shadow-2xs ring-1 ring-emerald-500/20"
                  : "bg-muted/30 border-border/80 text-muted-foreground hover:text-foreground hover:bg-muted/60"
              }`}
            >
              <Building2 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>Business Owners</span>
              <span className="rounded-md bg-background px-1.5 py-0.2 text-[10px] font-mono font-bold text-foreground shadow-2xs">
                {ownerCount}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setRoleFilter("staff")}
              className={`inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs transition-all cursor-pointer shrink-0 ${
                roleFilter === "staff"
                  ? "bg-sky-500/10 text-sky-700 dark:text-sky-300 border-sky-500/30 font-semibold shadow-2xs ring-1 ring-sky-500/20"
                  : "bg-muted/30 border-border/80 text-muted-foreground hover:text-foreground hover:bg-muted/60"
              }`}
            >
              <UserCheck className="h-3.5 w-3.5 text-sky-600 dark:text-sky-400" />
              <span>Store Managers & Staff</span>
              <span className="rounded-md bg-background px-1.5 py-0.2 text-[10px] font-mono font-bold text-foreground shadow-2xs">
                {staffCount}
              </span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Search users by name or email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8 text-xs h-8"
              />
            </div>
          </div>

          <DataTable
            data={filteredUsers}
            loading={isUsersLoading}
            emptyMessage="No registered users found matching the filter."
            columns={[
              {
                key: "name",
                header: "User Profile",
                render: (u: any) => {
                  const initial = u.name ? u.name.charAt(0).toUpperCase() : "U";
                  const isSuper = u.role === "superadmin";
                  const isPrimary = u.isPrimaryAdmin || u.email === "admin@minihisab.com";
                  return (
                    <div className="flex items-center gap-3 py-1">
                      <div
                        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl font-bold text-sm shadow-2xs ${
                          isPrimary
                            ? "bg-amber-500/15 text-amber-600 dark:text-amber-400 ring-1 ring-amber-500/40"
                            : isSuper
                            ? "bg-purple-500/15 text-purple-600 dark:text-purple-400 ring-1 ring-purple-500/30"
                            : "bg-primary/10 text-primary ring-1 ring-primary/20"
                        }`}
                      >
                        {isPrimary ? <Crown className="h-5 w-5 text-amber-500" /> : isSuper ? <Shield className="h-4.5 w-4.5" /> : initial}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className="font-semibold text-sm text-foreground truncate max-w-[200px]">{u.name}</p>
                          {isPrimary && (
                            <span className="inline-flex items-center rounded px-1.5 py-0.2 text-[9px] font-bold bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/30">
                              Root Admin
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                          {u.email && (
                            <a
                              href={`mailto:${u.email}`}
                              className="hover:text-primary transition-colors truncate max-w-[150px]"
                            >
                              {u.email}
                            </a>
                          )}
                          {u.email && u.phone && <span className="text-muted-foreground/40">•</span>}
                          {u.phone && <span className="font-mono">{u.phone}</span>}
                        </div>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="text-[10px] text-muted-foreground font-mono">ID: {u._id.slice(-6)}</span>
                          <button
                            onClick={(e) => handleCopyId(u._id, e)}
                            className="text-muted-foreground hover:text-foreground transition-colors p-0.5"
                            title="Copy Full ID"
                          >
                            {copiedId === u._id ? (
                              <Check className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
                            ) : (
                              <Copy className="h-3 w-3" />
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                },
              },
              {
                key: "role",
                header: "Administrative Role / Access Scope",
                render: (u: any) => {
                  const isSuper = u.role === "superadmin";
                  const isOwner = u.role === "owner";
                  const isPrimary = u.isPrimaryAdmin || u.email === "admin@minihisab.com";
                  const roleName = u.roleId?.name;
                  return (
                    <div className="flex flex-col gap-1 items-start py-1">
                      {isPrimary ? (
                        <Badge variant="default" className="bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30 text-[11px] font-bold gap-1 shadow-2xs">
                          <Crown className="h-3 w-3 text-amber-500 inline" />
                          Primary Root Superadmin
                        </Badge>
                      ) : isSuper ? (
                        <Badge variant="default" className="bg-purple-500/15 text-purple-700 dark:text-purple-300 border border-purple-500/30 text-[11px] font-semibold">
                          {roleName || "System Administrator"}
                        </Badge>
                      ) : (
                        <Badge
                          variant={isOwner ? "soft" : "outline"}
                          className="capitalize text-[11px] font-semibold"
                        >
                          {u.role}
                        </Badge>
                      )}

                      {roleName && !isPrimary && isSuper && (
                        <span className="text-[10px] text-muted-foreground font-mono">
                          Role: {roleName}
                        </span>
                      )}

                      {isSuper && !isPrimary && u.customPermissions?.length > 0 && (
                        <span className="text-[10px] text-amber-600 dark:text-amber-400 font-medium">
                          {u.customPermissions.length} Scoped Modules
                        </span>
                      )}
                    </div>
                  );
                },
              },
              {
                key: "business",
                header: "Organization / Scope",
                render: (u: any) => {
                  if (u.role === "superadmin") {
                    return (
                      <div className="flex items-center gap-1.5 py-1 text-xs text-purple-600 dark:text-purple-400 font-medium">
                        <ShieldCheck className="h-3.5 w-3.5 shrink-0" />
                        <span>Platform Headquarters</span>
                      </div>
                    );
                  }

                  return (
                    <div className="flex items-center gap-1.5 py-1 text-xs text-muted-foreground">
                      <Building2 className="h-3.5 w-3.5 text-muted-foreground/70 shrink-0" />
                      <span className="truncate max-w-[160px]">
                        {u.businessId?.name || "Unattached Business"}
                      </span>
                    </div>
                  );
                },
              },
              {
                key: "isActive",
                header: "Account Status",
                render: (u: any) => (
                  <div className="inline-flex items-center gap-1.5 py-1">
                    <span
                      className={`h-2 w-2 rounded-full ${
                        u.isActive ? "bg-emerald-500" : "bg-destructive"
                      }`}
                    />
                    <Badge
                      variant={u.isActive ? "soft" : "danger"}
                      className="capitalize text-[11px]"
                    >
                      {u.isActive ? "Active" : "Suspended"}
                    </Badge>
                  </div>
                ),
              },
              {
                key: "actions",
                header: "Management Actions",
                render: (u: any) => {
                  const isSuperAdmin = u.role === "superadmin";
                  const isPrimary = u.isPrimaryAdmin || u.email === "admin@minihisab.com";
                  return (
                    <div className="flex items-center justify-end gap-1.5 pr-3">
                      {!isSuperAdmin ? (
                        <>
                          <Button
                            variant="outline"
                            size="xs"
                            onClick={() => {
                              setPasswordUser(u);
                              setShowPasswordModal(true);
                            }}
                            className="gap-1 text-xs px-2.5 h-7.5 cursor-pointer hover:bg-primary/10 hover:text-primary hover:border-primary/30"
                            title="Change user password"
                          >
                            <Key className="h-3 w-3" />
                            <span>Password</span>
                          </Button>

                          <Button
                            variant="ghost"
                            size="xs"
                            onClick={() => handleOpenPurge(u)}
                            className="gap-1 text-xs px-2.5 h-7.5 text-destructive hover:bg-destructive/10 hover:text-destructive cursor-pointer"
                            title="Cascade delete all user and tenant data"
                          >
                            <Trash2 className="h-3 w-3" />
                            <span className="hidden xl:inline">Purge</span>
                          </Button>
                        </>
                      ) : isPrimary ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-700 dark:text-amber-400 bg-amber-500/10 border border-amber-500/25 px-2 py-1 rounded-md">
                          <Crown className="h-3 w-3" />
                          Root Protected
                        </span>
                      ) : (
                        <div className="flex items-center gap-1.5">
                          <Button
                            variant="outline"
                            size="xs"
                            onClick={() => {
                              setPasswordUser(u);
                              setShowPasswordModal(true);
                            }}
                            className="gap-1 text-xs px-2 h-7 cursor-pointer"
                            title="Update password"
                          >
                            <Key className="h-3 w-3" />
                            <span>Reset</span>
                          </Button>
                          <span className="text-[10px] font-mono text-muted-foreground/80 italic px-1.5 py-0.5 rounded bg-muted/40 border border-border/60">
                            Sub-Admin
                          </span>
                        </div>
                      )}
                    </div>
                  );
                },
              },
            ]}
          />
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* ── TAB 2: PLATFORM ADMIN ROLES (RBAC) ───────────────────────────── */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {activeTab === "roles" && (
        <div className="space-y-4">
          <div className="rounded-xl border border-border/80 bg-muted/20 p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-0.5">
              <h2 className="text-sm font-bold text-foreground flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4 text-primary" />
                Administrative Scope Templates
              </h2>
              <p className="text-xs text-muted-foreground">
                Secondary platform administrators inherit predefined or custom scopes. The Primary Superadmin retains root authority over all operations.
              </p>
            </div>
            <Button
              onClick={openCreateRole}
              size="sm"
              className="gap-1.5 text-xs font-semibold shrink-0 cursor-pointer shadow-2xs"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Create Custom Role</span>
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {platformRoles.map((role: any) => {
              const isSuperRole = role.name === "Super Administrator";
              const isSystem = role.isSystem;
              const moduleCount = role.permissions?.length || 0;
              return (
                <div
                  key={role._id}
                  className="rounded-xl border border-border/80 bg-card p-4 shadow-2xs flex flex-col justify-between hover:border-border transition-all"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h3 className="font-bold text-sm text-foreground">{role.name}</h3>
                          {isSystem ? (
                            <span className="inline-flex items-center rounded-md bg-blue-500/10 px-1.5 py-0.2 text-[9px] font-bold text-blue-600 dark:text-blue-400 border border-blue-500/20">
                              System Preset
                            </span>
                          ) : (
                            <span className="inline-flex items-center rounded-md bg-emerald-500/10 px-1.5 py-0.2 text-[9px] font-bold text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                              Custom Role
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                          {role.description || "Administrative role template."}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-1 border-t border-border/50 text-xs">
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Users className="h-3.5 w-3.5 text-muted-foreground/70" />
                        <span className="font-semibold text-foreground">{role.userCount || 0}</span>
                        <span>Assigned</span>
                      </div>
                      <span className="text-muted-foreground/40">•</span>
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <SlidersHorizontal className="h-3.5 w-3.5 text-muted-foreground/70" />
                        <span className="font-semibold text-foreground">{moduleCount}</span>
                        <span>Scopes</span>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                        Assigned Scopes:
                      </p>
                      <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto pr-1">
                        {role.permissions?.map((p: any) => (
                          <span
                            key={p.module}
                            className="inline-flex items-center rounded px-2 py-0.5 text-[10px] font-medium bg-muted/70 text-foreground border border-border/70 capitalize"
                          >
                            {p.module}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-3 mt-3 border-t border-border/60">
                    {!isSystem ? (
                      <>
                        <Button
                          variant="outline"
                          size="xs"
                          onClick={() => openEditRole(role)}
                          className="h-7 text-xs gap-1 cursor-pointer"
                        >
                          <Pencil className="h-3 w-3" />
                          <span>Edit</span>
                        </Button>
                        <Button
                          variant="ghost"
                          size="xs"
                          onClick={() => setDeletingRole(role)}
                          className="h-7 text-xs gap-1 text-destructive hover:bg-destructive/10 cursor-pointer"
                        >
                          <Trash2 className="h-3 w-3" />
                          <span>Delete</span>
                        </Button>
                      </>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground font-mono">
                        <Lock className="h-3 w-3" />
                        Immutable Template
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── MODAL: CREATE SYSTEM ADMIN ──────────────────────────────────── */}
      {showModal && (
        <Modal
          open={showModal}
          onClose={() => setShowModal(false)}
          title="Create System Administrator"
          size="md"
        >
          <form onSubmit={handleSubmitAdmin} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">Full Name *</label>
                <Input
                  required
                  placeholder="e.g. John Doe"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">Email Address *</label>
                <Input
                  required
                  type="email"
                  placeholder="admin@minihisab.com"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">Phone Number</label>
                <Input
                  placeholder="+91 98765 43210"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">Master Password *</label>
                <div className="relative">
                  <Input
                    required
                    type={showAdminPassword ? "text" : "password"}
                    placeholder="Secure password"
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    className="pr-9"
                  />
                  <button
                    type="button"
                    onClick={() => setShowAdminPassword((prev) => !prev)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1 cursor-pointer focus:outline-hidden"
                    tabIndex={-1}
                    aria-label={showAdminPassword ? "Hide password" : "Show password"}
                  >
                    {showAdminPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            </div>

            {/* Role Preset Selector */}
            <div className="space-y-1.5 border-t border-border pt-3">
              <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Administrative Role Preset (Template)
              </label>
              <Select
                value={form.roleId}
                onValueChange={(val) => handleSelectRolePreset(val)}
                options={roleSelectOptions}
                placeholder="Custom Scopes (No Preset Template)"
                className="w-full"
                triggerClassName="w-full text-xs"
                size="sm"
              />
              <p className="text-[11px] text-muted-foreground">
                Selecting a role preset automatically selects its associated scopes below.
              </p>
            </div>

            <div className="space-y-2 border-t border-border pt-3">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Individual Module Permissions
                </label>
                <span className="text-[10px] text-muted-foreground font-mono">
                  {form.allowedModules.length} of {SYSTEM_MODULES.length} enabled
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground">
                Leave all unchecked for unrestricted Superadmin privileges, or check specific modules to restrict access.
              </p>
              <div className="flex flex-wrap gap-2 pt-1 max-h-40 overflow-y-auto">
                {SYSTEM_MODULES.map((mod) => {
                  const isChecked = form.allowedModules.includes(mod.key);
                  return (
                    <Badge
                      key={mod.key}
                      variant={isChecked ? "default" : "soft"}
                      className="cursor-pointer text-xs px-2.5 py-1 transition-all hover:scale-105"
                      onClick={() => toggleModule(mod.key)}
                    >
                      {isChecked && <Check className="h-3 w-3 mr-1 inline" />}
                      {mod.label}
                    </Badge>
                  );
                })}
              </div>
            </div>

            <div className="flex gap-3 pt-3 border-t border-border">
              <Button
                variant="outline"
                type="button"
                className="flex-1 cursor-pointer"
                onClick={() => setShowModal(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="flex-1 cursor-pointer font-semibold"
                disabled={createMutation.isPending}
              >
                {createMutation.isPending ? "Creating Admin..." : "Create Administrator"}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* ── MODAL: CREATE / EDIT PLATFORM ROLE ───────────────────────────── */}
      {showRoleModal && (
        <Modal
          open={showRoleModal}
          onClose={() => setShowRoleModal(false)}
          title={editingRoleId ? "Edit Admin Role" : "Create Platform Admin Role"}
          size="md"
        >
          <form onSubmit={handleSaveRole} className="space-y-4">
            <div>
              <label className="mb-1 block text-xs font-medium text-foreground">Role Name *</label>
              <Input
                required
                placeholder="e.g. Operations & Support Lead, Junior Auditor"
                value={roleForm.name}
                onChange={(e) => setRoleForm({ ...roleForm, name: e.target.value })}
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-foreground">Role Description</label>
              <Input
                placeholder="Brief summary of duties and permitted administrative operations"
                value={roleForm.description}
                onChange={(e) => setRoleForm({ ...roleForm, description: e.target.value })}
              />
            </div>

            <div className="space-y-2 border-t border-border pt-3">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Permitted Modules & Scopes *
                </label>
                <span className="text-[10px] text-muted-foreground font-mono">
                  {roleForm.allowedModules.length} selected
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground">
                Select which platform modules administrators assigned to this role will be able to access.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 max-h-56 overflow-y-auto">
                {SYSTEM_MODULES.map((mod) => {
                  const isChecked = roleForm.allowedModules.includes(mod.key);
                  return (
                    <div
                      key={mod.key}
                      onClick={() => toggleRoleModule(mod.key)}
                      className={`flex items-start gap-2 p-2.5 rounded-lg border cursor-pointer transition-all ${
                        isChecked
                          ? "bg-primary/10 border-primary/40 text-foreground"
                          : "bg-muted/20 border-border/70 text-muted-foreground hover:bg-muted/50"
                      }`}
                    >
                      <div
                        className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors ${
                          isChecked
                            ? "bg-primary border-primary text-primary-foreground"
                            : "border-border bg-background"
                        }`}
                      >
                        {isChecked && <Check className="h-3 w-3" />}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-foreground leading-tight">{mod.label}</p>
                        <p className="text-[10px] text-muted-foreground mt-0.5 leading-tight">{mod.desc}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex gap-3 pt-3 border-t border-border">
              <Button
                variant="outline"
                type="button"
                className="flex-1 cursor-pointer"
                onClick={() => setShowRoleModal(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="flex-1 cursor-pointer font-semibold"
                disabled={saveRoleMutation.isPending}
              >
                {saveRoleMutation.isPending
                  ? "Saving Role..."
                  : editingRoleId
                  ? "Save Changes"
                  : "Create Platform Role"}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* ── MODAL: CONFIRM DELETE PLATFORM ROLE ──────────────────────────── */}
      {deletingRole && (
        <Modal
          open={Boolean(deletingRole)}
          onClose={() => setDeletingRole(null)}
          title="Delete Platform Admin Role"
          size="sm"
        >
          <div className="space-y-4">
            <p className="text-xs text-muted-foreground">
              Are you sure you want to delete the custom role <strong>{deletingRole.name}</strong>?
            </p>
            {deletingRole.userCount > 0 && (
              <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-xs">
                Warning: {deletingRole.userCount} administrator(s) are currently assigned to this role. Please reassign them before deletion.
              </div>
            )}
            <div className="flex gap-3 pt-2">
              <Button
                variant="outline"
                className="flex-1 cursor-pointer"
                onClick={() => setDeletingRole(null)}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                className="flex-1 cursor-pointer font-semibold"
                disabled={deleteRoleMutation.isPending || deletingRole.userCount > 0}
                onClick={() => deleteRoleMutation.mutate(deletingRole._id)}
              >
                {deleteRoleMutation.isPending ? "Deleting..." : "Delete Role"}
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* ── MODAL: CASCADE PURGE TEST DATA ──────────────────────────────── */}
      {showPurgeModal && (
        <Modal
          open={showPurgeModal}
          onClose={() => {
            setShowPurgeModal(false);
            setPurgeResult(null);
          }}
          title="Cascade Purge User & Test Data"
          size="md"
        >
          {purgeResult ? (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-950 dark:text-emerald-200 flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400 mt-0.5 shrink-0" />
                <div>
                  <p className="font-semibold text-sm">Purge Operation Successful</p>
                  <p className="text-xs mt-0.5">
                    User <strong>{purgeResult.purgedUser?.name}</strong> ({purgeResult.purgedUser?.email}) and all dependent collections were permanently removed.
                  </p>
                  <p className="text-xs font-mono font-medium mt-1">
                    Total documents deleted: {purgeResult.totalDocumentsDeleted}
                  </p>
                </div>
              </div>

              {purgeResult.deletedCounts && (
                <div className="rounded-xl border border-border p-3 bg-muted/30 max-h-56 overflow-y-auto space-y-1.5 text-xs">
                  <p className="font-semibold text-foreground mb-2">Deleted Collections Breakdown:</p>
                  {Object.entries(purgeResult.deletedCounts)
                    .filter(([_, count]: any) => count > 0)
                    .map(([coll, count]: any) => (
                      <div
                        key={coll}
                        className="flex justify-between py-1 border-b border-border/50 last:border-0 font-mono"
                      >
                        <span className="capitalize text-muted-foreground">{coll}:</span>
                        <span className="font-bold text-destructive">{count}</span>
                      </div>
                    ))}
                  </div>
              )}

              <div className="pt-2">
                <Button
                  className="w-full cursor-pointer"
                  onClick={() => {
                    setShowPurgeModal(false);
                    setPurgeResult(null);
                  }}
                >
                  Close
                </Button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleConfirmPurge} className="space-y-4">
              <div className="p-3.5 rounded-xl bg-destructive/10 border border-destructive/25 text-destructive flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-destructive mt-0.5 shrink-0" />
                <div className="text-xs leading-relaxed">
                  <p className="font-bold">Irreversible Cascade Deletion</p>
                  <p className="mt-1">
                    This testing utility permanently deletes this user and all associated records across every database collection:
                  </p>
                  <ul className="list-disc list-inside mt-1.5 space-y-0.5 text-[11px] font-mono">
                    <li>Business & Outlet documents</li>
                    <li>Products, Categories, Brands & Stock Entries</li>
                    <li>Orders, Invoices, Customers & Expenses</li>
                    <li>Roles, Units, Staff Users, Invites & Subscriptions</li>
                    <li>Sessions, OTPs, Notifications & Audit Logs</li>
                  </ul>
                </div>
              </div>

              {purgeTarget ? (
                <div className="p-3 rounded-xl border border-border bg-muted/30 space-y-1 text-xs">
                  <p className="text-muted-foreground font-medium">Selected User Target:</p>
                  <p className="font-semibold text-sm text-foreground">{purgeTarget.name}</p>
                  <p className="font-mono text-muted-foreground">{purgeTarget.email || "No email"}</p>
                  <p className="font-mono text-[11px] text-muted-foreground">ID: {purgeTarget._id}</p>
                  <p className="text-[11px]">
                    Role: <span className="font-semibold capitalize">{purgeTarget.role}</span>
                  </p>
                </div>
              ) : (
                <div>
                  <label className="mb-1 block text-xs font-medium text-foreground">
                    Target User ID (ObjectId) *
                  </label>
                  <Input
                    required
                    placeholder="e.g. 64b8f0123456789abcdef012"
                    value={manualUserId}
                    onChange={(e) => setManualUserId(e.target.value)}
                    className="font-mono text-xs"
                  />
                  <p className="text-[10px] text-muted-foreground mt-1">
                    Paste the MongoDB _id of the test user you wish to completely wipe along with their store data.
                  </p>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <Button
                  variant="outline"
                  type="button"
                  className="flex-1 cursor-pointer"
                  onClick={() => setShowPurgeModal(false)}
                  disabled={purgeMutation.isPending}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="flex-1 bg-destructive hover:bg-destructive/90 text-white gap-2 font-semibold cursor-pointer"
                  disabled={purgeMutation.isPending}
                >
                  <Flame className="h-4 w-4" />
                  {purgeMutation.isPending ? "Purging Records..." : "Confirm & Delete Everything"}
                </Button>
              </div>
            </form>
          )}
        </Modal>
      )}

      {/* ── DIALOG: CHANGE USER PASSWORD ─────────────────────────────────── */}
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
