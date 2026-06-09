"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/ui/data-table";
import { useAuth } from "@/components/auth/auth-provider";
import { getJson } from "@/lib/api-client";
import type { AuditLog } from "@/lib/types";

export default function AdminAuditLogsPage() {
  const { token } = useAuth();

  const { data: auditData, isLoading: loadingAudit } = useQuery({
    queryKey: ["admin-audit-logs"],
    queryFn: () => getJson<{ logs: AuditLog[]; total: number }>("/audit-logs", token),
    enabled: Boolean(token)
  });

  const auditLogs = auditData?.logs ?? [];

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <DataTable
        loading={loadingAudit}
        data={auditLogs}
        keyExtractor={(l) => l._id}
        emptyMessage="No platform-wide audit activities found."
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
