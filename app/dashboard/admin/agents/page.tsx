"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminService } from "@/services/admin.service";
import { useAuth } from "@/components/auth/auth-provider";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
  const [selectedAgent, setSelectedAgent] = useState<any | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-agents"],
    queryFn: () => adminService.getAgents(token!),
    enabled: Boolean(token)
  });

  const agents = data?.agents || [];

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
    approveMutation.mutate({
      commissionPercentage: Number(formData.get("commissionPercentage")),
      agentCode: formData.get("agentCode")?.toString(),
      status: formData.get("status")?.toString(),
    });
  };

  if (isLoading) return <div className="p-4">Loading agents...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Agents Management</h1>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button>+ Create Agent</Button>
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
                      <select 
                        id="status" 
                        name="status" 
                        className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                        defaultValue={agent.status}
                      >
                        <option value="pending_approval">Pending Approval</option>
                        <option value="active">Active</option>
                        <option value="suspended">Suspended</option>
                      </select>
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
    </div>
  );
}
