"use client";

import * as React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/components/auth/auth-provider";
import { authService } from "@/services/auth.service";
import { userService } from "@/services/user.service";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { Card, CardContent } from "@/components/ui/card";
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
  Pencil,
  Store,
  Clock,
  IdCard,
  ShieldAlert,
} from "lucide-react";
import { toast } from "react-hot-toast";
import { getErrorMessage } from "@/lib/error";
import { cn } from "@/lib/utils";

export default function ProfilePage() {
  const { user: authUser, token } = useAuth();
  const qc = useQueryClient();
  const [copiedField, setCopiedField] = React.useState<string | null>(null);
  const [showEditModal, setShowEditModal] = React.useState(false);

  // Fetch fresh user profile from /auth/me
  const { data: meData, isLoading, refetch } = useQuery({
    queryKey: ["auth-me"],
    queryFn: () => authService.getMe(),
    staleTime: 5_000,
  });

  const meUser = meData?.data?.user || meData?.user || {};
  const user = { ...authUser, ...meUser };

  const displayName = user?.name || "User";
  const userRole = (user?.role || "staff").toLowerCase();

  const [editForm, setEditForm] = React.useState({
    name: "",
    phone: "",
  });

  React.useEffect(() => {
    if (user?.name || user?.phone) {
      setEditForm({
        name: user.name || "",
        phone: user.phone || "",
      });
    }
  }, [user?.name, user?.phone]);

  const updateProfileMutation = useMutation({
    mutationFn: (data: { name: string; phone: string }) =>
      userService.updateUser(user?.id || user?._id, data, token),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["auth-me"] });
      setShowEditModal(false);
      toast.success("Profile information updated successfully");
    },
    onError: (err) => {
      toast.error(getErrorMessage(err, "Failed to update profile"));
    },
  });

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
          badgeClass: "bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/20",
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
          badgeClass: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20",
        };
      default:
        return {
          label: "Team Member",
          icon: UserCheck,
          badgeClass: "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20",
        };
    }
  };

  const roleConfig = getRoleConfig(userRole);
  const RoleIcon = roleConfig.icon;

  const memberSince = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
    : "Active Member";

  const businessDisplay =
    user?.businessName ||
    (user?.role === "superadmin" ? "Platform Administrator" : "Personal Workspace");

  const outletsList = user?.outlets || [];

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border/60">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">My Profile & Security</h1>
            <span
              className={cn(
                "inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-bold uppercase tracking-wider border",
                roleConfig.badgeClass
              )}
            >
              <RoleIcon className="h-3 w-3" />
              {roleConfig.label}
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Personal identity credentials, store role assignments, security keys, and active device sessions.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isLoading}
            className="h-10 px-3 gap-1.5 text-xs font-semibold border-border/80 hover:bg-muted/50 cursor-pointer"
          >
            <RefreshCw className={cn("h-3.5 w-3.5", isLoading && "animate-spin text-primary")} />
            <span>Refresh</span>
          </Button>

          <Button
            size="sm"
            onClick={() => setShowEditModal(true)}
            className="h-10 px-4 gap-2 text-xs font-bold bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm rounded-xl cursor-pointer"
          >
            <Pencil className="h-3.5 w-3.5" />
            <span>Edit Profile</span>
          </Button>
        </div>
      </div>

      {/* Identity Hero Card */}
      <div className="rounded-2xl border border-border/80 bg-card p-5 sm:p-6 shadow-2xs space-y-5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-5 border-b border-border/60">
          <div className="flex items-center gap-4 min-w-0">
            <div className="relative">
              <Avatar
                name={displayName}
                size="lg"
                className="h-16 w-16 text-xl font-black ring-4 ring-primary/10 shadow-xs"
              />
              <span className="absolute bottom-0 right-0 h-4 w-4 rounded-full bg-emerald-500 ring-2 ring-card" />
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xl font-bold tracking-tight text-foreground truncate">
                  {displayName}
                </h2>
                {user?.emailVerified ? (
                  <span className="inline-flex items-center gap-1 rounded-md bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
                    <CheckCircle2 className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
                    Email Verified
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded-md bg-amber-500/10 px-2 py-0.5 text-[10px] font-bold text-amber-700 dark:text-amber-400 border border-amber-500/20">
                    Pending Verification
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground font-mono truncate mt-0.5">
                {user?.email || "No email assigned"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleCopy(user?.id || user?._id || "", "User ID")}
              className="group inline-flex items-center gap-1.5 rounded-lg border border-border/80 bg-muted/30 px-3 py-1.5 text-xs text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
              title="Click to copy User ID"
            >
              <IdCard className="h-3.5 w-3.5 text-primary" />
              <span className="text-[11px] font-mono">
                ID: {user?.id || user?._id ? `${String(user.id || user._id).slice(0, 10)}...` : "N/A"}
              </span>
              {copiedField === "User ID" ? (
                <Check className="h-3.5 w-3.5 text-emerald-600" />
              ) : (
                <Copy className="h-3.5 w-3.5 opacity-60 group-hover:opacity-100" />
              )}
            </button>
          </div>
        </div>

        {/* Identity Attributes Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {/* Email Address */}
          <div className="flex items-start justify-between p-3.5 rounded-xl border border-border/70 bg-muted/20 hover:bg-muted/40 transition-colors">
            <div className="min-w-0 pr-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                Primary Email
              </span>
              <span className="text-xs font-bold text-foreground truncate block font-mono mt-1">
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
                {copiedField === "Email" ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
              </button>
            )}
          </div>

          {/* Contact Phone */}
          <div className="flex items-start justify-between p-3.5 rounded-xl border border-border/70 bg-muted/20 hover:bg-muted/40 transition-colors">
            <div className="min-w-0 pr-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                Phone Number
              </span>
              <span className="text-xs font-bold text-foreground truncate block font-mono mt-1">
                {user?.phone || "No phone linked"}
              </span>
            </div>
            {user?.phone ? (
              <button
                type="button"
                onClick={() => handleCopy(user.phone, "Phone")}
                className="text-muted-foreground hover:text-foreground p-1 cursor-pointer shrink-0"
                title="Copy phone"
              >
                {copiedField === "Phone" ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setShowEditModal(true)}
                className="text-xs font-bold text-primary hover:underline shrink-0 mt-1"
              >
                + Add
              </button>
            )}
          </div>

          {/* Store Organization */}
          <div className="flex items-start justify-between p-3.5 rounded-xl border border-border/70 bg-muted/20 hover:bg-muted/40 transition-colors">
            <div className="min-w-0 pr-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                Organization
              </span>
              <span className="text-xs font-bold text-foreground truncate block mt-1">
                {businessDisplay}
              </span>
            </div>
            <Building2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
          </div>

          {/* Account Plan Tier */}
          <div className="flex items-start justify-between p-3.5 rounded-xl border border-border/70 bg-muted/20 hover:bg-muted/40 transition-colors">
            <div className="min-w-0 pr-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                Plan Subscription
              </span>
              <span className="text-xs font-bold text-foreground truncate block capitalize mt-1">
                {user?.planType ? `${user.planType} Plan` : (user?.role === "superadmin" ? "Enterprise Platform" : "Standard Plan")}
              </span>
            </div>
            <Layers className="h-4 w-4 text-primary shrink-0 mt-0.5" />
          </div>

          {/* Member Registration */}
          <div className="flex items-start justify-between p-3.5 rounded-xl border border-border/70 bg-muted/20 hover:bg-muted/40 transition-colors">
            <div className="min-w-0 pr-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                Registration Date
              </span>
              <span className="text-xs font-bold text-foreground truncate block mt-1">
                {memberSince}
              </span>
            </div>
            <Calendar className="h-4 w-4 text-primary shrink-0 mt-0.5" />
          </div>

          {/* Sign-In Authentication Method */}
          <div className="flex items-start justify-between p-3.5 rounded-xl border border-border/70 bg-muted/20 hover:bg-muted/40 transition-colors">
            <div className="min-w-0 pr-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                Login Preference
              </span>
              <span className="text-xs font-bold text-foreground truncate block capitalize mt-1">
                {user?.preferredLoginMethod === "otp" ? "Email OTP (Passwordless)" : "Password + Security OTP"}
              </span>
            </div>
            <Sparkles className="h-4 w-4 text-primary shrink-0 mt-0.5" />
          </div>
        </div>

        {/* Outlets Access Registry */}
        {outletsList.length > 0 && (
          <div className="pt-3 border-t border-border/60">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Store className="h-3.5 w-3.5 text-primary" />
                Assigned Store Outlets ({outletsList.length})
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {outletsList.map((o: any) => (
                <div
                  key={o._id}
                  className="inline-flex items-center gap-2 rounded-xl border border-border/70 bg-card px-3 py-1.5 text-xs font-semibold shadow-2xs"
                >
                  <Store className="h-3.5 w-3.5 text-primary" />
                  <span>{o.name}</span>
                  {o.code && <span className="font-mono text-[10px] text-muted-foreground">({o.code})</span>}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Security Credentials & Sessions Section */}
      <SecuritySettings />

      {/* Edit Profile Modal */}
      <Modal
        open={showEditModal}
        onClose={() => setShowEditModal(false)}
        title="Edit Personal Information"
        size="md"
      >
        <form
          className="space-y-4 pt-1"
          onSubmit={(e) => {
            e.preventDefault();
            if (!editForm.name.trim()) {
              toast.error("Name is required");
              return;
            }
            updateProfileMutation.mutate({
              name: editForm.name.trim(),
              phone: editForm.phone.trim(),
            });
          }}
        >
          <div>
            <label className="mb-1 block text-xs font-semibold text-foreground">Full Name *</label>
            <Input
              value={editForm.name}
              onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="e.g. John Doe"
              required
              className="h-10 text-sm"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-foreground">Contact Phone</label>
            <Input
              value={editForm.phone}
              onChange={(e) => setEditForm((f) => ({ ...f, phone: e.target.value }))}
              placeholder="e.g. 9876543210"
              className="h-10 text-sm font-mono"
            />
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-border/70">
            <Button
              variant="outline"
              size="sm"
              type="button"
              className="h-10 px-4"
              onClick={() => setShowEditModal(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={updateProfileMutation.isPending}
              className="h-10 px-5 font-bold bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              {updateProfileMutation.isPending ? "Saving..." : "Save Profile"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
