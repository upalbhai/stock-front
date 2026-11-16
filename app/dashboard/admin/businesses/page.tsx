"use client";

import * as React from "react";
import dynamic from "next/dynamic";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Search,
  Edit3,
  CheckCircle2,
  DollarSign,
  LogIn,
  Mail,
  MoreHorizontal,
  History,
  Building2,
  Users,
  Store,
  Clock,
  ShieldAlert,
  Layers,
  ArrowRight,
  RefreshCw,
  Phone,
  Sparkles,
  ExternalLink,
  Copy,
  Check,
} from "lucide-react";
import { toast } from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
const Modal = dynamic(() => import("@/components/ui/modal").then((m) => ({ default: m.Modal })), { ssr: false });
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Select } from "@/components/ui/select";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
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
import { formatDate } from "@/lib/format";
import type { Business, StaffUser, Plan } from "@/lib/types";
import { useQueryStates, parseAsString, parseAsInteger } from "nuqs";

const AVAILABLE_FEATURE_GROUPS = [
  {
    category: "POS & Invoicing",
    features: [
      { key: "retail_billing", label: "Retail POS Billing" },
      { key: "wholesale_billing", label: "Wholesale Billing" },
      { key: "gst_invoices", label: "GST Tax Invoices" },
      { key: "order_void", label: "Bill Voiding & Cancel" },
    ],
  },
  {
    category: "Customer & Khata",
    features: [
      { key: "credit_khata", label: "Customer Credit & Khata" },
      { key: "customers", label: "Customer Directory" },
    ],
  },
  {
    category: "Inventory & Stock",
    features: [
      { key: "packaging_units", label: "Packaging Units" },
      { key: "bulk_stock_in", label: "Bulk Stock Receive" },
      { key: "order_history", label: "Detailed Order History" },
    ],
  },
  {
    category: "Platform & Alerts",
    features: [
      { key: "notifications", label: "In-App Notifications" },
    ],
  },
];

const ALL_FEATURE_KEYS = AVAILABLE_FEATURE_GROUPS.flatMap((g) => g.features.map((f) => f.key));

function getBusinessPlanLabel(b: Business & { planId?: Plan | string | null }) {
  if (b.planId && typeof b.planId === "object") return b.planId.name;
  if (b.customPlanDetails) {
    const { price, currency = "INR", billingCycle } = b.customPlanDetails;
    const cycle = billingCycle === "yearly" ? "/yr" : "/mo";
    if (price != null) return `Custom: ${currency} ${price}${cycle}`;
    return "Custom Plan";
  }
  if (b.planId) return String(b.planId);
  return b.plan || "Free";
}

