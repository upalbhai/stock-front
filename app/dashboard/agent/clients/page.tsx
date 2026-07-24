"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { agentService, AgentClient } from "@/services/agent.service";
import { useAuth } from "@/components/auth/auth-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "react-hot-toast";
import { getErrorMessage } from "@/lib/error";
import { formatCurrency } from "@/lib/format";
import { DataTable, ColumnDef } from "@/components/ui/data-table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const AVAILABLE_FEATURES = [
  { key: "retail_billing", label: "Retail POS Billing", desc: "Quick counter billing, takeaway & dine-in" },
  { key: "wholesale_billing", label: "Wholesale Billing", desc: "Bulk billing in peti/crate with manual pricing" },
  { key: "packaging_units", label: "Packaging Units", desc: "Peti/crate packaging on products" },
  { key: "gst_invoices", label: "GST Invoices", desc: "CGST/SGST invoice generation" },
  { key: "credit_khata", label: "Credit / Khata", desc: "Partial payments and customer balance" },
  { key: "customers", label: "Customer Directory", desc: "Saved customers with GSTIN & balance" },
  { key: "bulk_stock_in", label: "Bulk Stock Receive", desc: "Receive stock in peti/crate units" },
  { key: "order_void", label: "Void Bills", desc: "Void wrong entries with audit trail" },
  { key: "order_history", label: "Order History", desc: "View and reprint past bills" },
  { key: "notifications", label: "In-App Notifications", desc: "Alerts for orders & stock thresholds" },
];

