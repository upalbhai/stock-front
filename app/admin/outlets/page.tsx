"use client";

import * as React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Search, CheckCircle2 } from "lucide-react";
import { toast } from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select } from "@/components/ui/select";
import { DataTable } from "@/components/ui/data-table";
import { useAuth } from "@/components/auth/auth-provider";
import { getJson, apiFetch } from "@/lib/api-client";
import { getErrorMessage } from "@/lib/error";

export default function AdminOutletsPage() {
  const { token } = useAuth();
  const qc = useQueryClient();

  const [search, setSearch] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState("");

  const { data: outletsData, isLoading: loadingOutlets } = useQuery({
    queryKey: ["admin-outlets", search, statusFilter],
    queryFn: () => getJson<{ outlets: any[] }>("/admin/outlets", token, { search: search || undefined, status: statusFilter || undefined }),
    enabled: Boolean(token)
  });

  const approveOutletMutation = useMutation({
    mutationFn: (id: string) => apiFetch(`/admin/outlets/${id}/approve`, { method: "PATCH", token }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-outlets"] }); toast.success("Outlet approved"); },
    onError: (err) => toast.error(getErrorMessage(err))
  });

  const setOutletStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => apiFetch(`/admin/outlets/${id}/status`, { method: "PATCH", body: { status }, token }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-outlets"] }); toast.success("Status updated"); },
    onError: (err) => toast.error(getErrorMessage(err))
  });

  const outlets = outletsData?.outlets ?? [];

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="relative flex-1 min-w-[240px] max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <Input className="pl-9" placeholder="Search outlets..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <div className="w-48">
          <Select id="status-filter" value={statusFilter} onValueChange={setStatusFilter} options={[
            { value: "", label: "All Statuses" },
            { value: "pending", label: "Pending Approval" },
            { value: "active", label: "Active" },
            { value: "suspended", label: "Suspended" },
            { value: "banned", label: "Banned" }
          ]} />
        </div>
      </div>

      <DataTable
        loading={loadingOutlets}
        data={outlets}
        keyExtractor={(o) => o._id}
        emptyMessage="No outlets registered on the platform matching search."
        columns={[
          {
            key: "name", header: "Outlet Details",
            render: (o) => (
              <div>
                <p className="font-semibold text-sm">{o.name}</p>
                <p className="text-xs text-muted">Brand: {o.businessId?.name || "No Business associated"}</p>
                {o.email && <p className="text-[10px] text-muted font-mono">{o.email}</p>}
              </div>
            )
          },
          {
            key: "manager", header: "Assigned Manager",
            render: (o) => (
              <div>
                {o.managerId ? (
                  <>
                    <p className="text-xs font-semibold">{o.managerId.name}</p>
                    <p className="text-[10px] text-muted">{o.managerId.phone}</p>
                  </>
                ) : (
                  <span className="text-xs text-muted italic">Unassigned</span>
                )}
              </div>
            )
          },
          {
            key: "status", header: "Status",
            render: (o) => (
              <Badge variant={o.status === "active" ? "soft" : o.status === "pending" ? "warning" : "danger"} className="capitalize">
                {o.status || "inactive"}
              </Badge>
            )
          },
          {
            key: "actions", header: "Operations",
            render: (o) => (
              <div className="flex gap-2 flex-wrap">
                {o.status === "pending" && (
                  <Button variant="default" size="xs" className="gap-1 bg-success hover:bg-success/90" onClick={() => approveOutletMutation.mutate(o._id)}>
                    <CheckCircle2 className="h-3 w-3" /> Approve Outlet
                  </Button>
                )}
                <div className="w-28">
                  <Select
                    id={`set-outlet-status-${o._id}`}
                    value={o.status || "pending"}
                    onValueChange={(status) => setOutletStatusMutation.mutate({ id: o._id, status })}
                    options={[
                      { value: "active", label: "Active" },
                      { value: "suspended", label: "Suspend" },
                      { value: "banned", label: "Ban Outlet" }
                    ]}
                  />
                </div>
              </div>
            )
          }
        ]}
      />
    </div>
  );
}
