"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import {
  ClipboardList,
  AlertTriangle,
  ShieldCheck,
  User,
  Clock,
  Globe,
  Layers,
  Package,
  ShoppingCart,
  Award,
  Users,
  Settings,
  ShieldAlert,
  FileText,
  Activity,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DataTable } from "@/components/ui/data-table";
import { Avatar } from "@/components/ui/avatar";
import { useAuth } from "@/components/auth/auth-provider";
import { adminService } from "@/services/admin.service";
import type { AuditLog } from "@/lib/types";
import { useQueryStates, parseAsString, parseAsInteger } from "nuqs";
import { JollyDateRangePicker } from "@/components/ui/jolly-date-picker";
import { parseDate } from "@internationalized/date";
import { cn } from "@/lib/utils";

const ACTION_CONFIG: Record<
  string,
  { label: string; variant: "soft" | "warning" | "danger" | "secondary" | "outline" }
> = {
  create: { label: "Created", variant: "soft" },
  update: { label: "Updated", variant: "warning" },
  delete: { label: "Deleted", variant: "danger" },
  refund: { label: "Refunded", variant: "danger" },
  login: { label: "User Login", variant: "secondary" },
  register: { label: "User Registered", variant: "soft" },
  impersonate_start: { label: "Impersonation Began", variant: "danger" },
  impersonate_end: { label: "Impersonation Ended", variant: "warning" },
};

const MODULE_ICONS: Record<string, any> = {
  orders: ShoppingCart,
  products: Package,
  categories: Layers,
  brands: Award,
  customers: Users,
  auth: ShieldCheck,
  settings: Settings,
  business: Settings,
  outlets: StoreIcon,
};

function StoreIcon(props: any) {
  return <Settings {...props} />;
}

