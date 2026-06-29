"use client";

import * as React from "react";
import { useRouter, useParams } from "next/navigation";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getJson, apiFetch } from "@/lib/api-client";
import { getErrorMessage } from "@/lib/error";
import { APP_ROUTES } from "@/lib/routes";
import { Sparkles } from "lucide-react";

export default function InviteAcceptPage() {
  const router = useRouter();
  const params = useParams();
  const tokenParam = params?.token as string;

  const [form, setForm] = React.useState({ name: "", password: "", confirmPassword: "" });
  const [error, setError] = React.useState<string | null>(null);

  const { data: inviteData, isLoading } = useQuery({
    queryKey: ["invite-detail", tokenParam],
    queryFn: () => getJson<{ invite: any; businessName: string }>(`/users/invites/${tokenParam}`),
    enabled: Boolean(tokenParam)
  });

  const acceptMutation = useMutation({
    mutationFn: (body: unknown) => apiFetch<{ token: string; user: any }>(`/users/invites/${tokenParam}/accept`, {
      method: "POST",
      body
    }),
    onSuccess: async (data) => {
      const { setStoredAuth, setStoredOutletId } = await import("@/lib/auth-storage");
      try {
        setStoredAuth({ token: data.token, user: data.user });
        setStoredOutletId(data.user.outletId || null);
      } catch {
        localStorage.setItem("outlet-auth", JSON.stringify({ token: data.token, user: data.user }));
      }
      window.location.href = APP_ROUTES.DASHBOARD;
    },
    onError: (err) => {
      setError(getErrorMessage(err, "Failed to accept invitation"));
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match!");
      return;
    }
    if (form.password.length < 6) {
      setError("Password must be at least 6 characters!");
      return;
    }
    acceptMutation.mutate({
      name: form.name,
      password: form.password
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-sm text-muted animate-pulse">Verifying franchise token...</p>
      </div>
    );
  }

  const invite = inviteData?.invite;
  const businessName = inviteData?.businessName;

  if (!invite) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md text-center rounded-xl border border-border shadow-soft p-6">
          <CardTitle className="text-xl font-bold text-danger">Invalid or Expired Invitation</CardTitle>
          <CardDescription className="mt-2">
            The link you followed is either expired, invalid, or has already been used. Please request a new invite link from your franchise administrator.
          </CardDescription>
          <Button className="mt-6 w-full" onClick={() => router.push(APP_ROUTES.LOGIN)}>Go to Login</Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-[85vh] flex items-center justify-center py-10 px-4">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(99,102,241,0.15),rgba(255,255,255,0))] dark:bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(99,102,241,0.08),rgba(0,0,0,0))]" />

      <Card className="relative w-full max-w-md border border-border/70 shadow-soft backdrop-blur-md bg-surface/80 rounded-3xl animate-rise">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-white shadow-soft font-bold mb-3">
            <Sparkles className="h-6 w-6" />
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight">Accept Invitation</CardTitle>
          <CardDescription className="text-sm text-muted">
            You have been invited to join the team at <span className="font-semibold text-text">{businessName}</span> as a <span className="font-semibold text-text capitalize">{invite.role}</span>.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-2">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1 block text-xs font-medium text-muted">Your Full Name *</label>
              <Input
                required
                value={form.name}
                onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))}
                placeholder="Rahul Patel"
              />
            </div>
            {invite.phone && (
              <div>
                <label className="mb-1 block text-xs font-medium text-muted">Registered Phone</label>
                <Input disabled value={invite.phone} className="bg-border/20 font-semibold" />
              </div>
            )}
            <div>
              <label className="mb-1 block text-xs font-medium text-muted">Set Password *</label>
              <Input
                required
                type="password"
                value={form.password}
                onChange={(e) => setForm(f => ({ ...f, password: e.target.value }))}
                placeholder="At least 6 characters"
                minLength={6}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted">Confirm Password *</label>
              <Input
                required
                type="password"
                value={form.confirmPassword}
                onChange={(e) => setForm(f => ({ ...f, confirmPassword: e.target.value }))}
                placeholder="Repeat password"
                minLength={6}
              />
            </div>

            {error && (
              <div className="rounded-xl bg-danger/10 border border-danger/20 p-2 text-center">
                <p className="text-xs text-danger font-medium">{error}</p>
              </div>
            )}

            <Button type="submit" className="w-full py-6 text-sm font-semibold rounded-2xl shadow-soft" disabled={acceptMutation.isPending}>
              {acceptMutation.isPending ? "Joining..." : "Accept & Launch Dashboard"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
