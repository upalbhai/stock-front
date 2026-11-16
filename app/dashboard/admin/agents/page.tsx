"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminService } from "@/services/admin.service";
import { useAuth } from "@/components/auth/auth-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select } from "@/components/ui/select";
import { toast } from "react-hot-toast";
import { getErrorMessage } from "@/lib/error";
import { formatCurrency, formatDate } from "@/lib/format";
import {
  Users,
  UserCheck,
  Plus,
  RefreshCw,
  TrendingUp,
  Percent,
  Copy,
  Check,
  CheckCircle2,
  XCircle,
  Clock,
  Shield,
  CreditCard,
  Building2,
  Phone,
  Mail,
  Edit3,
  ExternalLink,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { DataTable } from "@/components/ui/data-table";
import Link from "next/link";
import { APP_ROUTES } from "@/lib/routes";

export default function AdminAgentsPage() {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<"agents" | "payouts">("agents");
  const [agentFilter, setAgentFilter] = useState<"all" | "active" | "pending">("all");
  const [selectedAgent, setSelectedAgent] = useState<any | null>(null);
  const [selectedPayout, setSelectedPayout] = useState<any | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["admin-agents"],
    queryFn: () => adminService.getAgents(token!),
    enabled: Boolean(token),
  });

  const {
    data: payoutsData,
    isLoading: isLoadingPayouts,
    refetch: refetchPayouts,
  } = useQuery({
    queryKey: ["admin-payout-requests"],
    queryFn: () => adminService.getPayoutRequests(token!),
    enabled: Boolean(token),
  });

  const agents = data?.agents || [];
  const payoutRequests = payoutsData?.requests || [];

  const handleCopy = (text: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(text);
    setCopiedId(text);
    toast.success("Copied to clipboard");
    setTimeout(() => setCopiedId(null), 2000);
  };

  const createMutation = useMutation({
    mutationFn: (data: any) => adminService.createAgent(data, token!),
    onSuccess: () => {
      toast.success("Agent created successfully. Verification OTP dispatched.");
      queryClient.invalidateQueries({ queryKey: ["admin-agents"] });
      setIsCreateOpen(false);
    },
    onError: (err) => {
      toast.error(getErrorMessage(err));
    },
  });

  const approveMutation = useMutation({
    mutationFn: (data: any) =>
      adminService.approveAgent(selectedAgent!._id, data, token!),
    onSuccess: () => {
      toast.success("Agent profile and commission rates saved");
      queryClient.invalidateQueries({ queryKey: ["admin-agents"] });
      setSelectedAgent(null);
    },
    onError: (err) => {
      toast.error(getErrorMessage(err));
    },
  });

  const processPayoutMutation = useMutation({
    mutationFn: (data: { id: string; payload: any }) =>
      adminService.processPayoutRequest(data.id, data.payload, token!),
    onSuccess: () => {
      toast.success("Payout request processed successfully");
      queryClient.invalidateQueries({ queryKey: ["admin-payout-requests"] });
      setSelectedPayout(null);
    },
    onError: (err) => {
      toast.error(getErrorMessage(err));
    },
  });

  const handleCreateAgent = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    createMutation.mutate({
      name: formData.get("name")?.toString(),
      email: formData.get("email")?.toString(),
      phone: formData.get("phone")?.toString() || undefined,
      password: formData.get("password")?.toString() || undefined,
      commissionPercentage: formData.get("commissionPercentage")
        ? Number(formData.get("commissionPercentage"))
        : 20,
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

  // Filtered agents
  const filteredAgents = agents
    .filter((a: any) => {
      if (agentFilter === "active") return a.status === "active";
      if (agentFilter === "pending") return a.status === "pending_approval";
      return true;
    })
    .filter((a: any) => {
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      return (
        a.name?.toLowerCase().includes(q) ||
        a.email?.toLowerCase().includes(q) ||
        a.phone?.includes(q) ||
        a.profile?.agentCode?.toLowerCase().includes(q)
      );
    });

  // Metrics
  const totalAgents = agents.length;
  const activeAgents = agents.filter((a: any) => a.status === "active").length;
  const pendingApprovals = agents.filter(
    (a: any) => a.status === "pending_approval"
  ).length;
  const pendingPayouts = payoutRequests.filter(
    (r: any) => r.status === "pending"
  ).length;

  return (
    <div className="space-y-4 animate-in fade-in duration-300">
      {/* ── COMPACT SECTION HEADER & LIVE METRIC STRIP ───────────────────── */}
      <div className="flex flex-col gap-3 rounded-xl border border-border/80 bg-card p-3 sm:p-3.5 shadow-2xs">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-base sm:text-lg font-bold tracking-tight text-foreground sm:text-xl">
                Partner Agent Management
              </h1>
              <span className="inline-flex items-center rounded-md bg-primary/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary border border-primary/20 shrink-0">
                Affiliates
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5 hidden sm:block">
              Recruit sales partners, configure commission percentages, and process referral payouts.
            </p>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <Link href="/dashboard/admin/agents/performance">
              <Button
                variant="outline"
                size="sm"
                className="h-7 sm:h-8 gap-1 px-2 sm:px-2.5 text-xs cursor-pointer shadow-2xs hover:bg-accent"
              >
                <TrendingUp className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                <span className="hidden md:inline">Performance</span>
              </Button>
            </Link>
            <Button
              variant="default"
              size="sm"
              onClick={() => setIsCreateOpen(true)}
              className="h-7 sm:h-8 gap-1 sm:gap-1.5 px-2 sm:px-3 text-xs font-semibold cursor-pointer shadow-2xs"
            >
              <Plus className="h-3.5 w-3.5" />
              <span><span className="hidden sm:inline">Create </span>Agent</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                refetch();
                refetchPayouts();
              }}
              className="h-7 sm:h-8 gap-1 px-2 sm:px-2.5 text-xs cursor-pointer shadow-2xs hover:bg-accent"
            >
              <RefreshCw
                className={`h-3 w-3 ${isLoading ? "animate-spin text-primary" : "text-muted-foreground"}`}
              />
              <span className="hidden sm:inline">Refresh</span>
            </Button>
          </div>
        </div>

        {/* ── COMPACT METRIC FILTER CHIPS (SLIM, ONLY 34px TALL) ─────────── */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar scroll-smooth border-t border-border/60 pt-2.5 -mx-3 px-3 sm:mx-0 sm:px-0 sm:flex-wrap">
          {/* Chip 1: Agents View */}
          <button
            type="button"
            onClick={() => {
              setActiveTab("agents");
              setAgentFilter("all");
            }}
            className={`inline-flex shrink-0 items-center gap-2 rounded-lg border px-3 py-1.5 text-xs transition-all cursor-pointer ${
              activeTab === "agents" && agentFilter === "all"
                ? "border-primary bg-primary/10 text-primary font-semibold shadow-2xs"
                : "border-border/80 bg-background text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            <Users className="h-3.5 w-3.5" />
            <span>All Agents</span>
            <span
              className={`ml-1 rounded-full px-1.5 py-0.2 text-[10px] font-mono ${
                activeTab === "agents" && agentFilter === "all"
                  ? "bg-primary text-primary-foreground font-bold"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {totalAgents}
            </span>
          </button>

          {/* Chip 2: Active Agents */}
          <button
            type="button"
            onClick={() => {
              setActiveTab("agents");
              setAgentFilter("active");
            }}
            className={`inline-flex shrink-0 items-center gap-2 rounded-lg border px-3 py-1.5 text-xs transition-all cursor-pointer ${
              activeTab === "agents" && agentFilter === "active"
                ? "border-emerald-500 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold shadow-2xs"
                : "border-border/80 bg-background text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
            <span>Active Partners</span>
            <span
              className={`ml-1 rounded-full px-1.5 py-0.2 text-[10px] font-mono ${
                activeTab === "agents" && agentFilter === "active"
                  ? "bg-emerald-500 text-white font-bold"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {activeAgents}
            </span>
          </button>

          {/* Chip 3: Pending Approvals */}
          <button
            type="button"
            onClick={() => {
              setActiveTab("agents");
              setAgentFilter("pending");
            }}
            className={`inline-flex shrink-0 items-center gap-2 rounded-lg border px-3 py-1.5 text-xs transition-all cursor-pointer ${
              activeTab === "agents" && agentFilter === "pending"
                ? "border-amber-500 bg-amber-500/10 text-amber-600 dark:text-amber-400 font-semibold shadow-2xs"
                : "border-border/80 bg-background text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            <Clock className="h-3.5 w-3.5 text-amber-500" />
            <span>Pending Review</span>
            <span
              className={`ml-1 rounded-full px-1.5 py-0.2 text-[10px] font-mono ${
                activeTab === "agents" && agentFilter === "pending"
                  ? "bg-amber-500 text-white font-bold"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {pendingApprovals}
            </span>
          </button>

          {/* Chip 4: Payout Requests */}
          <button
            type="button"
            onClick={() => setActiveTab("payouts")}
            className={`inline-flex shrink-0 items-center gap-2 rounded-lg border px-3 py-1.5 text-xs transition-all cursor-pointer ${
              activeTab === "payouts"
                ? "border-primary bg-primary/10 text-primary font-semibold shadow-2xs"
                : "border-border/80 bg-background text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            <CreditCard className="h-3.5 w-3.5" />
            <span>Payout Requests</span>
            {pendingPayouts > 0 ? (
              <span className="ml-1 rounded-full bg-amber-500 px-1.5 py-0.2 text-[10px] font-mono text-white font-bold animate-pulse">
                {pendingPayouts} pending
              </span>
            ) : (
              <span className="ml-1 rounded-full bg-muted px-1.5 py-0.2 text-[10px] font-mono text-muted-foreground">
                {payoutRequests.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* ── AGENTS TABLE ─────────────────────────────────────────────────── */}
      {activeTab === "agents" && (
        <DataTable
          data={filteredAgents}
          isLoading={isLoading}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          placeholderText="Search agents..."
          onRefetch={() => refetch()}
          emptyStateText="No partner agents match your search filter."
          emptyStateIcon="👥"
          columns={[
            {
              header: "Partner Agent",
              render: (agent: any) => {
                const initial = agent.name ? agent.name.charAt(0).toUpperCase() : "A";
                return (
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 font-bold text-primary ring-1 ring-primary/20 text-xs">
                      {initial}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold text-foreground text-xs">{agent.name}</span>
                        {agent.profile?.agentCode && (
                          <button
                            type="button"
                            onClick={(e) => handleCopy(agent.profile.agentCode, e)}
                            className="group inline-flex items-center gap-1 rounded bg-muted/80 px-1.5 py-0.2 text-[10px] font-mono text-foreground hover:bg-muted transition-colors border border-border/60"
                            title="Click to copy referral code"
                          >
                            <span>{agent.profile.agentCode}</span>
                            {copiedId === agent.profile.agentCode ? (
                              <Check className="h-2.5 w-2.5 text-emerald-500" />
                            ) : (
                              <Copy className="h-2.5 w-2.5 opacity-60 group-hover:opacity-100" />
                            )}
                          </button>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-muted-foreground mt-0.5">
                        <span className="flex items-center gap-1">
                          <Mail className="h-3 w-3" /> {agent.email}
                        </span>
                        {agent.phone && (
                          <>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              <Phone className="h-3 w-3" /> {agent.phone}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                );
              },
            },
            {
              header: "Commission Rate",
              render: (agent: any) => (
                <div className="inline-flex items-center gap-1 font-semibold text-xs text-foreground">
                  <Percent className="h-3.5 w-3.5 text-primary" />
                  <span>{agent.profile?.commissionPercentage ?? 20}%</span>
                </div>
              ),
            },
            {
              header: "Status",
              render: (agent: any) => {
                const isActive = agent.status === "active";
                const isPending = agent.status === "pending_approval";
                return (
                  <div className="inline-flex items-center gap-1.5">
                    <span
                      className={`h-2 w-2 rounded-full ${
                        isActive
                          ? "bg-emerald-500"
                          : isPending
                          ? "bg-amber-500 animate-pulse"
                          : "bg-destructive"
                      }`}
                    />
                    <Badge
                      variant={isActive ? "soft" : isPending ? "warning" : "danger"}
                      className="capitalize text-[11px] font-medium"
                    >
                      {agent.status.replace("_", " ")}
                    </Badge>
                  </div>
                );
              },
            },
            {
              header: "Actions",
              render: (agent: any) => (
                <div className="flex items-center justify-end pr-2">
                  <Button
                    variant="outline"
                    size="xs"
                    className="gap-1 text-xs cursor-pointer shadow-2xs hover:bg-accent"
                    onClick={() => setSelectedAgent(agent)}
                  >
                    <Edit3 className="h-3 w-3" />
                    <span>{agent.status === "pending_approval" ? "Review & Approve" : "Edit Settings"}</span>
                  </Button>
                </div>
              ),
            },
          ]}
        />
      )}

      {/* ── PAYOUTS TABLE ────────────────────────────────────────────────── */}
      {activeTab === "payouts" && (
        <DataTable
          data={payoutRequests}
          isLoading={isLoadingPayouts}
          searchQuery=""
          onSearchChange={() => {}}
          placeholderText="Filter payout requests..."
          onRefetch={() => refetchPayouts()}
          emptyStateText="No commission payout requests logged."
          emptyStateIcon="💳"
          columns={[
            {
              header: "Agent",
              render: (req: any) => (
                <div>
                  <div className="font-semibold text-xs text-foreground">
                    {req.agentId?.name || "Unknown Agent"}
                  </div>
                  <div className="text-[11px] text-muted-foreground">{req.agentId?.email}</div>
                </div>
              ),
            },
            {
              header: "Requested Amount",
              render: (req: any) => (
                <div className="text-xs font-bold text-foreground">
                  {formatCurrency(req.amount, req.currency || "INR")}
                </div>
              ),
            },
            {
              header: "Submission Time",
              render: (req: any) => (
                <div className="text-xs text-muted-foreground flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  <span>{formatDate(req.createdAt)}</span>
                </div>
              ),
            },
            {
              header: "Transaction Reference",
              render: (req: any) =>
                req.transactionId ? (
                  <span className="font-mono text-xs bg-muted px-2 py-0.5 rounded border border-border/60">
                    {req.transactionId}
                  </span>
                ) : (
                  <span className="text-xs text-muted-foreground">Pending disbursement</span>
                ),
            },
            {
              header: "Status",
              render: (req: any) => (
                <Badge
                  variant={
                    req.status === "approved"
                      ? "soft"
                      : req.status === "rejected"
                      ? "danger"
                      : "warning"
                  }
                  className="uppercase text-[10px] font-medium"
                >
                  {req.status}
                </Badge>
              ),
            },
            {
              header: "Action",
              render: (req: any) => (
                <div className="flex items-center justify-end pr-2">
                  {req.status === "pending" ? (
                    <Button
                      size="xs"
                      className="gap-1 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold cursor-pointer shadow-2xs"
                      onClick={() => setSelectedPayout(req)}
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      <span>Process Payout</span>
                    </Button>
                  ) : (
                    <span className="text-xs text-muted-foreground">Processed</span>
                  )}
                </div>
              ),
            },
          ]}
        />
      )}

      {/* ── CREATE AGENT DIALOG ─────────────────────────────────────────── */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary border border-primary/20">
                <Users className="h-5 w-5" />
              </div>
              <div>
                <DialogTitle className="text-base font-bold text-foreground">
                  Create Partner Agent
                </DialogTitle>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Register partner and issue verification email
                </p>
              </div>
            </div>
          </DialogHeader>

          <form onSubmit={handleCreateAgent} className="space-y-3.5 pt-1">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">
                Full Name *
              </label>
              <Input
                name="name"
                required
                placeholder="e.g. Rahul Sharma"
                className="text-xs h-9"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">
                Email Address *
              </label>
              <Input
                name="email"
                type="email"
                required
                placeholder="rahul@example.com"
                className="text-xs h-9"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">
                Phone Number (Optional)
              </label>
              <Input
                name="phone"
                type="tel"
                placeholder="9876543210"
                className="text-xs h-9"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">
                Initial Password (Optional)
              </label>
              <Input
                name="password"
                type="password"
                placeholder="Leave blank for OTP email login"
                className="text-xs h-9"
              />
              <p className="text-[10px] text-muted-foreground">
                If omitted, agent logs in via email OTP.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-foreground">
                  Commission (%) *
                </label>
                <Input
                  name="commissionPercentage"
                  type="number"
                  min="0"
                  max="100"
                  defaultValue={20}
                  required
                  className="text-xs h-9 font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-foreground">
                  Agent Code (Optional)
                </label>
                <Input
                  name="agentCode"
                  placeholder="Auto-generated"
                  className="text-xs h-9 font-mono uppercase"
                />
              </div>
            </div>

            <DialogFooter className="gap-2 pt-2 border-t border-border/80">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsCreateOpen(false)}
                className="cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={createMutation.isPending}
                className="font-semibold cursor-pointer shadow-2xs"
              >
                {createMutation.isPending ? "Creating..." : "Create & Send Invite"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── EDIT / APPROVE AGENT DIALOG ─────────────────────────────────── */}
      <Dialog
        open={Boolean(selectedAgent)}
        onOpenChange={(open) => !open && setSelectedAgent(null)}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary border border-primary/20">
                <UserCheck className="h-5 w-5" />
              </div>
              <div>
                <DialogTitle className="text-base font-bold text-foreground">
                  {selectedAgent?.status === "pending_approval"
                    ? "Approve Partner Agent"
                    : "Edit Agent Settings"}
                </DialogTitle>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Configure status and commissions for {selectedAgent?.name}
                </p>
              </div>
            </div>
          </DialogHeader>

          {selectedAgent && (
            <form onSubmit={handleApprove} className="space-y-3.5 pt-1">
              <div className="rounded-xl border border-border/80 bg-muted/30 p-3 space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Partner Name:</span>
                  <span className="font-semibold text-foreground">{selectedAgent.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Email:</span>
                  <span className="text-foreground">{selectedAgent.email}</span>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-foreground">Account Status</label>
                <Select
                  name="status"
                  defaultValue={selectedAgent.status}
                  options={[
                    { value: "pending_approval", label: "Pending Approval" },
                    { value: "active", label: "Active (Approved)" },
                    { value: "suspended", label: "Suspended" },
                  ]}
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-foreground">
                  Commission Percentage (%) *
                </label>
                <Input
                  name="commissionPercentage"
                  type="number"
                  min="0"
                  max="100"
                  defaultValue={selectedAgent.profile?.commissionPercentage || 20}
                  required
                  className="text-xs h-9 font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-foreground">
                  Unique Referral Code
                </label>
                <Input
                  name="agentCode"
                  defaultValue={selectedAgent.profile?.agentCode || ""}
                  placeholder="e.g. AGT-JOHN-992"
                  className="text-xs h-9 font-mono uppercase"
                />
              </div>

              <DialogFooter className="gap-2 pt-2 border-t border-border/80">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedAgent(null)}
                  className="cursor-pointer"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={approveMutation.isPending}
                  className="font-semibold cursor-pointer shadow-2xs"
                >
                  {approveMutation.isPending ? "Saving..." : "Save Settings"}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* ── PROCESS PAYOUT DIALOG ───────────────────────────────────────── */}
      <Dialog
        open={Boolean(selectedPayout)}
        onOpenChange={(open) => !open && setSelectedPayout(null)}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                <CreditCard className="h-5 w-5" />
              </div>
              <div>
                <DialogTitle className="text-base font-bold text-foreground">
                  Process Payout Request
                </DialogTitle>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Confirm bank wire transfer or UPI settlement
                </p>
              </div>
            </div>
          </DialogHeader>

          {selectedPayout && (
            <form onSubmit={handleProcessPayout} className="space-y-3.5 pt-1">
              <div className="rounded-xl border border-border/80 bg-muted/30 p-3 space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Beneficiary Agent:</span>
                  <span className="font-semibold text-foreground">
                    {selectedPayout.agentId?.name}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Requested Payout:</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400 text-sm">
                    {formatCurrency(
                      selectedPayout.amount,
                      selectedPayout.currency || "INR"
                    )}
                  </span>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-foreground">Settlement Action</label>
                <Select
                  name="action"
                  defaultValue="approve"
                  options={[
                    { value: "approve", label: "Approve & Mark Paid" },
                    { value: "reject", label: "Reject Request" },
                  ]}
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-foreground">
                  Bank Transaction ID / UTR
                </label>
                <Input
                  name="transactionId"
                  placeholder="e.g. UTR-9876543210"
                  className="text-xs h-9 font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-foreground">
                  Admin Internal Notes (Optional)
                </label>
                <Input
                  name="notes"
                  placeholder="Internal audit note or rejection reason"
                  className="text-xs h-9"
                />
              </div>

              <DialogFooter className="gap-2 pt-2 border-t border-border/80">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedPayout(null)}
                  className="cursor-pointer"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={processPayoutMutation.isPending}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold cursor-pointer shadow-2xs"
                >
                  {processPayoutMutation.isPending ? "Processing..." : "Submit Decision"}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
