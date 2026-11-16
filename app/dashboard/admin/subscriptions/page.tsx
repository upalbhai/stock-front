"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { useQueryStates, parseAsString, parseAsInteger } from "nuqs";
import {
  CreditCard,
  Building2,
  DollarSign,
  CheckCircle2,
  Clock,
  XCircle,
  AlertCircle,
  RefreshCw,
  Copy,
  Check,
  Calendar,
  Layers,
  ArrowUpRight,
} from "lucide-react";
import Link from "next/link";
import { toast } from "react-hot-toast";
import { useAuth } from "@/components/auth/auth-provider";
import { adminService } from "@/services/admin.service";
import { DataTable } from "@/components/ui/data-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { formatCurrency, formatDate } from "@/lib/format";
import { APP_ROUTES } from "@/lib/routes";

export default function AdminSubscriptionsPage() {
  const { token } = useAuth();
  const [copiedId, setCopiedId] = React.useState<string | null>(null);

  const [query, setQuery] = useQueryStates({
    search: parseAsString.withDefault(""),
    statusFilter: parseAsString.withDefault("all"),
    page: parseAsInteger.withDefault(1),
  });

  const { data: subData, isLoading, refetch } = useQuery({
    queryKey: ["admin-subscriptions", query.search, query.statusFilter, query.page],
    queryFn: () =>
      adminService.getAllSubscriptions(token, {
        search: query.search || undefined,
        status: query.statusFilter !== "all" ? query.statusFilter : undefined,
        page: query.page,
        limit: 10,
      }),
    enabled: Boolean(token),
  });

  const subscriptions = subData?.subscriptions ?? [];
  const totalCount = subData?.total ?? subscriptions.length;
  const activeCount = subscriptions.filter((s: any) => s.status === "active").length;
  const pastDueCount = subscriptions.filter((s: any) => s.status === "past_due").length;
  const churnedCount = subscriptions.filter(
    (s: any) => s.status === "cancelled" || s.status === "expired"
  ).length;

  const handleCopyId = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    toast.success("Subscription ID copied");
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getRemainingDays = (endDateStr: string) => {
    if (!endDateStr) return null;
    const diff = new Date(endDateStr).getTime() - Date.now();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    return days;
  };

  const columns = React.useMemo(
    () => [
      {
        key: "business",
        header: "Tenant Business",
        render: (s: any) => {
          const bizName = s.businessId?.name || "Unknown Business";
          const initial = bizName ? bizName.charAt(0).toUpperCase() : "B";
          return (
            <div className="flex items-center gap-3 py-1">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary font-bold text-sm ring-1 ring-primary/20 shadow-2xs">
                {initial}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-sm text-foreground truncate max-w-[200px]">
                    {bizName}
                  </span>
                  {s.businessId?.name && (
                    <Link
                      href={`${APP_ROUTES.ADMIN_BUSINESSES}?search=${encodeURIComponent(s.businessId.name)}`}
                      className="text-muted-foreground hover:text-primary transition-colors p-0.5"
                      title="Inspect Business Account"
                    >
                      <ArrowUpRight className="h-3 w-3" />
                    </Link>
                  )}
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                  <span className="truncate max-w-[170px]">{s.businessId?.email || "No email"}</span>
                  <span className="text-muted-foreground/40">•</span>
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] text-muted-foreground font-mono">ID: {s._id.slice(-6)}</span>
                    <button
                      onClick={(e) => handleCopyId(s._id, e)}
                      className="text-muted-foreground hover:text-foreground transition-colors p-0.5"
                      title="Copy Full ID"
                    >
                      {copiedId === s._id ? (
                        <Check className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
                      ) : (
                        <Copy className="h-3 w-3" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        },
      },
      {
        key: "plan",
        header: "Plan & Tier",
        render: (s: any) => {
          const planName = s.planId?.name || "Custom Tier";
          const isYearly = s.billingCycle === "yearly";
          return (
            <div className="flex flex-col py-1">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="font-semibold text-sm text-foreground">{planName}</span>
                <span className="inline-flex items-center rounded-md bg-muted px-1.5 py-0.2 text-[10px] font-mono font-medium text-muted-foreground capitalize">
                  {s.billingCycle || "monthly"}
                </span>
              </div>
              <span className="text-[10px] text-muted-foreground mt-0.5">
                {isYearly ? "Annual prepaid billing" : "Monthly recurring billing"}
              </span>
            </div>
          );
        },
      },
      {
        key: "amount",
        header: "Recurring Amount",
        render: (s: any) => {
          const currency = s.currency || "INR";
          return (
            <div className="flex flex-col py-1">
              <span className="font-bold text-sm text-foreground">
                {formatCurrency(s.amount || 0, currency)}
              </span>
              <span className="text-[10px] text-muted-foreground font-mono">
                {s.billingCycle === "yearly" ? "per year" : "per month"}
              </span>
            </div>
          );
        },
      },
      {
        key: "status",
        header: "Subscription State",
        render: (s: any) => {
          let variant: "default" | "soft" | "warning" | "danger" = "default";
          let dotColor = "bg-emerald-500";
          let label = s.status;

          switch (s.status) {
            case "active":
              variant = "soft";
              dotColor = "bg-emerald-500";
              break;
            case "past_due":
              variant = "warning";
              dotColor = "bg-amber-500 animate-pulse";
              label = "Past Due";
              break;
            case "cancelled":
              variant = "danger";
              dotColor = "bg-destructive";
              break;
            case "expired":
              variant = "soft";
              dotColor = "bg-muted-foreground";
              break;
          }

          return (
            <div className="inline-flex items-center gap-1.5 py-1">
              <span className={`h-2 w-2 rounded-full ${dotColor}`} />
              <Badge variant={variant} className="capitalize text-[11px] font-medium">
                {label}
              </Badge>
            </div>
          );
        },
      },
      {
        key: "dates",
        header: "Billing Period",
        render: (s: any) => {
          const remainingDays = getRemainingDays(s.endDate);
          const isEndingSoon = remainingDays !== null && remainingDays > 0 && remainingDays <= 7;
          return (
            <div className="flex flex-col text-xs text-muted-foreground py-1">
              <div className="flex items-center gap-1 text-foreground font-medium">
                <Calendar className="h-3 w-3 text-muted-foreground/70" />
                <span>
                  {s.startDate ? formatDate(s.startDate) : "N/A"} - {s.endDate ? formatDate(s.endDate) : "N/A"}
                </span>
              </div>
              {s.status === "active" && remainingDays !== null && (
                <span
                  className={`text-[10px] mt-0.5 font-medium ${
                    isEndingSoon
                      ? "text-amber-600 dark:text-amber-400 font-semibold"
                      : "text-muted-foreground"
                  }`}
                >
                  {remainingDays > 0
                    ? `Renews in ${remainingDays} days`
                    : "Period concluded"}
                </span>
              )}
            </div>
          );
        },
      },
      {
        key: "actions",
        header: "Account",
        render: (s: any) => (
          <div className="flex items-center justify-end pr-3">
            {s.businessId?.name && (
              <Button
                asChild
                variant="outline"
                size="xs"
                className="gap-1 text-xs cursor-pointer hover:bg-primary/10 hover:text-primary hover:border-primary/30"
              >
                <Link
                  href={`${APP_ROUTES.ADMIN_BUSINESSES}?search=${encodeURIComponent(s.businessId.name)}`}
                >
                  <Building2 className="h-3 w-3" />
                  <span>Manage</span>
                </Link>
              </Button>
            )}
          </div>
        ),
      },
    ],
    [copiedId]
  );

  return (
    <div className="space-y-4 animate-in fade-in duration-300">
      {/* ── COMPACT SECTION HEADER & LIVE METRIC STRIP ───────────────────── */}
      <div className="flex flex-col gap-3 rounded-xl border border-border/80 bg-card p-3 sm:p-3.5 shadow-2xs">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-base sm:text-lg font-bold tracking-tight text-foreground sm:text-xl">
                Platform Subscriptions
              </h1>
              <span className="inline-flex items-center rounded-md bg-primary/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary border border-primary/20 shrink-0">
                Revenue & Plans
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5 hidden sm:block">
              Live recurring revenue telemetry, plan billing cycles, customer renewal status, and accounts health.
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
          {/* Chip 1: All Subscriptions */}
          <button
            type="button"
            onClick={() => setQuery({ statusFilter: "all", page: 1 })}
            className={`inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs transition-all cursor-pointer shrink-0 ${
              query.statusFilter === "all"
                ? "bg-primary/10 text-primary border-primary/30 font-semibold shadow-2xs ring-1 ring-primary/20"
                : "bg-muted/30 border-border/80 text-muted-foreground hover:text-foreground hover:bg-muted/60"
            }`}
          >
            <CreditCard className="h-3.5 w-3.5" />
            <span>All Subscriptions</span>
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
            <span>Active Recurring</span>
            <span className="rounded-md bg-emerald-500/15 px-1.5 py-0.2 text-[10px] font-mono font-bold text-emerald-600 dark:text-emerald-400">
              {activeCount}
            </span>
          </button>

          {/* Chip 3: Past Due */}
          <button
            type="button"
            onClick={() => setQuery({ statusFilter: "past_due", page: 1 })}
            className={`inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs transition-all cursor-pointer shrink-0 ${
              query.statusFilter === "past_due"
                ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30 font-semibold shadow-2xs ring-1 ring-amber-500/20"
                : "bg-muted/30 border-border/80 text-muted-foreground hover:text-foreground hover:bg-muted/60"
            }`}
          >
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-amber-500" />
            </span>
            <span>Past Due</span>
            <span className="rounded-md bg-amber-500/15 px-1.5 py-0.2 text-[10px] font-mono font-bold text-amber-600 dark:text-amber-400">
              {pastDueCount}
            </span>
          </button>

          {/* Chip 4: Cancelled / Expired */}
          <button
            type="button"
            onClick={() => setQuery({ statusFilter: "cancelled", page: 1 })}
            className={`inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs transition-all cursor-pointer shrink-0 ${
              query.statusFilter === "cancelled" || query.statusFilter === "expired"
                ? "bg-destructive/10 text-destructive border-destructive/30 font-semibold shadow-2xs ring-1 ring-destructive/20"
                : "bg-muted/30 border-border/80 text-muted-foreground hover:text-foreground hover:bg-muted/60"
            }`}
          >
            <XCircle className="h-3.5 w-3.5 text-muted-foreground" />
            <span>Cancelled or Expired</span>
            <span className="rounded-md bg-muted px-1.5 py-0.2 text-[10px] font-mono font-bold text-muted-foreground">
              {churnedCount}
            </span>
          </button>
        </div>
      </div>

      {/* ── MAIN DATA TABLE ──────────────────────────────────────────────── */}
      <DataTable
        isLoading={isLoading}
        data={subscriptions}
        keyExtractor={(s: any) => s._id}
        searchQuery={query.search}
        onSearchChange={(s) => setQuery({ search: s, page: 1 })}
        onRefetch={() => refetch()}
        placeholderText="Search subscriptions..."
        emptyStateText="No subscriptions found matching the filters."
        totalItems={subData?.total}
        page={query.page}
        limit={10}
        onPageChange={(p) => setQuery({ page: p })}
        filters={
          <div className="flex items-center gap-2">
            <Select
              id="status-filter"
              value={query.statusFilter}
              onValueChange={(v) => setQuery({ statusFilter: v, page: 1 })}
              className="w-44"
              size="sm"
              options={[
                { value: "all", label: "All Statuses" },
                { value: "active", label: "Active" },
                { value: "past_due", label: "Past Due" },
                { value: "cancelled", label: "Cancelled" },
                { value: "expired", label: "Expired" },
              ]}
            />
          </div>
        }
        columns={columns}
      />
    </div>
  );
}
