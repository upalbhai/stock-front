"use client";

import * as React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Store,
  Building2,
  CheckCircle2,
  Clock,
  ShieldAlert,
  RefreshCw,
  MoreHorizontal,
  User,
  Phone,
  Mail,
  Copy,
  Check,
  AlertCircle,
  ExternalLink,
} from "lucide-react";
import Link from "next/link";
import { toast } from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import { getErrorMessage } from "@/lib/error";
import { adminService } from "@/services/admin.service";
import { APP_ROUTES } from "@/lib/routes";
import { formatDate } from "@/lib/format";
import { useQueryStates, parseAsString, parseAsInteger } from "nuqs";

export default function AdminOutletsPage() {
  const { token } = useAuth();
  const qc = useQueryClient();
  const [copiedId, setCopiedId] = React.useState<string | null>(null);

  const [query, setQuery] = useQueryStates({
    search: parseAsString.withDefault(""),
    statusFilter: parseAsString.withDefault("all"),
    page: parseAsInteger.withDefault(1),
  });

  const { data: outletsData, isLoading: loadingOutlets, refetch } = useQuery({
    queryKey: ["admin-outlets", query.search, query.statusFilter, query.page],
    queryFn: () =>
      adminService.getAdminOutlets(token, {
        search: query.search || undefined,
        status: query.statusFilter !== "all" ? query.statusFilter : undefined,
        page: query.page,
        limit: 10,
      } as any),
    enabled: Boolean(token),
  });

  const approveOutlet = useMutation({
    mutationFn: (id: string) => adminService.approveOutlet(id, token),
    onSuccess: () => {
      toast.success("Outlet approved successfully");
      qc.invalidateQueries({ queryKey: ["admin-outlets"] });
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const updateStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      adminService.updateOutletStatus(id, status, token),
    onSuccess: () => {
      toast.success("Outlet status updated");
      qc.invalidateQueries({ queryKey: ["admin-outlets"] });
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const outlets = outletsData?.outlets ?? [];
  const totalCount = outletsData?.total ?? outlets.length;
  const activeCount = outlets.filter((o: any) => o.status === "active").length;
  const pendingCount = outlets.filter((o: any) => o.status === "pending").length;
  const unassignedCount = outlets.filter((o: any) => !o.managerId).length;

  const handleCopyId = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    toast.success("Outlet ID copied");
    setTimeout(() => setCopiedId(null), 2000);
  };

  const columns = React.useMemo(
    () => [
      {
        key: "name",
        header: "Outlet Branch",
        render: (o: any) => (
          <div className="flex items-center gap-3 py-1">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary ring-1 ring-primary/20 shadow-2xs">
              <Store className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-sm text-foreground truncate max-w-[200px]">{o.name}</span>
                {o.isDefault && (
                  <span className="inline-flex items-center rounded-md bg-primary/10 px-1.5 py-0.2 text-[9px] font-bold uppercase tracking-wider text-primary border border-primary/20">
                    Main Branch
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Building2 className="h-3 w-3 text-muted-foreground/70" />
                  <span className="truncate max-w-[150px]">{o.businessId?.name || "Unattached Store"}</span>
                </span>
                <span className="text-muted-foreground/50">•</span>
                <div className="flex items-center gap-1">
                  <span className="text-[10px] text-muted-foreground font-mono">ID: {o._id.slice(-6)}</span>
                  <button
                    onClick={(e) => handleCopyId(o._id, e)}
                    className="text-muted-foreground hover:text-foreground transition-colors p-0.5"
                    title="Copy Full ID"
                  >
                    {copiedId === o._id ? (
                      <Check className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
                    ) : (
                      <Copy className="h-3 w-3" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        ),
      },
      {
        key: "manager",
        header: "Assigned Manager",
        render: (o: any) => {
          if (!o.managerId) {
            return (
              <div className="flex items-center gap-1.5 py-1 text-amber-600 dark:text-amber-400 text-xs">
                <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                <span className="font-medium">Unassigned Manager</span>
              </div>
            );
          }

          return (
            <div className="flex flex-col py-1">
              <div className="flex items-center gap-1.5">
                <User className="h-3.5 w-3.5 text-muted-foreground/70 shrink-0" />
                <span className="font-medium text-sm text-foreground truncate max-w-[180px]">
                  {o.managerId.name}
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                {o.managerId.phone && (
                  <span className="font-mono">{o.managerId.phone}</span>
                )}
                {o.managerId.email && (
                  <>
                    <span className="text-muted-foreground/40">•</span>
                    <a
                      href={`mailto:${o.managerId.email}`}
                      className="truncate max-w-[140px] hover:text-primary transition-colors"
                    >
                      {o.managerId.email}
                    </a>
                  </>
                )}
              </div>
            </div>
          );
        },
      },
      {
        key: "status",
        header: "Approval & State",
        render: (o: any) => {
          const status = o.status || "inactive";
          const isPending = status === "pending";
          const isActive = status === "active";

          return (
            <div className="inline-flex items-center gap-1.5 py-1">
              <span
                className={`h-2 w-2 rounded-full ${isPending
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
        header: "Operations",
        render: (o: any) => (
          <div className="flex gap-2 items-center justify-end pr-3">
            {o.status === "pending" && (
              <Button
                variant="default"
                size="xs"
                className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold cursor-pointer shadow-2xs"
                onClick={() => approveOutlet.mutate(o._id)}
                disabled={approveOutlet.isPending}
              >
                <CheckCircle2 className="h-3.5 w-3.5" /> Approve
              </Button>
            )}

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon-xs" className="h-8 w-8 p-0 cursor-pointer">
                  <span className="sr-only">Open menu</span>
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuLabel className="text-xs">Outlet Actions</DropdownMenuLabel>
                {o.businessId?._id && (
                  <DropdownMenuItem asChild className="cursor-pointer">
                    <Link
                      href={`${APP_ROUTES.ADMIN_BUSINESSES}?search=${encodeURIComponent(o.businessId.name || "")}`}
                    >
                      <Building2 className="mr-2 h-4 w-4 text-primary" /> View Business
                    </Link>
                  </DropdownMenuItem>
                )}

                <DropdownMenuSeparator />
                <DropdownMenuLabel className="text-xs">Change Status</DropdownMenuLabel>
                <DropdownMenuItem
                  onClick={() => updateStatus.mutate({ id: o._id, status: "active" })}
                  className="cursor-pointer"
                >
                  Set Active
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => updateStatus.mutate({ id: o._id, status: "suspended" })}
                  className="cursor-pointer"
                >
                  Suspend Outlet
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => updateStatus.mutate({ id: o._id, status: "banned" })}
                  className="text-destructive focus:text-destructive focus:bg-destructive/10 cursor-pointer"
                >
                  Ban Outlet
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ),
      },
    ],
    [approveOutlet.mutate, approveOutlet.isPending, updateStatus.mutate, copiedId]
  );

  return (
    <div className="space-y-4 animate-in fade-in duration-300">
      {/* ── COMPACT SECTION HEADER & LIVE METRIC STRIP ───────────────────── */}
      <div className="flex flex-col gap-3 rounded-xl border border-border/80 bg-card p-3 sm:p-3.5 shadow-2xs">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-base sm:text-lg font-bold tracking-tight text-foreground sm:text-xl">
                Outlet Branches
              </h1>
              <span className="inline-flex items-center rounded-md bg-primary/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary border border-primary/20 shrink-0">
                Physical Branches
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5 hidden sm:block">
              Platform-wide registry of retail outlets, store branches, assigned managers, and approval states.
            </p>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            className="h-7 sm:h-8 gap-1 px-2 sm:px-2.5 text-xs cursor-pointer shadow-2xs hover:bg-accent shrink-0"
          >
            <RefreshCw className={`h-3 w-3 ${loadingOutlets ? "animate-spin text-primary" : "text-muted-foreground"}`} />
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
            <Store className="h-3.5 w-3.5" />
            <span>All Outlets</span>
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
              {activeCount}
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
              {pendingCount}
            </span>
          </button>

          {/* Chip 4: Unassigned Managers Warning */}
          {unassignedCount > 0 && (
            <div className="inline-flex items-center gap-2 rounded-lg border border-amber-500/25 bg-amber-500/5 px-3 py-1.5 text-xs text-amber-700 dark:text-amber-300 shrink-0">
              <AlertCircle className="h-3.5 w-3.5 text-amber-500" />
              <span>Unassigned Managers</span>
              <span className="rounded-md bg-amber-500/15 px-1.5 py-0.2 text-[10px] font-mono font-bold">
                {unassignedCount}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* ── MAIN DATA TABLE ──────────────────────────────────────────────── */}
      <DataTable
        isLoading={loadingOutlets}
        data={outlets}
        keyExtractor={(o: any) => o._id}
        searchQuery={query.search}
        onSearchChange={(s) => setQuery({ search: s, page: 1 })}
        onRefetch={() => refetch()}
        placeholderText="Search outlets..."
        emptyStateText="No outlet branches registered on the platform matching search."
        totalItems={outletsData?.total}
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
    </div>
  );
}
