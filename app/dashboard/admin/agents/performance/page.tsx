"use client";

import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { adminService } from "@/services/admin.service";
import { useAuth } from "@/components/auth/auth-provider";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { formatCurrency } from "@/lib/format";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  TrendingUp,
  Users,
  DollarSign,
  ArrowLeft,
  RefreshCw,
  Search,
  CheckCircle2,
  Clock,
  Store,
  Wallet,
} from "lucide-react";
import Link from "next/link";

export default function AgentPerformancePage() {
  const { token } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "with-clients">("all");

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["admin-agents-performance"],
    queryFn: () => adminService.getAgentPerformanceStats(token!),
    enabled: Boolean(token),
  });

  const stats = data?.stats || [];

  // Metrics
  const totalAgents = stats.length;
  const activeAgents = stats.filter((a: any) => a.status === "active").length;
  const totalClientsManaged = stats.reduce(
    (acc: number, a: any) => acc + (a.clientsCount || 0),
    0
  );

  const filteredStats = stats
    .filter((agent: any) => {
      if (statusFilter === "active") return agent.status === "active";
      if (statusFilter === "with-clients") return (agent.clientsCount || 0) > 0;
      return true;
    })
    .filter((agent: any) => {
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      return (
        agent.name?.toLowerCase().includes(q) ||
        agent.email?.toLowerCase().includes(q)
      );
    });

  return (
    <div className="space-y-4 animate-in fade-in duration-300">
      {/* ── COMPACT SECTION HEADER & LIVE METRIC STRIP ───────────────────── */}
      <div className="flex flex-col gap-3 rounded-xl border border-border/80 bg-card p-3 sm:p-3.5 shadow-2xs">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <Link href="/dashboard/admin/agents">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-muted-foreground hover:text-foreground cursor-pointer shrink-0"
                  title="Back to Agent Management"
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              </Link>
              <h1 className="text-base sm:text-lg font-bold tracking-tight text-foreground sm:text-xl">
                Agent Performance & Revenue
              </h1>
              <span className="inline-flex items-center rounded-md bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-600 border border-emerald-500/20 shrink-0">
                Analytics
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5 ml-9 hidden sm:block">
              Track client acquisition volumes, subscription billings, and commission balances per partner.
            </p>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
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
          {/* All Agents */}
          <button
            type="button"
            onClick={() => setStatusFilter("all")}
            className={`inline-flex shrink-0 items-center gap-2 rounded-lg border px-3 py-1.5 text-xs transition-all cursor-pointer ${
              statusFilter === "all"
                ? "border-primary bg-primary/10 text-primary font-semibold shadow-2xs"
                : "border-border/80 bg-background text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            <Users className="h-3.5 w-3.5" />
            <span>All Agents</span>
            <span
              className={`ml-1 rounded-full px-1.5 py-0.2 text-[10px] font-mono ${
                statusFilter === "all"
                  ? "bg-primary text-primary-foreground font-bold"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {totalAgents}
            </span>
          </button>

          {/* Active Partners */}
          <button
            type="button"
            onClick={() => setStatusFilter("active")}
            className={`inline-flex shrink-0 items-center gap-2 rounded-lg border px-3 py-1.5 text-xs transition-all cursor-pointer ${
              statusFilter === "active"
                ? "border-emerald-500 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold shadow-2xs"
                : "border-border/80 bg-background text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
            <span>Active Referrers</span>
            <span
              className={`ml-1 rounded-full px-1.5 py-0.2 text-[10px] font-mono ${
                statusFilter === "active"
                  ? "bg-emerald-500 text-white font-bold"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {activeAgents}
            </span>
          </button>

          {/* With Active Clients */}
          <button
            type="button"
            onClick={() => setStatusFilter("with-clients")}
            className={`inline-flex shrink-0 items-center gap-2 rounded-lg border px-3 py-1.5 text-xs transition-all cursor-pointer ${
              statusFilter === "with-clients"
                ? "border-primary bg-primary/10 text-primary font-semibold shadow-2xs"
                : "border-border/80 bg-background text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            <Store className="h-3.5 w-3.5 text-primary" />
            <span>With Stores Referred</span>
            <span
              className={`ml-1 rounded-full px-1.5 py-0.2 text-[10px] font-mono ${
                statusFilter === "with-clients"
                  ? "bg-primary text-primary-foreground font-bold"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {stats.filter((a: any) => (a.clientsCount || 0) > 0).length}
            </span>
          </button>

          {/* Total Client Stores */}
          <div className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-border/80 bg-muted/40 px-3 py-1.5 text-xs text-muted-foreground sm:ml-auto">
            <Store className="h-3.5 w-3.5 text-primary" />
            <span>Total Stores Managed:</span>
            <span className="font-bold text-foreground font-mono">{totalClientsManaged}</span>
          </div>
        </div>
      </div>

      {/* ── SEARCH TOOLBAR ──────────────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-3">
        <div className="relative flex-1 max-w-sm min-w-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search agents..."
            className="pl-8 text-xs h-9 bg-card border-border/80"
          />
        </div>
      </div>

      {/* ── PERFORMANCE TABLE ───────────────────────────────────────────── */}
      <div className="rounded-xl border border-border bg-card overflow-x-auto shadow-xs">
        <Table className="min-w-[650px] w-full">
          <TableHeader>
            <TableRow className="bg-muted/40 hover:bg-muted/40 border-b border-border">
              <TableHead className="text-xs font-semibold">Partner Agent</TableHead>
              <TableHead className="text-xs font-semibold">Status</TableHead>
              <TableHead className="text-right text-xs font-semibold">Stores Referred</TableHead>
              <TableHead className="text-right text-xs font-semibold">Total Platform Sales</TableHead>
              <TableHead className="text-right text-xs font-semibold">Commissions Paid</TableHead>
              <TableHead className="text-right text-xs font-semibold">Commissions Due</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-10 text-xs text-muted-foreground">
                  <RefreshCw className="h-4 w-4 animate-spin mx-auto mb-2 text-primary" />
                  Loading performance metrics...
                </TableCell>
              </TableRow>
            ) : filteredStats.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                  No agents found matching your filter.
                </TableCell>
              </TableRow>
            ) : (
              filteredStats.map((agent: any) => {
                const initial = agent.name ? agent.name.charAt(0).toUpperCase() : "A";
                return (
                  <TableRow key={agent._id} className="hover:bg-muted/30 transition-colors">
                    <TableCell>
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 font-bold text-primary ring-1 ring-primary/20 text-xs">
                          {initial}
                        </div>
                        <div>
                          <div className="font-semibold text-xs text-foreground">{agent.name}</div>
                          <div className="text-[11px] text-muted-foreground">{agent.email}</div>
                        </div>
                      </div>
                    </TableCell>

                    <TableCell>
                      <Badge
                        variant={agent.status === "active" ? "soft" : "secondary"}
                        className="capitalize text-[11px] font-medium"
                      >
                        {agent.status}
                      </Badge>
                    </TableCell>

                    <TableCell className="text-right">
                      <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-xs font-mono font-semibold text-foreground">
                        {agent.clientsCount || 0}
                      </span>
                    </TableCell>

                    <TableCell className="text-right">
                      {agent.wallets && agent.wallets.length > 0 ? (
                        <div className="space-y-0.5">
                          {agent.wallets.map((w: any) => (
                            <div key={w.currency} className="text-xs font-bold text-foreground">
                              {formatCurrency(w.totalSales || 0, w.currency)}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">None</span>
                      )}
                    </TableCell>

                    <TableCell className="text-right">
                      {agent.wallets && agent.wallets.length > 0 ? (
                        <div className="space-y-0.5">
                          {agent.wallets.map((w: any) => (
                            <div
                              key={w.currency}
                              className="text-xs font-semibold text-emerald-600 dark:text-emerald-400"
                            >
                              {formatCurrency(w.paid || 0, w.currency)}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">None</span>
                      )}
                    </TableCell>

                    <TableCell className="text-right">
                      {agent.wallets && agent.wallets.length > 0 ? (
                        <div className="space-y-0.5">
                          {agent.wallets.map((w: any) => (
                            <div
                              key={w.currency}
                              className={`text-xs font-semibold ${
                                (w.pending || 0) > 0
                                  ? "text-amber-600 dark:text-amber-400 font-bold"
                                  : "text-muted-foreground"
                              }`}
                            >
                              {formatCurrency(w.pending || 0, w.currency)}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">None</span>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
