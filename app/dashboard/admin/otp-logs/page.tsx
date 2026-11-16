"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { format } from "date-fns";
import {
  CheckCircle2,
  XCircle,
  Clock,
  KeyRound,
  RefreshCw,
  Copy,
  Check,
  Mail,
  ShieldCheck,
  Search,
} from "lucide-react";
import { adminService } from "@/services/admin.service";
import { useAuth } from "@/components/auth/auth-provider";
import { DataTable, ColumnDef } from "@/components/ui/data-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "react-hot-toast";

type OtpLog = {
  _id: string;
  email: string;
  code: string;
  type: string;
  used: boolean;
  expiresAt: string;
  createdAt: string;
};

export default function AdminOtpLogsPage() {
  const { token } = useAuth();
  const [logs, setLogs] = useState<OtpLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "used" | "expired">("all");
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);

  const fetchLogs = useCallback(async () => {
    try {
      setLoading(true);
      const res = await adminService.getOtpLogs(token || "", page, limit);
      if (res.success && res.data?.logs) {
        setLogs(res.data.logs);
        setTotal(res.data.total || 0);
      }
    } catch (error) {
      console.error("Failed to fetch OTP logs:", error);
    } finally {
      setLoading(false);
    }
  }, [token, page, limit]);

  useEffect(() => {
    if (token) {
      fetchLogs();
    }
  }, [token, fetchLogs]);

  const handleCopyCode = (code: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    toast.success("OTP code copied");
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const getStatusBadge = (log: OtpLog) => {
    const isExpired = new Date(log.expiresAt) < new Date();
    if (log.used) {
      return (
        <div className="inline-flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-emerald-500" />
          <Badge variant="soft" className="text-[11px] font-medium">
            <CheckCircle2 className="w-3 h-3 mr-1 text-emerald-500" /> Used
          </Badge>
        </div>
      );
    }
    if (isExpired) {
      return (
        <div className="inline-flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-destructive" />
          <Badge variant="danger" className="text-[11px] font-medium">
            <XCircle className="w-3 h-3 mr-1" /> Expired
          </Badge>
        </div>
      );
    }
    return (
      <div className="inline-flex items-center gap-1.5">
        <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
        <Badge variant="warning" className="text-[11px] font-medium">
          <Clock className="w-3 h-3 mr-1" /> Active
        </Badge>
      </div>
    );
  };

  // Filtered logs
  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      const isExpired = new Date(log.expiresAt) < new Date();
      if (statusFilter === "used") return log.used;
      if (statusFilter === "active") return !log.used && !isExpired;
      if (statusFilter === "expired") return !log.used && isExpired;
      return true;
    });
  }, [logs, statusFilter]);

  // Metrics
  const activeCount = logs.filter(
    (l) => !l.used && new Date(l.expiresAt) >= new Date()
  ).length;
  const usedCount = logs.filter((l) => l.used).length;
  const expiredCount = logs.filter(
    (l) => !l.used && new Date(l.expiresAt) < new Date()
  ).length;

  const columns: ColumnDef<OtpLog>[] = [
    {
      header: "Recipient Email",
      accessorKey: "email",
      render: (row) => (
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary/10 text-primary">
            <Mail className="h-3.5 w-3.5" />
          </div>
          <span className="font-semibold text-xs text-foreground">{row.email}</span>
        </div>
      ),
    },
    {
      header: "Verification Code",
      accessorKey: "code",
      render: (row) => (
        <button
          type="button"
          onClick={(e) => handleCopyCode(row.code, e)}
          className="group inline-flex items-center gap-1.5 rounded-md border border-border/80 bg-muted/40 px-2 py-1 text-xs font-mono font-bold text-primary hover:bg-muted transition-colors"
          title="Click to copy OTP"
        >
          <span>{row.code}</span>
          {copiedCode === row.code ? (
            <Check className="h-3 w-3 text-emerald-500" />
          ) : (
            <Copy className="h-2.5 w-2.5 opacity-60 group-hover:opacity-100" />
          )}
        </button>
      ),
    },
    {
      header: "Dispatch Purpose",
      accessorKey: "type",
      render: (row) => (
        <span className="inline-flex items-center rounded-md bg-muted px-2 py-0.5 text-[11px] font-medium text-foreground capitalize border border-border/60">
          {row.type || "Authentication"}
        </span>
      ),
    },
    {
      header: "Token Status",
      accessorKey: "used",
      render: (row) => getStatusBadge(row),
    },
    {
      header: "Dispatched At",
      accessorKey: "createdAt",
      render: (row) => (
        <span className="text-xs text-muted-foreground whitespace-nowrap">
          {format(new Date(row.createdAt), "MMM d, yyyy h:mm a")}
        </span>
      ),
    },
    {
      header: "Expiry Time",
      accessorKey: "expiresAt",
      render: (row) => (
        <span className="text-xs text-muted-foreground whitespace-nowrap">
          {format(new Date(row.expiresAt), "h:mm a")}
        </span>
      ),
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
                One-Time Password (OTP) Logs
              </h1>
              <span className="inline-flex items-center rounded-md bg-primary/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary border border-primary/20 shrink-0">
                Auth Telemetry
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5 hidden sm:block">
              Real-time verification dispatch audit to assist clients who report email delivery latency.
            </p>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={fetchLogs}
              className="h-7 sm:h-8 gap-1 px-2 sm:px-2.5 text-xs cursor-pointer shadow-2xs hover:bg-accent"
            >
              <RefreshCw
                className={`h-3 w-3 ${loading ? "animate-spin text-primary" : "text-muted-foreground"}`}
              />
              <span className="hidden sm:inline">Refresh</span>
            </Button>
          </div>
        </div>

        {/* ── COMPACT METRIC FILTER CHIPS (SLIM, ONLY 34px TALL) ─────────── */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar scroll-smooth border-t border-border/60 pt-2.5 -mx-3 px-3 sm:mx-0 sm:px-0 sm:flex-wrap">
          {/* All OTPs */}
          <button
            type="button"
            onClick={() => setStatusFilter("all")}
            className={`inline-flex shrink-0 items-center gap-2 rounded-lg border px-3 py-1.5 text-xs transition-all cursor-pointer ${
              statusFilter === "all"
                ? "border-primary bg-primary/10 text-primary font-semibold shadow-2xs"
                : "border-border/80 bg-background text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            <KeyRound className="h-3.5 w-3.5" />
            <span>All Dispatches</span>
            <span
              className={`ml-1 rounded-full px-1.5 py-0.2 text-[10px] font-mono ${
                statusFilter === "all"
                  ? "bg-primary text-primary-foreground font-bold"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {total}
            </span>
          </button>

          {/* Active Tokens */}
          <button
            type="button"
            onClick={() => setStatusFilter("active")}
            className={`inline-flex shrink-0 items-center gap-2 rounded-lg border px-3 py-1.5 text-xs transition-all cursor-pointer ${
              statusFilter === "active"
                ? "border-primary bg-primary/10 text-primary font-semibold shadow-2xs"
                : "border-border/80 bg-background text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
            <span>Active & Valid</span>
            <span
              className={`ml-1 rounded-full px-1.5 py-0.2 text-[10px] font-mono ${
                statusFilter === "active"
                  ? "bg-primary text-primary-foreground font-bold"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {activeCount}
            </span>
          </button>

          {/* Used */}
          <button
            type="button"
            onClick={() => setStatusFilter("used")}
            className={`inline-flex shrink-0 items-center gap-2 rounded-lg border px-3 py-1.5 text-xs transition-all cursor-pointer ${
              statusFilter === "used"
                ? "border-emerald-500 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold shadow-2xs"
                : "border-border/80 bg-background text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
            <span>Verified / Used</span>
            <span
              className={`ml-1 rounded-full px-1.5 py-0.2 text-[10px] font-mono ${
                statusFilter === "used"
                  ? "bg-emerald-500 text-white font-bold"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {usedCount}
            </span>
          </button>

          {/* Expired */}
          <button
            type="button"
            onClick={() => setStatusFilter("expired")}
            className={`inline-flex shrink-0 items-center gap-2 rounded-lg border px-3 py-1.5 text-xs transition-all cursor-pointer ${
              statusFilter === "expired"
                ? "border-destructive bg-destructive/10 text-destructive font-semibold shadow-2xs"
                : "border-border/80 bg-background text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            <XCircle className="h-3.5 w-3.5 text-destructive" />
            <span>Expired</span>
            <span
              className={`ml-1 rounded-full px-1.5 py-0.2 text-[10px] font-mono ${
                statusFilter === "expired"
                  ? "bg-destructive text-destructive-foreground font-bold"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {expiredCount}
            </span>
          </button>
        </div>
      </div>

      {/* ── DATA TABLE ─────────────────────────────────────────────────── */}
      <DataTable
        title=""
        columns={columns}
        data={filteredLogs}
        isLoading={loading}
        totalItems={total}
        page={page}
        limit={limit}
        onPageChange={setPage}
        onLimitChange={setLimit}
        onRefetch={fetchLogs}
        emptyStateText="No OTP authentication records found."
        emptyStateIcon="🔑"
      />
    </div>
  );
}
