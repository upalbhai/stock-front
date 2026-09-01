"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/components/auth/auth-provider";
import { authService } from "@/services/auth.service";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { SecuritySettings } from "@/components/settings/security-settings";
import {
  User, Mail, Phone, Building,
  CheckCircle2, ShieldCheck
} from "lucide-react";

export default function ProfilePage() {
  const { user: authUser } = useAuth();

  // Fetch fresh user profile from /auth/me
  const { data: meData } = useQuery({
    queryKey: ["auth-me"],
    queryFn: () => authService.getMe(),
    staleTime: 60000,
  });

  const meUser = meData?.data?.user || meData?.user || {};
  const user = { ...authUser, ...meUser };

  const displayName = user?.name || "User";
  const userRole = user?.role?.toUpperCase() || "STAFF";

  return (
    <div className="space-y-8 max-w-5xl mx-auto px-4 py-4 sm:px-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
      {/* Page Header */}
      <div className="flex flex-col gap-1 border-b border-border/40 pb-5">
        <h1 className="text-3xl font-extrabold tracking-tight flex items-center gap-3 text-foreground">
          <div className="p-2 bg-primary/10 rounded-xl text-primary">
            <User className="h-7 w-7" />
          </div>
          My Profile & Security
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage your account credentials, security preferences, active sessions, and password.
        </p>
      </div>

      {/* User Information Card */}
      <Card className="overflow-hidden rounded-2xl border border-border/50 bg-card shadow-md">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
            <Avatar name={displayName} size="lg" className="h-16 w-16 text-xl font-bold border-2 border-primary/20 shadow-sm" />
            <div className="space-y-2 flex-1">
              <div className="flex flex-wrap items-center gap-3">
                <h2 className="text-2xl font-bold text-foreground">{displayName}</h2>
                <Badge
                  variant={user?.role === "superadmin" ? "danger" : user?.role === "owner" ? "default" : "soft"}
                  className="font-bold uppercase tracking-wider text-xs px-2.5 py-0.5"
                >
                  {userRole}
                </Badge>
                {user?.emailVerified && (
                  <Badge variant="soft" className="bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 text-xs gap-1">
                    <CheckCircle2 className="h-3 w-3" /> Verified
                  </Badge>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-2 text-xs text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-primary" />
                  <span className="font-mono text-foreground">{user?.email || "No email"}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-primary" />
                  <span className="font-mono text-foreground">{user?.phone || "No phone"}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Building className="h-4 w-4 text-primary" />
                  <span className="text-foreground">{user?.businessName || (user?.role === "superadmin" ? "Platform Administrator" : "No Business")}</span>
                </div>
                <div className="flex items-center gap-2 sm:col-span-2">
                  <ShieldCheck className="h-4 w-4 text-primary" />
                  <span className="font-mono text-[11px] text-muted-foreground select-all">User ID: {user?.id || user?._id}</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Security & Password Settings Component */}
      <div className="pt-2">
        <SecuritySettings />
      </div>
    </div>
  );
}
