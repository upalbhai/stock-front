"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouter, usePathname } from "next/navigation";
import { ShieldAlertIcon, Sparkles, Store, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatsCard } from "@/components/ui/stats-card";
import { useAuth } from "@/components/auth/auth-provider";
import { adminService } from "@/services/admin.service";
import { APP_ROUTES } from "@/lib/routes";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { token, user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();


  const { data: statsData } = useQuery({
    queryKey: ["admin-dashboard-stats"],
    queryFn: () => adminService.getDashboardStats(token),
    enabled: Boolean(token && user?.role === "superadmin"),
  });

  if (!user) {
    return null;
  }

  if (user.role !== "superadmin") {
    return (
      <div className="flex flex-col items-center justify-center space-y-4 py-20 text-center">
        <ShieldAlertIcon className="h-16 w-16 text-danger" />
        <h2 className="text-xl font-bold">Unauthorized Access</h2>
        <p className="text-sm text-muted-foreground">Only Super Administrators have access to this portal.</p>
        <Button onClick={() => router.push(APP_ROUTES.DASHBOARD)}>Return to Home</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-extrabold tracking-tight lg:text-3xl">
          <Sparkles className="h-6 w-6 animate-pulse text-primary lg:h-7 lg:w-7" /> Super Admin Portal
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage platform metrics, client accounts, outlets, and system audits.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatsCard
          label="Registered Businesses"
          value={statsData?.totalBusinesses || 0}
          icon={<Store className="h-5 w-5" />}
        />
        <StatsCard label="Active Businesses" value={statsData?.activeBusinesses || 0} color="success" />
        <StatsCard
          label="Platform Total Users"
          value={statsData?.totalUsers || 0}
          icon={<Users className="h-5 w-5" />}
        />
      </div>

      <div>{children}</div>
    </div>
  );
}
