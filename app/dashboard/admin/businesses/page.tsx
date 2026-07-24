"use client";

import * as React from "react";
import dynamic from "next/dynamic";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Search, Edit3, CheckCircle2, DollarSign, LogIn, Mail, MoreHorizontal, History } from "lucide-react";
import { toast } from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
const Modal = dynamic(() => import("@/components/ui/modal").then(m => ({ default: m.Modal })), { ssr: false });
import { Select } from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DataTable } from "@/components/ui/data-table";
import { useAuth } from "@/components/auth/auth-provider";
import { adminService } from "@/services/admin.service";
import { planService } from "@/services/plan.service";
import { userService } from "@/services/user.service";
import { getErrorMessage } from "@/lib/error";
import { APP_ROUTES } from "@/lib/routes";
import type { Business, StaffUser, Plan } from "@/lib/types";
import { useQueryStates, parseAsString, parseAsInteger } from "nuqs";

export default function AdminBusinessesPage() {
  const { token, impersonate } = useAuth();
  const qc = useQueryClient();

  const [query, setQuery] = useQueryStates({
    search: parseAsString.withDefault(""),
    statusFilter: parseAsString.withDefault("all"),
    page: parseAsInteger.withDefault(1)
  });

  const [showPlanModal, setShowPlanModal] = React.useState(false);
  const [showManualSubModal, setShowManualSubModal] = React.useState(false);
  const [showEmailPreviewModal, setShowEmailPreviewModal] = React.useState(false);
  const [previewHtml, setPreviewHtml] = React.useState("");
  const [previewBusinessId, setPreviewBusinessId] = React.useState("");
  const [isSendingEmail, setIsSendingEmail] = React.useState(false);
  const [selectedBusiness, setSelectedBusiness] = React.useState<Business | null>(null);

  const [showHistoryModal, setShowHistoryModal] = React.useState(false);
  const [historyBusiness, setHistoryBusiness] = React.useState<Business | null>(null);
  
  const [showImpersonateModal, setShowImpersonateModal] = React.useState(false);
  const [impersonateTargetBusiness, setImpersonateTargetBusiness] = React.useState<Business | null>(null);
  const [userSearch, setUserSearch] = React.useState("");
  const [impersonatingId, setImpersonatingId] = React.useState<string | null>(null);

  const [planForm, setPlanForm] = React.useState({ plan: "free", maxOutlets: 1, subscriptionStatus: "trial", planExpiresAt: "" });
  const [manualSubForm, setManualSubForm] = React.useState({
    planId: "", billingCycle: "monthly", amount: "", currency: "INR", paymentReference: "", endDate: "", notes: ""
  });

  const { data: bizData, isLoading: loadingBiz, refetch } = useQuery({
    queryKey: ["admin-businesses", query.search, query.statusFilter, query.page],
    queryFn: () => adminService.getAdminBusinesses(token, { 
      search: query.search || undefined, 
      status: query.statusFilter !== "all" ? query.statusFilter : undefined,
      page: query.page,
      limit: 10
    }),
    enabled: Boolean(token)
  });

  const { data: plansData } = useQuery({
    queryKey: ["plans", "all"],
    queryFn: () => planService.getAllPlans(token),
    enabled: Boolean(token)
  });

  const { data: historyData, isLoading: loadingHistory } = useQuery({
    queryKey: ["admin-plan-history", historyBusiness?._id],
    queryFn: () => adminService.getPlanRequestHistory(historyBusiness!._id, token!),
    enabled: Boolean(token && historyBusiness)
  });

  const { data: usersData, isLoading: loadingUsers } = useQuery({
    queryKey: ["business-users", impersonateTargetBusiness?._id],
    queryFn: () => userService.getUsers(token, { businessId: impersonateTargetBusiness?._id }),
    enabled: Boolean(token && impersonateTargetBusiness)
  });

  const approveBizMutation = useMutation({
    mutationFn: (id: string) => adminService.approveBusiness(id, token),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-businesses"] }); toast.success("Business approved"); },
    onError: (err) => toast.error(getErrorMessage(err))
  });

  const setBizStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => adminService.updateBusinessStatus(id, status, token),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-businesses"] }); toast.success("Status updated"); },
    onError: (err) => toast.error(getErrorMessage(err))
  });

  const planMutation = useMutation({
    mutationFn: ({ id, body }: { id: string; body: unknown }) => adminService.updateBusinessPlan(id, body, token),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-businesses"] });
      setShowPlanModal(false);
      setSelectedBusiness(null);
      toast.success("Plan updated successfully");
    },
    onError: (err) => toast.error(getErrorMessage(err))
  });

  const openEmailPreview = async (businessId: string) => {
    try {
      const previewRes = await adminService.getSubscriptionEmailPreview(businessId, token);
      if (previewRes.html) {
        setPreviewHtml(previewRes.html);
        setPreviewBusinessId(businessId);
        setShowEmailPreviewModal(true);
      }
    } catch (e) {
      toast.error(getErrorMessage(e));
    }
  };

  const manualSubMutation = useMutation({
    mutationFn: (body: any) => adminService.manualSubscription(body, token),
    onSuccess: async (res, variables) => {
      qc.invalidateQueries({ queryKey: ["admin-businesses"] });
      setShowManualSubModal(false);
      setSelectedBusiness(null);
      toast.success("Manual subscription added");

      const bizId = (res as any)?.business?._id || variables?.businessId;
      if (bizId) {
        openEmailPreview(bizId);
      }
    },
    onError: (err) => toast.error(getErrorMessage(err))
  });

  const sendEmail = async () => {
    if (!previewBusinessId) return;
    setIsSendingEmail(true);
    try {
      await adminService.sendSubscriptionEmail(previewBusinessId, token);
      toast.success("Email sent successfully");
      setShowEmailPreviewModal(false);
    } catch (e) {
      toast.error(getErrorMessage(e));
    } finally {
      setIsSendingEmail(false);
    }
  };

  const cancelSubMutation = useMutation({
    mutationFn: (businessId: string) => adminService.cancelSubscription(businessId, token),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-businesses"] });
      toast.success("Subscription cancelled");
    },
    onError: (err) => toast.error(getErrorMessage(err))
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
    setManualSubForm({ planId: (biz.planId as any)?._id || biz.planId || "", billingCycle: "monthly", amount: "", currency: biz.currency || "INR", paymentReference: "", endDate: "", notes: "" });
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
      window.location.href = APP_ROUTES.DASHBOARD;
    } catch (err) {
      toast.error("Impersonation failed: " + getErrorMessage(err));
      setImpersonatingId(null);
    }
  };

  const columns = React.useMemo(() => [
    {
      key: "name", header: "Business",
      render: (b: Business) => (
        <div className="flex flex-col">
          <span className="font-semibold text-sm">{b.name}</span>
          <span className="text-[10px] text-muted-foreground font-mono">ID: {b._id}</span>
        </div>
      )
    },
    {
      key: "owner", header: "Owner Name",
      render: (b: Business & { ownerId?: any }) => (
        <div className="flex flex-col">
          <span className="font-medium text-sm">{b.ownerId?.name || "No owner"}</span>
          {b.ownerId?.email && <span className="text-[10px] text-muted-foreground">{b.ownerId.email}</span>}
        </div>
      )
    },
    {
      key: "phone", header: "Owner Contact",
      render: (b: Business & { ownerId?: any }) => (
        <span className="text-xs text-muted-foreground">{b.ownerId?.phone || "No phone"}</span>
      )
    },
    {
      key: "plan", header: "Subscription",
      render: (b: Business) => (
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-1.5 flex-wrap">
            <Badge variant="soft" className="capitalize text-[10px]">{typeof b.planId === "object" ? (b.planId as any).name : b.planId || b.plan}</Badge>
            <Badge variant={b.subscriptionStatus === "active" ? "default" : b.subscriptionStatus === "trial" ? "soft" : "danger"} className="capitalize text-[10px]">{b.subscriptionStatus || "unknown"}</Badge>
          </div>
          {b.subscriptionStatus === "trial" && b.trialEndsAt && <span className="text-[10px] text-muted-foreground">Trial ends: {new Date(b.trialEndsAt).toLocaleDateString()}</span>}
          {b.subscriptionStatus === "active" && b.currentPeriodEnd && <span className="text-[10px] text-muted-foreground">Period ends: {new Date(b.currentPeriodEnd).toLocaleDateString()}</span>}
        </div>
      )
    },
    {
      key: "status", header: "Status",
      render: (b: Business) => (
        <Badge variant={b.status === "active" ? "soft" : b.status === "pending" ? "warning" : "danger"} className="capitalize">{b.status || "inactive"}</Badge>
      )
    },
    {
      key: "actions", header: "Administration Tools",
      render: (b: Business) => (
        <div className="flex gap-2 items-center justify-end pr-4">
          {b.status === "pending" && (
            <Button variant="default" size="xs" className="gap-1 bg-success hover:bg-success/90" onClick={() => approveBizMutation.mutate(b._id)}>
              <CheckCircle2 className="h-3 w-3" /> Approve
            </Button>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => openPlanEdit(b)}>
                <Edit3 className="mr-2 h-4 w-4" /> Settings
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => { setHistoryBusiness(b); setShowHistoryModal(true); }}>
                <History className="mr-2 h-4 w-4" /> Plan History
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => openManualSub(b)}>
                <DollarSign className="mr-2 h-4 w-4" /> Manual Sub
              </DropdownMenuItem>
              {b.subscriptionStatus === "active" && (
                <DropdownMenuItem onClick={() => openEmailPreview(b._id)}>
                  <Mail className="mr-2 h-4 w-4" /> Mail
                </DropdownMenuItem>
              )}
              {b.subscriptionStatus === "active" && (
                <DropdownMenuItem onClick={() => { if(confirm(`Cancel subscription for ${b.name}?`)) cancelSubMutation.mutate(b._id); }} className="text-red-600 focus:text-red-600 focus:bg-red-50">
                  Cancel Sub
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => triggerImpersonate(b)}>
                <LogIn className="mr-2 h-4 w-4" /> Impersonate
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuLabel>Change Status</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => setBizStatusMutation.mutate({ id: b._id, status: "active" })}>
                Set Active
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setBizStatusMutation.mutate({ id: b._id, status: "suspended" })}>
                Suspend
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setBizStatusMutation.mutate({ id: b._id, status: "banned" })}>
                Ban Account
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )
    }
  ], [approveBizMutation.mutate, openPlanEdit, openManualSub, openEmailPreview, cancelSubMutation.mutate, triggerImpersonate, setBizStatusMutation.mutate]);

  return (
    <div className="space-y-4">
      <DataTable
        isLoading={loadingBiz}
        data={businesses}
        keyExtractor={(b) => b._id}
        searchQuery={query.search}
        onSearchChange={(s) => setQuery({ search: s })}
        onRefetch={() => refetch()}
        placeholderText="Search businesses..."
        emptyStateText="No businesses registered on the platform matching search."
        totalItems={bizData?.total}
        page={query.page}
        limit={10}
        onPageChange={(p) => setQuery({ page: p })}
        filters={
          <Select id="status-filter" value={query.statusFilter} onValueChange={(v) => setQuery({ statusFilter: v })} className="w-48 h-9" options={[
            { value: "all", label: "All Statuses" },
            { value: "pending", label: "Pending Approval" },
            { value: "active", label: "Active" },
            { value: "suspended", label: "Suspended" },
            { value: "banned", label: "Banned" }
          ]} />
        }
        columns={columns}
      />

      {showPlanModal && (
        <Modal open={showPlanModal} onClose={() => setShowPlanModal(false)} title="Update Subscription Plan" size="sm">
          <form onSubmit={(e) => { e.preventDefault(); if (selectedBusiness) planMutation.mutate({ id: selectedBusiness._id, body: { planId: planForm.plan, maxOutlets: Number(planForm.maxOutlets), subscriptionStatus: planForm.subscriptionStatus, currentPeriodEnd: planForm.planExpiresAt ? new Date(planForm.planExpiresAt).toISOString() : undefined } }); }} className="space-y-4">
            <div>
              <p className="text-sm font-semibold">{selectedBusiness?.name}</p>
              <p className="text-xs text-muted-foreground">Customize account features level and boundaries.</p>
            </div>
            <div><label className="mb-1 block text-xs font-medium text-muted-foreground">Plan tier *</label><Select id="plan-level" value={planForm.plan} onValueChange={(v) => setPlanForm(f => ({ ...f, plan: v }))} options={PLAN_OPTIONS} /></div>
            <div><label className="mb-1 block text-xs font-medium text-muted-foreground">Max Outlets permitted</label><Input id="max-outlets" type="number" min={1} max={100} value={planForm.maxOutlets} onChange={(e) => setPlanForm(f => ({ ...f, maxOutlets: Number(e.target.value) }))} /></div>
            <div><label className="mb-1 block text-xs font-medium text-muted-foreground">Status</label><Select id="sub-status" value={planForm.subscriptionStatus} onValueChange={(v) => setPlanForm(f => ({ ...f, subscriptionStatus: v }))} options={[{ value: "trial", label: "Free Trial" }, { value: "active", label: "Active subscription" }, { value: "past_due", label: "Past Due" }, { value: "unpaid", label: "Unpaid / Suspended" }]} /></div>
            <div><label className="mb-1 block text-xs font-medium text-muted-foreground">Plan Expiry Date</label><Input id="plan-expires" type="date" value={planForm.planExpiresAt} onChange={(e) => setPlanForm(f => ({ ...f, planExpiresAt: e.target.value }))} /></div>
            <div className="flex gap-3 pt-2"><Button variant="outline" type="button" className="flex-1" onClick={() => setShowPlanModal(false)}>Cancel</Button><Button type="submit" className="flex-1" disabled={planMutation.isPending}>{planMutation.isPending ? "Updating..." : "Save Settings"}</Button></div>
          </form>
        </Modal>
      )}

      {showManualSubModal && (
        <Modal open={showManualSubModal} onClose={() => setShowManualSubModal(false)} title="Create Manual Subscription" size="sm">
          <form onSubmit={(e) => { e.preventDefault(); if(selectedBusiness) manualSubMutation.mutate({ businessId: selectedBusiness._id, planId: manualSubForm.planId, billingCycle: manualSubForm.billingCycle, amount: manualSubForm.amount ? Number(manualSubForm.amount) : undefined, currency: manualSubForm.currency || undefined, paymentReference: manualSubForm.paymentReference || undefined, endDate: manualSubForm.endDate || undefined, notes: manualSubForm.notes || undefined }); }} className="space-y-4">
            <div><p className="text-sm font-semibold">{selectedBusiness?.name}</p></div>
            <div><label className="mb-1 block text-xs font-medium text-muted-foreground">Plan tier *</label><Select id="manual-plan-id" value={manualSubForm.planId} onValueChange={(v) => setManualSubForm(f => ({ ...f, planId: v }))} options={PLAN_OPTIONS} /></div>
            <div><label className="mb-1 block text-xs font-medium text-muted-foreground">Billing Cycle</label><Select id="manual-cycle" value={manualSubForm.billingCycle} onValueChange={(v) => setManualSubForm(f => ({ ...f, billingCycle: v }))} options={[{ value: "monthly", label: "Monthly" }, { value: "yearly", label: "Yearly" }]} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">Amount Paid</label>
                <Input id="manual-amount" type="number" placeholder="Optional." value={manualSubForm.amount} onChange={(e) => setManualSubForm(f => ({ ...f, amount: e.target.value }))} />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">Currency</label>
                <Select
                  id="manual-currency"
                  value={manualSubForm.currency}
                  onValueChange={(v) => setManualSubForm(f => ({ ...f, currency: v }))}
                  options={[
                    { value: "INR", label: "INR (₹)" },
                    { value: "USD", label: "USD ($)" },
                    { value: "EUR", label: "EUR (€)" },
                    { value: "GBP", label: "GBP (£)" },
                    { value: "AED", label: "AED (د.إ)" },
                    { value: "SAR", label: "SAR (ر.س)" }
                  ]}
                />
              </div>
            </div>
            <div><label className="mb-1 block text-xs font-medium text-muted-foreground">Payment Reference</label><Input id="manual-ref" placeholder="e.g. CASH_01" value={manualSubForm.paymentReference} onChange={(e) => setManualSubForm(f => ({ ...f, paymentReference: e.target.value }))} /></div>
            <div><label className="mb-1 block text-xs font-medium text-muted-foreground">Expiry Date</label><Input id="manual-expires" type="date" value={manualSubForm.endDate} onChange={(e) => setManualSubForm(f => ({ ...f, endDate: e.target.value }))} /></div>
            <div><label className="mb-1 block text-xs font-medium text-muted-foreground">Internal Notes</label><Input id="manual-notes" value={manualSubForm.notes} onChange={(e) => setManualSubForm(f => ({ ...f, notes: e.target.value }))} /></div>
            <div className="flex gap-3 pt-2"><Button variant="outline" type="button" className="flex-1" onClick={() => setShowManualSubModal(false)}>Cancel</Button><Button type="submit" className="flex-1 bg-indigo-600 text-white hover:bg-indigo-700" disabled={manualSubMutation.isPending}>{manualSubMutation.isPending ? "Creating..." : "Apply Subscription"}</Button></div>
          </form>
        </Modal>
      )}

      {showImpersonateModal && (
        <Modal open={showImpersonateModal} onClose={() => setShowImpersonateModal(false)} title={`Impersonate ${impersonateTargetBusiness?.name}`} size="md">
          <div className="space-y-4">
            <p className="text-xs text-muted-foreground">Select a staff member or owner to temporarily log into their portal session.</p>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input className="pl-9" placeholder="Search by name or phone..." value={userSearch} onChange={(e) => setUserSearch(e.target.value)} />
            </div>
            <div className="max-h-60 overflow-y-auto space-y-2">
              {loadingUsers ? <p className="text-xs text-muted-foreground animate-pulse">Loading...</p> : bizUsers.map((u) => (
                <div key={u._id} className="flex justify-between items-center bg-card border border-border p-3 rounded-2xl">
                  <div><p className="font-semibold text-sm">{u.name}</p><p className="text-xs text-muted-foreground capitalize">{u.role} — {u.phone}</p></div>
                  <Button size="sm" onClick={() => executeImpersonation(u._id)} disabled={impersonatingId !== null}>{impersonatingId === u._id ? "Logging In..." : "Log In"}</Button>
                </div>
              ))}
            </div>
          </div>
        </Modal>
      )}

      {showEmailPreviewModal && (
        <Modal open={showEmailPreviewModal} onClose={() => setShowEmailPreviewModal(false)} title="Email Preview" size="lg">
          <div className="space-y-4">
            <div className="bg-white border rounded-md h-[60vh] shadow-inner overflow-hidden">
              <iframe className="w-full h-full" srcDoc={previewHtml} title="Email Preview" sandbox="allow-same-origin" />
            </div>
            <div className="flex gap-3 pt-2">
              <Button variant="outline" type="button" className="flex-1" onClick={() => setShowEmailPreviewModal(false)}>Close</Button>
              <Button className="flex-1 bg-indigo-600 text-white hover:bg-indigo-700" onClick={sendEmail} disabled={isSendingEmail}>
                {isSendingEmail ? "Sending..." : "Send Email"}
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {showHistoryModal && historyBusiness && (
        <Modal
          open={showHistoryModal}
          onClose={() => { setShowHistoryModal(false); setHistoryBusiness(null); }}
          title={`Plan Request History - ${historyBusiness.name}`}
        >
          <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2 pt-2">
            {loadingHistory ? (
              <div className="animate-pulse space-y-4">Loading history...</div>
            ) : historyData?.logs?.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground bg-muted/20 rounded-lg">
                No plan request history found for this client.
              </div>
            ) : (
              <div className="relative border-l border-border ml-3 space-y-6">
                {historyData?.logs?.map((log: any) => (
                  <div key={log._id} className="relative pl-6">
                    <div className={`absolute -left-1.5 top-1.5 h-3 w-3 rounded-full border-2 border-background ${
                      log.action === "admin_plan_change_approved" ? "bg-success" : 
                      log.action === "admin_plan_change_rejected" ? "bg-destructive" : 
                      "bg-primary"
                    }`} />
                    <div className="flex flex-col">
                      <span className="text-xs text-muted-foreground font-mono">
                        {new Date(log.createdAt).toLocaleString()}
                      </span>
                      <span className="text-sm font-medium mt-1">
                        {log.action === "agent_plan_change_requested" && "Agent requested a custom plan change"}
                        {log.action === "admin_plan_change_approved" && "Admin approved the plan request"}
                        {log.action === "admin_plan_change_rejected" && "Admin rejected the plan request"}
                      </span>
                      {log.message && (
                        <div className="text-sm text-muted-foreground mt-1 bg-muted/30 p-2 rounded border border-border/50">
                          {log.message}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Modal>
      )}

    </div>
  );
}
