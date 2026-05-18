"use client";

import * as React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import {
  ShieldAlert, Users, Store, ToggleLeft, ToggleRight, Sparkles,
  Search, ShieldAlertIcon, RefreshCw, LogIn, Edit3, Eye
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { Select } from "@/components/ui/select";
import { DataTable } from "@/components/ui/data-table";
import { StatsCard } from "@/components/ui/stats-card";
import { useAuth } from "@/components/auth/auth-provider";
import { getJson, apiFetch } from "@/lib/api-client";
import { formatNumber, formatDate } from "@/lib/format";
import type { Business, StaffUser } from "@/lib/types";

const PLAN_OPTIONS = [
  { value: "free", label: "Free Plan" },
  { value: "starter", label: "Starter" },
  { value: "pro", label: "Pro" },
  { value: "enterprise", label: "Enterprise" }
];

export default function AdminPage() {
  const { token, login, logout, user } = useAuth();
  const qc = useQueryClient();
  const router = useRouter();

  const [search, setSearch] = React.useState("");
  const [showPlanModal, setShowPlanModal] = React.useState(false);
  const [selectedBusiness, setSelectedBusiness] = React.useState<Business | null>(null);

  // Form states
  const [planForm, setPlanForm] = React.useState({ plan: "free", maxOutlets: 1 });

  // Impersonate state
  const [showImpersonateModal, setShowImpersonateModal] = React.useState(false);
  const [impersonateTargetBusiness, setImpersonateTargetBusiness] = React.useState<Business | null>(null);
  const [userSearch, setUserSearch] = React.useState("");

  // Platform Stats Query
  const { data: statsData } = useQuery({
    queryKey: ["admin-stats"],
    queryFn: () => getJson<{ totalBusinesses: number; activeBusinesses: number; totalUsers: number }>("/admin/stats", token),
    enabled: Boolean(token && user?.role === "superadmin")
  });

  // Business List Query
  const { data: bizData, isLoading: loadingBiz } = useQuery({
    queryKey: ["admin-businesses", search],
    queryFn: () => getJson<{ businesses: (Business & { ownerId?: { name: string; phone: string; email?: string } })[] }>("/admin/businesses", token, { search: search || undefined }),
    enabled: Boolean(token && user?.role === "superadmin")
  });

  // Target business users lookup for Impersonation
  const { data: usersData, isLoading: loadingUsers } = useQuery({
    queryKey: ["admin-business-users", impersonateTargetBusiness?._id],
    queryFn: () => getJson<{ users: StaffUser[] }>("/users", token, { businessId: impersonateTargetBusiness?._id }),
    enabled: Boolean(token && impersonateTargetBusiness?._id)
  });

  // Mutations
  const toggleMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      apiFetch(`/admin/businesses/${id}/toggle`, { method: "PATCH", body: { isActive }, token }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-businesses"] }); }
  });

  const planMutation = useMutation({
    mutationFn: ({ id, body }: { id: string; body: unknown }) =>
      apiFetch(`/admin/businesses/${id}/plan`, { method: "PATCH", body, token }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-businesses"] });
      setShowPlanModal(false);
      setSelectedBusiness(null);
    }
  });

  const impersonateMutation = useMutation({
    mutationFn: (targetUserId: string) =>
      apiFetch<{ token: string; user: any }>("/admin/impersonate", { method: "POST", body: { targetUserId }, token }),
    onSuccess: (data) => {
      // Store current admin credentials in local storage to preserve state
      localStorage.setItem("original_admin_token", token || "");
      // Update session storage and app state with target user token
      localStorage.setItem("auth_token", data.token);
      localStorage.setItem("auth_user", JSON.stringify(data.user));
      // Reload page to force context reinitialization
      window.location.href = "/";
    }
  });

  if (user?.role !== "superadmin") {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
        <ShieldAlertIcon className="h-16 w-16 text-danger" />
        <h2 className="text-xl font-bold">Unauthorized Access</h2>
        <p className="text-sm text-muted">Only Super Administrators have access to this portal.</p>
        <Button onClick={() => router.push("/")}>Return to Home</Button>
      </div>
    );
  }

  const stats = statsData;
  const businesses = bizData?.businesses ?? [];
  const bizUsers = (usersData?.users ?? []).filter((u) =>
    !userSearch || u.name.toLowerCase().includes(userSearch.toLowerCase()) || u.phone.includes(userSearch)
  );

  const openPlanEdit = (biz: Business) => {
    setSelectedBusiness(biz);
    setPlanForm({ plan: biz.plan, maxOutlets: biz.settings?.defaultTaxRate ?? 1 }); // maxOutlets stored or defaults
    setShowPlanModal(true);
  };

  const handlePlanSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBusiness) return;
    planMutation.mutate({
      id: selectedBusiness._id,
      body: { plan: planForm.plan, maxOutlets: Number(planForm.maxOutlets) }
    });
  };

  const triggerImpersonate = (biz: Business) => {
    setImpersonateTargetBusiness(biz);
    setUserSearch("");
    setShowImpersonateModal(true);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Sparkles className="h-6 w-6 text-primary animate-pulse" /> Super Admin Portal
        </h1>
        <p className="text-sm text-muted">Manage businesses, customize subscription plans, and audit system activities.</p>
      </div>

      {/* Hero Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <StatsCard label="Total Registered Businesses" value={stats?.totalBusinesses || 0} icon={<Store className="h-5 w-5" />} />
        <StatsCard label="Active Businesses" value={stats?.activeBusinesses || 0} color="success" />
        <StatsCard label="Platform Total Users" value={stats?.totalUsers || 0} icon={<Users className="h-5 w-5" />} />
      </div>

      {/* Businesses Grid */}
      <div className="space-y-4">
        <div className="flex justify-between items-center gap-4 flex-wrap">
          <h3 className="font-semibold text-lg">Business Registry</h3>
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            <Input className="pl-9" placeholder="Search businesses..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
        </div>

        <DataTable
          loading={loadingBiz}
          data={businesses}
          keyExtractor={(b) => b._id}
          emptyMessage="No businesses registered on the platform."
          columns={[
            {
              key: "name", header: "Business & Owner",
              render: (b) => (
                <div>
                  <p className="font-semibold">{b.name}</p>
                  <p className="text-xs text-muted">Owner: {b.ownerId?.name || "No owner"} ({b.ownerId?.phone || "No phone"})</p>
                </div>
              )
            },
            {
              key: "plan", header: "Subscription Plan",
              render: (b) => (
                <div className="flex items-center gap-1.5">
                  <Badge variant="soft" className="capitalize">{b.plan}</Badge>
                </div>
              )
            },
            {
              key: "isActive", header: "Status",
              render: (b) => (
                <button onClick={() => toggleMutation.mutate({ id: b._id, isActive: !b.isActive })}
                  className="hover:scale-105 transition">
                  {b.isActive ? (
                    <Badge variant="soft" className="flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-green-500" /> Active</Badge>
                  ) : (
                    <Badge variant="danger" className="flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-danger" /> Suspended</Badge>
                  )}
                </button>
              )
            },
            {
              key: "actions", header: "",
              render: (b) => (
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="gap-1" onClick={() => openPlanEdit(b)}>
                    <Edit3 className="h-3.5 w-3.5" /> Plan
                  </Button>
                  <Button variant="soft" size="sm" className="gap-1" onClick={() => triggerImpersonate(b)}>
                    <LogIn className="h-3.5 w-3.5" /> Impersonate
                  </Button>
                </div>
              )
            }
          ]}
        />
      </div>

      {/* PLAN CUSTOMIZATION DIALOG */}
      <Modal open={showPlanModal} onClose={() => setShowPlanModal(false)} title="Update Subscription Plan" size="sm">
        <form onSubmit={handlePlanSubmit} className="space-y-4">
          <div>
            <p className="text-sm font-semibold">{selectedBusiness?.name}</p>
            <p className="text-xs text-muted">Customize account settings and feature levels.</p>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-muted">Plan Level *</label>
            <Select id="plan-level" value={planForm.plan} onValueChange={(v) => setPlanForm(f => ({ ...f, plan: v }))} options={PLAN_OPTIONS} />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-muted">Maximum Outlets Permitted</label>
            <Input id="max-outlets" type="number" min={1} max={100} value={planForm.maxOutlets} onChange={(e) => setPlanForm(f => ({ ...f, maxOutlets: Number(e.target.value) }))} />
          </div>
          <div className="flex gap-3 pt-2">
            <Button variant="outline" type="button" className="flex-1" onClick={() => setShowPlanModal(false)}>Cancel</Button>
            <Button type="submit" className="flex-1" disabled={planMutation.isPending}>
              {planMutation.isPending ? "Updating..." : "Save Settings"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* IMPERSONATION MODAL: SELECT USER */}
      <Modal open={showImpersonateModal} onClose={() => setShowImpersonateModal(false)} title={`Impersonate ${impersonateTargetBusiness?.name}`} size="md">
        <div className="space-y-4">
          <p className="text-xs text-muted">Select a staff member or owner to temporarily log into their portal session. Every action you perform will be logged as impersonation under your admin ID.</p>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            <Input className="pl-9" placeholder="Search by name or phone..." value={userSearch} onChange={(e) => setUserSearch(e.target.value)} />
          </div>

          <div className="max-h-60 overflow-y-auto space-y-2">
            {loadingUsers ? (
              <p className="text-xs text-muted animate-pulse">Loading business users...</p>
            ) : bizUsers.length === 0 ? (
              <p className="text-xs text-muted italic">No matching users in business.</p>
            ) : bizUsers.map((u) => (
              <div key={u._id} className="flex justify-between items-center bg-surface border border-border p-3 rounded-2xl">
                <div>
                  <p className="font-semibold text-sm">{u.name}</p>
                  <p className="text-xs text-muted capitalize">{u.role} — {u.phone}</p>
                </div>
                <Button size="sm" onClick={() => impersonateMutation.mutate(u._id)} disabled={impersonateMutation.isPending}>
                  Log In
                </Button>
              </div>
            ))}
          </div>
        </div>
      </Modal>
    </div>
  );
}
