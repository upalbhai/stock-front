"use client";

import * as React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Search, Edit3, CheckCircle2, DollarSign, LogIn } from "lucide-react";
import { toast } from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { Select } from "@/components/ui/select";
import { DataTable } from "@/components/ui/data-table";
import { useAuth } from "@/components/auth/auth-provider";
import { getJson, apiFetch } from "@/lib/api-client";
import { getErrorMessage } from "@/lib/error";
import type { Business, StaffUser, Plan } from "@/lib/types";

export default function AdminBusinessesPage() {
  const { token, impersonate } = useAuth();
  const qc = useQueryClient();

  const [search, setSearch] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState("");

  const [showPlanModal, setShowPlanModal] = React.useState(false);
  const [showManualSubModal, setShowManualSubModal] = React.useState(false);
  const [selectedBusiness, setSelectedBusiness] = React.useState<Business | null>(null);
  
  const [showImpersonateModal, setShowImpersonateModal] = React.useState(false);
  const [impersonateTargetBusiness, setImpersonateTargetBusiness] = React.useState<Business | null>(null);
  const [userSearch, setUserSearch] = React.useState("");
  const [impersonatingId, setImpersonatingId] = React.useState<string | null>(null);

  const [planForm, setPlanForm] = React.useState({ plan: "free", maxOutlets: 1, subscriptionStatus: "trial", planExpiresAt: "" });
  const [manualSubForm, setManualSubForm] = React.useState({
    planId: "", billingCycle: "monthly", amount: "", paymentReference: "", endDate: "", notes: ""
  });

  const { data: bizData, isLoading: loadingBiz } = useQuery({
    queryKey: ["admin-businesses", search, statusFilter],
    queryFn: () => getJson<{ businesses: (Business & { ownerId?: { name: string; phone: string; email?: string } })[] }>("/admin/businesses", token, { search: search || undefined, status: statusFilter || undefined }),
    enabled: Boolean(token)
  });

  const { data: plansData } = useQuery({
    queryKey: ["admin-plans"],
    queryFn: () => getJson<{ plans: Plan[] }>("/plans/all", token),
    enabled: Boolean(token)
  });

  const { data: usersData, isLoading: loadingUsers } = useQuery({
    queryKey: ["admin-business-users", impersonateTargetBusiness?._id],
    queryFn: () => getJson<{ users: StaffUser[] }>("/users", token, { businessId: impersonateTargetBusiness?._id }),
    enabled: Boolean(token && impersonateTargetBusiness?._id)
  });

  const approveBizMutation = useMutation({
    mutationFn: (id: string) => apiFetch(`/admin/businesses/${id}/approve`, { method: "PATCH", token }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-businesses"] }); toast.success("Business approved"); },
    onError: (err) => toast.error(getErrorMessage(err))
  });

  const setBizStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => apiFetch(`/admin/businesses/${id}/status`, { method: "PATCH", body: { status }, token }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-businesses"] }); toast.success("Status updated"); },
    onError: (err) => toast.error(getErrorMessage(err))
  });

  const planMutation = useMutation({
    mutationFn: ({ id, body }: { id: string; body: unknown }) => apiFetch(`/admin/businesses/${id}/plan`, { method: "PATCH", body, token }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-businesses"] });
      setShowPlanModal(false);
      setSelectedBusiness(null);
      toast.success("Plan updated");
    },
    onError: (err) => toast.error(getErrorMessage(err))
  });

  const manualSubMutation = useMutation({
    mutationFn: (body: any) => apiFetch("/admin/subscriptions/manual", { method: "POST", body, token }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-businesses"] });
      setShowManualSubModal(false);
      setSelectedBusiness(null);
      toast.success("Manual subscription applied");
    },
    onError: (err) => toast.error(getErrorMessage(err))
  });

  const cancelSubMutation = useMutation({
    mutationFn: (businessId: string) => apiFetch("/admin/subscriptions/cancel", { method: "POST", body: { businessId }, token }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-businesses"] });
      toast.success("Subscription cancelled successfully");
    },
    onError: (err) => toast.error("Cancellation failed: " + getErrorMessage(err))
  });

  const businesses = bizData?.businesses ?? [];
  const plans = plansData?.plans || [];
  const PLAN_OPTIONS = plans.map(p => ({ value: p._id, label: p.name }));
  const bizUsers = (usersData?.users ?? []).filter((u) =>
    !userSearch || u.name.toLowerCase().includes(userSearch.toLowerCase()) || u.phone.includes(userSearch)
  );

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

  const openManualSub = (biz: Business) => {
    setSelectedBusiness(biz);
    setManualSubForm({ planId: (biz.planId as any)?._id || biz.planId || "", billingCycle: "monthly", amount: "", paymentReference: "", endDate: "", notes: "" });
    setShowManualSubModal(true);
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
      toast.error("Impersonation failed: " + getErrorMessage(err));
      setImpersonatingId(null);
    }
  };

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="relative flex-1 min-w-[240px] max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <Input className="pl-9" placeholder="Search businesses..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <div className="w-48">
          <Select id="status-filter" value={statusFilter} onValueChange={setStatusFilter} options={[
            { value: "", label: "All Statuses" },
            { value: "pending", label: "Pending Approval" },
            { value: "active", label: "Active" },
            { value: "suspended", label: "Suspended" },
            { value: "banned", label: "Banned" }
          ]} />
        </div>
      </div>

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
                  <Badge variant="soft" className="capitalize text-[10px]">{typeof b.planId === "object" ? (b.planId as any).name : b.planId || b.plan}</Badge>
                  <Badge variant={b.subscriptionStatus === "active" ? "default" : b.subscriptionStatus === "trial" ? "soft" : "danger"} className="capitalize text-[10px]">{b.subscriptionStatus || "unknown"}</Badge>
                </div>
                {b.subscriptionStatus === "trial" && b.trialEndsAt && <span className="text-[10px] text-muted block">Trial ends: {new Date(b.trialEndsAt).toLocaleDateString()}</span>}
                {b.subscriptionStatus === "active" && b.currentPeriodEnd && <span className="text-[10px] text-muted block">Period ends: {new Date(b.currentPeriodEnd).toLocaleDateString()}</span>}
              </div>
            )
          },
          {
            key: "status", header: "Status",
            render: (b) => (
              <Badge variant={b.status === "active" ? "soft" : b.status === "pending" ? "warning" : "danger"} className="capitalize">{b.status || "inactive"}</Badge>
            )
          },
          {
            key: "actions", header: "Administration Tools",
            render: (b) => (
              <div className="flex gap-2 flex-wrap items-center">
                {b.status === "pending" && (
                  <Button variant="default" size="xs" className="gap-1 bg-success hover:bg-success/90" onClick={() => approveBizMutation.mutate(b._id)}>
                    <CheckCircle2 className="h-3 w-3" /> Approve
                  </Button>
                )}
                <Button variant="outline" size="xs" className="gap-1" onClick={() => openPlanEdit(b)}><Edit3 className="h-3 w-3" /> Settings</Button>
                <Button variant="default" size="xs" className="gap-1 bg-indigo-600 hover:bg-indigo-700 text-white" onClick={() => openManualSub(b)}><DollarSign className="h-3 w-3" /> Manual Sub</Button>
                {b.subscriptionStatus === "active" && (
                  <Button variant="destructive" size="xs" className="gap-1" onClick={() => { if(confirm(`Cancel subscription for ${b.name}?`)) cancelSubMutation.mutate(b._id); }}>Cancel Sub</Button>
                )}
                <Button variant="soft" size="xs" className="gap-1" onClick={() => triggerImpersonate(b)}><LogIn className="h-3 w-3" /> Impersonate</Button>
                <div className="w-28">
                  <Select
                    id={`set-status-${b._id}`} value={b.status || "pending"}
                    onValueChange={(status) => setBizStatusMutation.mutate({ id: b._id, status })}
                    options={[
                      { value: "active", label: "Active" }, { value: "suspended", label: "Suspend" }, { value: "banned", label: "Ban Account" }
                    ]}
                  />
                </div>
              </div>
            )
          }
        ]}
      />

      <Modal open={showPlanModal} onClose={() => setShowPlanModal(false)} title="Update Subscription Plan" size="sm">
        <form onSubmit={(e) => { e.preventDefault(); if (selectedBusiness) planMutation.mutate({ id: selectedBusiness._id, body: { planId: planForm.plan, maxOutlets: Number(planForm.maxOutlets), subscriptionStatus: planForm.subscriptionStatus, currentPeriodEnd: planForm.planExpiresAt ? new Date(planForm.planExpiresAt).toISOString() : undefined } }); }} className="space-y-4">
          <div>
            <p className="text-sm font-semibold">{selectedBusiness?.name}</p>
            <p className="text-xs text-muted">Customize account features level and boundaries.</p>
          </div>
          <div><label className="mb-1 block text-xs font-medium text-muted">Plan tier *</label><Select id="plan-level" value={planForm.plan} onValueChange={(v) => setPlanForm(f => ({ ...f, plan: v }))} options={PLAN_OPTIONS} /></div>
          <div><label className="mb-1 block text-xs font-medium text-muted">Max Outlets permitted</label><Input id="max-outlets" type="number" min={1} max={100} value={planForm.maxOutlets} onChange={(e) => setPlanForm(f => ({ ...f, maxOutlets: Number(e.target.value) }))} /></div>
          <div><label className="mb-1 block text-xs font-medium text-muted">Status</label><Select id="sub-status" value={planForm.subscriptionStatus} onValueChange={(v) => setPlanForm(f => ({ ...f, subscriptionStatus: v }))} options={[{ value: "trial", label: "Free Trial" }, { value: "active", label: "Active subscription" }, { value: "past_due", label: "Past Due" }, { value: "unpaid", label: "Unpaid / Suspended" }]} /></div>
          <div><label className="mb-1 block text-xs font-medium text-muted">Plan Expiry Date</label><Input id="plan-expires" type="date" value={planForm.planExpiresAt} onChange={(e) => setPlanForm(f => ({ ...f, planExpiresAt: e.target.value }))} /></div>
          <div className="flex gap-3 pt-2"><Button variant="outline" type="button" className="flex-1" onClick={() => setShowPlanModal(false)}>Cancel</Button><Button type="submit" className="flex-1" disabled={planMutation.isPending}>{planMutation.isPending ? "Updating..." : "Save Settings"}</Button></div>
        </form>
      </Modal>

      <Modal open={showManualSubModal} onClose={() => setShowManualSubModal(false)} title="Create Manual Subscription" size="sm">
        <form onSubmit={(e) => { e.preventDefault(); if(selectedBusiness) manualSubMutation.mutate({ businessId: selectedBusiness._id, planId: manualSubForm.planId, billingCycle: manualSubForm.billingCycle, amount: manualSubForm.amount ? Number(manualSubForm.amount) : undefined, paymentReference: manualSubForm.paymentReference || undefined, endDate: manualSubForm.endDate || undefined, notes: manualSubForm.notes || undefined }); }} className="space-y-4">
          <div><p className="text-sm font-semibold">{selectedBusiness?.name}</p></div>
          <div><label className="mb-1 block text-xs font-medium text-muted">Plan tier *</label><Select id="manual-plan-id" value={manualSubForm.planId} onValueChange={(v) => setManualSubForm(f => ({ ...f, planId: v }))} options={PLAN_OPTIONS} /></div>
          <div><label className="mb-1 block text-xs font-medium text-muted">Billing Cycle</label><Select id="manual-cycle" value={manualSubForm.billingCycle} onValueChange={(v) => setManualSubForm(f => ({ ...f, billingCycle: v }))} options={[{ value: "monthly", label: "Monthly" }, { value: "yearly", label: "Yearly" }]} /></div>
          <div><label className="mb-1 block text-xs font-medium text-muted">Amount Paid (INR)</label><Input id="manual-amount" type="number" placeholder="Optional." value={manualSubForm.amount} onChange={(e) => setManualSubForm(f => ({ ...f, amount: e.target.value }))} /></div>
          <div><label className="mb-1 block text-xs font-medium text-muted">Payment Reference</label><Input id="manual-ref" placeholder="e.g. CASH_01" value={manualSubForm.paymentReference} onChange={(e) => setManualSubForm(f => ({ ...f, paymentReference: e.target.value }))} /></div>
          <div><label className="mb-1 block text-xs font-medium text-muted">Expiry Date</label><Input id="manual-expires" type="date" value={manualSubForm.endDate} onChange={(e) => setManualSubForm(f => ({ ...f, endDate: e.target.value }))} /></div>
          <div><label className="mb-1 block text-xs font-medium text-muted">Internal Notes</label><Input id="manual-notes" value={manualSubForm.notes} onChange={(e) => setManualSubForm(f => ({ ...f, notes: e.target.value }))} /></div>
          <div className="flex gap-3 pt-2"><Button variant="outline" type="button" className="flex-1" onClick={() => setShowManualSubModal(false)}>Cancel</Button><Button type="submit" className="flex-1 bg-indigo-600 text-white hover:bg-indigo-700" disabled={manualSubMutation.isPending}>{manualSubMutation.isPending ? "Creating..." : "Apply Subscription"}</Button></div>
        </form>
      </Modal>

      <Modal open={showImpersonateModal} onClose={() => setShowImpersonateModal(false)} title={`Impersonate ${impersonateTargetBusiness?.name}`} size="md">
        <div className="space-y-4">
          <p className="text-xs text-muted">Select a staff member or owner to temporarily log into their portal session.</p>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            <Input className="pl-9" placeholder="Search by name or phone..." value={userSearch} onChange={(e) => setUserSearch(e.target.value)} />
          </div>
          <div className="max-h-60 overflow-y-auto space-y-2">
            {loadingUsers ? <p className="text-xs text-muted animate-pulse">Loading...</p> : bizUsers.map((u) => (
              <div key={u._id} className="flex justify-between items-center bg-surface border border-border p-3 rounded-2xl">
                <div><p className="font-semibold text-sm">{u.name}</p><p className="text-xs text-muted capitalize">{u.role} — {u.phone}</p></div>
                <Button size="sm" onClick={() => executeImpersonation(u._id)} disabled={impersonatingId !== null}>{impersonatingId === u._id ? "Logging In..." : "Log In"}</Button>
              </div>
            ))}
          </div>
        </div>
      </Modal>
    </div>
  );
}
