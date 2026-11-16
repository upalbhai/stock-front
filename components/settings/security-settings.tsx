"use client";

import * as React from "react";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  KeyRound,
  AlertCircle,
  Monitor,
  Smartphone,
  Tablet,
  MapPin,
  Clock,
  LogOut,
  ShieldAlert,
  Loader2,
  Eye,
  EyeOff,
  Check,
  CheckCircle2,
  Lock,
  ShieldCheck,
  SmartphoneNfc,
  Sparkles,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useAuth } from "@/components/auth/auth-provider";
import { useAppDispatch } from "@/store/hooks";
import { updateUser } from "@/store/authSlice";
import { authService } from "@/services/auth.service";
import { getJson, apiFetch } from "@/lib/api-client";
import { toast } from "react-hot-toast";

type SessionInfo = {
  id: string;
  deviceName: string;
  deviceType: "desktop" | "mobile" | "tablet" | "unknown";
  browser: string;
  os: string;
  ip: string;
  location: { city: string; region: string; country: string };
  lastActiveAt: string;
  createdAt: string;
  isCurrent: boolean;
};

function formatRelativeTime(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function DeviceIcon({ type }: { type: string }) {
  if (type === "mobile") return <Smartphone className="h-4 w-4" />;
  if (type === "tablet") return <Tablet className="h-4 w-4" />;
  return <Monitor className="h-4 w-4" />;
}

export function SecuritySettings() {
  const { token, user } = useAuth();
  const dispatch = useAppDispatch();
  const qc = useQueryClient();

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [revokeId, setRevokeId] = useState<string | null>(null);
  const [showRevokeAll, setShowRevokeAll] = useState(false);

  // Password visibility states
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [loginMethod, setLoginMethod] = useState<"password" | "otp">(
    (user?.preferredLoginMethod as "password" | "otp") || "password"
  );

  const [form, setForm] = useState({
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  // Fetch active sessions
  const { data: sessionData, isLoading: sessionsLoading } = useQuery({
    queryKey: ["sessions"],
    queryFn: () => getJson<{ sessions: SessionInfo[] }>("/auth/sessions", token),
    enabled: Boolean(token),
    refetchInterval: 60000,
  });

  const sessions = sessionData?.sessions ?? [];

  // Revoke single session
  const revokeMutation = useMutation({
    mutationFn: (id: string) => apiFetch(`/auth/sessions/${id}`, { method: "DELETE", token }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["sessions"] });
      setRevokeId(null);
      toast.success("Device session logged out successfully");
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to revoke session");
    },
  });

  // Revoke all other sessions
  const revokeAllMutation = useMutation({
    mutationFn: () => apiFetch("/auth/sessions", { method: "DELETE", token }),
    onSuccess: (data: any) => {
      qc.invalidateQueries({ queryKey: ["sessions"] });
      setShowRevokeAll(false);
      toast.success(data?.message || "All other device sessions logged out");
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to revoke sessions");
    },
  });

  const handleMethodChange = async (method: "password" | "otp") => {
    setLoginMethod(method);
    try {
      await authService.setupPassword({ preferredLoginMethod: method });
      if (user) {
        dispatch(updateUser({ ...user, preferredLoginMethod: method }));
      }
      toast.success(
        method === "password"
          ? "Default login set to Password"
          : "Default login set to Email OTP"
      );
    } catch (err: any) {
      toast.error(err.message || "Failed to update preferred login method");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccess(null);
    setError(null);

    if (form.newPassword.length < 6) {
      setError("New password must be at least 6 characters long.");
      return;
    }

    if (form.newPassword !== form.confirmPassword) {
      setError("New passwords do not match.");
      return;
    }

    try {
      setLoading(true);
      const res = await authService.setupPassword({
        newPassword: form.newPassword,
        oldPassword: form.oldPassword || undefined,
      });

      if ((res as any).success === false) {
        setError((res as any).message || "Failed to update password");
        return;
      }

      setSuccess("Account password updated successfully.");
      setForm({ oldPassword: "", newPassword: "", confirmPassword: "" });
      toast.success("Password updated successfully");
    } catch (err: any) {
      setError(
        err?.response?.data?.message ||
          err.message ||
          "Failed to update password. Please verify your current password."
      );
    } finally {
      setLoading(false);
    }
  };

  const otherSessionsCount = sessions.filter((s) => !s.isCurrent).length;

  // Password strength helper
  const getPasswordStrength = (pwd: string) => {
    if (!pwd) return { label: "", percent: 0, color: "bg-muted" };
    if (pwd.length < 6) return { label: "Too short (min 6)", percent: 25, color: "bg-destructive" };
    if (pwd.length < 9) return { label: "Fair", percent: 60, color: "bg-amber-500" };
    const hasNum = /\d/.test(pwd);
    const hasSpecial = /[^A-Za-z0-9]/.test(pwd);
    if (hasNum && hasSpecial) return { label: "Strong", percent: 100, color: "bg-emerald-500" };
    return { label: "Good", percent: 80, color: "bg-blue-500" };
  };

  const pwdStrength = getPasswordStrength(form.newPassword);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-5 items-start">
      {/* ── LEFT COLUMN: PASSWORD & PREFERENCES (5 COLS) ──────────────────── */}
      <div className="lg:col-span-5 space-y-4">
        <div className="rounded-xl border border-border/80 bg-card p-4 sm:p-5 shadow-2xs space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-border/60">
            <KeyRound className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-bold text-foreground">Login Credentials</h2>
          </div>

          {/* Preferred Login Method Selector */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-foreground">Preferred Sign-In Method</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleMethodChange("password")}
                className={`flex flex-col items-start p-2.5 rounded-lg border text-left transition-all cursor-pointer ${
                  loginMethod === "password"
                    ? "border-primary bg-primary/10 shadow-2xs"
                    : "border-border/80 bg-muted/20 hover:bg-muted/40"
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <Lock className={`h-3.5 w-3.5 ${loginMethod === "password" ? "text-primary" : "text-muted-foreground"}`} />
                  {loginMethod === "password" && <CheckCircle2 className="h-3.5 w-3.5 text-primary" />}
                </div>
                <span className="text-xs font-semibold text-foreground mt-1.5">Password</span>
                <span className="text-[10px] text-muted-foreground">Standard login</span>
              </button>

              <button
                type="button"
                onClick={() => handleMethodChange("otp")}
                className={`flex flex-col items-start p-2.5 rounded-lg border text-left transition-all cursor-pointer ${
                  loginMethod === "otp"
                    ? "border-primary bg-primary/10 shadow-2xs"
                    : "border-border/80 bg-muted/20 hover:bg-muted/40"
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <SmartphoneNfc className={`h-3.5 w-3.5 ${loginMethod === "otp" ? "text-primary" : "text-muted-foreground"}`} />
                  {loginMethod === "otp" && <CheckCircle2 className="h-3.5 w-3.5 text-primary" />}
                </div>
                <span className="text-xs font-semibold text-foreground mt-1.5">Email OTP</span>
                <span className="text-[10px] text-muted-foreground">Passwordless code</span>
              </button>
            </div>
          </div>

          {/* Password Setup Form */}
          <form onSubmit={handleSubmit} className="space-y-3 pt-1">
            {error && (
              <div className="p-3 bg-destructive/10 text-destructive border border-destructive/20 rounded-lg text-xs flex items-start gap-2 animate-in fade-in">
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {success && (
              <div className="p-3 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 rounded-lg text-xs font-medium flex items-center gap-2 animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500" />
                <span>{success}</span>
              </div>
            )}

            {/* Current Password */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground flex items-center justify-between">
                <span>Current Password</span>
                <span className="text-[10px] text-muted-foreground font-normal">Leave blank if not set</span>
              </label>
              <div className="relative">
                <Input
                  type={showOldPassword ? "text" : "password"}
                  placeholder="Enter current password..."
                  value={form.oldPassword}
                  onChange={(e) => setForm((f) => ({ ...f, oldPassword: e.target.value }))}
                  className="text-xs h-9 bg-muted/20 border-border/80 pr-9"
                />
                <button
                  type="button"
                  onClick={() => setShowOldPassword(!showOldPassword)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
                  tabIndex={-1}
                >
                  {showOldPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                </button>
              </div>
            </div>

            {/* New Password */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <label className="font-semibold text-foreground">New Password *</label>
                {form.newPassword && (
                  <span className="text-[10px] font-mono text-muted-foreground">
                    {pwdStrength.label}
                  </span>
                )}
              </div>
              <div className="relative">
                <Input
                  required
                  type={showNewPassword ? "text" : "password"}
                  placeholder="Min 6 characters..."
                  value={form.newPassword}
                  onChange={(e) => setForm((f) => ({ ...f, newPassword: e.target.value }))}
                  minLength={6}
                  className="text-xs h-9 bg-muted/20 border-border/80 pr-9"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
                  tabIndex={-1}
                >
                  {showNewPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                </button>
              </div>

              {/* Password strength progress bar */}
              {form.newPassword && (
                <div className="h-1 w-full rounded-full bg-muted overflow-hidden mt-1">
                  <div
                    className={`h-full transition-all duration-300 rounded-full ${pwdStrength.color}`}
                    style={{ width: `${pwdStrength.percent}%` }}
                  />
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <label className="font-semibold text-foreground">Confirm New Password *</label>
                {form.confirmPassword && (
                  <span
                    className={`text-[10px] font-mono ${
                      form.newPassword === form.confirmPassword ? "text-emerald-500 font-bold" : "text-destructive"
                    }`}
                  >
                    {form.newPassword === form.confirmPassword ? "Match" : "Mismatch"}
                  </span>
                )}
              </div>
              <div className="relative">
                <Input
                  required
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Re-type new password..."
                  value={form.confirmPassword}
                  onChange={(e) => setForm((f) => ({ ...f, confirmPassword: e.target.value }))}
                  minLength={6}
                  className="text-xs h-9 bg-muted/20 border-border/80 pr-9"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
                  tabIndex={-1}
                >
                  {showConfirmPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-8 text-xs font-semibold cursor-pointer shadow-2xs mt-2"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                  <span>Updating Password...</span>
                </>
              ) : (
                <span>Update Account Password</span>
              )}
            </Button>
          </form>
        </div>
      </div>

      {/* ── RIGHT COLUMN: ACTIVE DEVICE SESSIONS (7 COLS) ────────────────── */}
      <div className="lg:col-span-7 space-y-4">
        <div className="rounded-xl border border-border/80 bg-card p-4 sm:p-5 shadow-2xs space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-border/60 flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <ShieldAlert className="h-4 w-4 text-primary" />
              <div>
                <h2 className="text-sm font-bold text-foreground">Active Device Sessions</h2>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Logged-in browsers, operating systems, and IP addresses
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="inline-flex items-center rounded-md bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary border border-primary/20">
                {sessions.length} active
              </span>

              {otherSessionsCount > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs text-destructive border-destructive/30 hover:bg-destructive/10 cursor-pointer shadow-2xs"
                  onClick={() => setShowRevokeAll(true)}
                >
                  <LogOut className="h-3 w-3 mr-1" />
                  <span>Logout Others</span>
                </Button>
              )}
            </div>
          </div>

          {/* Session Cards List */}
          {sessionsLoading ? (
            <div className="flex flex-col items-center justify-center py-10 gap-2 text-xs text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
              <span>Checking active sessions...</span>
            </div>
          ) : sessions.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-8">No active sessions detected.</p>
          ) : (
            <div className="space-y-2.5">
              {sessions.map((session) => {
                const locationStr =
                  [session.location?.city, session.location?.country].filter(Boolean).join(", ") ||
                  "Unknown location";

                return (
                  <div
                    key={session.id}
                    className={`flex items-start justify-between gap-3 p-3 sm:p-3.5 rounded-xl border transition-all ${
                      session.isCurrent
                        ? "border-emerald-500/30 bg-emerald-500/[0.04] shadow-2xs"
                        : "border-border/60 bg-muted/10 hover:bg-muted/30 hover:border-border/80"
                    }`}
                  >
                    <div className="flex items-start gap-3 min-w-0">
                      {/* Device Icon */}
                      <div
                        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                          session.isCurrent
                            ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 ring-1 ring-emerald-500/20"
                            : "bg-muted text-muted-foreground border border-border/60"
                        }`}
                      >
                        <DeviceIcon type={session.deviceType} />
                      </div>

                      {/* Device info */}
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <p className="text-xs font-semibold text-foreground truncate">
                            {session.deviceName || "Desktop Browser"}
                          </p>
                          {session.isCurrent ? (
                            <span className="inline-flex items-center gap-1 rounded-md bg-emerald-500/10 px-1.5 py-0.2 text-[9px] font-bold text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                              This device
                            </span>
                          ) : null}
                        </div>

                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground mt-1">
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3 text-muted-foreground/70" />
                            <span>{locationStr}</span>
                          </span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3 text-muted-foreground/70" />
                            <span>{formatRelativeTime(session.lastActiveAt)}</span>
                          </span>
                          <span>•</span>
                          <span className="font-mono text-[10px] opacity-75">{session.ip}</span>
                        </div>
                      </div>
                    </div>

                    {/* Revoke button */}
                    {!session.isCurrent && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2 text-xs text-destructive hover:bg-destructive/10 shrink-0 cursor-pointer"
                        onClick={() => setRevokeId(session.id)}
                      >
                        Revoke
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Security Advisory Callout */}
          <div className="p-3 rounded-lg border border-border/60 bg-muted/20 text-[11px] text-muted-foreground flex items-start gap-2">
            <ShieldCheck className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
            <span>
              If you notice any unfamiliar device or location, click <strong>Revoke</strong> and immediately update your account password.
            </span>
          </div>
        </div>
      </div>

      {/* Confirm revoke single session */}
      <ConfirmDialog
        open={Boolean(revokeId)}
        onClose={() => setRevokeId(null)}
        onConfirm={() => revokeId && revokeMutation.mutate(revokeId)}
        title="Revoke Device Session?"
        message="This will immediately sign out the selected device. Anyone using that device will be forced to log in again."
        confirmLabel="Revoke Session"
        loading={revokeMutation.isPending}
      />

      {/* Confirm revoke all */}
      <ConfirmDialog
        open={showRevokeAll}
        onClose={() => setShowRevokeAll(false)}
        onConfirm={() => revokeAllMutation.mutate()}
        title="Log Out All Other Devices?"
        message={`This will revoke ${otherSessionsCount} active session${otherSessionsCount !== 1 ? "s" : ""}. Only your current browser session will remain active.`}
        confirmLabel="Log Out All Others"
        loading={revokeAllMutation.isPending}
      />
    </div>
  );
}
