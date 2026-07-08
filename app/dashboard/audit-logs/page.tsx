"use client";

import { useQuery } from "@tanstack/react-query";
import { ClipboardList, AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/ui/data-table";
import { Avatar } from "@/components/ui/avatar";
import { useAuth } from "@/components/auth/auth-provider";
import { adminService } from "@/services/admin.service";
import type { AuditLog } from "@/lib/types";
import { useQueryStates, parseAsString, parseAsInteger } from "nuqs";
import { JollyDateRangePicker } from "@/components/ui/jolly-date-picker";
import { parseDate } from "@internationalized/date";

const actionColors: Record<string, "soft" | "warning" | "danger" | "secondary"> = {
  create: "soft", update: "warning", delete: "danger", refund: "danger",
  login: "secondary", register: "soft", impersonate_start: "danger", impersonate_end: "warning"
};

export default function AuditLogsPage() {
  const { token } = useAuth();
  
  const [query, setQuery] = useQueryStates({
    page: parseAsInteger.withDefault(1),
    limit: parseAsInteger.withDefault(50),
    from: parseAsString.withDefault(""),
    to: parseAsString.withDefault("")
  });

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["audit-logs", query.page, query.limit, query.from, query.to],
    queryFn: () => adminService.getAuditLogs(token, {
      page: query.page,
      limit: query.limit,
      from: query.from || undefined,
      to: query.to || undefined
    }),
    enabled: Boolean(token)
  });

  const logs = data?.logs ?? data ?? []; // Adjust depending on response format

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Audit Logs</h1>
          <p className="text-sm text-muted">Track all system activities and changes</p>
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
        isLoading={isLoading}
        data={Array.isArray(logs) ? logs : []}
        keyExtractor={(l) => l._id}
        totalItems={data?.meta?.pagination?.total ?? (Array.isArray(logs) ? logs.length : 0)}
        page={query.page}
        limit={query.limit}
        onPageChange={(p) => setQuery({ page: p })}
        onLimitChange={(l) => setQuery({ limit: l, page: 1 })}
        onRefetch={() => refetch()}
        emptyStateIcon={<ClipboardList className="h-12 w-12 text-muted/30" />}
        emptyStateText="No audit logs found in the selected date range."
        columns={[
          {
            key: "actor", header: "Actor",
            render: (l) => (
              <div className="flex items-center gap-2">
                <Avatar name={l.actorName ?? "?"} size="sm" />
                <div>
                  <p className="text-sm font-medium">{l.actorName || "System"}</p>
                  {l.impersonatorName && (
                    <p className="text-xs text-danger flex items-center gap-1">
                      <AlertTriangle className="h-3 w-3" />
                      via {l.impersonatorName}
                    </p>
                  )}
                </div>
              </div>
            )
          },
          { key: "module", header: "Module", render: (l) => <span className="text-xs font-medium text-muted capitalize">{l.module || "—"}</span> },
          {
            key: "action", header: "Action",
            render: (l) => <Badge variant={actionColors[l.action] ?? "secondary"} className="capitalize text-xs">{l.action.replace(/_/g, " ")}</Badge>
          },
          { key: "message", header: "Details", render: (l) => <span className="text-sm text-muted max-w-xs truncate block">{l.message || l.targetName || "—"}</span> },
          { key: "ip", header: "IP", render: (l) => <span className="text-xs font-mono text-muted">{l.ip || "—"}</span> },
          { key: "createdAt", header: "Time", render: (l) => <span className="text-xs text-muted whitespace-nowrap">{new Date(l.createdAt).toLocaleString("en-IN")}</span> }
        ]}
      />
    </div>
  );
}
