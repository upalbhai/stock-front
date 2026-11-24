"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminService } from "@/services/admin.service";
import { useAuth } from "@/components/auth/auth-provider";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "react-hot-toast";
import { getErrorMessage } from "@/lib/error";
import { formatCurrency, formatDate } from "@/lib/format";
import { DataTable, ColumnDef } from "@/components/ui/data-table";
import {
  CheckCircle2,
  XCircle,
  Building2,
  User,
  Clock,
  Calendar,
  RefreshCw,
  Copy,
  Check,
  Receipt,
  ArrowRight,
  Layers,
  ArrowUpRight,
  History,
  ShieldAlert,
} from "lucide-react";
import Link from "next/link";
import { APP_ROUTES } from "@/lib/routes";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";

const COUNTRY_MAP: Record<string, { name: string; flag: string; defaultCurrency: string }> = {
  IN: { name: "India", flag: "🇮🇳", defaultCurrency: "INR" },
  US: { name: "United States", flag: "🇺🇸", defaultCurrency: "USD" },
  AE: { name: "UAE", flag: "🇦🇪", defaultCurrency: "AED" },
  GB: { name: "UK", flag: "🇬🇧", defaultCurrency: "GBP" },
  EU: { name: "Europe", flag: "🇪🇺", defaultCurrency: "EUR" },
  CA: { name: "Canada", flag: "🇨🇦", defaultCurrency: "CAD" },
  AU: { name: "Australia", flag: "🇦🇺", defaultCurrency: "AUD" },
  SG: { name: "Singapore", flag: "🇸🇬", defaultCurrency: "SGD" },
  SA: { name: "Saudi Arabia", flag: "🇸🇦", defaultCurrency: "SAR" },
  QA: { name: "Qatar", flag: "🇶🇦", defaultCurrency: "QAR" },
  OM: { name: "Oman", flag: "🇴🇲", defaultCurrency: "OMR" },
  KW: { name: "Kuwait", flag: "🇰🇼", defaultCurrency: "KWD" },
  BH: { name: "Bahrain", flag: "🇧🇭", defaultCurrency: "BHD" },
};

