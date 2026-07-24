"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminService } from "@/services/admin.service";
import { useAuth } from "@/components/auth/auth-provider";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select } from "@/components/ui/select";
import { toast } from "react-hot-toast";
import { getErrorMessage } from "@/lib/error";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export default function AdminAgentsPage() {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<"agents" | "payouts">("agents");
  const [selectedAgent, setSelectedAgent] = useState<any | null>(null);
  const [selectedPayout, setSelectedPayout] = useState<any | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-agents"],
    queryFn: () => adminService.getAgents(token!),
    enabled: Boolean(token)
  });

  const { data: payoutsData, isLoading: isLoadingPayouts } = useQuery({
    queryKey: ["admin-payout-requests"],
    queryFn: () => adminService.getPayoutRequests(token!),
    enabled: Boolean(token)
  });

  const agents = data?.agents || [];
  const payoutRequests = payoutsData?.requests || [];

  const createMutation = useMutation({
    mutationFn: (data: any) => adminService.createAgent(data, token!),
    onSuccess: () => {
      toast.success("Agent created! Verification OTP sent to their email.");
      queryClient.invalidateQueries({ queryKey: ["admin-agents"] });
      setIsCreateOpen(false);
    },
    onError: (err) => {
      toast.error(getErrorMessage(err));
    }
  });

  const approveMutation = useMutation({
    mutationFn: (data: any) => adminService.approveAgent(selectedAgent!._id, data, token!),
    onSuccess: () => {
      toast.success("Agent settings updated");
      queryClient.invalidateQueries({ queryKey: ["admin-agents"] });
      setSelectedAgent(null);
    },
    onError: (err) => {
      toast.error(getErrorMessage(err));
    }
  });

  const processPayoutMutation = useMutation({
    mutationFn: (data: { id: string, payload: any }) => adminService.processPayoutRequest(data.id, data.payload, token!),
    onSuccess: () => {
      toast.success("Payout request processed");
      queryClient.invalidateQueries({ queryKey: ["admin-payout-requests"] });
      setSelectedPayout(null);
    },
    onError: (err) => {
      toast.error(getErrorMessage(err));
    }
  });

  const handleCreateAgent = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    createMutation.mutate({
      name: formData.get("name")?.toString(),
      email: formData.get("email")?.toString(),
      phone: formData.get("phone")?.toString() || undefined,
      password: formData.get("password")?.toString() || undefined,
      commissionPercentage: formData.get("commissionPercentage") ? Number(formData.get("commissionPercentage")) : 20,
      agentCode: formData.get("agentCode")?.toString() || undefined,
    });
  };

  const handleApprove = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const payload = {
      commissionPercentage: Number(formData.get("commissionPercentage")),
      agentCode: formData.get("agentCode")?.toString(),
      status: formData.get("status")?.toString(),
    };
    approveMutation.mutate(payload);
  };

  const handleProcessPayout = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const payload = {
      action: formData.get("action") as string,
      transactionId: formData.get("transactionId") as string,
      notes: formData.get("notes") as string,
    };
    processPayoutMutation.mutate({ id: selectedPayout._id, payload });
  };

  if (isLoading) {
    return <div className="animate-pulse space-y-4 p-4">Loading agents...</div>;
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Agent Management</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage sales agents, commissions, and payouts.</p>
        </div>
      </div>

      <div className="flex border-b border-border">
        <button
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === "agents" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}
          onClick={() => setActiveTab("agents")}
        >
          Agents
        </button>
        <button
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === "payouts" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}
          onClick={() => setActiveTab("payouts")}
        >
          Payout Requests
          {payoutRequests.filter((r: any) => r.status === "pending").length > 0 && (
            <span className="ml-2 bg-primary text-primary-foreground text-[10px] px-1.5 py-0.5 rounded-full">
              {payoutRequests.filter((r: any) => r.status === "pending").length}
            </span>
          )}
        </button>
      </div>

      {activeTab === "agents" && (
        <>
          <div className="flex justify-end">
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
              <DialogTrigger asChild>
                <Button>Create New Agent</Button>
              </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Agent</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateAgent} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="create-name" className="text-sm font-medium leading-none">Full Name *</label>
                <Input id="create-name" name="name" required placeholder="e.g. Rahul Sharma" />
              </div>
              <div className="space-y-2">
                <label htmlFor="create-email" className="text-sm font-medium leading-none">Email Address *</label>
                <Input id="create-email" name="email" type="email" required placeholder="rahul@example.com" />
              </div>
              <div className="space-y-2">
                <label htmlFor="create-phone" className="text-sm font-medium leading-none">Phone Number (Optional)</label>
                <Input id="create-phone" name="phone" type="tel" placeholder="9876543210" />
              </div>
              <div className="space-y-2">
                <label htmlFor="create-password" className="text-sm font-medium leading-none">Set Password (Optional)</label>
                <Input id="create-password" name="password" type="password" placeholder="Leave blank for OTP login" />
                <p className="text-[11px] text-muted-foreground">If set, agent can login with password once email is verified.</p>
              </div>
              <div className="space-y-2">
                <label htmlFor="create-commission" className="text-sm font-medium leading-none">Commission Percentage (%)</label>
                <Input id="create-commission" name="commissionPercentage" type="number" defaultValue={20} required />
              </div>
              <div className="space-y-2">
                <label htmlFor="create-code" className="text-sm font-medium leading-none">Agent Code (Optional)</label>
                <Input id="create-code" name="agentCode" placeholder="Auto-generated if left blank" />
              </div>
              <Button type="submit" className="w-full" disabled={createMutation.isPending}>
                {createMutation.isPending ? "Creating..." : "Create Agent & Send Verification"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {agents.map((agent: any) => (
          <Card key={agent._id}>
            <CardContent className="p-4 flex justify-between items-center">
              <div>
                <h3 className="font-semibold text-lg">{agent.name}</h3>
                <p className="text-sm text-muted-foreground">{agent.email} | {agent.phone}</p>
                <div className="flex gap-2 mt-2">
                  <Badge variant={agent.status === "active" ? "success" : agent.status === "pending_approval" ? "warning" : "danger"}>
                    {agent.status}
                  </Badge>
                  {agent.profile?.agentCode && (
                    <Badge variant="soft">Code: {agent.profile.agentCode}</Badge>
                  )}
                  {agent.profile?.commissionPercentage !== undefined && (
                    <Badge variant="soft">Comm: {agent.profile.commissionPercentage}%</Badge>
                  )}
                </div>
              </div>

              <Dialog open={selectedAgent?._id === agent._id} onOpenChange={(open) => !open && setSelectedAgent(null)}>
                <DialogTrigger asChild>
                  <Button variant="outline" onClick={() => setSelectedAgent(agent)}>
                    {agent.status === "pending_approval" ? "Approve Agent" : "Edit Settings"}
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>{agent.status === "pending_approval" ? "Approve" : "Edit"} Agent: {agent.name}</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleApprove} className="space-y-4">
                    <div className="space-y-2">
                      <label htmlFor="status" className="text-sm font-medium leading-none">Status</label>
                      <Select
                        id="status"
                        name="status"
                        defaultValue={agent.status}
                        options={[
                          { value: "pending_approval", label: "Pending Approval" },
                          { value: "active", label: "Active" },
                          { value: "suspended", label: "Suspended" }
                        ]}
                      />
                    </div>
                    <div className="space-y-2">
                      <label htmlFor="commissionPercentage" className="text-sm font-medium leading-none">Commission Percentage (%)</label>
                      <Input 
                        id="commissionPercentage" 
                        name="commissionPercentage" 
                        type="number" 
                        defaultValue={agent.profile?.commissionPercentage || 20} 
                        required 
                      />
                    </div>
                    <div className="space-y-2">
                      <label htmlFor="agentCode" className="text-sm font-medium leading-none">Unique Agent Code</label>
                      <Input 
                        id="agentCode" 
                        name="agentCode" 
                        type="text" 
                        defaultValue={agent.profile?.agentCode || ""} 
                        placeholder="e.g. AGT-JOHN-992"
                      />
                    </div>
                    <Button type="submit" className="w-full" disabled={approveMutation.isPending}>
                      {approveMutation.isPending ? "Saving..." : "Save Settings"}
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>
        ))}
        {agents.length === 0 && (
          <div className="text-center py-12 text-muted-foreground bg-muted/20 rounded-lg">
            No agents found.
          </div>
        )}
      </div>
      </>
      )}

      {activeTab === "payouts" && (
        <div className="grid gap-4">
          {isLoadingPayouts ? (
            <div className="animate-pulse space-y-4 p-4">Loading payout requests...</div>
          ) : (
            <>
              {payoutRequests.map((req: any) => (
                <Card key={req._id}>
                  <CardContent className="p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                      <h3 className="font-semibold">{req.agentId?.name || "Unknown Agent"}</h3>
                      <p className="text-sm text-muted-foreground">{req.agentId?.email}</p>
                      <div className="mt-2 text-sm font-medium">
                        Requested: <span className="font-bold">{req.amount} {req.currency}</span>
                      </div>
                      <div className="text-[11px] text-muted-foreground mt-1">
                        Submitted: {new Date(req.createdAt).toLocaleString()}
                      </div>
                      {req.transactionId && (
                        <div className="text-xs mt-1 font-mono text-muted-foreground">Txn: {req.transactionId}</div>
                      )}
                    </div>

                    <div className="flex flex-col items-end gap-2">
                      <Badge variant={req.status === "approved" ? "success" : req.status === "rejected" ? "danger" : "warning"} className="uppercase text-[10px]">
                        {req.status}
                      </Badge>

                      {req.status === "pending" && (
                        <Dialog open={selectedPayout?._id === req._id} onOpenChange={(open) => !open && setSelectedPayout(null)}>
                          <DialogTrigger asChild>
                            <Button size="sm" onClick={() => setSelectedPayout(req)}>Process Payout</Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Process Payout Request</DialogTitle>
                            </DialogHeader>
                            <div className="text-sm bg-muted/50 p-3 rounded-md mb-4">
                              <p>Agent: <strong>{req.agentId?.name}</strong></p>
                              <p>Amount: <strong>{req.amount} {req.currency}</strong></p>
                            </div>
                            <form onSubmit={handleProcessPayout} className="space-y-4">
                              <div className="space-y-2">
                                <label className="text-sm font-medium leading-none">Action</label>
                                <Select
                                  name="action"
                                  defaultValue="approve"
                                  options={[
                                    { value: "approve", label: "Approve & Mark Paid" },
                                    { value: "reject", label: "Reject Request" }
                                  ]}
                                />
                              </div>
                              <div className="space-y-2">
                                <label className="text-sm font-medium leading-none">Transaction ID / Reference (If Approving)</label>
                                <Input name="transactionId" placeholder="e.g. TXN-987654321" />
                              </div>
                              <div className="space-y-2">
                                <label className="text-sm font-medium leading-none">Admin Notes (Optional)</label>
                                <Input name="notes" placeholder="Reason for rejection or internal notes" />
                              </div>
                              <Button type="submit" className="w-full" disabled={processPayoutMutation.isPending}>
                                {processPayoutMutation.isPending ? "Processing..." : "Submit Process"}
                              </Button>
                            </form>
                          </DialogContent>
                        </Dialog>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
              {payoutRequests.length === 0 && (
                <div className="text-center py-12 text-muted-foreground bg-muted/20 rounded-lg">
                  No payout requests found.
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
