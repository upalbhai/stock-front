"use client";

import React from "react";
import { useQuery } from "@tanstack/react-query";
import { Users, DollarSign, Wallet, ArrowRight, Percent, Copy, Check } from "lucide-react";
import { useAuth } from "@/components/auth/auth-provider";
import { agentService } from "@/services/agent.service";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency } from "@/lib/format";
import Link from "next/link";
import { APP_ROUTES } from "@/lib/routes";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { toast } from "react-hot-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function AgentRootPage() {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  const [selectedCurrency, setSelectedCurrency] = React.useState<string>("INR");
  const [payoutAmount, setPayoutAmount] = React.useState<string>("");
  const [isPayoutModalOpen, setIsPayoutModalOpen] = React.useState(false);
  const [copiedRef, setCopiedRef] = React.useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["agent-stats"],
    queryFn: () => agentService.getStats(token!),
    enabled: Boolean(token)
  });

  const { data: historyData, isLoading: isLoadingHistory } = useQuery({
    queryKey: ["agent-wallet-history", selectedCurrency],
    queryFn: () => agentService.getWalletHistory(token!, selectedCurrency),
    enabled: Boolean(token && selectedCurrency)
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

  const payoutMutation = useMutation({
    mutationFn: (amount: number) => agentService.requestPayout({ currency: selectedCurrency, amount }, token!),
    onSuccess: () => {
      toast.success(`Payout request for ${selectedCurrency} submitted successfully`);
      queryClient.invalidateQueries({ queryKey: ["agent-stats"] });
      setIsPayoutModalOpen(false);
      setPayoutAmount("");
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to request payout");
    }
  });

  const handleRequestPayout = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = Number(payoutAmount);
    if (!amount || amount <= 0) return toast.error("Enter a valid amount");
    payoutMutation.mutate(amount);
  };

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
  
  // Calculate total pending requests for the selected currency
  const activePendingRequestsAmount = stats?.pendingRequests
    ?.filter((req: any) => req.currency === selectedCurrency)
    ?.reduce((sum: number, req: any) => sum + req.amount, 0) || 0;

  const availableToRequest = Math.max(0, (activeWallet.pending || 0) - activePendingRequestsAmount);

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
            <Select
              value={selectedCurrency}
              onValueChange={setSelectedCurrency}
              options={availableCurrencies.map((cur: string) => ({
                value: cur,
                label: `${cur} Wallet`
              }))}
              className="w-32 h-9 text-sm font-semibold text-primary"
            />
          )}
          {stats?.agentCode && (
            <button
              type="button"
              onClick={() => {
                const origin = typeof window !== "undefined" ? window.location.origin : "https://minihisab.com";
                const link = `${origin}/login?ref=${stats.agentCode}`;
                navigator.clipboard.writeText(link);
                setCopiedRef(true);
                toast.success("Referral link copied to clipboard!");
                setTimeout(() => setCopiedRef(false), 2000);
              }}
              title="Click to copy your referral link"
              className="group flex items-center gap-1.5 bg-primary/10 hover:bg-primary/20 text-primary px-3 py-1.5 rounded-md font-mono text-sm border border-primary/20 transition-all cursor-pointer"
            >
              <span>Ref:</span>
              <span className="font-bold">{stats.agentCode}</span>
              {copiedRef ? (
                <Check className="h-3.5 w-3.5 text-emerald-600 animate-in zoom-in-50" />
              ) : (
                <Copy className="h-3.5 w-3.5 opacity-70 group-hover:opacity-100" />
              )}
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
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
            <div className="text-xs text-muted-foreground mt-1 flex justify-between items-center">
              <span>Already Paid: {formatCurrency(activeWallet.paid || 0, activeWallet.currency)}</span>
              {activePendingRequestsAmount > 0 && (
                <span className="text-orange-500 font-medium">Requested: {formatCurrency(activePendingRequestsAmount, activeWallet.currency)}</span>
              )}
            </div>
            
            <Dialog open={isPayoutModalOpen} onOpenChange={setIsPayoutModalOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="w-full mt-4 h-8 text-xs" disabled={availableToRequest <= 0}>
                  Request Payout
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Request Payout ({activeWallet.currency})</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleRequestPayout} className="space-y-4 pt-2">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Available to Request</label>
                    <div className="text-lg font-bold text-success">{formatCurrency(availableToRequest, activeWallet.currency)}</div>
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="payoutAmount" className="text-sm font-medium leading-none">Amount to Request</label>
                    <Input 
                      id="payoutAmount" 
                      type="number" 
                      min="1" 
                      max={availableToRequest} 
                      value={payoutAmount}
                      onChange={(e) => setPayoutAmount(e.target.value)}
                      placeholder={`Max: ${availableToRequest}`}
                      required 
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={payoutMutation.isPending}>
                    {payoutMutation.isPending ? "Submitting..." : "Submit Request"}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        <h2 className="text-xl font-bold tracking-tight text-foreground">Wallet History</h2>
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoadingHistory ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center h-24 text-muted-foreground animate-pulse">Loading history...</TableCell>
                  </TableRow>
                ) : historyData?.transactions && historyData.transactions.length > 0 ? (
                  historyData.transactions.map((tx: any) => (
                    <TableRow key={tx._id}>
                      <TableCell className="whitespace-nowrap">{new Date(tx.createdAt).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <Badge variant={tx.type === "commission" ? "success" : "default"} className="capitalize">
                          {tx.type}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{tx.description}</TableCell>
                      <TableCell className={`text-right font-medium ${tx.type === "commission" ? "text-success" : ""}`}>
                        {tx.type === "payout" ? "-" : "+"}{formatCurrency(tx.amount, tx.currency)}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center h-24 text-muted-foreground">No transactions found for this wallet.</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

    </div>
  );
}
