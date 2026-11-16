"use client";

import React from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Building2,
  Users,
  DollarSign,
  Activity,
  ArrowRight,
  ArrowUpRight,
  RefreshCw,
  CreditCard,
  ShieldCheck,
  Receipt,
  Layers,
  Banknote,
  CheckCircle2,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/components/auth/auth-provider";
import { adminService } from "@/services/admin.service";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { formatCurrency, formatDate } from "@/lib/format";
import { APP_ROUTES } from "@/lib/routes";

export default function AdminRootPage() {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  const [selectedCurrency, setSelectedCurrency] = React.useState<string>("INR");
  const [isRefreshing, setIsRefreshing] = React.useState(false);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["admin-platform-stats"],
    queryFn: () => adminService.getDashboardStats(token),
    enabled: Boolean(token),
  });

  const stats = data;

  React.useEffect(() => {
    if (stats?.mrrByCurrency && stats.mrrByCurrency.length > 0) {
      if (!stats.mrrByCurrency.find((m: any) => m.currency === selectedCurrency)) {
        setSelectedCurrency(stats.mrrByCurrency[0].currency);
      }
    }
  }, [stats, selectedCurrency]);

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    await refetch();
    setTimeout(() => setIsRefreshing(false), 600);
  };

  // Safe calculations
  const totalBusinesses = stats?.totalBusinesses || 0;
  const activeBusinesses = stats?.activeBusinesses || 0;
  const activeRate = totalBusinesses > 0 ? Math.round((activeBusinesses / totalBusinesses) * 100) : 0;
  const activeSubscriptions = stats?.activeSubscriptions || 0;
  const totalUsers = stats?.totalUsers || 0;
  const avgUsersPerBusiness = totalBusinesses > 0 ? (totalUsers / totalBusinesses).toFixed(1) : "0";

  const currentMrrObj = stats?.mrrByCurrency?.find((m: any) => m.currency === selectedCurrency);
  const netMrr = currentMrrObj?.mrr || 0;
  const grossMrr = currentMrrObj?.grossMrr || 0;

  if (isLoading) {
    return (
      <div className="space-y-6">
        {/* Header Skeleton */}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-2">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-96" />
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-9 w-32" />
            <Skeleton className="h-9 w-24" />
          </div>
        </div>

        {/* 4 KPI Skeletons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-8 w-8 rounded-lg" />
              </CardHeader>
              <CardContent className="space-y-2">
                <Skeleton className="h-8 w-24" />
                <Skeleton className="h-3 w-40" />
                <Skeleton className="h-2 w-full mt-3 rounded-full" />
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Quick Actions Skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-24 w-full rounded-xl" />
          ))}
        </div>

        {/* Lower Grid Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Skeleton className="h-80 w-full rounded-xl lg:col-span-2" />
          <Skeleton className="h-80 w-full rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
      {/* ── SECTION HEADER ─────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
              Platform Overview
            </h1>
          </div>
          <p className="mt-0.5 text-xs text-muted-foreground hidden sm:block">
            Multi-tenant SaaS metrics, recurring revenue health, and real-time tenant infrastructure.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {stats?.mrrByCurrency && stats.mrrByCurrency.length > 0 && (
            <Select
              value={selectedCurrency}
              onValueChange={setSelectedCurrency}
              options={stats.mrrByCurrency.map((curr: any) => ({
                value: curr.currency,
                label: `${curr.currency} MRR`,
              }))}
              className="w-28 sm:w-32"
              size="sm"
            />
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={handleManualRefresh}
            disabled={isRefreshing}
            className="h-8 gap-1.5 px-2.5 text-xs cursor-pointer shadow-2xs hover:bg-accent shrink-0"
          >
            <RefreshCw className={`h-3 w-3 ${isRefreshing ? "animate-spin text-primary" : "text-muted-foreground"}`} />
            <span className="hidden sm:inline">Refresh</span>
          </Button>
        </div>
      </div>

      {/* ── 4 KPI HERO CARDS ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Monthly Recurring Revenue */}
        <Card className="group relative overflow-hidden border-border bg-card shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:border-emerald-500/40 hover:shadow-md">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Net Monthly Revenue
            </CardTitle>
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 transition-transform duration-200 group-hover:scale-110">
              <DollarSign className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="text-2xl font-bold tracking-tight text-foreground">
              {formatCurrency(netMrr, selectedCurrency)}
            </div>
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Gross: {formatCurrency(grossMrr, selectedCurrency)}</span>
              <span className="inline-flex items-center rounded-md bg-emerald-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                Net After Comm.
              </span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted mt-2">
              <div
                className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                style={{ width: grossMrr > 0 ? `${Math.min(100, Math.round((netMrr / grossMrr) * 100))}%` : "100%" }}
              />
            </div>
          </CardContent>
        </Card>

        {/* Card 2: Active Businesses */}
        <Card className="group relative overflow-hidden border-border bg-card shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:border-blue-500/40 hover:shadow-md">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Tenant Stores
            </CardTitle>
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 transition-transform duration-200 group-hover:scale-110">
              <Building2 className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold tracking-tight text-foreground">{activeBusinesses}</span>
              <span className="text-xs text-muted-foreground font-medium">active stores</span>
            </div>
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Total Registered: {totalBusinesses}</span>
              <span className="inline-flex items-center rounded-md bg-blue-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-blue-600 dark:text-blue-400">
                {activeRate}% Active
              </span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted mt-2">
              <div
                className="h-full rounded-full bg-blue-500 transition-all duration-500"
                style={{ width: `${Math.min(100, activeRate)}%` }}
              />
            </div>
          </CardContent>
        </Card>

        {/* Card 3: Active Subscriptions */}
        <Card className="group relative overflow-hidden border-border bg-card shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:border-purple-500/40 hover:shadow-md">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Paid Subscriptions
            </CardTitle>
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400 transition-transform duration-200 group-hover:scale-110">
              <CreditCard className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold tracking-tight text-foreground">{activeSubscriptions}</span>
              <span className="text-xs text-muted-foreground font-medium">active plans</span>
            </div>
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Paying Accounts</span>
              <span className="inline-flex items-center rounded-md bg-purple-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-purple-600 dark:text-purple-400">
                Recurring Active
              </span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted mt-2">
              <div
                className="h-full rounded-full bg-purple-500 transition-all duration-500"
                style={{
                  width: totalBusinesses > 0
                    ? `${Math.min(100, Math.round((activeSubscriptions / totalBusinesses) * 100))}%`
                    : "0%",
                }}
              />
            </div>
          </CardContent>
        </Card>

        {/* Card 4: Total Users Registry */}
        <Card className="group relative overflow-hidden border-border bg-card shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:border-amber-500/40 hover:shadow-md">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Total User Accounts
            </CardTitle>
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 transition-transform duration-200 group-hover:scale-110">
              <Users className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold tracking-tight text-foreground">{totalUsers}</span>
              <span className="text-xs text-muted-foreground font-medium">registered users</span>
            </div>
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Avg per tenant store</span>
              <span className="inline-flex items-center rounded-md bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-amber-600 dark:text-amber-400">
                {avgUsersPerBusiness} users/store
              </span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted mt-2">
              <div className="h-full rounded-full bg-amber-500 transition-all duration-500 w-full" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── QUICK OPERATIONS HUB ─────────────────────────────────────────── */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold tracking-tight text-foreground">
            Platform Quick Actions
          </h2>
          <span className="text-xs text-muted-foreground">Frequently accessed administrative workflows</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {/* Action 1: Businesses */}
          <Link
            href={APP_ROUTES.ADMIN_BUSINESSES}
            className="group relative flex flex-col justify-between rounded-xl border border-border bg-card p-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-sm"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary transition-transform duration-200 group-hover:scale-110">
                <Building2 className="h-4 w-4" />
              </div>
              <ArrowUpRight className="h-4 w-4 text-muted-foreground/60 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-primary" />
            </div>
            <div className="mt-3">
              <h3 className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
                Manage Businesses
              </h3>
              <p className="mt-0.5 text-xs text-muted-foreground line-clamp-1">
                View status, inspect outlets, or adjust tenant limits
              </p>
            </div>
          </Link>

          {/* Action 2: Plan Requests */}
          <Link
            href={APP_ROUTES.ADMIN_PLAN_REQUESTS}
            className="group relative flex flex-col justify-between rounded-xl border border-border bg-card p-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-sm"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary transition-transform duration-200 group-hover:scale-110">
                <Receipt className="h-4 w-4" />
              </div>
              <ArrowUpRight className="h-4 w-4 text-muted-foreground/60 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-primary" />
            </div>
            <div className="mt-3">
              <h3 className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
                Plan Requests
              </h3>
              <p className="mt-0.5 text-xs text-muted-foreground line-clamp-1">
                Review tier changes and custom quota submissions
              </p>
            </div>
          </Link>

          {/* Action 3: Manual Payments */}
          <Link
            href={APP_ROUTES.ADMIN_PAYMENTS}
            className="group relative flex flex-col justify-between rounded-xl border border-border bg-card p-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-sm"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary transition-transform duration-200 group-hover:scale-110">
                <Banknote className="h-4 w-4" />
              </div>
              <ArrowUpRight className="h-4 w-4 text-muted-foreground/60 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-primary" />
            </div>
            <div className="mt-3">
              <h3 className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
                Verify Payments
              </h3>
              <p className="mt-0.5 text-xs text-muted-foreground line-clamp-1">
                Inspect bank transfer receipts and invoice proofs
              </p>
            </div>
          </Link>

          {/* Action 4: Audit Trails */}
          <Link
            href={APP_ROUTES.ADMIN_AUDIT_LOGS}
            className="group relative flex flex-col justify-between rounded-xl border border-border bg-card p-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-sm"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary transition-transform duration-200 group-hover:scale-110">
                <ShieldCheck className="h-4 w-4" />
              </div>
              <ArrowUpRight className="h-4 w-4 text-muted-foreground/60 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-primary" />
            </div>
            <div className="mt-3">
              <h3 className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
                Audit Trails
              </h3>
              <p className="mt-0.5 text-xs text-muted-foreground line-clamp-1">
                Inspect security logs, login records, and role mutations
              </p>
            </div>
          </Link>
        </div>
      </div>

      {/* ── LOWER SECTION: RECENT SIGNUPS + PLATFORM READINESS ──────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 Cols): Recent Tenant Signups */}
        <Card className="border-border bg-card shadow-xs lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between border-b border-border/80 pb-3">
            <div>
              <CardTitle className="text-base font-bold text-foreground">
                Recent Tenant Signups
              </CardTitle>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Newly registered store businesses on the platform
              </p>
            </div>
            <Button asChild variant="ghost" size="sm" className="gap-1.5 text-xs text-primary hover:text-primary cursor-pointer">
              <Link href={APP_ROUTES.ADMIN_BUSINESSES}>
                <span>View all ({totalBusinesses})</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="pt-4">
            {!stats?.recentBusinesses || stats.recentBusinesses.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground mb-3">
                  <Building2 className="h-6 w-6" />
                </div>
                <p className="text-sm font-medium text-foreground">No recent signups found</p>
                <p className="mt-1 text-xs text-muted-foreground">New stores will appear here as soon as they register.</p>
              </div>
            ) : (
              <div className="divide-y divide-border/60">
                {stats.recentBusinesses.map((biz: any) => {
                  const initial = biz.name ? biz.name.charAt(0).toUpperCase() : "B";
                  const isActive = biz.status === "active";
                  return (
                    <div
                      key={biz._id}
                      className="group flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-3.5 first:pt-0 last:pb-0 transition-colors hover:bg-muted/30 rounded-lg px-2"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary font-bold text-xs ring-1 ring-primary/20">
                          {initial}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
                            {biz.name}
                          </p>
                          <p className="truncate text-xs text-muted-foreground">
                            {biz.email || "No direct email attached"}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between sm:justify-end gap-3 text-right shrink-0">
                        <span className="text-xs text-muted-foreground font-mono">
                          {biz.createdAt ? formatDate(biz.createdAt) : "Recent"}
                        </span>
                        <Badge
                          variant={isActive ? "soft" : "warning"}
                          className="capitalize text-[11px] font-medium px-2 py-0.5"
                        >
                          {biz.status || "active"}
                        </Badge>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Right Column (1 Col): Platform Infrastructure Status */}
        <Card className="border-border bg-card shadow-xs flex flex-col justify-between">
          <div>
            <CardHeader className="border-b border-border/80 pb-3">
              <CardTitle className="text-base font-bold text-foreground">
                Platform Infrastructure
              </CardTitle>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Core services status and operational health
              </p>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              <div className="flex items-start gap-3 rounded-lg border border-border/60 bg-muted/20 p-3">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                <div className="text-xs space-y-0.5">
                  <p className="font-semibold text-foreground">Tenant Multi-Tenancy</p>
                  <p className="text-muted-foreground leading-relaxed">
                    Data isolation enforced across all {totalBusinesses} businesses.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 rounded-lg border border-border/60 bg-muted/20 p-3">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                <div className="text-xs space-y-0.5">
                  <p className="font-semibold text-foreground">Billing & Invoicing Engine</p>
                  <p className="text-muted-foreground leading-relaxed">
                    Automated tax calculations, receipt dispatch, and payment hooks active.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 rounded-lg border border-border/60 bg-muted/20 p-3">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                <div className="text-xs space-y-0.5">
                  <p className="font-semibold text-foreground">Security & Audit Tracking</p>
                  <p className="text-muted-foreground leading-relaxed">
                    All administrative operations and mutations logged to immutable trail.
                  </p>
                </div>
              </div>
            </CardContent>
          </div>

          <div className="p-4 pt-0 border-t border-border/60 mt-4 space-y-2">
            <div className="flex items-center justify-between text-xs text-muted-foreground pt-3">
              <span>Platform Version</span>
              <span className="font-mono font-medium text-foreground">v2.4 (Enterprise)</span>
            </div>
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Security Protocols</span>
              <span className="font-mono font-medium text-emerald-600 dark:text-emerald-400">Strict RBAC</span>
            </div>
            <Button asChild variant="outline" size="sm" className="w-full mt-3 cursor-pointer text-xs">
              <Link href={APP_ROUTES.ADMIN_SETTINGS}>
                Configure Platform Parameters
              </Link>
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
