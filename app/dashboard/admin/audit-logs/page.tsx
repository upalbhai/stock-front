"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import {
  AlertTriangle,
  ShieldAlert,
  Clock,
  RefreshCw,
  Search,
  Filter,
  User,
  Activity,
  Globe,
  FileText,
  Copy,
  Check,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { useAuth } from "@/components/auth/auth-provider";
import { adminService } from "@/services/admin.service";
import type { AuditLog } from "@/lib/types";
import { useQueryStates, parseAsString, parseAsInteger } from "nuqs";
import { JollyDateRangePicker } from "@/components/ui/jolly-date-picker";
import { parseDate } from "@internationalized/date";
import { formatDate } from "@/lib/format";
import { toast } from "react-hot-toast";

export default function AdminAuditLogsPage() {
  const { token } = useAuth();
  const [copiedText, setCopiedText] = React.useState<string | null>(null);
  const [actionFilter, setActionFilter] = React.useState<string>("all");

  const [query, setQuery] = useQueryStates({
    page: parseAsInteger.withDefault(1),
    limit: parseAsInteger.withDefault(20),
    from: parseAsString.withDefault(""),
    to: parseAsString.withDefault(""),
  });

  const {
    data: auditData,
    isLoading: loadingAudit,
    refetch,
  } = useQuery({
    queryKey: [
      "admin-audit-logs",
      query.page,
      query.limit,
      query.from,
      query.to,
    ],
    queryFn: () =>
      adminService.getAuditLogs(token, {
        page: query.page,
        limit: query.limit,
        from: query.from || undefined,
        to: query.to || undefined,
      }),
    enabled: Boolean(token),
  });

  const rawLogs: AuditLog[] =
    auditData?.data ??
    (auditData as any)?.logs ??
    (Array.isArray(auditData) ? auditData : []);

  const totalLogs =
    auditData?.meta?.pagination?.total ??
    (Array.isArray(rawLogs) ? rawLogs.length : 0);

  const handleCopy = (text: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(text);
    setCopiedText(text);
    toast.success("Copied to clipboard");
    setTimeout(() => setCopiedText(null), 2000);
  };

  // Filter logs client-side if chip selected
  const auditLogs = React.useMemo(() => {
    if (!Array.isArray(rawLogs)) return [];
    if (actionFilter === "impersonation") {
      return rawLogs.filter(
        (l) => Boolean(l.impersonatorName) || l.action?.includes("impersonat")
      );
    }
    if (actionFilter === "business") {
      return rawLogs.filter(
        (l) => l.module?.toLowerCase().includes("business") || l.module?.toLowerCase().includes("tenant")
      );
    }
    if (actionFilter === "billing") {
      return rawLogs.filter(
        (l) =>
          l.module?.toLowerCase().includes("plan") ||
          l.module?.toLowerCase().includes("subscription") ||
          l.module?.toLowerCase().includes("payment")
      );
    }
    return rawLogs;
  }, [rawLogs, actionFilter]);

  const impersonationCount = (Array.isArray(rawLogs) ? rawLogs : []).filter(
    (l) => Boolean(l.impersonatorName) || l.action?.includes("impersonat")
  ).length;

  return (
    <div className="space-y-4 animate-in fade-in duration-300">
      {/* ── COMPACT SECTION HEADER & LIVE METRIC STRIP ───────────────────── */}
      <div className="flex flex-col gap-3 rounded-xl border border-border/80 bg-card p-3 sm:p-3.5 shadow-2xs">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-base sm:text-lg font-bold tracking-tight text-foreground sm:text-xl">
                Platform Audit Logs
              </h1>
              <span className="inline-flex items-center rounded-md bg-primary/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary border border-primary/20 shrink-0">
                Security Trail
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5 hidden sm:block">
              Immutable telemetry log recording administrative interventions, plan modifications, and impersonation sessions.
            </p>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <div className="hidden sm:block">
              <JollyDateRangePicker
                label="Date Range"
                value={
                  query.from && query.to
                    ? {
                        start: parseDate(query.from.split("T")[0]),
                        end: parseDate(query.to.split("T")[0]),
                      }
                    : null
                }
                onChange={(val) => {
                  if (val) {
                    setQuery({
                      from: val.start.toString() + "T00:00:00.000Z",
                      to: val.end.toString() + "T23:59:59.999Z",
                      page: 1,
                    });
                  } else {
                    setQuery({ from: "", to: "", page: 1 });
                  }
                }}
              />
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              className="h-7 sm:h-8 gap-1 px-2 sm:px-2.5 text-xs cursor-pointer shadow-2xs hover:bg-accent shrink-0"
            >
              <RefreshCw
                className={`h-3 w-3 ${loadingAudit ? "animate-spin text-primary" : "text-muted-foreground"}`}
              />
              <span className="hidden sm:inline">Refresh</span>
            </Button>
          </div>
        </div>

        {/* Mobile Date Filter */}
        <div className="sm:hidden pt-1">
          <JollyDateRangePicker
            label="Date Range"
            value={
              query.from && query.to
                ? {
                    start: parseDate(query.from.split("T")[0]),
                    end: parseDate(query.to.split("T")[0]),
                  }
                : null
            }
            onChange={(val) => {
              if (val) {
                setQuery({
                  from: val.start.toString() + "T00:00:00.000Z",
                  to: val.end.toString() + "T23:59:59.999Z",
                  page: 1,
                });
              } else {
                setQuery({ from: "", to: "", page: 1 });
              }
            }}
          />
        </div>

        {/* ── COMPACT METRIC FILTER CHIPS (SLIM, ONLY 34px TALL) ─────────── */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar scroll-smooth border-t border-border/60 pt-2.5 -mx-3 px-3 sm:mx-0 sm:px-0 sm:flex-wrap">
          {/* All Logs */}
          <button
            type="button"
            onClick={() => setActionFilter("all")}
            className={`inline-flex shrink-0 items-center gap-2 rounded-lg border px-3 py-1.5 text-xs transition-all cursor-pointer ${
              actionFilter === "all"
                ? "border-primary bg-primary/10 text-primary font-semibold shadow-2xs"
                : "border-border/80 bg-background text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            <Activity className="h-3.5 w-3.5" />
            <span>All Activities</span>
            <span
              className={`ml-1 rounded-full px-1.5 py-0.2 text-[10px] font-mono ${
                actionFilter === "all"
                  ? "bg-primary text-primary-foreground font-bold"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {totalLogs}
            </span>
          </button>

          {/* Impersonation Actions */}
          <button
            type="button"
            onClick={() => setActionFilter("impersonation")}
            className={`inline-flex shrink-0 items-center gap-2 rounded-lg border px-3 py-1.5 text-xs transition-all cursor-pointer ${
              actionFilter === "impersonation"
                ? "border-destructive bg-destructive/10 text-destructive font-semibold shadow-2xs"
                : "border-border/80 bg-background text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            <AlertTriangle className="h-3.5 w-3.5 text-destructive" />
            <span>Impersonation Sessions</span>
            <span
              className={`ml-1 rounded-full px-1.5 py-0.2 text-[10px] font-mono ${
                actionFilter === "impersonation"
                  ? "bg-destructive text-destructive-foreground font-bold"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {impersonationCount}
            </span>
          </button>

          {/* Business & Tenant */}
          <button
            type="button"
            onClick={() => setActionFilter("business")}
            className={`inline-flex shrink-0 items-center gap-2 rounded-lg border px-3 py-1.5 text-xs transition-all cursor-pointer ${
              actionFilter === "business"
                ? "border-primary bg-primary/10 text-primary font-semibold shadow-2xs"
                : "border-border/80 bg-background text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            <FileText className="h-3.5 w-3.5 text-primary" />
            <span>Tenant Events</span>
          </button>

          {/* Billing & Subscriptions */}
          <button
            type="button"
            onClick={() => setActionFilter("billing")}
            className={`inline-flex shrink-0 items-center gap-2 rounded-lg border px-3 py-1.5 text-xs transition-all cursor-pointer ${
              actionFilter === "billing"
                ? "border-primary bg-primary/10 text-primary font-semibold shadow-2xs"
                : "border-border/80 bg-background text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            <Activity className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>Billing & Plans</span>
          </button>
        </div>
      </div>

      {/* ── DATA TABLE ─────────────────────────────────────────────────── */}
      <DataTable
        isLoading={loadingAudit}
        data={auditLogs}
        keyExtractor={(l) => l._id}
        totalItems={totalLogs}
        page={query.page}
        limit={query.limit}
        onPageChange={(p) => setQuery({ page: p })}
        onLimitChange={(l) => setQuery({ limit: l, page: 1 })}
        onRefetch={() => refetch()}
        emptyStateText="No platform audit activities logged for this period."
        emptyStateIcon="🛡️"
        columns={[
          {
            key: "actor",
            header: "Security Actor",
            render: (l) => {
              const initial = l.actorName ? l.actorName.charAt(0).toUpperCase() : "S";
              return (
                <div className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 font-bold text-primary ring-1 ring-primary/20 text-xs">
                    {initial}
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-foreground">
                      {l.actorName || "System Automation"}
                    </p>
                    {l.impersonatorName && (
                      <p className="text-[10px] text-destructive flex items-center gap-1 font-semibold mt-0.5">
                        <AlertTriangle className="h-3 w-3 shrink-0" />
                        <span>Impersonated by {l.impersonatorName}</span>
                      </p>
                    )}
                  </div>
                </div>
              );
            },
          },
          {
            key: "module",
            header: "Domain / Module",
            render: (l) => (
              <span className="inline-flex items-center rounded-md bg-muted px-2 py-0.5 text-[11px] font-medium text-foreground capitalize border border-border/60">
                {l.module || "Core System"}
              </span>
            ),
          },
          {
            key: "action",
            header: "Action Type",
            render: (l) => {
              const isDanger =
                l.action.startsWith("impersonate") ||
                l.action.includes("delete") ||
                l.action.includes("ban");
              const isSuccess =
                l.action.includes("approve") ||
                l.action.includes("create") ||
                l.action.includes("verify");

              return (
                <Badge
                  variant={isDanger ? "danger" : isSuccess ? "soft" : "secondary"}
                  className="text-[10px] uppercase font-mono tracking-wider"
                >
                  {l.action.replace(/_/g, " ")}
                </Badge>
              );
            },
          },
          {
            key: "message",
            header: "Audit Message / Payload Summary",
            render: (l) => (
              <span
                className="text-xs text-muted-foreground block max-w-md truncate"
                title={l.message || ""}
              >
                {l.message || "No additional payload recorded"}
              </span>
            ),
          },
          {
            key: "ip",
            header: "Origin IP",
            render: (l) =>
              l.ip ? (
                <button
                  type="button"
                  onClick={(e) => {
                    if (l.ip) handleCopy(l.ip, e);
                  }}
                  className="group inline-flex items-center gap-1 rounded font-mono text-[11px] text-muted-foreground hover:text-foreground bg-muted/40 px-1.5 py-0.5 border border-border/60 transition-colors"
                  title="Click to copy IP address"
                >
                  <Globe className="h-2.5 w-2.5 opacity-60" />
                  <span>{l.ip}</span>
                  {copiedText === l.ip ? (
                    <Check className="h-2.5 w-2.5 text-emerald-500" />
                  ) : null}
                </button>
              ) : (
                <span className="text-xs text-muted-foreground">Internal</span>
              ),
          },
          {
            key: "createdAt",
            header: "Timestamp",
            render: (l) => (
              <div className="flex items-center gap-1 text-xs text-muted-foreground whitespace-nowrap">
                <Clock className="h-3 w-3 text-muted-foreground/70" />
                <span>{new Date(l.createdAt).toLocaleString("en-IN")}</span>
              </div>
            ),
          },
        ]}
      />
    </div>
  );
}
