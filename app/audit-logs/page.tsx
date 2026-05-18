"use client";

import { useQuery } from "@tanstack/react-query";
import { ClipboardList, AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/ui/data-table";
import { Avatar } from "@/components/ui/avatar";
import { useAuth } from "@/components/auth/auth-provider";
import { getJson } from "@/lib/api-client";
import type { AuditLog } from "@/lib/types";

const actionColors: Record<string, "soft" | "warning" | "danger" | "secondary"> = {
  create: "soft", update: "warning", delete: "danger", refund: "danger",
  login: "secondary", register: "soft", impersonate_start: "danger", impersonate_end: "warning"
};

export default function AuditLogsPage() {
  const { token } = useAuth();
  const { data, isLoading } = useQuery({
    queryKey: ["audit-logs"],
    queryFn: () => getJson<{ logs: AuditLog[]; total: number }>("/audit-logs", token),
    enabled: Boolean(token)
  });

  const logs = data?.logs ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Audit Logs</h1>
        <p className="text-sm text-muted">Track all system activities and changes</p>
      </div>

      <DataTable
        loading={isLoading}
        data={logs}
        keyExtractor={(l) => l._id}
        emptyMessage="No audit logs yet."
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
