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
  { key: "dashboard", label: "Dashboard" },
  { key: "businesses", label: "Businesses" },
  { key: "subscriptions", label: "Subscriptions" },
  { key: "users", label: "User Registry" },
  { key: "settings", label: "Settings" },
  { key: "audit_logs", label: "Audit Trails" },
  { key: "blogs", label: "Blog CMS" },
];

export default function AdminUsersPage() {
  const { token, user: currentUser } = useAuth();
  const qc = useQueryClient();
  const [search, setSearch] = useQueryState("search", parseAsString.withDefault(""));
  const [roleFilter, setRoleFilter] = React.useState<string>("all");
  const [copiedId, setCopiedId] = React.useState<string | null>(null);

  const [showModal, setShowModal] = React.useState(false);

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
    allowedModules: [] as string[],
  });

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["admin-users", search],
    queryFn: () => userService.getUsers(token, { search: search || undefined }),
    enabled: Boolean(token),
  });

  const createMutation = useMutation({
    mutationFn: (body: any) => adminService.createSystemAdmin(body, token),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-users"] });
      setShowModal(false);
      setForm({ name: "", email: "", phone: "", password: "", allowedModules: [] });
      toast.success("System Admin created successfully!");
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const customPermissions = form.allowedModules.map((mod) => ({
      module: mod,
      actions:
        mod === "blogs"
          ? ["read", "create", "update", "delete", "publish"]
          : ["read", "create", "update", "delete"],
    }));
    createMutation.mutate({
      name: form.name,
      email: form.email,
      phone: form.phone,
      password: form.password,
      customPermissions,
    });
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

  const allUsers = data?.users ?? [];

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
      {/* ── COMPACT SECTION HEADER & LIVE METRIC STRIP ───────────────────── */}
      <div className="flex flex-col gap-3 rounded-xl border border-border/80 bg-card p-3 sm:p-3.5 shadow-2xs">
        <div className="flex flex-col gap-2.5 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-base sm:text-lg font-bold tracking-tight text-foreground sm:text-xl">
                Users & Access Registry
              </h1>
              <span className="inline-flex items-center rounded-md bg-primary/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary border border-primary/20 shrink-0">
                Accounts
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5 hidden sm:block">
              Platform-wide user directory, role permissions, system administrators, and testing account lifecycle.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              className="h-7 sm:h-8 gap-1 px-2 sm:px-2.5 text-xs cursor-pointer shadow-2xs hover:bg-accent shrink-0"
            >
              <RefreshCw className={`h-3 w-3 ${isLoading ? "animate-spin text-primary" : "text-muted-foreground"}`} />
              <span className="hidden sm:inline">Refresh</span>
            </Button>

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
          </div>
        </div>

        {/* ── COMPACT METRIC FILTER CHIPS (SLIM, ONLY 34px TALL) ─────────── */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar scroll-smooth border-t border-border/60 pt-2.5 -mx-3 px-3 sm:mx-0 sm:px-0 sm:flex-wrap">
          {/* Chip 1: All Users */}
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

          {/* Chip 2: Superadmins */}
          <button
            type="button"
            onClick={() => setRoleFilter("superadmin")}
            className={`inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs transition-all cursor-pointer shrink-0 ${
              roleFilter === "superadmin"
                ? "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/30 font-semibold shadow-2xs ring-1 ring-purple-500/20"
                : "bg-muted/30 border-border/80 text-muted-foreground hover:text-foreground hover:bg-muted/60"
            }`}
          >
            <ShieldCheck className="h-3.5 w-3.5 text-purple-500" />
            <span>Superadmins</span>
            <span className="rounded-md bg-purple-500/15 px-1.5 py-0.2 text-[10px] font-mono font-bold text-purple-600 dark:text-purple-400">
              {superadminCount}
            </span>
          </button>

          {/* Chip 3: Store Owners */}
          <button
            type="button"
            onClick={() => setRoleFilter("owner")}
            className={`inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs transition-all cursor-pointer shrink-0 ${
              roleFilter === "owner"
                ? "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30 font-semibold shadow-2xs ring-1 ring-blue-500/20"
                : "bg-muted/30 border-border/80 text-muted-foreground hover:text-foreground hover:bg-muted/60"
            }`}
          >
            <Building2 className="h-3.5 w-3.5 text-blue-500" />
            <span>Store Owners</span>
            <span className="rounded-md bg-blue-500/15 px-1.5 py-0.2 text-[10px] font-mono font-bold text-blue-600 dark:text-blue-400">
              {ownerCount}
            </span>
          </button>

          {/* Chip 4: Staff & Managers */}
          <button
            type="button"
            onClick={() => setRoleFilter("staff")}
            className={`inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs transition-all cursor-pointer shrink-0 ${
              roleFilter === "staff"
                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 font-semibold shadow-2xs ring-1 ring-emerald-500/20"
                : "bg-muted/30 border-border/80 text-muted-foreground hover:text-foreground hover:bg-muted/60"
            }`}
          >
            <UserCheck className="h-3.5 w-3.5 text-emerald-500" />
            <span>Managers & Staff</span>
            <span className="rounded-md bg-emerald-500/15 px-1.5 py-0.2 text-[10px] font-mono font-bold text-emerald-600 dark:text-emerald-400">
              {staffCount}
            </span>
          </button>
        </div>
      </div>

      {/* ── MAIN DATA TABLE ──────────────────────────────────────────────── */}
      <DataTable
        isLoading={isLoading}
        data={filteredUsers}
        keyExtractor={(u: any) => u._id}
        searchQuery={search}
        onSearchChange={setSearch}
        onRefetch={() => refetch()}
        placeholderText="Search users..."
        emptyStateText="No registered users found matching the filter."
        columns={[
          {
            key: "name",
            header: "User Profile",
            render: (u: any) => {
              const initial = u.name ? u.name.charAt(0).toUpperCase() : "U";
              const isSuper = u.role === "superadmin";
              return (
                <div className="flex items-center gap-3 py-1">
                  <div
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl font-bold text-sm shadow-2xs ${
                      isSuper
                        ? "bg-purple-500/15 text-purple-600 dark:text-purple-400 ring-1 ring-purple-500/30"
                        : "bg-primary/10 text-primary ring-1 ring-primary/20"
                    }`}
                  >
                    {isSuper ? <Shield className="h-4.5 w-4.5" /> : initial}
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-sm text-foreground truncate max-w-[200px]">{u.name}</p>
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
            header: "Platform Role",
            render: (u: any) => {
              const isSuper = u.role === "superadmin";
              const isOwner = u.role === "owner";
              const hasCustom = Boolean(u.roleId?.name);
              return (
                <div className="flex flex-col gap-1 items-start py-1">
                  <Badge
                    variant={isSuper ? "default" : isOwner ? "soft" : "outline"}
                    className="capitalize text-[11px] font-semibold"
                  >
                    {u.role}
                  </Badge>
                  {hasCustom && (
                    <span className="text-[10px] text-muted-foreground font-mono">
                      Role: {u.roleId.name}
                    </span>
                  )}
                  {isSuper && u.customPermissions?.length > 0 && (
                    <span className="text-[10px] text-amber-600 dark:text-amber-400 font-medium">
                      Scoped Permissions
                    </span>
                  )}
                </div>
              );
            },
          },
          {
            key: "business",
            header: "Business Association",
            render: (u: any) => {
              if (u.role === "superadmin") {
                return (
                  <div className="flex items-center gap-1.5 py-1 text-xs text-purple-600 dark:text-purple-400 font-medium">
                    <ShieldCheck className="h-3.5 w-3.5 shrink-0" />
                    <span>System Root</span>
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
            header: "Status",
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
            header: "Administration",
            render: (u: any) => {
              const isSuperAdmin = u.role === "superadmin";
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
                  ) : (
                    <span className="text-[10px] font-mono text-muted-foreground/80 italic px-2 py-1 rounded bg-muted/30 border border-border/60">
                      System Protected
                    </span>
                  )}
                </div>
              );
            },
          },
        ]}
      />

      {/* ── MODAL: CREATE SYSTEM ADMIN ──────────────────────────────────── */}
      {showModal && (
        <Modal
          open={showModal}
          onClose={() => setShowModal(false)}
          title="Create System Administrator"
          size="md"
        >
          <form onSubmit={handleSubmit} className="space-y-4">
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
                <label className="mb-1 block text-xs font-medium text-muted-foreground">Password *</label>
                <Input
                  required
                  type="password"
                  placeholder="Secure master password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2 border-t border-border pt-3">
              <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Administrative Access Scopes (RBAC)
              </label>
              <p className="text-[11px] text-muted-foreground">
                Select which platform modules this administrator can access. Leave all unchecked for unrestricted Superadmin privileges.
              </p>
              <div className="flex flex-wrap gap-2 pt-1">
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