export default function AgentClientsPage() {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  const [selectedClient, setSelectedClient] = useState<AgentClient | null>(null);
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([]);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState("");

  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [selectedHistoryClient, setSelectedHistoryClient] = useState<AgentClient | null>(null);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["agent-clients", page, limit, search],
    queryFn: () => agentService.getClients(token!, { page, limit, search }),
    enabled: Boolean(token)
  });

  const { data: historyData, isLoading: isLoadingHistory } = useQuery({
    queryKey: ["agent-client-history", selectedHistoryClient?._id],
    queryFn: () => agentService.getPlanRequestHistory(selectedHistoryClient!._id, token!),
    enabled: Boolean(token && selectedHistoryClient?._id),
  });

  const clients = data?.data?.clients || [];
  const totalItems = data?.meta?.pagination?.total || 0;

  const createClientMutation = useMutation({
    mutationFn: (data: any) => agentService.createClient(data, token!),
    onSuccess: () => {
      toast.success("New client onboarded successfully");
      queryClient.invalidateQueries({ queryKey: ["agent-clients"] });
      setIsCreateOpen(false);
    },
    onError: (err) => {
      toast.error(getErrorMessage(err));
    }
  });

  const updatePlanMutation = useMutation({
    mutationFn: (data: any) => agentService.updateCustomPlan(selectedClient!._id, data, token!),
    onSuccess: () => {
      toast.success("Custom plan updated successfully");
      queryClient.invalidateQueries({ queryKey: ["agent-clients"] });
      setSelectedClient(null);
    },
    onError: (err) => {
      toast.error(getErrorMessage(err));
    }
  });

  const handleOpenManagePlan = (client: AgentClient) => {
    setSelectedClient(client);
    setSelectedFeatures(
      client.customPlanDetails?.enabledFeatures || AVAILABLE_FEATURES.map(f => f.key)
    );
  };

  const handleCreateClient = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    createClientMutation.mutate({
      ownerName: formData.get("ownerName")?.toString(),
      businessName: formData.get("businessName")?.toString(),
      email: formData.get("email")?.toString(),
      phone: formData.get("phone")?.toString() || undefined,
    });
  };

  const handleUpdatePlan = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    updatePlanMutation.mutate({
      price: Number(formData.get("price")),
      currency: formData.get("currency")?.toString() || "INR",
      maxProducts: Number(formData.get("maxProducts")),
      maxOutlets: Number(formData.get("maxOutlets")),
      enabledFeatures: selectedFeatures,
    });
  };

  const columns: ColumnDef<AgentClient>[] = [
    {
      header: "Client Name",
      accessorKey: "name",
      render: (client) => (
        <div>
          <div className="font-semibold text-foreground">{client.name}</div>
          <div className="text-xs text-muted-foreground">
            {[client.email, client.phone].filter(Boolean).join(" • ")}
          </div>
        </div>
      ),
    },
    {
      header: "Status",
      accessorKey: "status",
      render: (client) => (
        <Badge variant={client.status === "active" ? "success" : "warning"}>
          {client.status}
        </Badge>
      ),
    },
    {
      header: "Subscription",
      accessorKey: "subscriptionStatus",
      render: (client) => {
        const variant =
          client.subscriptionStatus === "active"
            ? "success"
            : client.subscriptionStatus === "trial"
              ? "info"
              : client.subscriptionStatus === "grace_period"
                ? "warning"
                : "danger";

        return <Badge variant={variant}>{client.subscriptionStatus}</Badge>;
      },
    },
    {
      header: "Custom Plan",
      render: (client: any) => {
        if (client.pendingCustomPlan) {
          return (
            <div className="text-xs space-y-0.5">
              <Badge variant="warning" className="mb-1">Pending Approval</Badge>
              <div className="font-semibold text-foreground mt-1">
                Requested: {formatCurrency(client.pendingCustomPlan.price, client.pendingCustomPlan.currency || "INR")} / mo
              </div>
              <div className="text-muted-foreground">
                {client.pendingCustomPlan.maxProducts || 50} Products • {client.pendingCustomPlan.maxOutlets || 1} Outlet(s)
              </div>
            </div>
          );
        }

        const price = client.customPlanDetails?.price ?? 0;
        const currency = client.customPlanDetails?.currency || "INR";
        const maxProducts = client.customPlanDetails?.maxProducts ?? 50;
        const maxOutlets = client.customPlanDetails?.maxOutlets ?? 1;

        return (
          <div className="text-xs space-y-0.5 relative group">
            <div className="font-semibold text-foreground">
              {formatCurrency(price, currency)} / mo
            </div>
            <div className="text-muted-foreground">
              {maxProducts} Products • {maxOutlets} Outlet(s)
            </div>
            {!client.pendingCustomPlan && client.lastPlanRequestStatus && (
              <div className="mt-1">
                {client.lastPlanRequestStatus.status === "rejected" ? (
                  <div className="text-destructive font-medium">
                    Last request rejected
                    {client.lastPlanRequestStatus.reason && `: ${client.lastPlanRequestStatus.reason}`}
                  </div>
                ) : (
                  <div className="text-success font-medium">
                    Last request approved
                    {client.lastPlanRequestStatus.reason && `: ${client.lastPlanRequestStatus.reason}`}
                  </div>
                )}
              </div>
            )}
          </div>
        );
      },
    },
    {
      header: "Joined Date",
      accessorKey: "createdAt",
      render: (client) => (
        <span className="text-xs text-muted-foreground">
          {client.createdAt ? new Date(client.createdAt).toLocaleDateString() : "-"}
        </span>
      ),
    },
    {
      header: "Action",
      render: (client: any) => (
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleOpenManagePlan(client)}
            disabled={!!client.pendingCustomPlan}
            title={client.pendingCustomPlan ? "A plan change is currently pending admin approval" : "Manage Plan"}
          >
            Manage Plan
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSelectedHistoryClient(client);
              setIsHistoryOpen(true);
            }}
          >
            View History
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Your Clients</h1>
          <p className="text-sm text-muted-foreground">
            Manage your onboarded client accounts and customize their subscription plans.
          </p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button>+ Add New Client</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Onboard New Client</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateClient} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="ownerName" className="text-sm font-medium leading-none">Owner Full Name *</label>
                <Input id="ownerName" name="ownerName" required placeholder="e.g. Vikram Patel" />
              </div>
              <div className="space-y-2">
                <label htmlFor="businessName" className="text-sm font-medium leading-none">Business / Shop Name *</label>
                <Input id="businessName" name="businessName" required placeholder="e.g. Patel General Store" />
              </div>
              <div className="space-y-2">
                <label htmlFor="create-client-email" className="text-sm font-medium leading-none">Email Address *</label>
                <Input id="create-client-email" name="email" type="email" required placeholder="vikram@example.com" />
              </div>
              <div className="space-y-2">
                <label htmlFor="create-client-phone" className="text-sm font-medium leading-none">Phone Number (Optional)</label>
                <Input id="create-client-phone" name="phone" type="tel" placeholder="9876543210" />
              </div>
              <Button type="submit" className="w-full" disabled={createClientMutation.isPending}>
                {createClientMutation.isPending ? "Creating Client..." : "Onboard Client"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <DataTable
        columns={columns}
        data={clients}
        isLoading={isLoading}
        totalItems={totalItems}
        page={page}
        limit={limit}
        onPageChange={setPage}
        onLimitChange={setLimit}
        searchQuery={search}
        onSearchChange={setSearch}
        onRefetch={refetch}
        placeholderText="Search clients by name, email, or phone..."
        emptyStateText="No clients found. Start adding clients or share your referral link."
        emptyStateIcon="👥"
      />

      <Dialog open={Boolean(selectedClient)} onOpenChange={(open) => !open && setSelectedClient(null)}>
        <DialogContent className="min-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Configure Custom Plan for {selectedClient?.name}</DialogTitle>
          </DialogHeader>
          {selectedClient && (
            <form onSubmit={handleUpdatePlan} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label htmlFor="price" className="text-xs font-medium leading-none">Monthly Price</label>
                  <div className="flex gap-2">
                    <select
                      name="currency"
                      defaultValue={selectedClient.customPlanDetails?.currency || "INR"}
                      className="flex h-9 w-20 rounded-md border border-input bg-transparent px-2 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    >
                      <option value="INR">INR</option>
                      <option value="USD">USD</option>
                      <option value="EUR">EUR</option>
                      <option value="GBP">GBP</option>
                      <option value="AED">AED</option>
                    </select>
                    <Input
                      id="price"
                      name="price"
                      type="number"
                      defaultValue={selectedClient.customPlanDetails?.price || 0}
                      required
                      className="flex-1"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label htmlFor="maxProducts" className="text-xs font-medium leading-none">Max Products</label>
                  <Input
                    id="maxProducts"
                    name="maxProducts"
                    type="number"
                    defaultValue={selectedClient.customPlanDetails?.maxProducts || 50}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="maxOutlets" className="text-xs font-medium leading-none">Max Outlets</label>
                  <Input
                    id="maxOutlets"
                    name="maxOutlets"
                    type="number"
                    defaultValue={selectedClient.customPlanDetails?.maxOutlets || 1}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2 pt-2">
                <div className="flex justify-between items-center">
                  <label className="text-sm font-medium leading-none">Included Modules & Features</label>
                  <div className="flex gap-2 text-xs">
                    <button
                      type="button"
                      onClick={() => setSelectedFeatures(AVAILABLE_FEATURES.map(f => f.key))}
                      className="text-primary font-semibold hover:underline"
                    >
                      Select All
                    </button>
                    <span className="text-muted-foreground">•</span>
                    <button
                      type="button"
                      onClick={() => setSelectedFeatures([])}
                      className="text-muted-foreground hover:underline font-medium"
                    >
                      Clear
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-60 overflow-y-auto p-1.5 border border-border rounded-lg bg-muted/20">
                  {AVAILABLE_FEATURES.map((feat) => {
                    const isChecked = selectedFeatures.includes(feat.key);
                    return (
                      <div
                        key={feat.key}
                        onClick={() => {
                          setSelectedFeatures(prev =>
                            prev.includes(feat.key)
                              ? prev.filter(k => k !== feat.key)
                              : [...prev, feat.key]
                          );
                        }}
                        className={`flex items-start gap-2.5 p-2.5 rounded-lg border text-xs cursor-pointer transition ${isChecked
                            ? "bg-primary/10 border-primary text-foreground shadow-sm"
                            : "bg-card border-border text-muted-foreground hover:border-foreground/30"
                          }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => { }}
                          className="mt-0.5 h-3.5 w-3.5 rounded border-border text-primary focus:ring-primary pointer-events-none"
                        />
                        <div className="min-w-0">
                          <div className="font-semibold text-foreground">{feat.label}</div>
                          <div className="text-[10px] text-muted-foreground line-clamp-1">{feat.desc}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={updatePlanMutation.isPending}>
                {updatePlanMutation.isPending ? "Saving..." : "Save Custom Plan"}
              </Button>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {isHistoryOpen && selectedHistoryClient && (
        <Dialog open={isHistoryOpen} onOpenChange={setIsHistoryOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Plan Request History - {selectedHistoryClient.name}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2 pt-2">
              {isLoadingHistory ? (
                <div className="animate-pulse space-y-4">Loading history...</div>
              ) : historyData?.logs?.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground bg-muted/20 rounded-lg">
                  No plan request history found for this client.
                </div>
              ) : (
                <div className="relative border-l border-border ml-3 space-y-6">
                  {historyData?.logs?.map((log: any, idx: number) => (
                    <div key={log._id} className="relative pl-6">
                      <div className={`absolute -left-1.5 top-1.5 h-3 w-3 rounded-full border-2 border-background ${
                        log.action === "admin_plan_change_approved" ? "bg-success" : 
                        log.action === "admin_plan_change_rejected" ? "bg-destructive" : 
                        "bg-primary"
                      }`} />
                      <div className="flex flex-col">
                        <span className="text-xs text-muted-foreground font-mono">
                          {new Date(log.createdAt).toLocaleString()}
                        </span>
                        <span className="text-sm font-medium mt-1">
                          {log.action === "agent_plan_change_requested" && "Agent requested a custom plan change"}
                          {log.action === "admin_plan_change_approved" && "Admin approved the plan request"}
                          {log.action === "admin_plan_change_rejected" && "Admin rejected the plan request"}
                        </span>
                        {log.message && (
                          <div className="text-sm text-muted-foreground mt-1 bg-muted/30 p-2 rounded border border-border/50">
                            {log.message}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
