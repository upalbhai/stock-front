"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { useQueryStates, parseAsString, parseAsInteger } from "nuqs";
import { DollarSign, CheckCircle2, Clock, XCircle, AlertCircle } from "lucide-react";
import { useAuth } from "@/components/auth/auth-provider";
import { adminService } from "@/services/admin.service";
import { DataTable } from "@/components/ui/data-table";
import { Badge } from "@/components/ui/badge";
import { Select } from "@/components/ui/select";
import { formatCurrency } from "@/lib/format";

export default function AdminSubscriptionsPage() {
  const { token } = useAuth();

  const [query, setQuery] = useQueryStates({
    search: parseAsString.withDefault(""),
    statusFilter: parseAsString.withDefault("all"),
    page: parseAsInteger.withDefault(1)
  });

  const { data: subData, isLoading, refetch } = useQuery({
    queryKey: ["admin-subscriptions", query.search, query.statusFilter, query.page],
    queryFn: () => adminService.getAllSubscriptions(token, {
      search: query.search || undefined,
      status: query.statusFilter !== "all" ? query.statusFilter : undefined,
      page: query.page,
      limit: 10
    }),
    enabled: Boolean(token)
  });

  const subscriptions = subData?.subscriptions ?? [];

  const columns = React.useMemo(() => [
    {
      key: "business", header: "Business",
      render: (s: any) => (
        <div className="flex flex-col">
          <span className="font-semibold text-sm">{s.businessId?.name || "Unknown"}</span>
          <span className="text-[10px] text-muted-foreground">{s.businessId?.email || "No email"}</span>
        </div>
      )
    },
    {
      key: "plan", header: "Plan Details",
      render: (s: any) => (
        <div className="flex flex-col">
          <span className="font-medium text-sm capitalize">{s.planId?.name || "Unknown Plan"}</span>
          <span className="text-[10px] text-muted-foreground capitalize">{s.billingCycle}</span>
        </div>
      )
    },
    {
      key: "amount", header: "Amount",
      render: (s: any) => (
        <div className="flex flex-col">
          <span className="font-medium text-sm">{formatCurrency(s.amount, s.currency || "INR")}</span>
        </div>
      )
    },
    {
      key: "status", header: "Status",
      render: (s: any) => {
        let variant: "default" | "soft" | "warning" | "danger" | "success" = "default";
        let Icon = CheckCircle2;
        
        switch(s.status) {
          case "active":
            variant = "success";
            Icon = CheckCircle2;
            break;
          case "past_due":
            variant = "warning";
            Icon = Clock;
            break;
          case "cancelled":
            variant = "danger";
            Icon = XCircle;
            break;
          case "expired":
            variant = "soft";
            Icon = AlertCircle;
            break;
        }

        return (
          <Badge variant={variant} className="capitalize flex items-center gap-1 w-max">
            <Icon className="h-3 w-3" /> {s.status}
          </Badge>
        );
      }
    },
    {
      key: "dates", header: "Timeline",
      render: (s: any) => (
        <div className="flex flex-col text-xs text-muted-foreground">
          <span>Start: {new Date(s.startDate).toLocaleDateString()}</span>
          <span>End: {new Date(s.endDate).toLocaleDateString()}</span>
        </div>
      )
    }
  ], []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Subscriptions</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage and monitor all platform subscriptions.
        </p>
      </div>

      <DataTable
        isLoading={isLoading}
        data={subscriptions}
        keyExtractor={(s) => s._id}
        searchQuery={query.search}
        onSearchChange={(s) => setQuery({ search: s })}
        onRefetch={() => refetch()}
        placeholderText="Search by business name..."
        emptyStateText="No subscriptions found matching the filters."
        totalItems={subData?.total}
        page={query.page}
        limit={10}
        onPageChange={(p) => setQuery({ page: p })}
        filters={
          <Select
            id="status-filter"
            value={query.statusFilter}
            onValueChange={(v) => setQuery({ statusFilter: v })}
            className="w-48 h-9"
            options={[
              { value: "all", label: "All Statuses" },
              { value: "active", label: "Active" },
              { value: "past_due", label: "Past Due" },
              { value: "cancelled", label: "Cancelled" },
              { value: "expired", label: "Expired" }
            ]}
          />
        }
        columns={columns}
      />
    </div>
  );
}
