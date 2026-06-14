"use client";

import * as React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2 } from "lucide-react";
import { toast } from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select } from "@/components/ui/select";
import { DataTable } from "@/components/ui/data-table";
import { useAuth } from "@/components/auth/auth-provider";
import { apiFetch } from "@/lib/api-client";
import { getErrorMessage } from "@/lib/error";
import { adminService } from "@/services/admin.service";

export default function AdminOutletsPage() {
  const { token } = useAuth();
  const qc = useQueryClient();

  const [search, setSearch] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<string>("all");

  const { data: outletsData, isLoading: loadingOutlets, refetch } = useQuery({
    queryKey: ["admin-outlets", search, statusFilter],
    queryFn: () => adminService.getAdminOutlets(token, { search: search || undefined, status: statusFilter !== "all" ? statusFilter : undefined }),
    enabled: Boolean(token)
  });

  const approveOutlet = useMutation({
    mutationFn: (id: string) => adminService.approveOutlet(id, token),
    onSuccess: () => {
      toast.success("Outlet approved successfully");
      qc.invalidateQueries({ queryKey: ["admin-outlets"] });
    },
    onError: (err) => toast.error(getErrorMessage(err))
  });

  const updateStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => adminService.updateOutletStatus(id, status, token),
    onSuccess: () => {
      toast.success("Outlet status updated");
      qc.invalidateQueries({ queryKey: ["admin-outlets"] });
    },
    onError: (err) => toast.error(getErrorMessage(err))
  });

  const outlets = outletsData?.outlets ?? [];

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <DataTable
        isLoading={loadingOutlets}
        data={outlets}
        keyExtractor={(o) => o._id}
        searchQuery={search}
        onSearchChange={setSearch}
        onRefetch={() => refetch()}
        placeholderText="Search outlets..."
        emptyStateText="No outlets registered on the platform matching search."
        filters={
          <Select id="status-filter" value={statusFilter} onValueChange={setStatusFilter} className="w-48 h-9" options={[
            { value: "all", label: "All Statuses" },
            { value: "pending", label: "Pending Approval" },
            { value: "active", label: "Active" },
            { value: "suspended", label: "Suspended" },
            { value: "banned", label: "Banned" }
          ]} />
        }
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
                  <Button variant="default" size="xs" className="gap-1 bg-success hover:bg-success/90" onClick={() => approveOutlet.mutate(o._id)}>
                    <CheckCircle2 className="h-3 w-3" /> Approve Outlet
                  </Button>
                )}
                <div className="w-28">
                  <Select
                    id={`set-outlet-status-${o._id}`}
                    value={o.status || "pending"}
                    onValueChange={(status) => updateStatus.mutate({ id: o._id, status })}
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
