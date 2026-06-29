"use client";

import * as React from "react";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  KeyRound, AlertCircle, Monitor, Smartphone, Tablet,
  MapPin, Clock, LogOut, ShieldAlert, Loader2
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useAuth } from "@/components/auth/auth-provider";
import { useAppDispatch } from "@/store/hooks";
import { updateUser } from "@/store/authSlice";
import { Select } from "@/components/ui/select";
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
  return new Date(dateStr).toLocaleDateString("en-IN", { dateStyle: "medium" });
}

function DeviceIcon({ type }: { type: string }) {
  if (type === "mobile") return <Smartphone className="h-5 w-5" />;
  if (type === "tablet") return <Tablet className="h-5 w-5" />;
  return <Monitor className="h-5 w-5" />;
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
  const [loginMethod, setLoginMethod] = useState(user?.preferredLoginMethod || "password");
  const [form, setForm] = useState({
    oldPassword: "",
    newPassword: "",
    confirmPassword: ""
  });

  // Fetch active sessions
  const { data: sessionData, isLoading: sessionsLoading } = useQuery({
    queryKey: ["sessions"],
    queryFn: () => getJson<{ sessions: SessionInfo[] }>("/auth/sessions", token),
    enabled: Boolean(token),
    refetchInterval: 60000 // refresh every minute
  });

  const sessions = sessionData?.sessions ?? [];

  // Revoke single session
  const revokeMutation = useMutation({
    mutationFn: (id: string) => apiFetch(`/auth/sessions/${id}`, { method: "DELETE", token }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["sessions"] });
      setRevokeId(null);
      toast.success("Session revoked");
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to revoke session");
    }
  });

  // Revoke all other sessions
  const revokeAllMutation = useMutation({
    mutationFn: () => apiFetch("/auth/sessions", { method: "DELETE", token }),
    onSuccess: (data: any) => {
      qc.invalidateQueries({ queryKey: ["sessions"] });
      setShowRevokeAll(false);
      toast.success(data?.message || "All other sessions revoked");
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to revoke sessions");
    }
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccess(null);
    setError(null);

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

      setSuccess("Password updated successfully.");
      setForm({ oldPassword: "", newPassword: "", confirmPassword: "" });
    } catch (err: any) {
      setError(err?.response?.data?.message || err.message || "Failed to update password. Make sure you entered your current password if you already have one.");
    } finally {
      setLoading(false);
    }
  };

  const otherSessionsCount = sessions.filter((s) => !s.isCurrent).length;

  return (
    <div className="space-y-6">
      {/* Password Section */}
      <Card className="rounded-xl border border-border/70 shadow-soft">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <KeyRound className="h-5 w-5 text-primary" /> Security & Access
          </CardTitle>
          <CardDescription>Setup or change your account password</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">

            {error && (
              <div className="p-3 bg-red-500/10 text-red-500 border border-red-500/20 rounded-xl text-sm flex items-start gap-2">
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {success && (
              <div className="p-3 bg-green-500/10 text-green-500 border border-green-500/20 rounded-xl text-sm font-medium">
                {success}
              </div>
            )}

            <div>
              <label className="mb-1 block text-xs font-medium text-muted">Current Password</label>
              <Input
                type="password"
                placeholder="Leave blank if not set"
                value={form.oldPassword}
                onChange={e => setForm(f => ({ ...f, oldPassword: e.target.value }))}
              />
              <p className="mt-1 text-[10px] text-muted">Only required if you already have a password</p>
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-muted">New Password *</label>
              <Input
                required
                type="password"
                placeholder="Min 6 characters"
                value={form.newPassword}
                onChange={e => setForm(f => ({ ...f, newPassword: e.target.value }))}
                minLength={6}
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-muted">Confirm New Password *</label>
              <Input
                required
                type="password"
                placeholder="Min 6 characters"
                value={form.confirmPassword}
                onChange={e => setForm(f => ({ ...f, confirmPassword: e.target.value }))}
                minLength={6}
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-muted">Preferred Login Method</label>
              <Select
                value={loginMethod}
                onValueChange={async (val) => {
                  setLoginMethod(val as "password" | "otp");
                  try {
                    await authService.setupPassword({ preferredLoginMethod: val });
                    if (user) {
                      dispatch(updateUser({ ...user, preferredLoginMethod: val as "password" | "otp" }));
                    }
                    toast.success("Preferred login method updated");
                  } catch (err: any) {
                    toast.error(err.message || "Failed to update login method");
                  }
                }}
                options={[
                  { value: "password", label: "Password" },
                  { value: "otp", label: "Email OTP" }
                ]}
              />
            </div>

            <Button type="submit" disabled={loading} className="w-full">
              {loading ? "Saving..." : "Save Password"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Active Sessions Section */}
      <Card className="rounded-xl border border-border/70 shadow-soft">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-lg">
                <ShieldAlert className="h-5 w-5 text-primary" /> Active Sessions
              </CardTitle>
              <CardDescription>
                {sessions.length} active session{sessions.length !== 1 ? "s" : ""} on your account
              </CardDescription>
            </div>
            {otherSessionsCount > 0 && (
              <Button
                variant="outline"
                size="sm"
                className="text-danger border-danger/30 hover:bg-danger/10 text-xs"
                onClick={() => setShowRevokeAll(true)}
              >
                <LogOut className="h-3.5 w-3.5 mr-1" /> Logout All Others
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {sessionsLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted" />
            </div>
          ) : sessions.length === 0 ? (
            <p className="text-sm text-muted text-center py-6">No active sessions found.</p>
          ) : (
            <div className="space-y-3">
              {sessions.map((session) => {
                const locationStr = [session.location?.city, session.location?.country]
                  .filter(Boolean)
                  .join(", ") || "Unknown location";

                return (
                  <div
                    key={session.id}
                    className={`flex items-start gap-4 p-4 rounded-xl border transition-all ${session.isCurrent
                      ? "border-primary/30 bg-primary/[0.03]"
                      : "border-border/50 hover:border-border"
                      }`}
                  >
                    {/* Device icon */}
                    <div className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${session.isCurrent ? "bg-primary/10 text-primary" : "bg-border/40 text-muted"
                      }`}>
                      <DeviceIcon type={session.deviceType} />
                    </div>

                    {/* Device info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-sm font-semibold truncate">{session.deviceName}</p>
                        {session.isCurrent && (
                          <Badge variant="soft" className="text-[10px] shrink-0">This device</Badge>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted">
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" /> {locationStr}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" /> {formatRelativeTime(session.lastActiveAt)}
                        </span>
                        <span className="font-mono text-[10px] opacity-60">{session.ip}</span>
                      </div>
                    </div>

                    {/* Revoke button */}
                    {!session.isCurrent && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-danger hover:bg-danger/10 shrink-0 text-xs"
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
        </CardContent>
      </Card>

      {/* Confirm revoke single session */}
      <ConfirmDialog
        open={!!revokeId}
        onClose={() => setRevokeId(null)}
        onConfirm={() => revokeId && revokeMutation.mutate(revokeId)}
        title="Revoke Session?"
        message="This will immediately log out the selected device. The user will need to sign in again on that device."
        confirmLabel="Revoke Session"
        loading={revokeMutation.isPending}
      />

      {/* Confirm revoke all */}
      <ConfirmDialog
        open={showRevokeAll}
        onClose={() => setShowRevokeAll(false)}
        onConfirm={() => revokeAllMutation.mutate()}
        title="Log Out All Other Devices?"
        message={`This will revoke ${otherSessionsCount} other session${otherSessionsCount !== 1 ? "s" : ""}. Only your current session will remain active.`}
        confirmLabel="Revoke All"
        loading={revokeAllMutation.isPending}
      />
    </div>
  );
}
