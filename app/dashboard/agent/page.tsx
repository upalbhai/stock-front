"use client";

import React from "react";
import { useQuery } from "@tanstack/react-query";
import { Users, DollarSign, Wallet, ArrowRight, Percent } from "lucide-react";
import { useAuth } from "@/components/auth/auth-provider";
import { agentService } from "@/services/agent.service";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency } from "@/lib/format";
import Link from "next/link";
import { APP_ROUTES } from "@/lib/routes";

export default function AgentRootPage() {
  const { token } = useAuth();

  const [selectedCurrency, setSelectedCurrency] = React.useState<string>("INR");

  const { data, isLoading } = useQuery({
    queryKey: ["agent-stats"],
    queryFn: () => agentService.getStats(token!),
    enabled: Boolean(token)
  });

  // Effect to auto-select the first available currency if wallets exist and current isn't valid
  React.useEffect(() => {
    if (data?.wallets?.length) {
      const hasCurrency = data.wallets.some((w: any) => w.currency === selectedCurrency);
      if (!hasCurrency) {
        setSelectedCurrency(data.wallets[0].currency);
      }
    }
  }, [data, selectedCurrency]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold tracking-tight">Agent Dashboard</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-4" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16 mb-1" />
                <Skeleton className="h-3 w-32" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const stats = data;
  const availableCurrencies = stats?.wallets?.map((w: any) => w.currency) || ["INR"];
  const activeWallet = stats?.wallets?.find((w: any) => w.currency === selectedCurrency) || { currency: selectedCurrency, totalSales: 0, pending: 0, paid: 0 };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Agent Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Overview of your sales, clients, and commissions.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {availableCurrencies.length > 0 && (
            <select
              value={selectedCurrency}
              onChange={(e) => setSelectedCurrency(e.target.value)}
              className="h-9 rounded-md border border-input bg-card px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring font-semibold text-primary"
            >
              {availableCurrencies.map((cur: string) => (
                <option key={cur} value={cur}>{cur} Wallet</option>
              ))}
            </select>
          )}
          {stats?.agentCode && (
            <div className="bg-primary/10 text-primary px-3 py-1.5 rounded-md font-mono text-sm border border-primary/20">
              Ref Code: <span className="font-bold">{stats.agentCode}</span>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-card to-card/50 shadow-sm border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Sales ({activeWallet.currency})</CardTitle>
            <DollarSign className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{formatCurrency(activeWallet.totalSales || 0, activeWallet.currency)}</div>
            <p className="text-xs text-muted-foreground mt-1">Revenue generated in {activeWallet.currency}</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-card to-card/50 shadow-sm border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active Clients</CardTitle>
            <Users className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{stats?.activeClients || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">Businesses managed by you</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-card to-card/50 shadow-sm border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Commission Rate</CardTitle>
            <Percent className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{stats?.commissionPercentage || 0}%</div>
            <p className="text-xs text-muted-foreground mt-1">Applied to all sales</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-card to-card/50 shadow-sm border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pending Payout ({activeWallet.currency})</CardTitle>
            <Wallet className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{formatCurrency(activeWallet.pending || 0, activeWallet.currency)}</div>
            <p className="text-xs text-muted-foreground mt-1">Already Paid: {formatCurrency(activeWallet.paid || 0, activeWallet.currency)}</p>
          </CardContent>
        </Card>
      </div>

    </div>
  );
}
