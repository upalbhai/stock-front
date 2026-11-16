"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/components/auth/auth-provider";
import { authService } from "@/services/auth.service";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SecuritySettings } from "@/components/settings/security-settings";
import {
  User,
  Mail,
  Phone,
  Building2,
  CheckCircle2,
  ShieldCheck,
  Crown,
  Briefcase,
  UserCheck,
  RefreshCw,
  Copy,
  Check,
  Calendar,
  Layers,
  Sparkles,
} from "lucide-react";
import { toast } from "react-hot-toast";

export default function ProfilePage() {
  const { user: authUser } = useAuth();
  const [copiedField, setCopiedField] = React.useState<string | null>(null);

  // Fetch fresh user profile from /auth/me
  const { data: meData, isLoading, refetch } = useQuery({
    queryKey: ["auth-me"],
    queryFn: () => authService.getMe(),
    staleTime: 60000,
  });

  const meUser = meData?.data?.user || meData?.user || {};
  const user = { ...authUser, ...meUser };

  const displayName = user?.name || "User";
  const userRole = (user?.role || "staff").toLowerCase();

  const handleCopy = (text: string, label: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedField(label);
    toast.success(`${label} copied to clipboard`);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const getRoleConfig = (role: string) => {
    switch (role) {
      case "superadmin":
        return {
          label: "Superadmin",
          icon: ShieldCheck,
          badgeClass: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20",
        };
      case "owner":
        return {
          label: "Store Owner",
          icon: Crown,
          badgeClass: "bg-primary/10 text-primary border-primary/20",
        };
      case "agent":
        return {
          label: "Partner Agent",
          icon: Briefcase,
          badgeClass: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
        };
      default:
        return {
          label: "Team Member",
          icon: UserCheck,
          badgeClass: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
        };
    }
  };

  const roleConfig = getRoleConfig(userRole);
  const RoleIcon = roleConfig.icon;

  const memberSince = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString("en-US", { month: "short", year: "numeric" })
    : "Active Member";

  const businessDisplay =
    user?.businessName ||
    (user?.role === "superadmin" ? "Platform Administrator" : "Personal Workspace");

  return (
    <div className="space-y-4 max-w-5xl mx-auto animate-in fade-in duration-300">
      {/* ── SECTION HEADER (COMPACT & RESPONSIVE) ─────────────────────────── */}
      <div className="flex flex-col gap-3 rounded-xl border border-border/80 bg-card p-3 sm:p-3.5 shadow-2xs">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-base sm:text-lg font-bold tracking-tight text-foreground sm:text-xl">
                My Profile & Security
              </h1>
              <span
                className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider border shrink-0 ${roleConfig.badgeClass}`}
              >
                <RoleIcon className="h-3 w-3" />
                {roleConfig.label}
              </span>
              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-md px-2 py-0.5 shrink-0">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Active Account
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5 hidden sm:block">
              Manage your personal credentials, identity profile, sign-in methods, and active device sessions.
            </p>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              className="h-7 sm:h-8 gap-1 px-2 sm:px-2.5 text-xs cursor-pointer shadow-2xs hover:bg-accent"
            >
              <RefreshCw className={`h-3 w-3 ${isLoading ? "animate-spin text-primary" : "text-muted-foreground"}`} />
              <span className="hidden sm:inline">Refresh</span>
            </Button>
          </div>
        </div>
      </div>

      {/* ── USER PROFILE IDENTITY CARD ────────────────────────────────────── */}
      <div className="rounded-xl border border-border/80 bg-card p-4 sm:p-5 shadow-2xs space-y-4">
        {/* Top Profile Banner */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-border/60">
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="relative">
              <Avatar
                name={displayName}
                size="lg"
                className="h-14 w-14 text-lg font-bold ring-2 ring-primary/20 shadow-xs"
              />
              <span className="absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full bg-emerald-500 ring-2 ring-card" />
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg sm:text-xl font-bold text-foreground truncate">
                  {displayName}
                </h2>
                {user?.emailVerified ? (
                  <span className="inline-flex items-center gap-1 rounded-md bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                    <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                    Verified
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded-md bg-amber-500/10 px-2 py-0.5 text-[10px] font-bold text-amber-600 dark:text-amber-400 border border-amber-500/20">
                    Pending Verification
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground font-mono truncate mt-0.5">
                {user?.email || "No email assigned"}
              </p>
            </div>
          </div>

          {/* User ID copy badge */}
          <div className="flex items-center gap-1.5 self-start sm:self-center">
            <button
              type="button"
              onClick={() => handleCopy(user?.id || user?._id || "", "User ID")}
              className="group inline-flex items-center gap-1.5 rounded-lg border border-border/80 bg-muted/30 px-2.5 py-1 text-xs text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
              title="Click to copy User ID"
            >
              <span className="text-[11px] font-mono">
                ID: {user?.id || user?._id ? `${String(user.id || user._id).slice(0, 10)}...` : "N/A"}
              </span>
              {copiedField === "User ID" ? (
                <Check className="h-3 w-3 text-emerald-500" />
              ) : (
                <Copy className="h-3 w-3 opacity-60 group-hover:opacity-100" />
              )}
            </button>
          </div>
        </div>

        {/* Identity Details Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-1">
          {/* Email */}
          <div className="flex items-start justify-between p-3 rounded-xl border border-border/60 bg-muted/10 hover:bg-muted/30 transition-colors">
            <div className="min-w-0 pr-2">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground block">
                Email Address
              </span>
              <span className="text-xs font-semibold text-foreground truncate block font-mono mt-0.5">
                {user?.email || "Not provided"}
              </span>
            </div>
            {user?.email && (
              <button
                type="button"
                onClick={() => handleCopy(user.email, "Email")}
                className="text-muted-foreground hover:text-foreground p-1 cursor-pointer shrink-0"
                title="Copy email"
              >
                {copiedField === "Email" ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
              </button>
            )}
          </div>

          {/* Phone */}
          <div className="flex items-start justify-between p-3 rounded-xl border border-border/60 bg-muted/10 hover:bg-muted/30 transition-colors">
            <div className="min-w-0 pr-2">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground block">
                Contact Phone
              </span>
              <span className="text-xs font-semibold text-foreground truncate block font-mono mt-0.5">
                {user?.phone || "No phone linked"}
              </span>
            </div>
            {user?.phone && (
              <button
                type="button"
                onClick={() => handleCopy(user.phone, "Phone")}
                className="text-muted-foreground hover:text-foreground p-1 cursor-pointer shrink-0"
                title="Copy phone"
              >
                {copiedField === "Phone" ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
              </button>
            )}
          </div>

          {/* Business Workspace */}
          <div className="flex items-start justify-between p-3 rounded-xl border border-border/60 bg-muted/10 hover:bg-muted/30 transition-colors">
            <div className="min-w-0 pr-2">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground block">
                Store Business
              </span>
              <span className="text-xs font-semibold text-foreground truncate block mt-0.5">
                {businessDisplay}
              </span>
            </div>
            <Building2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
          </div>

          {/* Subscription Tier */}
          <div className="flex items-start justify-between p-3 rounded-xl border border-border/60 bg-muted/10 hover:bg-muted/30 transition-colors">
            <div className="min-w-0 pr-2">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground block">
                Account Tier
              </span>
              <span className="text-xs font-semibold text-foreground truncate block capitalize mt-0.5">
                {user?.planType || (user?.role === "superadmin" ? "Superadmin Tier" : "Standard Plan")}
              </span>
            </div>
            <Layers className="h-4 w-4 text-primary shrink-0 mt-0.5" />
          </div>

          {/* Member Registration */}
          <div className="flex items-start justify-between p-3 rounded-xl border border-border/60 bg-muted/10 hover:bg-muted/30 transition-colors">
            <div className="min-w-0 pr-2">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground block">
                Member Since
              </span>
              <span className="text-xs font-semibold text-foreground truncate block mt-0.5">
                {memberSince}
              </span>
            </div>
            <Calendar className="h-4 w-4 text-primary shrink-0 mt-0.5" />
          </div>

          {/* Preferred Sign-In Method */}
          <div className="flex items-start justify-between p-3 rounded-xl border border-border/60 bg-muted/10 hover:bg-muted/30 transition-colors">
            <div className="min-w-0 pr-2">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground block">
                Sign-In Method
              </span>
              <span className="text-xs font-semibold text-foreground truncate block capitalize mt-0.5">
                {user?.preferredLoginMethod === "otp" ? "Email OTP (Passwordless)" : "Password + OTP"}
              </span>
            </div>
            <Sparkles className="h-4 w-4 text-primary shrink-0 mt-0.5" />
          </div>
        </div>
      </div>

      {/* ── SECURITY CREDENTIALS & SESSIONS SECTION ───────────────────────── */}
      <SecuritySettings />
    </div>
  );
}
