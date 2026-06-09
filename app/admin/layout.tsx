"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import {
  ShieldAlertIcon, Users, Store, Sparkles, CreditCard, ClipboardList
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatsCard } from "@/components/ui/stats-card";
import { useAuth } from "@/components/auth/auth-provider";
import { getJson } from "@/lib/api-client";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { token, user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  // Platform Stats Query
  const { data: statsData } = useQuery({
    queryKey: ["admin-stats"],
    queryFn: () => getJson<{ totalBusinesses: number; activeBusinesses: number; totalUsers: number }>("/admin/stats", token),
    enabled: Boolean(token && user?.role === "superadmin")
  });

  if (!user) {
    return null; // Let the global auth handle basic redirects if needed, but we check superadmin below
  }

  if (user.role !== "superadmin") {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
        <ShieldAlertIcon className="h-16 w-16 text-danger" />
        <h2 className="text-xl font-bold">Unauthorized Access</h2>
        <p className="text-sm text-muted">Only Super Administrators have access to this portal.</p>
        <Button onClick={() => router.push("/")}>Return to Home</Button>
      </div>
    );
  }

  const stats = statsData;

  const tabsConfig = [
    { id: "businesses", label: "Businesses", icon: Store, path: "/admin/businesses" },
    { id: "outlets", label: "Outlets", icon: Store, path: "/admin/outlets" },
    { id: "users", label: "Users Registry", icon: Users, path: "/admin/users" },
    { id: "audit-logs", label: "Audit Trails", icon: ClipboardList, path: "/admin/audit-logs" },
    { id: "plans", label: "Plans", icon: CreditCard, path: "/admin/plans" }
  ] as const;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold flex items-center gap-2 tracking-tight">
            <Sparkles className="h-7 w-7 text-primary animate-pulse" /> Super Admin Portal
          </h1>
          <p className="text-sm text-muted mt-1">Manage global platforms metrics, client accounts, active outlets, and track system audits.</p>
        </div>
      </div>

      {/* Hero Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <StatsCard label="Registered Businesses" value={stats?.totalBusinesses || 0} icon={<Store className="h-5 w-5" />} />
        <StatsCard label="Active Businesses" value={stats?.activeBusinesses || 0} color="success" />
        <StatsCard label="Platform Total Users" value={stats?.totalUsers || 0} icon={<Users className="h-5 w-5" />} />
      </div>

      {/* Navigation Tabs */}
      <div className="flex gap-2 border-b border-border/60 pb-1.5 overflow-x-auto">
        {tabsConfig.map((t) => {
          const Icon = t.icon;
          const isActive = pathname.startsWith(t.path);
          return (
            <Link
              key={t.id}
              href={t.path}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-2xl transition-all whitespace-nowrap ${
                isActive
                  ? "bg-primary text-white shadow-soft"
                  : "text-muted hover:bg-surface hover:text-text"
              }`}
            >
              <Icon className="h-4 w-4" />
              {t.label}
            </Link>
          );
        })}
      </div>

      {/* Sub-page Content */}
      <div className="pt-2">
        {children}
      </div>
    </div>
  );
}