export default function AuditLogsPage() {
  const { token } = useAuth();

  const [query, setQuery] = useQueryStates({
    page: parseAsInteger.withDefault(1),
    limit: parseAsInteger.withDefault(50),
    from: parseAsString.withDefault(""),
    to: parseAsString.withDefault(""),
  });

  const [moduleFilter, setModuleFilter] = React.useState<string>("all");

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["audit-logs", query.page, query.limit, query.from, query.to],
    queryFn: () =>
      adminService.getAuditLogs(token, {
        page: query.page,
        limit: query.limit,
        from: query.from || undefined,
        to: query.to || undefined,
      }),
    enabled: Boolean(token),
  });

  const logs: AuditLog[] = React.useMemo(() => {
    return data?.data ?? (data as any)?.logs ?? (Array.isArray(data) ? data : []);
  }, [data]);

  const filteredLogs = React.useMemo(() => {
    if (moduleFilter === "all") return logs;
    return logs.filter((l) => (l.module || "").toLowerCase() === moduleFilter.toLowerCase());
  }, [logs, moduleFilter]);

  const totalLogsCount = data?.meta?.pagination?.total ?? logs.length;

  const criticalActionsCount = React.useMemo(() => {
    return logs.filter(
      (l) => l.action === "delete" || l.action === "refund" || l.action?.includes("impersonate")
    ).length;
  }, [logs]);

  const uniqueActorsCount = React.useMemo(() => {
    return new Set(logs.map((l) => l.actorName || "System")).size;
  }, [logs]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Audit Logs</h1>
            <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 text-xs">
              Security Trail
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">
            Immutable activity log tracking billing changes, catalog modifications, and authentication events.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <JollyDateRangePicker
            label="Filter Date"
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
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        <Card className="border border-border/70 bg-card shadow-2xs hover:shadow-xs transition-shadow">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                Total Audit Entries
              </p>
              <p className="text-xl font-extrabold text-foreground tracking-tight mt-1 truncate">
                {totalLogsCount} Events
              </p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Recorded system modifications
              </p>
            </div>
            <div className="h-10 w-10 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 border border-indigo-500/20">
              <ClipboardList className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border border-border/70 bg-card shadow-2xs hover:shadow-xs transition-shadow">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                Critical Operations
              </p>
              <p className={cn("text-xl font-extrabold tracking-tight mt-1 truncate", criticalActionsCount > 0 ? "text-amber-600 dark:text-amber-400" : "text-foreground")}>
                {criticalActionsCount} Operations
              </p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Deletions, refunds & voids
              </p>
            </div>
            <div className="h-10 w-10 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 border border-amber-500/20">
              <AlertTriangle className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border border-border/70 bg-card shadow-2xs hover:shadow-xs transition-shadow">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                Active Operators
              </p>
              <p className="text-xl font-extrabold text-foreground tracking-tight mt-1 truncate">
                {uniqueActorsCount} Staff / Users
              </p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Actors performing mutations
              </p>
            </div>
            <div className="h-10 w-10 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 border border-blue-500/20">
              <User className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border border-border/70 bg-card shadow-2xs hover:shadow-xs transition-shadow">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                System Health
              </p>
              <p className="text-xl font-extrabold text-emerald-600 dark:text-emerald-400 tracking-tight mt-1 truncate">
                Live Auditing
              </p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                100% events monitored
              </p>
            </div>
            <div className="h-10 w-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/20">
              <Activity className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Table */}
      <DataTable
        isLoading={isLoading}
        data={filteredLogs}
        keyExtractor={(l) => l._id}
        totalItems={totalLogsCount}
        page={query.page}
        limit={query.limit}
        onPageChange={(p) => setQuery({ page: p })}
        onLimitChange={(l) => setQuery({ limit: l, page: 1 })}
        onRefetch={() => refetch()}
        emptyStateIcon={<ClipboardList className="h-12 w-12 text-muted/30" />}
        emptyStateText="No audit logs recorded for the selected date range."
        filters={
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 w-full">
            <Tabs
              value={moduleFilter}
              onValueChange={(v) => setModuleFilter(v)}
              className="w-auto shrink-0"
            >
              <TabsList className="h-9 bg-muted/60 p-0.5 border border-border/40 shrink-0">
                <TabsTrigger
                  value="all"
                  className="h-full text-xs px-3.5 font-semibold whitespace-nowrap shrink-0 text-muted-foreground hover:text-foreground data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-xs transition-all"
                >
                  All Activity ({logs.length})
                </TabsTrigger>
                <TabsTrigger
                  value="orders"
                  className="h-full text-xs px-3.5 font-semibold whitespace-nowrap shrink-0 text-muted-foreground hover:text-foreground data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-xs transition-all"
                >
                  Billing & Orders
                </TabsTrigger>
                <TabsTrigger
                  value="products"
                  className="h-full text-xs px-3.5 font-semibold whitespace-nowrap shrink-0 text-muted-foreground hover:text-foreground data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-xs transition-all"
                >
                  Products & Catalog
                </TabsTrigger>
                <TabsTrigger
                  value="categories"
                  className="h-full text-xs px-3.5 font-semibold whitespace-nowrap shrink-0 text-muted-foreground hover:text-foreground data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-xs transition-all"
                >
                  Categories
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        }
        columns={[
          {
            key: "actor",
            header: "Operator / Actor",
            render: (l: AuditLog) => (
              <div className="flex items-center gap-2.5">
                <Avatar name={l.actorName ?? "System"} size="sm" />
                <div className="min-w-0">
                  <p className="text-xs font-bold text-foreground truncate">
                    {l.actorName || "System Automation"}
                  </p>
                  {l.impersonatorName ? (
                    <p className="text-[10px] text-destructive font-semibold flex items-center gap-1 mt-0.5">
                      <AlertTriangle className="h-3 w-3" />
                      <span>via {l.impersonatorName}</span>
                    </p>
                  ) : (
                    <span className="text-[10px] text-muted-foreground font-mono">
                      User Verified
                    </span>
                  )}
                </div>
              </div>
            ),
          },
          {
            key: "module",
            header: "Target Module",
            render: (l: AuditLog) => {
              const Icon = MODULE_ICONS[(l.module || "").toLowerCase()] || Layers;
              return (
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-muted/60 text-foreground border border-border/60 capitalize">
                  <Icon className="h-3.5 w-3.5 text-primary" />
                  <span>{l.module || "General"}</span>
                </div>
              );
            },
          },
          {
            key: "action",
            header: "Action Taken",
            render: (l: AuditLog) => {
              const cfg = ACTION_CONFIG[l.action] || {
                label: l.action.replace(/_/g, " "),
                variant: "secondary" as const,
              };
              return (
                <Badge
                  variant={cfg.variant}
                  className="capitalize text-[11px] font-bold px-2 py-0.5"
                >
                  {cfg.label}
                </Badge>
              );
            },
          },
          {
            key: "details",
            header: "Operation Details",
            render: (l: AuditLog) => (
              <div className="min-w-0 max-w-sm">
                <p className="text-xs font-medium text-foreground truncate">
                  {l.message || l.targetName || "System event logged"}
                </p>
                {l.targetType && (
                  <span className="text-[10px] font-mono text-muted-foreground block mt-0.5">
                    Target: {l.targetType} {l.targetName ? `(${l.targetName})` : ""}
                  </span>
                )}
              </div>
            ),
          },
          {
            key: "ip",
            header: "IP Origin",
            render: (l: AuditLog) => (
              <span className="text-xs font-mono text-muted-foreground bg-muted/40 px-2 py-0.5 rounded border border-border/40">
                {l.ip || "Localhost"}
              </span>
            ),
          },
          {
            key: "time",
            header: "Timestamp",
            render: (l: AuditLog) => (
              <div className="text-xs font-mono text-muted-foreground whitespace-nowrap flex items-center gap-1">
                <Clock className="h-3 w-3 text-muted-foreground" />
                <span>{new Date(l.createdAt).toLocaleString("en-IN")}</span>
              </div>
            ),
          },
        ]}
      />
    </div>
  );
}
