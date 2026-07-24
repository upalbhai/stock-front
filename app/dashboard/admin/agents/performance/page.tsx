"use client";

import React from "react";
import { useQuery } from "@tanstack/react-query";
import { adminService } from "@/services/admin.service";
import { useAuth } from "@/components/auth/auth-provider";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/format";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { TrendingUp, Users, DollarSign } from "lucide-react";

export default function AgentPerformancePage() {
  const { token } = useAuth();

  const { data, isLoading } = useQuery({
    queryKey: ["admin-agents-performance"],
    queryFn: () => adminService.getAgentPerformanceStats(token!),
    enabled: Boolean(token)
  });

  const stats = data?.stats || [];

  if (isLoading) {
    return <div className="animate-pulse space-y-4 p-4">Loading performance stats...</div>;
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Agent Performance</h1>
          <p className="text-sm text-muted-foreground mt-1">Monitor agent sales, commissions, and clients.</p>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Agent</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Clients Managed</TableHead>
                <TableHead className="text-right">Total Sales (All Currencies)</TableHead>
                <TableHead className="text-right">Commissions Paid</TableHead>
                <TableHead className="text-right">Commissions Pending</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {stats.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center h-24 text-muted-foreground">
                    No agents found.
                  </TableCell>
                </TableRow>
              ) : (
                stats.map((agent: any) => (
                  <TableRow key={agent._id}>
                    <TableCell>
                      <div className="font-medium">{agent.name}</div>
                      <div className="text-xs text-muted-foreground">{agent.email}</div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={agent.status === "active" ? "success" : "default"}>
                        {agent.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {agent.clientsCount}
                    </TableCell>
                    <TableCell className="text-right">
                      {agent.wallets && agent.wallets.length > 0 ? (
                        <div className="space-y-1">
                          {agent.wallets.map((w: any) => (
                            <div key={w.currency} className="text-sm">
                              {formatCurrency(w.totalSales || 0, w.currency)}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {agent.wallets && agent.wallets.length > 0 ? (
                        <div className="space-y-1">
                          {agent.wallets.map((w: any) => (
                            <div key={w.currency} className="text-sm text-success">
                              {formatCurrency(w.paid || 0, w.currency)}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {agent.wallets && agent.wallets.length > 0 ? (
                        <div className="space-y-1">
                          {agent.wallets.map((w: any) => (
                            <div key={w.currency} className="text-sm text-orange-500">
                              {formatCurrency(w.pending || 0, w.currency)}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
