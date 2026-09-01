"use client";

import * as React from "react";
import dynamic from "next/dynamic";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/components/auth/auth-provider";
import { userService } from "@/services/user.service";
import { adminService } from "@/services/admin.service";
import { useQueryState, parseAsString } from "nuqs";
import { Plus, Trash2, AlertTriangle, CheckCircle2, Flame, Key } from "lucide-react";
import { toast } from "react-hot-toast";
import { getErrorMessage } from "@/lib/error";

const Modal = dynamic(() => import("@/components/ui/modal").then(m => ({ default: m.Modal })), { ssr: false });
import { ChangePasswordDialog } from "@/components/users/change-password-dialog";

export default function AdminUsersPage() {
  const { token, user: currentUser } = useAuth();
  const qc = useQueryClient();
  const [search, setSearch] = useQueryState("search", parseAsString.withDefault(""));
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
    allowedModules: [] as string[]
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
    onError: (err) => toast.error(getErrorMessage(err))
  });

  const purgeMutation = useMutation({
    mutationFn: (targetId: string) => adminService.purgeUserTestData(targetId, token),
    onSuccess: (res: any) => {
      qc.invalidateQueries({ queryKey: ["admin-users"] });
      qc.invalidateQueries({ queryKey: ["admin-stats"] });
      qc.invalidateQueries({ queryKey: ["admin-businesses"] });
      qc.invalidateQueries({ queryKey: ["admin-outlets"] });
      setPurgeResult(res?.data || res);
      toast.success(res?.message || "User and associated data purged successfully!");
    },
    onError: (err) => toast.error(getErrorMessage(err))
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const customPermissions = form.allowedModules.map(mod => ({
      module: mod,
      actions: mod === "blogs" ? ["read", "create", "update", "delete", "publish"] : ["read", "create", "update", "delete"]
    }));
    createMutation.mutate({
      name: form.name,
      email: form.email,
      phone: form.phone,
      password: form.password,
      customPermissions
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
    setForm(prev => ({
      ...prev,
      allowedModules: prev.allowedModules.includes(mod)
        ? prev.allowedModules.filter(m => m !== mod)
        : [...prev.allowedModules, mod]
    }));
  };

  const handleChangePassword = async (userId: string, newPassword: string) => {
    await adminService.changeUserPassword(userId, newPassword, token);
  };

  const allUsers = data?.users ?? [];
  const SYSTEM_MODULES = ["dashboard", "businesses", "subscriptions", "users", "settings", "audit_logs", "blogs"];

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Platform Users</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage all users, system administrators, and test accounts.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            onClick={() => handleOpenPurge()} 
            variant="outline" 
            className="border-red-500/40 text-red-600 hover:bg-red-50 hover:border-red-500 dark:hover:bg-red-950/30 gap-2"
          >
            <Flame className="h-4 w-4" /> Purge Test Data
          </Button>
          <Button onClick={() => setShowModal(true)} className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2">
            <Plus className="h-4 w-4" /> Add System Admin
          </Button>
        </div>
      </div>

      <DataTable
        isLoading={isLoading}
        data={allUsers}
        keyExtractor={(u) => u._id}
        searchQuery={search}
        onSearchChange={setSearch}
        onRefetch={() => refetch()}
        placeholderText="Search system users..."
        emptyStateText="No system users matching search."
        columns={[
          {
            key: "name", header: "User Profile",
            render: (u) => (
              <div>
                <p className="font-semibold text-sm">{u.name}</p>
                <p className="text-xs text-muted font-mono">{u.email || "No email"}</p>
                <p className="text-[10px] text-muted font-mono">{u.phone || "No phone"}</p>
                <p className="text-[10px] text-gray-400 font-mono select-all">ID: {u._id}</p>
              </div>
            )
          },
          {
            key: "role", header: "Platform Role",
            render: (u) => (
              <div className="flex flex-col gap-1 items-start">
                <Badge variant={u.role === "superadmin" ? "danger" : u.role === "owner" ? "default" : "soft"} className="capitalize">
                  {u.role}
                </Badge>
                {u.roleId?.name && (
                  <span className="text-[10px] text-muted">Custom Role: {u.roleId.name}</span>
                )}
                {u.role === "superadmin" && u.customPermissions?.length > 0 && (
                  <span className="text-[10px] text-muted-foreground">Restricted Access</span>
                )}
              </div>
            )
          },
          {
            key: "business", header: "Business association",
            render: (u) => (
              <span className="text-xs text-muted">{u.businessId?.name || "System Administrator"}</span>
            )
          },
          {
            key: "isActive", header: "Status",
            render: (u) => (
              <Badge variant={u.isActive ? "soft" : "danger"}>
                {u.isActive ? "Active" : "Suspended"}
              </Badge>
            )
          },
          {
            key: "actions", header: "Actions",
            render: (u) => {
              const isSuperAdmin = u.role === "superadmin";
              return (
                <div className="flex items-center gap-2">
                  {!isSuperAdmin ? (
                    <>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => { setPasswordUser(u); setShowPasswordModal(true); }}
                        className="text-blue-500 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-950/30 gap-1 text-xs px-2.5 h-8"
                        title="Change user password"
                      >
                        <Key className="h-3.5 w-3.5" /> Password
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleOpenPurge(u)}
                        className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30 gap-1 text-xs px-2.5 h-8"
                        title="Cascade delete all user, business, and store data"
                      >
                        <Trash2 className="h-3.5 w-3.5" /> Purge Data
                      </Button>
                    </>
                  ) : (
                    <span className="text-[10px] text-muted-foreground italic px-2">Protected</span>
                  )}
                </div>
              );
            }
          }
        ]}
      />

      {/* CREATE ADMIN MODAL */}
      {showModal && (
        <Modal open={showModal} onClose={() => setShowModal(false)} title="Create System Admin" size="md">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">Full Name *</label>
                <Input required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">Email Address *</label>
                <Input required type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">Phone Number</label>
                <Input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">Password *</label>
                <Input required type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-xs font-medium text-muted-foreground">System Access Areas (RBAC)</label>
              <p className="text-[10px] text-muted-foreground mb-3">
                Select which modules this admin can access. Leave all unchecked to grant full unrestricted Superadmin access (Not recommended for regular staff).
              </p>
              <div className="flex flex-wrap gap-2">
                {SYSTEM_MODULES.map(mod => (
                  <Badge 
                    key={mod}
                    variant={form.allowedModules.includes(mod) ? "default" : "soft"}
                    className="cursor-pointer capitalize text-xs px-3 py-1"
                    onClick={() => toggleModule(mod)}
                  >
                    {mod.replace('_', ' ')}
                  </Badge>
                ))}
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button variant="outline" type="button" className="flex-1" onClick={() => setShowModal(false)}>Cancel</Button>
              <Button type="submit" className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white" disabled={createMutation.isPending}>
                {createMutation.isPending ? "Creating..." : "Create Admin"}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* CASCADE PURGE TEST DATA MODAL */}
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
              <div className="p-4 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-500/20 text-emerald-900 dark:text-emerald-300 flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-emerald-600 mt-0.5 shrink-0" />
                <div>
                  <p className="font-semibold text-sm">Purge Complete!</p>
                  <p className="text-xs mt-0.5">
                    User <strong>{purgeResult.purgedUser?.name}</strong> ({purgeResult.purgedUser?.email}) and all related data was permanently removed.
                  </p>
                  <p className="text-xs font-mono font-medium mt-1">
                    Total documents deleted: {purgeResult.totalDocumentsDeleted}
                  </p>
                </div>
              </div>

              {purgeResult.deletedCounts && (
                <div className="rounded-md border p-3 bg-muted/40 max-h-56 overflow-y-auto space-y-1.5 text-xs">
                  <p className="font-semibold text-foreground mb-2">Deleted Collections Breakdown:</p>
                  {Object.entries(purgeResult.deletedCounts)
                    .filter(([_, count]: any) => count > 0)
                    .map(([coll, count]: any) => (
                      <div key={coll} className="flex justify-between py-0.5 border-b border-muted last:border-0 font-mono">
                        <span className="capitalize text-muted-foreground">{coll}:</span>
                        <span className="font-bold text-red-600">{count}</span>
                      </div>
                    ))}
                </div>
              )}

              <div className="pt-2">
                <Button 
                  className="w-full" 
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
              <div className="p-3.5 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-500/30 text-red-900 dark:text-red-300 flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5 shrink-0" />
                <div className="text-xs leading-relaxed">
                  <p className="font-bold text-red-700 dark:text-red-400">DANGER: Irreversible Cascade Deletion</p>
                  <p className="mt-1">
                    This testing tool permanently removes this user and <strong>ALL associated records across all database collections</strong>:
                  </p>
                  <ul className="list-disc list-inside mt-1 space-y-0.5 text-[11px] text-red-800 dark:text-red-300/90 font-mono">
                    <li>Business & Outlet documents</li>
                    <li>Products, Categories, Brands & Stock Entries</li>
                    <li>Orders, Invoices, Customers & Expenses</li>
                    <li>Roles, Units, Staff Users, Invites & Subscriptions</li>
                    <li>Sessions, OTPs, Notifications & Audit Logs</li>
                  </ul>
                </div>
              </div>

              {purgeTarget ? (
                <div className="p-3 rounded-lg border bg-muted/40 space-y-1 text-xs">
                  <p className="text-muted-foreground font-medium">Selected User to Purge:</p>
                  <p className="font-semibold text-sm text-foreground">{purgeTarget.name}</p>
                  <p className="font-mono text-muted-foreground">{purgeTarget.email || "No email"}</p>
                  <p className="font-mono text-[11px] text-muted">ID: {purgeTarget._id}</p>
                  <p className="text-[11px]">Role: <span className="font-semibold capitalize">{purgeTarget.role}</span></p>
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
                    onChange={e => setManualUserId(e.target.value)} 
                    className="font-mono text-xs"
                  />
                  <p className="text-[10px] text-muted-foreground mt-1">
                    Paste the MongoDB _id of the user you wish to completely wipe along with their store data.
                  </p>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <Button 
                  variant="outline" 
                  type="button" 
                  className="flex-1" 
                  onClick={() => setShowPurgeModal(false)}
                  disabled={purgeMutation.isPending}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white gap-2 font-semibold" 
                  disabled={purgeMutation.isPending}
                >
                  <Flame className="h-4 w-4" />
                  {purgeMutation.isPending ? "Purging All Data..." : "Confirm & Delete Everything"}
                </Button>
              </div>
            </form>
          )}
        </Modal>
      )}

      {passwordUser && (
        <ChangePasswordDialog
          isOpen={showPasswordModal}
          onClose={() => { setShowPasswordModal(false); setPasswordUser(null); }}
          userId={passwordUser._id}
          userName={passwordUser.name}
          onChangePassword={handleChangePassword}
        />
      )}
    </div>
  );
}