export default function AdminBusinessesPage() {
  const { token, impersonate } = useAuth();
  const qc = useQueryClient();
  const [copiedId, setCopiedId] = React.useState<string | null>(null);

  const [query, setQuery] = useQueryStates({
    search: parseAsString.withDefault(""),
    statusFilter: parseAsString.withDefault("all"),
    page: parseAsInteger.withDefault(1),
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
  const [cancelBusiness, setCancelBusiness] = React.useState<Business | null>(null);

  const [planForm, setPlanForm] = React.useState({
    plan: "free",
    maxOutlets: 1,
    subscriptionStatus: "trial",
    planExpiresAt: "",
    isCustomPlan: false,
    price: 0,
    currency: "INR",
    billingCycle: "monthly",
    maxProducts: 50,
    enabledFeatures: [] as string[],
  });

  const [manualSubForm, setManualSubForm] = React.useState({
    planId: "",
    billingCycle: "monthly",
    amount: "",
    currency: "INR",
    paymentReference: "",
    endDate: "",
    notes: "",
  });

  const { data: bizData, isLoading: loadingBiz, refetch } = useQuery({
    queryKey: ["admin-businesses", query.search, query.statusFilter, query.page],
    queryFn: () =>
      adminService.getAdminBusinesses(token, {
        search: query.search || undefined,
        status: query.statusFilter !== "all" ? query.statusFilter : undefined,
        page: query.page,
        limit: 10,
      }),
    enabled: Boolean(token),
  });

  const { data: plansData } = useQuery({
    queryKey: ["plans", "all"],
    queryFn: () => planService.getAllPlans(token),
    enabled: Boolean(token),
  });

  const { data: historyData, isLoading: loadingHistory } = useQuery({
    queryKey: ["admin-plan-history", historyBusiness?._id],
    queryFn: () => adminService.getPlanRequestHistory(historyBusiness!._id, token!),
    enabled: Boolean(token && historyBusiness),
  });

  const { data: usersData, isLoading: loadingUsers } = useQuery({
    queryKey: ["business-users", impersonateTargetBusiness?._id],
    queryFn: () => userService.getUsers(token, { businessId: impersonateTargetBusiness?._id }),
    enabled: Boolean(token && impersonateTargetBusiness),
  });

  const approveBizMutation = useMutation({
    mutationFn: (id: string) => adminService.approveBusiness(id, token),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-businesses"] });
      toast.success("Business approved successfully");
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const setBizStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      adminService.updateBusinessStatus(id, status, token),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-businesses"] });
      toast.success("Status updated");
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const planMutation = useMutation({
    mutationFn: ({ id, body }: { id: string; body: unknown }) =>
      adminService.updateBusinessPlan(id, body, token),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-businesses"] });
      setShowPlanModal(false);
      setSelectedBusiness(null);
      toast.success("Plan updated successfully");
    },
    onError: (err) => toast.error(getErrorMessage(err)),
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
    onError: (err) => toast.error(getErrorMessage(err)),
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
      setCancelBusiness(null);
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const businesses = bizData?.businesses ?? [];
  const totalCount = bizData?.total ?? businesses.length;
  const plans = plansData?.plans || [];
  const PLAN_OPTIONS = plans.map((p) => ({ value: p._id, label: p.name }));
  const bizUsers = (usersData?.users ?? []).filter(
    (u) =>
      !userSearch ||
      u.name.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.phone.includes(userSearch)
  );

  // Derived metrics for overview cards
  const pendingApprovalsCount = businesses.filter((b) => b.status === "pending").length;
  const activeTenantsCount = businesses.filter((b) => b.status === "active").length;
  const activeSubscriptionsCount = businesses.filter((b) => b.subscriptionStatus === "active").length;

  const handleCopyId = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    toast.success("Business ID copied");
    setTimeout(() => setCopiedId(null), 2000);
  };

  const openPlanEdit = (biz: Business) => {
    setSelectedBusiness(biz);
    const isCustom = biz.customPlanDetails !== undefined || biz.planId === null;
    const customDetails = (biz.customPlanDetails || {}) as any;

    setPlanForm({
      plan: (biz.planId as any)?._id || biz.planId || biz.plan || "",
      maxOutlets: biz.maxOutlets || 1,
      subscriptionStatus: biz.subscriptionStatus || "trial",
      planExpiresAt: biz.currentPeriodEnd ? new Date(biz.currentPeriodEnd).toISOString().split("T")[0] : "",
      isCustomPlan: isCustom,
      price: customDetails.price || 0,
      currency: customDetails.currency || biz.currency || "INR",
      billingCycle: customDetails.billingCycle || "monthly",
      maxProducts: customDetails.maxProducts || biz.maxProducts || 50,
      enabledFeatures: customDetails.enabledFeatures || biz.enabledFeatures || ALL_FEATURE_KEYS,
    });
    setShowPlanModal(true);
  };

  const openManualSub = (biz: Business) => {
    setSelectedBusiness(biz);
    setManualSubForm({
      planId: (biz.planId as any)?._id || biz.planId || "",
      billingCycle: "monthly",
      amount: "",
      currency: biz.currency || "INR",
      paymentReference: "",
      endDate: "",
      notes: "",
    });
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

  const columns = React.useMemo(
    () => [
      {
        key: "name",
        header: "Business Tenant",
        render: (b: Business) => {
          const initial = b.name ? b.name.charAt(0).toUpperCase() : "B";
          return (
            <div className="flex items-center gap-3 py-1">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary font-bold text-sm ring-1 ring-primary/20 shadow-2xs">
                {initial}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-sm text-foreground truncate max-w-[200px]">{b.name}</span>
                  <span className="inline-flex items-center rounded-md bg-muted px-1.5 py-0.5 text-[10px] font-mono font-medium text-muted-foreground">
                    {b.maxOutlets || 1} {b.maxOutlets === 1 ? "outlet" : "outlets"}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="text-[10px] text-muted-foreground font-mono">ID: {b._id.slice(-6)}</span>
                  <button
                    onClick={(e) => handleCopyId(b._id, e)}
                    className="text-muted-foreground hover:text-foreground transition-colors p-0.5"
                    title="Copy Full ID"
                  >
                    {copiedId === b._id ? (
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
        key: "owner",
        header: "Owner Details",
        render: (b: Business & { ownerId?: any }) => (
          <div className="flex flex-col py-1">
            <span className="font-medium text-sm text-foreground">
              {b.ownerId?.name || "No owner attached"}
            </span>
            {b.ownerId?.email && (
              <a
                href={`mailto:${b.ownerId.email}`}
                className="text-xs text-muted-foreground hover:text-primary transition-colors truncate max-w-[180px]"
              >
                {b.ownerId.email}
              </a>
            )}
          </div>
        ),
      },
      {
        key: "phone",
        header: "Contact",
        render: (b: Business & { ownerId?: any }) => (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-mono">
            <Phone className="h-3 w-3 text-muted-foreground/70 shrink-0" />
            <span>{b.ownerId?.phone || "No phone"}</span>
          </div>
        ),
      },
      {
        key: "plan",
        header: "Subscription Plan",
        render: (b: Business) => {
          const isTrial = b.subscriptionStatus === "trial";
          const isActive = b.subscriptionStatus === "active";
          return (
            <div className="flex flex-col gap-1 py-1">
              <div className="flex items-center gap-1.5 flex-wrap">
                <Badge variant="soft" className="capitalize text-[10px] font-semibold">
                  {getBusinessPlanLabel(b)}
                </Badge>
                <Badge
                  variant={isActive ? "default" : isTrial ? "soft" : "danger"}
                  className="capitalize text-[10px]"
                >
                  {b.subscriptionStatus || "unknown"}
                </Badge>
              </div>
              {isTrial && b.trialEndsAt && (
                <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                  <Clock className="h-2.5 w-2.5" />
                  Trial ends {formatDate(b.trialEndsAt)}
                </span>
              )}
              {isActive && b.currentPeriodEnd && (
                <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                  <Clock className="h-2.5 w-2.5" />
                  Period ends {formatDate(b.currentPeriodEnd)}
                </span>
              )}
            </div>
          );
        },
      },
      {
        key: "status",
        header: "Account Status",
        render: (b: Business) => {
          const status = b.status || "inactive";
          const isPending = status === "pending";
          const isActive = status === "active";
          const isSuspended = status === "suspended" || status === "banned";

          return (
            <div className="inline-flex items-center gap-1.5">
              <span
                className={`h-2 w-2 rounded-full ${
                  isPending
                    ? "bg-amber-500 animate-pulse"
                    : isActive
                    ? "bg-emerald-500"
                    : "bg-destructive"
                }`}
              />
              <Badge
                variant={isActive ? "soft" : isPending ? "warning" : "danger"}
                className="capitalize text-[11px] font-medium"
              >
                {status}
              </Badge>
            </div>
          );
        },
      },
      {
        key: "actions",
        header: "Administration",
        render: (b: Business) => (
          <div className="flex gap-2 items-center justify-end pr-3">
            {b.status === "pending" && (
              <Button
                variant="default"
                size="xs"
                className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold cursor-pointer shadow-2xs"
                onClick={() => approveBizMutation.mutate(b._id)}
                disabled={approveBizMutation.isPending}
              >
                <CheckCircle2 className="h-3.5 w-3.5" /> Approve
              </Button>
            )}

            <Button
              variant="outline"
              size="xs"
              className="gap-1 px-2 text-xs cursor-pointer hover:bg-primary/10 hover:text-primary hover:border-primary/30"
              onClick={() => triggerImpersonate(b)}
              title="Log into tenant portal"
            >
              <LogIn className="h-3 w-3" />
              <span className="hidden xl:inline">Access</span>
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon-xs" className="h-8 w-8 p-0 cursor-pointer">
                  <span className="sr-only">Open menu</span>
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52">
                <DropdownMenuLabel className="text-xs">Management</DropdownMenuLabel>
                <DropdownMenuItem onClick={() => openPlanEdit(b)} className="cursor-pointer">
                  <Edit3 className="mr-2 h-4 w-4 text-primary" /> Edit Plan & Quotas
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => {
                    setHistoryBusiness(b);
                    setShowHistoryModal(true);
                  }}
                  className="cursor-pointer"
                >
                  <History className="mr-2 h-4 w-4 text-muted-foreground" /> Plan History
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => openManualSub(b)} className="cursor-pointer">
                  <DollarSign className="mr-2 h-4 w-4 text-emerald-600 dark:text-emerald-400" /> Manual Payment
                </DropdownMenuItem>

                {b.subscriptionStatus === "active" && (
                  <DropdownMenuItem onClick={() => openEmailPreview(b._id)} className="cursor-pointer">
                    <Mail className="mr-2 h-4 w-4 text-muted-foreground" /> Preview Receipt Email
                  </DropdownMenuItem>
                )}
                {b.subscriptionStatus === "active" && (
                  <DropdownMenuItem
                    onClick={() => setCancelBusiness(b)}
                    className="text-destructive focus:text-destructive focus:bg-destructive/10 cursor-pointer"
                  >
                    Cancel Subscription
                  </DropdownMenuItem>
                )}

                <DropdownMenuSeparator />
                <DropdownMenuLabel className="text-xs">Account Status</DropdownMenuLabel>
                <DropdownMenuItem
                  onClick={() => setBizStatusMutation.mutate({ id: b._id, status: "active" })}
                  className="cursor-pointer"
                >
                  Set Active
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setBizStatusMutation.mutate({ id: b._id, status: "suspended" })}
                  className="cursor-pointer"
                >
                  Suspend Account
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setBizStatusMutation.mutate({ id: b._id, status: "banned" })}
                  className="text-destructive focus:text-destructive focus:bg-destructive/10 cursor-pointer"
                >
                  Ban Account
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ),
      },
    ],
    [
      approveBizMutation.mutate,
      approveBizMutation.isPending,
      openPlanEdit,
      openManualSub,
      openEmailPreview,
      cancelSubMutation.mutate,
      triggerImpersonate,
      setBizStatusMutation.mutate,
      copiedId,
    ]
  );

  return (
    <div className="space-y-4 animate-in fade-in duration-300">
      {/* ── COMPACT SECTION HEADER & LIVE METRIC STRIP ───────────────────── */}
      <div className="flex flex-col gap-3 rounded-xl border border-border/80 bg-card p-3 sm:p-3.5 shadow-2xs">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-base sm:text-lg font-bold tracking-tight text-foreground sm:text-xl">
                Tenant Businesses
              </h1>
              <span className="inline-flex items-center rounded-md bg-primary/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary border border-primary/20 shrink-0">
                Registry
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5 hidden sm:block">
              Manage client stores, subscription boundaries, feature access, and account impersonation.
            </p>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            className="h-7 sm:h-8 gap-1 px-2 sm:px-2.5 text-xs cursor-pointer shadow-2xs hover:bg-accent shrink-0"
          >
            <RefreshCw className={`h-3 w-3 ${loadingBiz ? "animate-spin text-primary" : "text-muted-foreground"}`} />
            <span className="hidden sm:inline">Refresh</span>
          </Button>
        </div>

        {/* ── COMPACT METRIC FILTER CHIPS (SLIM, ONLY 34px TALL) ─────────── */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar scroll-smooth border-t border-border/60 pt-2.5 -mx-3 px-3 sm:mx-0 sm:px-0 sm:flex-wrap">
          {/* Chip 1: All */}
          <button
            type="button"
            onClick={() => setQuery({ statusFilter: "all", page: 1 })}
            className={`inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs transition-all cursor-pointer shrink-0 ${
              query.statusFilter === "all"
                ? "bg-primary/10 text-primary border-primary/30 font-semibold shadow-2xs ring-1 ring-primary/20"
                : "bg-muted/30 border-border/80 text-muted-foreground hover:text-foreground hover:bg-muted/60"
            }`}
          >
            <Building2 className="h-3.5 w-3.5" />
            <span>All Stores</span>
            <span className="rounded-md bg-background px-1.5 py-0.2 text-[10px] font-mono font-bold text-foreground shadow-2xs">
              {totalCount}
            </span>
          </button>

          {/* Chip 2: Active */}
          <button
            type="button"
            onClick={() => setQuery({ statusFilter: "active", page: 1 })}
            className={`inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs transition-all cursor-pointer shrink-0 ${
              query.statusFilter === "active"
                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 font-semibold shadow-2xs ring-1 ring-emerald-500/20"
                : "bg-muted/30 border-border/80 text-muted-foreground hover:text-foreground hover:bg-muted/60"
            }`}
          >
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            <span>Active</span>
            <span className="rounded-md bg-emerald-500/15 px-1.5 py-0.2 text-[10px] font-mono font-bold text-emerald-600 dark:text-emerald-400">
              {activeTenantsCount}
            </span>
          </button>

          {/* Chip 3: Pending */}
          <button
            type="button"
            onClick={() => setQuery({ statusFilter: "pending", page: 1 })}
            className={`inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs transition-all cursor-pointer shrink-0 ${
              query.statusFilter === "pending"
                ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30 font-semibold shadow-2xs ring-1 ring-amber-500/20"
                : "bg-muted/30 border-border/80 text-muted-foreground hover:text-foreground hover:bg-muted/60"
            }`}
          >
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-amber-500" />
            </span>
            <span>Pending Approvals</span>
            <span className="rounded-md bg-amber-500/15 px-1.5 py-0.2 text-[10px] font-mono font-bold text-amber-600 dark:text-amber-400">
              {pendingApprovalsCount}
            </span>
          </button>

          {/* Chip 4: Paid Subscriptions */}
          <div className="inline-flex items-center gap-2 rounded-lg border border-border/80 bg-muted/30 px-3 py-1.5 text-xs text-muted-foreground shrink-0">
            <Layers className="h-3.5 w-3.5 text-purple-500" />
            <span>Paid Subscriptions</span>
            <span className="rounded-md bg-purple-500/15 px-1.5 py-0.2 text-[10px] font-mono font-bold text-purple-600 dark:text-purple-400">
              {activeSubscriptionsCount}
            </span>
          </div>
        </div>
      </div>

      {/* ── MAIN DATA TABLE ──────────────────────────────────────────────── */}
      <DataTable
        isLoading={loadingBiz}
        data={businesses}
        keyExtractor={(b) => b._id}
        searchQuery={query.search}
        onSearchChange={(s) => setQuery({ search: s, page: 1 })}
        onRefetch={() => refetch()}
        placeholderText="Search businesses..."
        emptyStateText="No business tenants matching the current filter."
        totalItems={bizData?.total}
        page={query.page}
        limit={10}
        onPageChange={(p) => setQuery({ page: p })}
        filters={
          <div className="flex items-center gap-2">
            <Select
              id="status-filter"
              value={query.statusFilter}
              onValueChange={(v) => setQuery({ statusFilter: v, page: 1 })}
              className="w-48"
              size="sm"
              options={[
                { value: "all", label: "All Statuses" },
                { value: "pending", label: "Pending Approval" },
                { value: "active", label: "Active" },
                { value: "suspended", label: "Suspended" },
                { value: "banned", label: "Banned" },
              ]}
            />
          </div>
        }
        columns={columns}
      />

      {/* ── MODAL: UPDATE PLAN & QUOTAS ──────────────────────────────────── */}
      {showPlanModal && (
        <Modal
          open={showPlanModal}
          onClose={() => setShowPlanModal(false)}
          title={`Plan Settings: ${selectedBusiness?.name || "Business"}`}
          size="md"
        >
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (selectedBusiness) {
                const body: any = {
                  maxOutlets: Number(planForm.maxOutlets),
                  subscriptionStatus: planForm.subscriptionStatus,
                  currentPeriodEnd: planForm.planExpiresAt
                    ? new Date(planForm.planExpiresAt).toISOString()
                    : undefined,
                  isCustomPlan: planForm.isCustomPlan,
                };
                if (planForm.isCustomPlan) {
                  body.customPlanDetails = {
                    price: Number(planForm.price),
                    currency: planForm.currency,
                    billingCycle: planForm.billingCycle,
                    maxProducts: Number(planForm.maxProducts),
                    maxOutlets: Number(planForm.maxOutlets),
                    enabledFeatures: planForm.enabledFeatures,
                  };
                } else {
                  body.planId = planForm.plan;
                }
                planMutation.mutate({ id: selectedBusiness._id, body });
              }
            }}
            className="space-y-4 max-h-[75vh] overflow-y-auto pr-2"
          >
            <div>
              <p className="text-sm font-semibold text-foreground">{selectedBusiness?.name}</p>
              <p className="text-xs text-muted-foreground">Configure tenant subscription boundaries, pricing, and active modules.</p>
            </div>

            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Plan Architecture
              </label>
              <div className="flex bg-muted p-1 rounded-lg">
                <button
                  type="button"
                  onClick={() => setPlanForm((f) => ({ ...f, isCustomPlan: false }))}
                  className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                    !planForm.isCustomPlan
                      ? "bg-card shadow-xs text-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Preset Catalog Tier
                </button>
                <button
                  type="button"
                  onClick={() => setPlanForm((f) => ({ ...f, isCustomPlan: true }))}
                  className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                    planForm.isCustomPlan
                      ? "bg-card shadow-xs text-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Custom Enterprise Plan
                </button>
              </div>
            </div>

            {!planForm.isCustomPlan ? (
              <div className="space-y-1">
                <label className="block text-xs font-medium text-muted-foreground">Plan Tier</label>
                <Select
                  id="plan-level"
                  value={planForm.plan}
                  onValueChange={(v) => setPlanForm((f) => ({ ...f, plan: v }))}
                  options={PLAN_OPTIONS}
                />
              </div>
            ) : (
              <div className="space-y-4 rounded-xl border border-border bg-muted/20 p-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1 block text-xs font-medium text-muted-foreground">Custom Price</label>
                    <Input
                      id="custom-price"
                      type="number"
                      min={0}
                      value={planForm.price}
                      onChange={(e) => setPlanForm((f) => ({ ...f, price: Number(e.target.value) }))}
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-muted-foreground">Currency</label>
                    <Select
                      id="custom-currency"
                      value={planForm.currency}
                      onValueChange={(v) => setPlanForm((f) => ({ ...f, currency: v }))}
                      options={[
                        { value: "INR", label: "INR (₹)" },
                        { value: "USD", label: "USD ($)" },
                        { value: "EUR", label: "EUR (€)" },
                        { value: "GBP", label: "GBP (£)" },
                        { value: "AED", label: "AED (د.إ)" },
                        { value: "SAR", label: "SAR (ر.س)" },
                      ]}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1 block text-xs font-medium text-muted-foreground">Billing Cycle</label>
                    <Select
                      id="custom-cycle"
                      value={planForm.billingCycle}
                      onValueChange={(v) => setPlanForm((f) => ({ ...f, billingCycle: v }))}
                      options={[
                        { value: "monthly", label: "Monthly" },
                        { value: "yearly", label: "Yearly" },
                      ]}
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-muted-foreground">Max Products Limit</label>
                    <Input
                      id="max-products"
                      type="number"
                      min={1}
                      value={planForm.maxProducts}
                      onChange={(e) => setPlanForm((f) => ({ ...f, maxProducts: Number(e.target.value) }))}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Module Permissions
                    </label>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="ghost"
                        size="xs"
                        className="h-6 text-[10px] cursor-pointer"
                        onClick={() => setPlanForm((f) => ({ ...f, enabledFeatures: ALL_FEATURE_KEYS }))}
                      >
                        Select All
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="xs"
                        className="h-6 text-[10px] cursor-pointer"
                        onClick={() => setPlanForm((f) => ({ ...f, enabledFeatures: [] }))}
                      >
                        Clear
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {AVAILABLE_FEATURE_GROUPS.map((group) => (
                      <div key={group.category} className="space-y-1.5">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70">
                          {group.category}
                        </span>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                          {group.features.map((feat) => {
                            const isSelected = planForm.enabledFeatures.includes(feat.key);
                            return (
                              <div
                                key={feat.key}
                                onClick={() => {
                                  setPlanForm((f) => {
                                    const newFeats = isSelected
                                      ? f.enabledFeatures.filter((x) => x !== feat.key)
                                      : [...f.enabledFeatures, feat.key];
                                    return { ...f, enabledFeatures: newFeats };
                                  });
                                }}
                                className={`flex items-center gap-2 p-2 rounded-lg border text-xs cursor-pointer transition-colors ${
                                  isSelected
                                    ? "bg-primary/10 border-primary/40 text-primary font-semibold"
                                    : "bg-card hover:bg-muted/50 text-muted-foreground"
                                }`}
                              >
                                <div
                                  className={`w-3.5 h-3.5 rounded flex items-center justify-center border transition-colors ${
                                    isSelected ? "bg-primary border-primary text-primary-foreground" : "border-input"
                                  }`}
                                >
                                  {isSelected && <Check className="h-2.5 w-2.5" />}
                                </div>
                                <span className="truncate">{feat.label}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">Max Outlets Allowed</label>
                <Input
                  id="max-outlets"
                  type="number"
                  min={1}
                  max={100}
                  value={planForm.maxOutlets}
                  onChange={(e) => setPlanForm((f) => ({ ...f, maxOutlets: Number(e.target.value) }))}
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">Subscription State</label>
                <Select
                  id="sub-status"
                  value={planForm.subscriptionStatus}
                  onValueChange={(v) => setPlanForm((f) => ({ ...f, subscriptionStatus: v }))}
                  options={[
                    { value: "trial", label: "Free Trial" },
                    { value: "active", label: "Active Subscription" },
                    { value: "past_due", label: "Past Due" },
                    { value: "unpaid", label: "Unpaid / Suspended" },
                  ]}
                />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Plan Expiry Date</label>
              <Input
                id="plan-expires"
                type="date"
                value={planForm.planExpiresAt}
                onChange={(e) => setPlanForm((f) => ({ ...f, planExpiresAt: e.target.value }))}
              />
            </div>

            <div className="flex gap-3 pt-3 border-t border-border">
              <Button
                variant="outline"
                type="button"
                className="flex-1 cursor-pointer"
                onClick={() => setShowPlanModal(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="flex-1 cursor-pointer font-semibold"
                disabled={planMutation.isPending}
              >
                {planMutation.isPending ? "Updating Settings..." : "Save Plan Settings"}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* ── MODAL: MANUAL SUBSCRIPTION ENTRY ────────────────────────────── */}
      {showManualSubModal && (
        <Modal
          open={showManualSubModal}
          onClose={() => setShowManualSubModal(false)}
          title={`Manual Subscription: ${selectedBusiness?.name || "Business"}`}
          size="sm"
        >
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (selectedBusiness) {
                manualSubMutation.mutate({
                  businessId: selectedBusiness._id,
                  isCustomPlan: true,
                  billingCycle: manualSubForm.billingCycle,
                  amount: manualSubForm.amount ? Number(manualSubForm.amount) : undefined,
                  currency: manualSubForm.currency || undefined,
                  paymentReference: manualSubForm.paymentReference || undefined,
                  endDate: manualSubForm.endDate || undefined,
                  notes: manualSubForm.notes || undefined,
                });
              }
            }}
            className="space-y-4"
          >
            <div>
              <p className="text-sm font-semibold text-foreground">{selectedBusiness?.name}</p>
              <p className="text-xs text-muted-foreground">Record manual bank transfer or direct offline payment.</p>
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Billing Cycle</label>
              <Select
                id="manual-cycle"
                value={manualSubForm.billingCycle}
                onValueChange={(v) => setManualSubForm((f) => ({ ...f, billingCycle: v }))}
                options={[
                  { value: "monthly", label: "Monthly" },
                  { value: "yearly", label: "Yearly" },
                ]}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">Amount Paid</label>
                <Input
                  id="manual-amount"
                  type="number"
                  placeholder="e.g. 4999"
                  value={manualSubForm.amount}
                  onChange={(e) => setManualSubForm((f) => ({ ...f, amount: e.target.value }))}
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">Currency</label>
                <Select
                  id="manual-currency"
                  value={manualSubForm.currency}
                  onValueChange={(v) => setManualSubForm((f) => ({ ...f, currency: v }))}
                  options={[
                    { value: "INR", label: "INR (₹)" },
                    { value: "USD", label: "USD ($)" },
                    { value: "EUR", label: "EUR (€)" },
                    { value: "GBP", label: "GBP (£)" },
                    { value: "AED", label: "AED (د.إ)" },
                    { value: "SAR", label: "SAR (ر.س)" },
                  ]}
                />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Payment Reference</label>
              <Input
                id="manual-ref"
                placeholder="e.g. NEFT_20261114_001"
                value={manualSubForm.paymentReference}
                onChange={(e) => setManualSubForm((f) => ({ ...f, paymentReference: e.target.value }))}
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Expiry Date</label>
              <Input
                id="manual-expires"
                type="date"
                value={manualSubForm.endDate}
                onChange={(e) => setManualSubForm((f) => ({ ...f, endDate: e.target.value }))}
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Internal Notes</label>
              <Input
                id="manual-notes"
                placeholder="Offline verification notes"
                value={manualSubForm.notes}
                onChange={(e) => setManualSubForm((f) => ({ ...f, notes: e.target.value }))}
              />
            </div>

            <div className="flex gap-3 pt-3 border-t border-border">
              <Button
                variant="outline"
                type="button"
                className="flex-1 cursor-pointer"
                onClick={() => setShowManualSubModal(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="flex-1 cursor-pointer font-semibold"
                disabled={manualSubMutation.isPending}
              >
                {manualSubMutation.isPending ? "Recording..." : "Apply Subscription"}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* ── MODAL: TENANT IMPERSONATION ──────────────────────────────────── */}
      {showImpersonateModal && (
        <Modal
          open={showImpersonateModal}
          onClose={() => setShowImpersonateModal(false)}
          title={`Impersonate Tenant: ${impersonateTargetBusiness?.name}`}
          size="md"
        >
          <div className="space-y-4">
            <p className="text-xs text-muted-foreground">
              Select an account owner or staff member to enter their store session. All administrative actions are recorded in immutable audit logs.
            </p>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="pl-9"
                placeholder="Search by staff name or phone..."
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
              />
            </div>

            <div className="max-h-64 overflow-y-auto space-y-2 pr-1">
              {loadingUsers ? (
                <div className="py-8 text-center text-xs text-muted-foreground animate-pulse">
                  Loading business staff members...
                </div>
              ) : bizUsers.length === 0 ? (
                <div className="py-8 text-center text-xs text-muted-foreground">
                  No users found matching your search.
                </div>
              ) : (
                bizUsers.map((u) => (
                  <div
                    key={u._id}
                    className="flex items-center justify-between gap-3 rounded-xl border border-border bg-card p-3 shadow-2xs hover:bg-muted/30 transition-colors"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-sm text-foreground truncate">{u.name}</p>
                        <Badge variant="outline" className="text-[10px] uppercase font-bold tracking-wider">
                          {u.role}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {u.phone} • {u.email || "No email"}
                      </p>
                    </div>

                    <Button
                      size="sm"
                      className="gap-1.5 cursor-pointer shrink-0"
                      onClick={() => executeImpersonation(u._id)}
                      disabled={impersonatingId !== null}
                    >
                      <LogIn className="h-3.5 w-3.5" />
                      <span>{impersonatingId === u._id ? "Logging In..." : "Log In"}</span>
                    </Button>
                  </div>
                ))
              )}
            </div>
          </div>
        </Modal>
      )}

      {/* ── MODAL: EMAIL PREVIEW ─────────────────────────────────────────── */}
      {showEmailPreviewModal && (
        <Modal
          open={showEmailPreviewModal}
          onClose={() => setShowEmailPreviewModal(false)}
          title="Subscription Invoice Email Preview"
          size="lg"
        >
          <div className="space-y-4">
            <div className="bg-white border rounded-xl h-[60vh] shadow-inner overflow-hidden">
              <iframe
                className="w-full h-full"
                srcDoc={previewHtml}
                title="Email Preview"
                sandbox="allow-same-origin"
              />
            </div>
            <div className="flex gap-3 pt-2">
              <Button
                variant="outline"
                type="button"
                className="flex-1 cursor-pointer"
                onClick={() => setShowEmailPreviewModal(false)}
              >
                Close Preview
              </Button>
              <Button
                className="flex-1 cursor-pointer font-semibold"
                onClick={sendEmail}
                disabled={isSendingEmail}
              >
                {isSendingEmail ? "Dispatching..." : "Send Subscription Email"}
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* ── MODAL: PLAN REQUEST HISTORY ─────────────────────────────────── */}
      {showHistoryModal && historyBusiness && (
        <Modal
          open={showHistoryModal}
          onClose={() => {
            setShowHistoryModal(false);
            setHistoryBusiness(null);
          }}
          title={`Plan Request History: ${historyBusiness.name}`}
          size="md"
        >
          <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2 pt-2">
            {loadingHistory ? (
              <div className="py-8 text-center text-xs text-muted-foreground animate-pulse">
                Loading request timeline...
              </div>
            ) : historyData?.logs?.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground bg-muted/20 rounded-xl">
                No plan request history found for this business.
              </div>
            ) : (
              <div className="relative border-l border-border ml-3 space-y-6">
                {historyData?.logs?.map((log: any) => (
                  <div key={log._id} className="relative pl-6">
                    <div
                      className={`absolute -left-1.5 top-1.5 h-3 w-3 rounded-full border-2 border-background ${
                        log.action === "admin_plan_change_approved"
                          ? "bg-emerald-500"
                          : log.action === "admin_plan_change_rejected"
                          ? "bg-destructive"
                          : "bg-primary"
                      }`}
                    />
                    <div className="flex flex-col">
                      <span className="text-xs text-muted-foreground font-mono">
                        {new Date(log.createdAt).toLocaleString()}
                      </span>
                      <span className="text-sm font-medium mt-1 text-foreground">
                        {log.action === "agent_plan_change_requested" && "Agent submitted custom plan proposal"}
                        {log.action === "admin_plan_change_approved" && "Administrator approved plan upgrade"}
                        {log.action === "admin_plan_change_rejected" && "Administrator rejected request"}
                      </span>
                      {log.message && (
                        <div className="text-xs text-muted-foreground mt-1 bg-muted/30 p-2.5 rounded-lg border border-border/60">
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

      {/* ── CONFIRMATION DIALOG: CANCEL SUBSCRIPTION ────────────────────── */}
      <ConfirmDialog
        open={Boolean(cancelBusiness)}
        onClose={() => setCancelBusiness(null)}
        onConfirm={() => {
          if (cancelBusiness) cancelSubMutation.mutate(cancelBusiness._id);
        }}
        title="Cancel Tenant Subscription?"
        message={`Are you sure you want to cancel the subscription for ${
          cancelBusiness?.name || "this business"
        }? Access will be locked at the end of the current billing period.`}
        confirmLabel="Confirm Cancellation"
        variant="danger"
        loading={cancelSubMutation.isPending}
      />
    </div>
  );
}
