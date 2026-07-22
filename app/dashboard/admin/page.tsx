"use client";

import React from "react";
import { useQuery } from "@tanstack/react-query";
import { Building2, Users, DollarSign, Activity, ArrowRight } from "lucide-react";
import { useAuth } from "@/components/auth/auth-provider";
import { adminService } from "@/services/admin.service";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency } from "@/lib/format";
import Link from "next/link";
import { APP_ROUTES } from "@/lib/routes";
import { Badge } from "@/components/ui/badge";

export default function AdminRootPage() {
  const { token } = useAuth();

  const { data, isLoading } = useQuery({
    queryKey: ["admin-platform-stats"],
    queryFn: () => adminService.getDashboardStats(token),
    enabled: Boolean(token)
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold tracking-tight">Platform Overview</h1>
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

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Platform Overview</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Monitor the health and growth of your SaaS platform.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-card to-card/50 shadow-sm border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Monthly Recurring Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{formatCurrency(stats?.mrr || 0, "INR")}</div>
            <p className="text-xs text-muted-foreground mt-1">From active subscriptions</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-card to-card/50 shadow-sm border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active Businesses</CardTitle>
            <Building2 className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{stats?.activeBusinesses || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">Out of {stats?.totalBusinesses || 0} total registered</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-card to-card/50 shadow-sm border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active Subscriptions</CardTitle>
            <Activity className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{stats?.activeSubscriptions || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">Paying customers on the platform</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-card to-card/50 shadow-sm border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Users</CardTitle>
            <Users className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{stats?.totalUsers || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">Across all businesses</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
        <Card className="border-border shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2 border-b">
            <div>
              <CardTitle className="text-base font-semibold text-foreground">Recent Signups</CardTitle>
              <p className="text-xs text-muted-foreground mt-1">Newest businesses on the platform</p>
            </div>
            <Link href={APP_ROUTES.ADMIN_BUSINESSES} className="text-xs flex items-center text-primary hover:underline">
              View all <ArrowRight className="ml-1 h-3 w-3" />
            </Link>
          </CardHeader>
          <CardContent className="pt-4">
            {(!stats?.recentBusinesses || stats.recentBusinesses.length === 0) ? (
              <div className="text-center py-6 text-sm text-muted-foreground">No recent signups found.</div>
            ) : (
              <div className="space-y-4">
                {stats.recentBusinesses.map((biz) => (
                  <div key={biz._id} className="flex justify-between items-center bg-muted/30 p-3 rounded-lg border border-border/50">
                    <div>
                      <p className="font-semibold text-sm text-foreground">{biz.name}</p>
                      <p className="text-xs text-muted-foreground">{biz.email || "No email provided"}</p>
                    </div>
                    <div className="text-right flex flex-col items-end gap-1">
                      <span className="text-[10px] text-muted-foreground">
                        {new Date(biz.createdAt).toLocaleDateString()}
                      </span>
                      <Badge variant={biz.status === "active" ? "soft" : "warning"} className="text-[10px] capitalize">
                        {biz.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