export default function AdminPlanRequestsPage() {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  const [selectedRequest, setSelectedRequest] = useState<any | null>(null);
  const [isApproving, setIsApproving] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [searchQuery, setSearchQuery] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const [reason, setReason] = useState("");
  const [approvalPrice, setApprovalPrice] = useState("");
  const [approvalCurrency, setApprovalCurrency] = useState("INR");
  const [approvalCycle, setApprovalCycle] = useState<"monthly" | "yearly">("monthly");
  const [historyBusiness, setHistoryBusiness] = useState<any | null>(null);
  const [statusFilter, setStatusFilter] = useState<"pending" | "history" | "all">("pending");

  React.useEffect(() => {
    if (selectedRequest) {
      const cur =
        selectedRequest.pendingCustomPlan?.currency ||
        selectedRequest.currency ||
        (selectedRequest.isInternational ? "USD" : "INR");
      setApprovalCurrency(cur);
      setApprovalCycle(
        selectedRequest.pendingCustomPlan?.billingCycle === "yearly" ? "yearly" : "monthly"
      );
      setApprovalPrice(
        selectedRequest.pendingCustomPlan?.price != null
          ? String(selectedRequest.pendingCustomPlan.price)
          : selectedRequest.customPlanDetails?.price != null
          ? String(selectedRequest.customPlanDetails.price)
          : "0"
      );
    }
  }, [selectedRequest]);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["admin-plan-requests", page, limit, searchQuery, statusFilter],
    queryFn: () =>
      adminService.getPendingPlanRequests(token!, {
        page,
        limit,
        search: searchQuery || undefined,
        status: statusFilter,
      }),
    enabled: Boolean(token),
  });

  const { data: historyData, isLoading: loadingHistory } = useQuery({
    queryKey: ["admin-plan-history", historyBusiness?._id],
    queryFn: () => adminService.getPlanRequestHistory(historyBusiness!._id, token!),
    enabled: Boolean(token && historyBusiness),
  });

  const requests = data?.data?.requests || [];
  const meta = data?.meta?.pagination;
  const totalCount = meta?.total || requests.length;
  const counts = (data?.data as any)?.counts || {
    pending: requests.filter((r: any) => Boolean(r.pendingCustomPlan)).length,
    history: requests.filter((r: any) => !r.pendingCustomPlan && Boolean(r.lastPlanRequestStatus)).length,
    all: totalCount,
  };

  const handleCopyId = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    toast.success("ID copied to clipboard");
    setTimeout(() => setCopiedId(null), 2000);
  };

  const approveMutation = useMutation({
    mutationFn: (param: {
      businessId: string;
      reason: string;
      price?: number;
      currency?: string;
      billingCycle?: string;
    }) =>
      adminService.approvePlanRequest(
        param.businessId,
        {
          reason: param.reason,
          price: param.price,
          currency: param.currency,
          billingCycle: param.billingCycle,
        },
        token!
      ),
    onSuccess: () => {
      toast.success("Plan approved successfully");
      queryClient.invalidateQueries({ queryKey: ["admin-plan-requests"] });
      queryClient.invalidateQueries({ queryKey: ["admin-businesses"] });
      setSelectedRequest(null);
      setIsApproving(false);
      setReason("");
      setApprovalPrice("");
    },
    onError: (err) => {
      toast.error(getErrorMessage(err));
      setIsApproving(false);
    },
  });

  const rejectMutation = useMutation({
    mutationFn: (param: { businessId: string; reason: string }) =>
      adminService.rejectPlanRequest(param.businessId, param.reason, token!),
    onSuccess: () => {
      toast.success("Plan request rejected");
      queryClient.invalidateQueries({ queryKey: ["admin-plan-requests"] });
      setSelectedRequest(null);
      setIsRejecting(false);
      setReason("");
      setApprovalPrice("");
    },
    onError: (err) => {
      toast.error(getErrorMessage(err));
      setIsRejecting(false);
    },
  });

  const handleApprove = (businessId: string) => {
    setIsApproving(true);
    approveMutation.mutate({
      businessId,
      reason,
      price: approvalPrice !== "" ? Number(approvalPrice) : 0,
      currency: approvalCurrency,
      billingCycle: approvalCycle,
    });
  };

  const handleReject = (businessId: string) => {
    if (!reason.trim()) {
      toast.error("Please provide a reason for rejection.");
      return;
    }
    setIsRejecting(true);
    rejectMutation.mutate({ businessId, reason });
  };

  const columns: ColumnDef<any>[] = [
    {
      key: "business",
      header: "Business Tenant",
      render: (row) => {
        const initial = row.name ? row.name.charAt(0).toUpperCase() : "B";
        return (
          <div className="flex items-center gap-3 py-1">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary font-bold text-sm ring-1 ring-primary/20 shadow-2xs">
              {initial}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-semibold text-sm text-foreground truncate max-w-[200px]">
                  {row.name}
                </span>
                {(() => {
                  const countryCode = (row.country || row.detectedCountry || row.countryCode || "IN").toUpperCase();
                  const countryInfo = COUNTRY_MAP[countryCode] || { name: countryCode, flag: "🌐", defaultCurrency: "USD" };
                  const isIntl = row.isInternational || countryCode !== "IN";
                  return (
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium border ${
                        isIntl
                          ? "bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/30"
                          : "bg-muted text-muted-foreground border-border/60"
                      }`}
                      title={`Country: ${countryInfo.name} (${countryCode})${isIntl ? " - International Client" : " - Domestic Client"}`}
                    >
                      <span>{countryInfo.flag}</span>
                      <span>{countryInfo.name}</span>
                      {isIntl && (
                        <span className="font-bold text-[9px] uppercase tracking-wider text-purple-600 dark:text-purple-400">
                          • INTL
                        </span>
                      )}
                    </span>
                  );
                })()}
                <Link
                  href={`${APP_ROUTES.ADMIN_BUSINESSES}?search=${encodeURIComponent(row.name || "")}`}
                  className="text-muted-foreground hover:text-primary transition-colors p-0.5"
                  title="View Business in Registry"
                >
                  <ArrowUpRight className="h-3 w-3" />
                </Link>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                <span className="text-[10px] font-mono">ID: {row._id.slice(-6)}</span>
                <button
                  onClick={(e) => handleCopyId(row._id, e)}
                  className="text-muted-foreground hover:text-foreground transition-colors p-0.5"
                  title="Copy Full ID"
                >
                  {copiedId === row._id ? (
                    <Check className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
                  ) : (
                    <Copy className="h-3 w-3" />
                  )}
                </button>
              </div>
              {row.lastPlanRequestStatus?.status && (
                <div className="flex items-center gap-1 text-[10px] text-muted-foreground mt-0.5">
                  <span>Prior decision:</span>
                  <span
                    className={`font-semibold capitalize ${
                      row.lastPlanRequestStatus.status === "approved"
                        ? "text-emerald-600 dark:text-emerald-400"
                        : "text-destructive"
                    }`}
                  >
                    {row.lastPlanRequestStatus.status}
                  </span>
                  {row.lastPlanRequestStatus.date && (
                    <span>• {formatDate(row.lastPlanRequestStatus.date)}</span>
                  )}
                </div>
              )}
            </div>
          </div>
        );
      },
    },
    {
      key: "requester",
      header: "Requested By",
      render: (row) => {
        const isAgent = Boolean(row.agentId);
        const agentName = row.agentId?.name;
        const requesterName = row.pendingCustomPlan?.requestedBy?.name;

        return (
          <div className="flex flex-col py-1">
            <div className="flex items-center gap-1.5">
              <User className="h-3.5 w-3.5 text-muted-foreground/70 shrink-0" />
              <span className="font-medium text-sm text-foreground">
                {requesterName || (isAgent ? agentName : "Store Owner")}
              </span>
            </div>
            <div className="flex items-center gap-1.5 mt-0.5">
              {isAgent ? (
                <span className="inline-flex items-center rounded bg-blue-500/10 px-1.5 py-0.2 text-[10px] font-medium text-blue-700 dark:text-blue-300 border border-blue-500/20">
                  Agent: {agentName}
                </span>
              ) : (
                <span className="inline-flex items-center rounded bg-emerald-500/10 px-1.5 py-0.2 text-[10px] font-medium text-emerald-700 dark:text-emerald-300 border border-emerald-500/20">
                  Direct / Self-Serve
                </span>
              )}
            </div>
            {row.pendingCustomPlan?.requestedAt && (
              <div className="flex items-center gap-1 text-[11px] text-muted-foreground mt-0.5">
                <Calendar className="h-3 w-3 text-muted-foreground/60" />
                <span>{formatDate(row.pendingCustomPlan.requestedAt)}</span>
              </div>
            )}
          </div>
        );
      },
    },
    {
      key: "currentPlan",
      header: "Current Allocation",
      render: (row) => {
        const price = row.customPlanDetails?.price || 0;
        const currency = row.customPlanDetails?.currency || row.currency || "INR";
        const cycle = row.customPlanDetails?.billingCycle || "monthly";
        const prodLabel =
          row.maxProducts === 0
            ? "Unlimited products"
            : `${row.maxProducts ?? 50} products`;
        const outletLabel = `${row.maxOutlets ?? 1} ${row.maxOutlets === 1 ? "outlet" : "outlets"}`;

        return (
          <div className="flex flex-col py-1 text-xs">
            <span className="font-semibold text-foreground">
              {formatCurrency(price, currency)}
              <span className="text-[10px] text-muted-foreground font-normal"> / {cycle}</span>
            </span>
            <span className="text-[11px] text-muted-foreground mt-0.5">
              {prodLabel} • {outletLabel}
            </span>
          </div>
        );
      },
    },
    {
      key: "requestedPlan",
      header: "Proposed Tier",
      render: (row) => {
        if (!row.pendingCustomPlan && row.lastPlanRequestStatus) {
          const isApproved = row.lastPlanRequestStatus.status === "approved";
          const price = row.customPlanDetails?.price || 0;
          const currency = row.customPlanDetails?.currency || row.currency || "INR";
          const cycle = row.customPlanDetails?.billingCycle || "monthly";

          return (
            <div className="flex flex-col py-1 text-xs">
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-foreground">
                  {price > 0 ? formatCurrency(price, currency) : "Free / Base"}
                  <span className="text-[10px] text-muted-foreground font-normal"> / {cycle}</span>
                </span>
                <span
                  className={`inline-flex items-center rounded-md px-1.5 py-0.2 text-[9px] font-bold uppercase tracking-wider ${
                    isApproved
                      ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                      : "bg-destructive/10 text-destructive border border-destructive/20"
                  }`}
                >
                  {isApproved ? "Approved Tier" : "Rejected"}
                </span>
              </div>
              <span className="text-[11px] text-muted-foreground mt-0.5">
                {row.maxProducts === 0 ? "Unlimited products" : `${row.maxProducts ?? 50} products`} •{" "}
                {row.maxOutlets ?? 1} {row.maxOutlets === 1 ? "outlet" : "outlets"}
              </span>
              {row.lastPlanRequestStatus.reason && (
                <span
                  className="text-[10px] text-muted-foreground/80 italic mt-0.5 max-w-[200px] truncate"
                  title={row.lastPlanRequestStatus.reason}
                >
                  Decision Note: {row.lastPlanRequestStatus.reason}
                </span>
              )}
            </div>
          );
        }

        const hasExplicitPrice =
          row.pendingCustomPlan?.price != null && row.pendingCustomPlan.price > 0;
        const price = hasExplicitPrice
          ? row.pendingCustomPlan.price
          : row.customPlanDetails?.price || 0;
        const currency =
          row.pendingCustomPlan?.currency ||
          row.customPlanDetails?.currency ||
          row.currency ||
          "INR";
        const cycle =
          row.pendingCustomPlan?.billingCycle ||
          row.customPlanDetails?.billingCycle ||
          "monthly";

        // Handle products: 0 means unlimited, explicit number, or fallback to current
        const productsDisplay =
          row.pendingCustomPlan?.maxProducts === 0
            ? "Unlimited products"
            : row.pendingCustomPlan?.maxProducts != null
            ? `${row.pendingCustomPlan.maxProducts} products`
            : `${row.maxProducts ?? 50} products (current)`;

        // Handle outlets: explicit number or fallback to current
        const outletsDisplay =
          row.pendingCustomPlan?.maxOutlets != null
            ? `${row.pendingCustomPlan.maxOutlets} ${
                row.pendingCustomPlan.maxOutlets === 1 ? "outlet" : "outlets"
              }`
            : `${row.maxOutlets ?? 1} ${row.maxOutlets === 1 ? "outlet" : "outlets"} (current)`;

        const hasFeatures =
          Array.isArray(row.pendingCustomPlan?.enabledFeatures) &&
          row.pendingCustomPlan.enabledFeatures.length > 0;

        return (
          <div className="flex flex-col py-1 text-xs">
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-primary">
                {hasExplicitPrice ? (
                  <>
                    {formatCurrency(price, currency)}
                    <span className="text-[10px] text-muted-foreground font-normal"> / {cycle}</span>
                  </>
                ) : price > 0 ? (
                  <>
                    {formatCurrency(price, currency)}
                    <span className="text-[10px] text-muted-foreground font-normal"> (current)</span>
                  </>
                ) : (
                  <span>Quote Pending</span>
                )}
              </span>
              <span className="inline-flex items-center rounded-md bg-primary/10 px-1.5 py-0.2 text-[9px] font-bold uppercase tracking-wider text-primary border border-primary/20">
                {hasFeatures ? "Features" : "Custom"}
              </span>
            </div>
            <span className="text-[11px] text-muted-foreground mt-0.5">
              {productsDisplay} • {outletsDisplay}
            </span>
            {hasFeatures && (
              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium mt-0.5">
                +{row.pendingCustomPlan.enabledFeatures.length} feature modules
              </span>
            )}
            {row.pendingCustomPlan?.notes && (
              <span
                className="text-[10px] text-muted-foreground/80 italic mt-0.5 max-w-[200px] truncate"
                title={row.pendingCustomPlan.notes}
              >
                Note: {row.pendingCustomPlan.notes}
              </span>
            )}
          </div>
        );
      },
    },
    {
      key: "actions",
      header: "Decision",
      render: (row) => {
        if (!row.pendingCustomPlan && row.lastPlanRequestStatus) {
          const isApproved = row.lastPlanRequestStatus.status === "approved";
          return (
            <div className="flex items-center justify-end gap-2 pr-2">
              <div className="flex flex-col items-end text-right">
                <span
                  className={`inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                    isApproved
                      ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                      : "bg-destructive/10 text-destructive border border-destructive/20"
                  }`}
                >
                  {isApproved ? "Approved" : "Rejected"}
                </span>
                {row.lastPlanRequestStatus.date && (
                  <span className="text-[10px] text-muted-foreground mt-0.5">
                    {formatDate(row.lastPlanRequestStatus.date)}
                  </span>
                )}
              </div>

              <Button
                variant="outline"
                size="xs"
                onClick={() => setHistoryBusiness(row)}
                className="gap-1 text-xs cursor-pointer shadow-2xs hover:bg-accent h-7.5 px-2.5"
                title="View Full Decision Timeline"
              >
                <History className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="hidden sm:inline">Timeline</span>
              </Button>

              <Link
                href={`${APP_ROUTES.ADMIN_BUSINESSES}?search=${encodeURIComponent(row.name)}`}
                className="inline-flex items-center gap-1 text-xs text-primary hover:underline h-7.5 px-1.5"
                title="Inspect in Tenant Registry"
              >
                <span>Inspect</span>
                <ArrowUpRight className="h-3 w-3" />
              </Link>
            </div>
          );
        }

        return (
          <div className="flex items-center justify-end gap-1.5 pr-2">
            <Button
              variant="outline"
              size="xs"
              onClick={() => setHistoryBusiness(row)}
              className="gap-1 text-xs cursor-pointer shadow-2xs hover:bg-accent h-7.5 px-2.5"
              title="View Decision History Timeline"
            >
              <History className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="hidden sm:inline">History</span>
            </Button>

            <Button
              variant="default"
              size="xs"
              onClick={() => {
                setSelectedRequest({ ...row, action: "approve" });
                setReason("");
                setApprovalPrice(
                  row.pendingCustomPlan?.price != null && row.pendingCustomPlan.price > 0
                    ? String(row.pendingCustomPlan.price)
                    : row.customPlanDetails?.price != null && row.customPlanDetails.price > 0
                    ? String(row.customPlanDetails.price)
                    : ""
                );
              }}
              className="gap-1 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold cursor-pointer shadow-2xs h-7.5 px-2.5"
              title="Approve Plan Request"
            >
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span>Approve</span>
            </Button>

            <Button
              variant="outline"
              size="xs"
              onClick={() => {
                setSelectedRequest({ ...row, action: "reject" });
                setReason("");
                setApprovalPrice("");
              }}
              className="gap-1 text-xs border-destructive/30 text-destructive hover:bg-destructive/10 cursor-pointer shadow-2xs h-7.5 px-2.5"
              title="Reject Plan Request"
            >
              <XCircle className="h-3.5 w-3.5" />
              <span>Reject</span>
            </Button>
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-4 animate-in fade-in duration-300">
      {/* ── COMPACT SECTION HEADER & LIVE METRIC STRIP ───────────────────── */}
      <div className="flex flex-col gap-3 rounded-xl border border-border/80 bg-card p-3 sm:p-3.5 shadow-2xs">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-base sm:text-lg font-bold tracking-tight text-foreground sm:text-xl">
                Custom Plan Requests
              </h1>
              <span className="inline-flex items-center rounded-md bg-amber-500/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 border border-amber-500/25 shrink-0">
                Quota Review
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5 hidden sm:block">
              Review and approve custom plan requests, pricing adjustments, and quota limits submitted by agents and clients.
            </p>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            className="h-7 sm:h-8 gap-1 px-2 sm:px-2.5 text-xs cursor-pointer shadow-2xs hover:bg-accent shrink-0"
          >
            <RefreshCw className={`h-3 w-3 ${isLoading ? "animate-spin text-primary" : "text-muted-foreground"}`} />
            <span className="hidden sm:inline">Refresh</span>
          </Button>
        </div>

        {/* ── COMPACT METRIC FILTER CHIPS (SLIM, ONLY 34px TALL) ─────────── */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar scroll-smooth border-t border-border/60 pt-2.5 -mx-3 px-3 sm:mx-0 sm:px-0 sm:flex-wrap">
          {/* Chip 1: Pending Approvals */}
          <button
            type="button"
            onClick={() => {
              setStatusFilter("pending");
              setPage(1);
            }}
            className={`inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs transition-all cursor-pointer shrink-0 ${
              statusFilter === "pending"
                ? "border-amber-500 bg-amber-500/10 text-amber-700 dark:text-amber-300 font-semibold shadow-2xs"
                : "border-border/80 bg-background text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-amber-500" />
            </span>
            <span>Pending Approvals</span>
            <span
              className={`rounded-md px-1.5 py-0.2 text-[10px] font-mono font-bold ${
                statusFilter === "pending"
                  ? "bg-amber-500 text-white"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {counts.pending}
            </span>
          </button>

          {/* Chip 2: Decision History */}
          <button
            type="button"
            onClick={() => {
              setStatusFilter("history");
              setPage(1);
            }}
            className={`inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs transition-all cursor-pointer shrink-0 ${
              statusFilter === "history"
                ? "border-emerald-500 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 font-semibold shadow-2xs"
                : "border-border/80 bg-background text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>Decision History</span>
            <span
              className={`rounded-md px-1.5 py-0.2 text-[10px] font-mono font-bold ${
                statusFilter === "history"
                  ? "bg-emerald-600 text-white"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {counts.history}
            </span>
          </button>

          {/* Chip 3: All Requests */}
          <button
            type="button"
            onClick={() => {
              setStatusFilter("all");
              setPage(1);
            }}
            className={`inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs transition-all cursor-pointer shrink-0 ${
              statusFilter === "all"
                ? "border-primary bg-primary/10 text-primary font-semibold shadow-2xs"
                : "border-border/80 bg-background text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            <Receipt className="h-3.5 w-3.5 text-primary" />
            <span>All Plan Requests</span>
            <span
              className={`rounded-md px-1.5 py-0.2 text-[10px] font-mono font-bold ${
                statusFilter === "all"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {counts.all}
            </span>
          </button>

          {/* Chip 4: Audit Trail Link */}
          <Link
            href="/dashboard/admin/audit-logs"
            className="inline-flex items-center gap-1.5 rounded-lg border border-border/80 bg-background px-3 py-1.5 text-xs text-muted-foreground hover:bg-muted hover:text-foreground transition-all cursor-pointer shadow-2xs ml-auto shrink-0"
            title="View platform-wide security and billing audit log"
          >
            <ShieldAlert className="h-3.5 w-3.5 text-primary" />
            <span>Billing Audit Trail</span>
          </Link>
        </div>
      </div>

      {/* ── MAIN DATA TABLE ──────────────────────────────────────────────── */}
      <DataTable
        data={requests}
        columns={columns}
        isLoading={isLoading}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        placeholderText="Search plan requests..."
        emptyStateText={
          statusFilter === "history"
            ? "No plan request decision history found."
            : statusFilter === "all"
            ? "No plan requests found."
            : "No pending custom plan requests found in the queue."
        }
        page={page}
        limit={limit}
        totalItems={totalCount}
        onPageChange={setPage}
        onLimitChange={setLimit}
      />

      {/* ── DIALOG: APPROVE / REJECT CONFIRMATION ────────────────────────── */}
      <Dialog
        open={Boolean(selectedRequest)}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedRequest(null);
            setReason("");
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-bold">
              {selectedRequest?.action === "approve" ? (
                <>
                  <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                  <span>Approve Custom Plan Request</span>
                </>
              ) : (
                <>
                  <XCircle className="h-5 w-5 text-destructive" />
                  <span>Reject Custom Plan Request</span>
                </>
              )}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <p className="text-xs text-muted-foreground">
              Confirm your decision for{" "}
              <strong className="text-foreground">{selectedRequest?.name}</strong>.
            </p>

            {selectedRequest?.action === "approve" ? (
              <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3.5 space-y-2.5">
                <p className="text-xs font-semibold text-emerald-900 dark:text-emerald-300">
                  New Plan Allocation Summary:
                </p>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div className="rounded-lg bg-card p-2 border border-border">
                    <span className="text-[10px] text-muted-foreground block font-medium">Price</span>
                    <span className="font-bold text-primary block mt-0.5">
                      {selectedRequest.pendingCustomPlan?.price != null &&
                      selectedRequest.pendingCustomPlan.price > 0
                        ? formatCurrency(
                            selectedRequest.pendingCustomPlan.price,
                            selectedRequest.pendingCustomPlan.currency || "INR"
                          )
                        : selectedRequest.customPlanDetails?.price
                        ? formatCurrency(
                            selectedRequest.customPlanDetails.price,
                            selectedRequest.customPlanDetails.currency || "INR"
                          )
                        : "Quote / Free"}
                    </span>
                  </div>
                  <div className="rounded-lg bg-card p-2 border border-border">
                    <span className="text-[10px] text-muted-foreground block font-medium">Max Products</span>
                    <span className="font-bold text-foreground block mt-0.5">
                      {selectedRequest.pendingCustomPlan?.maxProducts === 0
                        ? "Unlimited"
                        : selectedRequest.pendingCustomPlan?.maxProducts != null
                        ? selectedRequest.pendingCustomPlan.maxProducts
                        : selectedRequest.maxProducts != null
                        ? `${selectedRequest.maxProducts} (Current)`
                        : "50 (Default)"}
                    </span>
                  </div>
                  <div className="rounded-lg bg-card p-2 border border-border">
                    <span className="text-[10px] text-muted-foreground block font-medium">Max Outlets</span>
                    <span className="font-bold text-foreground block mt-0.5">
                      {selectedRequest.pendingCustomPlan?.maxOutlets != null
                        ? selectedRequest.pendingCustomPlan.maxOutlets
                        : selectedRequest.maxOutlets != null
                        ? `${selectedRequest.maxOutlets} (Current)`
                        : "1 (Default)"}
                    </span>
                  </div>
                </div>

                {Array.isArray(selectedRequest.pendingCustomPlan?.enabledFeatures) &&
                  selectedRequest.pendingCustomPlan.enabledFeatures.length > 0 && (
                    <div className="rounded-lg bg-card p-2.5 border border-border text-xs">
                      <span className="text-[10px] text-muted-foreground block font-medium mb-1">
                        Requested Feature Modules:
                      </span>
                      <div className="flex flex-wrap gap-1">
                        {selectedRequest.pendingCustomPlan.enabledFeatures.map(
                          (f: string) => (
                            <span
                              key={f}
                              className="inline-flex items-center rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium text-foreground capitalize border border-border/60"
                            >
                              {f.replace(/_/g, " ")}
                            </span>
                          )
                        )}
                      </div>
                    </div>
                  )}

                {selectedRequest.pendingCustomPlan?.notes && (
                  <div className="rounded-lg bg-card p-2.5 border border-border text-xs">
                    <span className="text-[10px] text-muted-foreground block font-medium">
                      Client / Agent Request Note:
                    </span>
                    <p className="text-foreground italic mt-0.5">
                      {selectedRequest.pendingCustomPlan.notes}
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-3.5 text-xs text-destructive space-y-1">
                <p className="font-semibold">Rejection Notification</p>
                <p className="text-[11px] leading-relaxed">
                  The client and submitting partner agent will be notified of this decision along with the reason provided below.
                </p>
              </div>
            )}

            {selectedRequest?.action === "approve" && (
              <div className="space-y-3 rounded-xl border border-border bg-muted/20 p-3.5">
                <div className="grid grid-cols-2 gap-2.5">
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-foreground">
                      Billing Currency
                    </label>
                    <Select
                      className="w-full"
                      size="sm"
                      value={approvalCurrency}
                      onValueChange={setApprovalCurrency}
                      options={[
                        { value: "INR", label: "₹ INR (India - Domestic)" },
                        { value: "USD", label: "$ USD (US & Global)" },
                        { value: "AED", label: "د.إ AED (UAE)" },
                        { value: "EUR", label: "€ EUR (Eurozone)" },
                        { value: "GBP", label: "£ GBP (UK)" },
                        { value: "CAD", label: "$ CAD (Canada)" },
                        { value: "AUD", label: "$ AUD (Australia)" },
                        { value: "SGD", label: "$ SGD (Singapore)" },
                        { value: "SAR", label: "﷼ SAR (Saudi Arabia)" },
                      ]}
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-foreground">
                      Billing Cycle
                    </label>
                    <Select
                      className="w-full"
                      size="sm"
                      value={approvalCycle}
                      onValueChange={(v) => setApprovalCycle(v as "monthly" | "yearly")}
                      options={[
                        { value: "monthly", label: "Monthly" },
                        { value: "yearly", label: "Yearly" },
                      ]}
                    />
                  </div>
                </div>

                <div className="space-y-1.5 pt-1 border-t border-border/60">
                  <div className="flex items-center justify-between">
                    <label htmlFor="approvalPrice" className="text-xs font-semibold text-foreground">
                      Subscription Price ({approvalCurrency})
                    </label>
                    {Number(approvalPrice) === 0 ? (
                      <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                        Complimentary (₹0 / $0)
                      </span>
                    ) : (
                      <span className="text-[10px] text-primary font-semibold">
                        Paid Tier
                      </span>
                    )}
                  </div>
                  <Input
                    id="approvalPrice"
                    type="number"
                    min="0"
                    step="1"
                    className="h-8 text-xs font-mono bg-card"
                    placeholder="0"
                    value={approvalPrice}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setApprovalPrice(e.target.value)}
                  />
                  {Number(approvalPrice) === 0 ? (
                    <p className="text-[10px] text-emerald-700 dark:text-emerald-300 font-medium">
                      ✨ Setting price to <strong>0</strong> activates the account immediately for 1 year. The client will not be prompted to pay.
                    </p>
                  ) : (
                    <p className="text-[10px] text-muted-foreground">
                      The client will be billed <strong>{approvalCurrency} {approvalPrice}</strong> per {approvalCycle} via card / online checkout to activate access.
                    </p>
                  )}
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <label htmlFor="reason" className="text-xs font-medium text-foreground">
                Administrative Notes / Reason{" "}
                {selectedRequest?.action === "reject" ? (
                  <span className="text-destructive">*</span>
                ) : (
                  <span className="text-muted-foreground">(Optional)</span>
                )}
              </label>
              <textarea
                id="reason"
                className="flex min-h-[85px] w-full rounded-lg border border-input bg-card px-3 py-2 text-xs shadow-2xs placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                placeholder={
                  selectedRequest?.action === "reject"
                    ? "Explain why this custom tier request cannot be approved..."
                    : "Add approval notes or transaction references..."
                }
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0 pt-2 border-t border-border">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSelectedRequest(null);
                setReason("");
              }}
              disabled={isApproving || isRejecting}
              className="cursor-pointer"
            >
              Cancel
            </Button>
            {selectedRequest?.action === "approve" ? (
              <Button
                size="sm"
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold cursor-pointer shadow-2xs"
                onClick={() => handleApprove(selectedRequest._id)}
                disabled={isApproving}
              >
                {isApproving ? "Approving Plan..." : "Confirm & Apply Plan"}
              </Button>
            ) : (
              <Button
                variant="destructive"
                size="sm"
                onClick={() => handleReject(selectedRequest?._id)}
                disabled={isRejecting}
                className="font-semibold cursor-pointer shadow-2xs"
              >
                {isRejecting ? "Rejecting..." : "Confirm Rejection"}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── DIALOG: PLAN REQUEST HISTORY TIMELINE ───────────────────────── */}
      <Dialog
        open={Boolean(historyBusiness)}
        onOpenChange={(open) => !open && setHistoryBusiness(null)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary border border-primary/20">
                <History className="h-5 w-5" />
              </div>
              <div>
                <DialogTitle className="text-base font-bold text-foreground">
                  Plan Request History
                </DialogTitle>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Audit timeline of past proposals, approvals, and rejections for{" "}
                  <span className="font-semibold text-foreground">{historyBusiness?.name}</span>
                </p>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1 pt-2">
            {loadingHistory ? (
              <div className="py-8 text-center text-xs text-muted-foreground animate-pulse">
                <RefreshCw className="h-4 w-4 animate-spin mx-auto mb-2 text-primary" />
                Loading decision timeline...
              </div>
            ) : !historyData?.logs || historyData.logs.length === 0 ? (
              <div className="text-center py-8 text-xs text-muted-foreground bg-muted/20 rounded-xl border border-border/60">
                No previous plan change history recorded for this store.
              </div>
            ) : (
              <div className="relative border-l border-border ml-3 space-y-5">
                {historyData.logs.map((log: any) => {
                  const isApprove = log.action === "admin_plan_change_approved";
                  const isReject = log.action === "admin_plan_change_rejected";
                  return (
                    <div key={log._id} className="relative pl-6">
                      <div
                        className={`absolute -left-1.5 top-1.5 h-3 w-3 rounded-full border-2 border-background ${
                          isApprove
                            ? "bg-emerald-500"
                            : isReject
                            ? "bg-destructive"
                            : "bg-primary"
                        }`}
                      />
                      <div className="flex flex-col">
                        <span className="text-[11px] text-muted-foreground font-mono">
                          {new Date(log.createdAt).toLocaleString()}
                        </span>
                        <span className="text-xs font-semibold mt-0.5 text-foreground">
                          {log.action === "agent_plan_change_requested" &&
                            "Agent submitted custom plan proposal"}
                          {log.action === "direct_plan_change_requested" &&
                            "Client requested plan upgrade directly"}
                          {log.action === "admin_plan_change_approved" &&
                            "Administrator approved plan change"}
                          {log.action === "admin_plan_change_rejected" &&
                            "Administrator rejected request"}
                        </span>
                        {log.message && (
                          <div className="text-[11px] text-muted-foreground mt-1 bg-muted/30 p-2.5 rounded-lg border border-border/60 leading-relaxed">
                            {log.message}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <DialogFooter className="pt-2 border-t border-border">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setHistoryBusiness(null)}
              className="cursor-pointer text-xs"
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
