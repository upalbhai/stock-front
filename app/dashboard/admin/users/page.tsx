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
import { Plus } from "lucide-react";
import { toast } from "react-hot-toast";
import { getErrorMessage } from "@/lib/error";

const Modal = dynamic(() => import("@/components/ui/modal").then(m => ({ default: m.Modal })), { ssr: false });

export default function AdminUsersPage() {
  const { token } = useAuth();
  const qc = useQueryClient();
  const [search, setSearch] = useQueryState("search", parseAsString.withDefault(""));
  const [showModal, setShowModal] = React.useState(false);

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const customPermissions = form.allowedModules.map(mod => ({
      module: mod,
      actions: ["read", "create", "update", "delete"]
    }));
    createMutation.mutate({
      name: form.name,
      email: form.email,
      phone: form.phone,
      password: form.password,
      customPermissions
    });
  };

  const toggleModule = (mod: string) => {
    setForm(prev => ({
      ...prev,
      allowedModules: prev.allowedModules.includes(mod)
        ? prev.allowedModules.filter(m => m !== mod)
        : [...prev.allowedModules, mod]
    }));
  };

  const allUsers = data?.users ?? [];
  const SYSTEM_MODULES = ["dashboard", "businesses", "subscriptions", "users", "settings", "audit_logs"];

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Platform Users</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage all users and system administrators.</p>
        </div>
        <Button onClick={() => setShowModal(true)} className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2">
          <Plus className="h-4 w-4" /> Add System Admin
        </Button>
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
          }
        ]}
      />

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
    </div>
  );
}
