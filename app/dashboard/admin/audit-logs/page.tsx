"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/ui/data-table";
import { useAuth } from "@/components/auth/auth-provider";
import { adminService } from "@/services/admin.service";
import type { AuditLog } from "@/lib/types";
import { useQueryStates, parseAsString, parseAsInteger } from "nuqs";
import { JollyDateRangePicker } from "@/components/ui/jolly-date-picker";
import { parseDate } from "@internationalized/date";

export default function AdminAuditLogsPage() {
  const { token } = useAuth();

  const [query, setQuery] = useQueryStates({
    page: parseAsInteger.withDefault(1),
    limit: parseAsInteger.withDefault(20),
    from: parseAsString.withDefault(""),
    to: parseAsString.withDefault("")
  });

  const { data: auditData, isLoading: loadingAudit, refetch } = useQuery({
    queryKey: ["admin-audit-logs", query.page, query.limit, query.from, query.to],
    queryFn: () => adminService.getAuditLogs(token, {
      page: query.page,
      limit: query.limit,
      from: query.from || undefined,
      to: query.to || undefined
    }),
    enabled: Boolean(token)
  });

  const auditLogs = auditData?.data ?? (auditData as any)?.logs ?? (Array.isArray(auditData) ? auditData : []);

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold">Platform Audit Logs</h1>
          <p className="text-xs text-muted">Track superadmin actions</p>
        </div>
        <JollyDateRangePicker
          label="Date Filter"
          value={(query.from && query.to) ? { start: parseDate(query.from.split('T')[0]), end: parseDate(query.to.split('T')[0]) } : null}
          onChange={(val) => {
            if (val) {
              setQuery({
                from: val.start.toString() + "T00:00:00.000Z",
                to: val.end.toString() + "T23:59:59.999Z",
                page: 1
              });
            } else {
              setQuery({ from: "", to: "", page: 1 });
            }
          }}
        />
      </div>
      <DataTable
        isLoading={loadingAudit}
        data={Array.isArray(auditLogs) ? auditLogs : []}
        keyExtractor={(l) => l._id}
        totalItems={auditData?.meta?.pagination?.total ?? (Array.isArray(auditLogs) ? auditLogs.length : 0)}
        page={query.page}
        limit={query.limit}
        onPageChange={(p) => setQuery({ page: p })}
        onLimitChange={(l) => setQuery({ limit: l, page: 1 })}
        onRefetch={() => refetch()}
        emptyStateText="No platform-wide audit activities found."
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
    </div>
  );
}
