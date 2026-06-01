"use client";

import * as React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import {
  ShieldAlert, Users, Store, ToggleLeft, ToggleRight, Sparkles,
  Search, ShieldAlertIcon, RefreshCw, LogIn, Edit3, Eye, ClipboardList, CheckCircle2, AlertTriangle, AlertCircle
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
import type { Business, StaffUser, Plan, AuditLog } from "@/lib/types";

type ActiveTab = "businesses" | "outlets" | "users" | "audit_logs";

export default function AdminPage() {
  const { token, impersonate, user } = useAuth();
  const qc = useQueryClient();
  const router = useRouter();

  const [activeTab, setActiveTab] = React.useState<ActiveTab>("businesses");
  
  // Search and filters
  const [search, setSearch] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState("");
  
  // Modals
  const [showPlanModal, setShowPlanModal] = React.useState(false);
  const [selectedBusiness, setSelectedBusiness] = React.useState<Business | null>(null);
  const [showImpersonateModal, setShowImpersonateModal] = React.useState(false);
  const [impersonateTargetBusiness, setImpersonateTargetBusiness] = React.useState<Business | null>(null);
  const [userSearch, setUserSearch] = React.useState("");
  const [impersonatingId, setImpersonatingId] = React.useState<string | null>(null);

  // Form states
  const [planForm, setPlanForm] = React.useState({ plan: "free", maxOutlets: 1, subscriptionStatus: "trial", planExpiresAt: "" });

  // Platform Stats Query
  const { data: statsData } = useQuery({
    queryKey: ["admin-stats"],
    queryFn: () => getJson<{ totalBusinesses: number; activeBusinesses: number; totalUsers: number }>("/admin/stats", token),
    enabled: Boolean(token && user?.role === "superadmin")
  });

  // Business List Query
  const { data: bizData, isLoading: loadingBiz } = useQuery({
    queryKey: ["admin-businesses", search, statusFilter],
    queryFn: () => getJson<{ businesses: (Business & { ownerId?: { name: string; phone: string; email?: string } })[] }>("/admin/businesses", token, { search: search || undefined, status: statusFilter || undefined }),
    enabled: Boolean(token && user?.role === "superadmin" && activeTab === "businesses")
  });

  // Outlets List Query
  const { data: outletsData, isLoading: loadingOutlets } = useQuery({
    queryKey: ["admin-outlets", search, statusFilter],
    queryFn: () => getJson<{ outlets: any[] }>("/admin/outlets", token, { search: search || undefined, status: statusFilter || undefined }),
    enabled: Boolean(token && user?.role === "superadmin" && activeTab === "outlets")
  });

  // All Users List Query
  const { data: allUsersData, isLoading: loadingAllUsers } = useQuery({
    queryKey: ["admin-all-users", search],
    queryFn: () => getJson<{ users: any[] }>("/users", token, { search: search || undefined }),
    enabled: Boolean(token && user?.role === "superadmin" && activeTab === "users")
  });

  // Audit Logs Query
  const { data: auditData, isLoading: loadingAudit } = useQuery({
    queryKey: ["admin-audit-logs"],
    queryFn: () => getJson<{ logs: AuditLog[]; total: number }>("/audit-logs", token),
    enabled: Boolean(token && user?.role === "superadmin" && activeTab === "audit_logs")
  });

  // Plans Query
  const { data: plansData } = useQuery({
    queryKey: ["admin-plans"],
    queryFn: () => getJson<{ plans: Plan[] }>("/plans/all", token),
    enabled: Boolean(token && user?.role === "superadmin" && activeTab === "businesses")
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

  const approveBizMutation = useMutation({
    mutationFn: (id: string) =>
      apiFetch(`/admin/businesses/${id}/approve`, { method: "PATCH", token }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-businesses"] }); }
  });

  const setBizStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      apiFetch(`/admin/businesses/${id}/status`, { method: "PATCH", body: { status }, token }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-businesses"] }); }
  });

  const approveOutletMutation = useMutation({
    mutationFn: (id: string) =>
      apiFetch(`/admin/outlets/${id}/approve`, { method: "PATCH", token }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-outlets"] }); }
  });

  const setOutletStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      apiFetch(`/admin/outlets/${id}/status`, { method: "PATCH", body: { status }, token }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-outlets"] }); }
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
  const outlets = outletsData?.outlets ?? [];
  const allUsers = allUsersData?.users ?? [];
  const auditLogs = auditData?.logs ?? [];

  const bizUsers = (usersData?.users ?? []).filter((u) =>
    !userSearch || u.name.toLowerCase().includes(userSearch.toLowerCase()) || u.phone.includes(userSearch)
  );

  const plans = plansData?.plans || [];
  const PLAN_OPTIONS = plans.map(p => ({ value: p._id, label: p.name }));

  const openPlanEdit = (biz: Business) => {
    setSelectedBusiness(biz);
    setPlanForm({ 
      plan: (biz.planId as any)?._id || biz.planId || biz.plan || "", 
      maxOutlets: biz.maxOutlets || 1,
      subscriptionStatus: biz.subscriptionStatus || "trial",
      planExpiresAt: biz.currentPeriodEnd ? new Date(biz.currentPeriodEnd).toISOString().split('T')[0] : ""
    });
    setShowPlanModal(true);
  };

  const handlePlanSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBusiness) return;
    planMutation.mutate({
      id: selectedBusiness._id,
      body: { 
        planId: planForm.plan, 
        maxOutlets: Number(planForm.maxOutlets),
        subscriptionStatus: planForm.subscriptionStatus,
        currentPeriodEnd: planForm.planExpiresAt ? new Date(planForm.planExpiresAt).toISOString() : undefined
      }
    });
  };

  const triggerImpersonate = (biz: Business) => {
    setImpersonateTargetBusiness(biz);
    setUserSearch("");
    setShowImpersonateModal(true);
  };

  const executeImpersonation = async (userId: string) => {
    setImpersonatingId(userId);
    try {
      await impersonate(userId);
      window.location.href = "/";
    } catch (err) {
      alert("Impersonation failed: " + (err as Error).message);
      setImpersonatingId(null);
    }
  };

  const tabsConfig = [
    { id: "businesses", label: "Businesses", icon: Store },
    { id: "outlets", label: "Outlets", icon: Store },
    { id: "users", label: "Users Registry", icon: Users },
    { id: "audit_logs", label: "Audit Trails", icon: ClipboardList }
  ] as const;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold flex items-center gap-2 tracking-tight">
            <Sparkles className="h-7 w-7 text-primary animate-pulse" /> Super Admin Portal
          </h1>
          <p className="text-sm text-muted mt-1">Manage global platforms metrics, client accounts, active outlets, and track system audits.</p>
        </div>
      </div>

      {/* Hero Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <StatsCard label="Registered Businesses" value={stats?.totalBusinesses || 0} icon={<Store className="h-5 w-5" />} />
        <StatsCard label="Active Businesses" value={stats?.activeBusinesses || 0} color="success" />
        <StatsCard label="Platform Total Users" value={stats?.totalUsers || 0} icon={<Users className="h-5 w-5" />} />
      </div>

      {/* Navigation Tabs */}
      <div className="flex gap-2 border-b border-border/60 pb-1.5 overflow-x-auto">
        {tabsConfig.map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              onClick={() => {
                setActiveTab(t.id);
                setSearch("");
                setStatusFilter("");
              }}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-2xl transition-all whitespace-nowrap ${
                activeTab === t.id
                  ? "bg-primary text-white shadow-soft"
                  : "text-muted hover:bg-surface hover:text-text"
              }`}
            >
              <Icon className="h-4 w-4" />
              {t.label}
            </button>
          );
        })}
      </div>

      {/* Action and Filter bar */}
      {activeTab !== "audit_logs" && (
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="relative flex-1 min-w-[240px] max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            <Input
              className="pl-9"
              placeholder={`Search ${activeTab}...`}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          {(activeTab === "businesses" || activeTab === "outlets") && (
            <div className="w-48">
              <Select
                id="status-filter"
                value={statusFilter}
                onValueChange={setStatusFilter}
                options={[
                  { value: "", label: "All Statuses" },
                  { value: "pending", label: "Pending Approval" },
                  { value: "active", label: "Active" },
                  { value: "suspended", label: "Suspended" },
                  { value: "banned", label: "Banned" }
                ]}
              />
            </div>
          )}
        </div>
      )}

      {/* Tab contents */}
      {activeTab === "businesses" && (
        <DataTable
          loading={loadingBiz}
          data={businesses}
          keyExtractor={(b) => b._id}
          emptyMessage="No businesses registered on the platform matching search."
          columns={[
            {
              key: "name", header: "Business & Owner",
              render: (b) => (
                <div>
                  <p className="font-semibold text-sm">{b.name}</p>
                  <p className="text-xs text-muted">Owner: {b.ownerId?.name || "No owner"} ({b.ownerId?.phone || "No phone"})</p>
                  {b.ownerId?.email && <p className="text-[10px] text-muted font-mono">{b.ownerId.email}</p>}
                </div>
              )
            },
            {
              key: "plan", header: "Subscription",
              render: (b) => (
                <div className="flex flex-col gap-0.5">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <Badge variant="soft" className="capitalize text-[10px]">
                      {typeof b.planId === "object" ? (b.planId as any).name : b.planId || b.plan}
                    </Badge>
                    <Badge variant={b.subscriptionStatus === "active" ? "default" : b.subscriptionStatus === "trial" ? "soft" : "danger"} className="capitalize text-[10px]">
                      {b.subscriptionStatus || "unknown"}
                    </Badge>
                  </div>
                  {b.subscriptionStatus === "trial" && b.trialEndsAt && (
                    <span className="text-[10px] text-muted block">
                      Trial ends: {new Date(b.trialEndsAt).toLocaleDateString()}
                    </span>
                  )}
                  {b.subscriptionStatus === "active" && b.currentPeriodEnd && (
                    <span className="text-[10px] text-muted block">
                      Period ends: {new Date(b.currentPeriodEnd).toLocaleDateString()}
                    </span>
                  )}
                </div>
              )
            },
            {
              key: "status", header: "Status",
              render: (b) => (
                <div className="flex items-center gap-1.5">
                  <Badge variant={b.status === "active" ? "soft" : b.status === "pending" ? "warning" : "danger"} className="capitalize">
                    {b.status || "inactive"}
                  </Badge>
                </div>
              )
            },
            {
              key: "actions", header: "Administration Tools",
              render: (b) => (
                <div className="flex gap-2 flex-wrap">
                  {b.status === "pending" && (
                    <Button variant="default" size="xs" className="gap-1 bg-success hover:bg-success/90" onClick={() => approveBizMutation.mutate(b._id)}>
                      <CheckCircle2 className="h-3 w-3" /> Approve
                    </Button>
                  )}
                  <Button variant="outline" size="xs" className="gap-1" onClick={() => openPlanEdit(b)}>
                    <Edit3 className="h-3 w-3" /> Plan Settings
                  </Button>
                  <Button variant="soft" size="xs" className="gap-1" onClick={() => triggerImpersonate(b)}>
                    <LogIn className="h-3 w-3" /> Impersonate
                  </Button>
                  <div className="w-28">
                    <Select
                      id={`set-status-${b._id}`}
                      value={b.status || "pending"}
                      onValueChange={(status) => setBizStatusMutation.mutate({ id: b._id, status })}
                      options={[
                        { value: "active", label: "Active" },
                        { value: "suspended", label: "Suspend" },
                        { value: "banned", label: "Ban Account" }
                      ]}
                    />
                  </div>
                </div>
              )
            }
          ]}
        />
      )}

      {activeTab === "outlets" && (
        <DataTable
          loading={loadingOutlets}
          data={outlets}
          keyExtractor={(o) => o._id}
          emptyMessage="No outlets registered on the platform matching search."
          columns={[
            {
              key: "name", header: "Outlet Details",
              render: (o) => (
                <div>
                  <p className="font-semibold text-sm">{o.name}</p>
                  <p className="text-xs text-muted">Brand: {o.businessId?.name || "No Business associated"}</p>
                  {o.email && <p className="text-[10px] text-muted font-mono">{o.email}</p>}
                </div>
              )
            },
            {
              key: "manager", header: "Assigned Manager",
              render: (o) => (
                <div>
                  {o.managerId ? (
                    <>
                      <p className="text-xs font-semibold">{o.managerId.name}</p>
                      <p className="text-[10px] text-muted">{o.managerId.phone}</p>
                    </>
                  ) : (
                    <span className="text-xs text-muted italic">Unassigned</span>
                  )}
                </div>
              )
            },
            {
              key: "status", header: "Status",
              render: (o) => (
                <Badge variant={o.status === "active" ? "soft" : o.status === "pending" ? "warning" : "danger"} className="capitalize">
                  {o.status || "inactive"}
                </Badge>
              )
            },
            {
              key: "actions", header: "Operations",
              render: (o) => (
                <div className="flex gap-2 flex-wrap">
                  {o.status === "pending" && (
                    <Button variant="default" size="xs" className="gap-1 bg-success hover:bg-success/90" onClick={() => approveOutletMutation.mutate(o._id)}>
                      <CheckCircle2 className="h-3 w-3" /> Approve Outlet
                    </Button>
                  )}
                  <div className="w-28">
                    <Select
                      id={`set-outlet-status-${o._id}`}
                      value={o.status || "pending"}
                      onValueChange={(status) => setOutletStatusMutation.mutate({ id: o._id, status })}
                      options={[
                        { value: "active", label: "Active" },
                        { value: "suspended", label: "Suspend" },
                        { value: "banned", label: "Ban Outlet" }
                      ]}
                    />
                  </div>
                </div>
              )
            }
          ]}
        />
      )}

      {activeTab === "users" && (
        <DataTable
          loading={loadingAllUsers}
          data={allUsers}
          keyExtractor={(u) => u._id}
          emptyMessage="No system users matching search."
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
      )}

      {activeTab === "audit_logs" && (
        <DataTable
          loading={loadingAudit}
          data={auditLogs}
          keyExtractor={(l) => l._id}
          emptyMessage="No platform-wide audit activities found."
          columns={[
            {
              key: "actor", header: "Actor",
              render: (l) => (
                <div>
                  <p className="text-xs font-semibold">{l.actorName || "System"}</p>
                  {l.impersonatorName && (
                    <p className="text-[10px] text-danger flex items-center gap-0.5 font-bold">
                      <AlertTriangle className="h-2.5 w-2.5" />
                      via {l.impersonatorName}
                    </p>
                  )}
                </div>
              )
            },
            { key: "module", header: "Module", render: (l) => <span className="text-xs capitalize font-medium">{l.module || "—"}</span> },
            {
              key: "action", header: "Action type",
              render: (l) => (
                <Badge variant={l.action.startsWith("impersonate") ? "danger" : "soft"} className="text-[10.5px] uppercase">
                  {l.action.replace(/_/g, " ")}
                </Badge>
              )
            },
            { key: "message", header: "Details / Payload Summary", render: (l) => <span className="text-xs text-muted block max-w-sm truncate">{l.message || "—"}</span> },
            { key: "ip", header: "IP", render: (l) => <span className="text-xs text-muted font-mono">{l.ip || "—"}</span> },
            { key: "createdAt", header: "Timestamp", render: (l) => <span className="text-xs text-muted whitespace-nowrap">{new Date(l.createdAt).toLocaleString("en-IN")}</span> }
          ]}
        />
      )}

      {/* PLAN CUSTOMIZATION DIALOG */}
      <Modal open={showPlanModal} onClose={() => setShowPlanModal(false)} title="Update Subscription Plan" size="sm">
        <form onSubmit={handlePlanSubmit} className="space-y-4">
          <div>
            <p className="text-sm font-semibold">{selectedBusiness?.name}</p>
            <p className="text-xs text-muted">Customize account features level and boundaries.</p>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-muted">Plan tier *</label>
            <Select id="plan-level" value={planForm.plan} onValueChange={(v) => setPlanForm(f => ({ ...f, plan: v }))} options={PLAN_OPTIONS} />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-muted">Max Outlets permitted</label>
            <Input id="max-outlets" type="number" min={1} max={100} value={planForm.maxOutlets} onChange={(e) => setPlanForm(f => ({ ...f, maxOutlets: Number(e.target.value) }))} />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-muted">Status</label>
            <Select id="sub-status" value={planForm.subscriptionStatus} onValueChange={(v) => setPlanForm(f => ({ ...f, subscriptionStatus: v }))} options={[
              { value: "trial", label: "Free Trial" },
              { value: "active", label: "Active subscription" },
              { value: "past_due", label: "Past Due" },
              { value: "unpaid", label: "Unpaid / Suspended" }
            ]} />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-muted">Plan Expiry Date</label>
            <Input id="plan-expires" type="date" value={planForm.planExpiresAt} onChange={(e) => setPlanForm(f => ({ ...f, planExpiresAt: e.target.value }))} />
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
                <Button
                  size="sm"
                  onClick={() => executeImpersonation(u._id)}
                  disabled={impersonatingId !== null}
                >
                  {impersonatingId === u._id ? "Logging In..." : "Log In"}
                </Button>
              </div>
            ))}
          </div>
        </div>
      </Modal>
    </div>
  );
}
