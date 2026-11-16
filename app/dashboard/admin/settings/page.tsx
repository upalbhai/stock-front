"use client";

import * as React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/components/auth/auth-provider";
import { adminService } from "@/services/admin.service";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { toast } from "react-hot-toast";
import { getErrorMessage } from "@/lib/error";
import {
  Settings,
  Save,
  AlertTriangle,
  ShieldCheck,
  Building2,
  Bell,
  CreditCard,
  RefreshCw,
  Clock,
  Sparkles,
  Lock,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function AdminSettingsPage() {
  const { token } = useAuth();
  const qc = useQueryClient();

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["admin-settings"],
    queryFn: () => adminService.getSettings(token),
    enabled: Boolean(token),
  });

  const [form, setForm] = React.useState({
    maintenanceMode: false,
    defaultTrialDays: 14,
    allowNewSignups: true,
    globalAnnouncement: "",
    bankDetails: {
      accountName: "",
      accountNumber: "",
      ifsc: "",
      bankName: "",
      branch: "",
      upiId: "",
      notes: "",
    },
  });

  React.useEffect(() => {
    if (data?.settings) {
      setForm({
        maintenanceMode: data.settings.maintenanceMode ?? false,
        defaultTrialDays: data.settings.defaultTrialDays ?? 14,
        allowNewSignups: data.settings.allowNewSignups ?? true,
        globalAnnouncement: data.settings.globalAnnouncement ?? "",
        bankDetails: {
          accountName: data.settings.bankDetails?.accountName ?? "",
          accountNumber: data.settings.bankDetails?.accountNumber ?? "",
          ifsc: data.settings.bankDetails?.ifsc ?? "",
          bankName: data.settings.bankDetails?.bankName ?? "",
          branch: data.settings.bankDetails?.branch ?? "",
          upiId: data.settings.bankDetails?.upiId ?? "",
          notes: data.settings.bankDetails?.notes ?? "",
        },
      });
    }
  }, [data]);

  const updateMutation = useMutation({
    mutationFn: (body: any) => adminService.updateSettings(body, token),
    onSuccess: (res: any) => {
      qc.invalidateQueries({ queryKey: ["admin-settings"] });
      toast.success(res.message || "Platform configurations saved successfully");
    },
    onError: (err) => {
      toast.error(getErrorMessage(err));
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate(form);
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-300 max-w-5xl">
      {/* ── COMPACT SECTION HEADER & LIVE METRIC STRIP ───────────────────── */}
      <div className="flex flex-col gap-3 rounded-xl border border-border/80 bg-card p-3 sm:p-3.5 shadow-2xs">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-base sm:text-lg font-bold tracking-tight text-foreground sm:text-xl">
                Global Platform Settings
              </h1>
              <span className="inline-flex items-center rounded-md bg-primary/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary border border-primary/20 shrink-0">
                Core Governance
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5 hidden sm:block">
              Control environment maintenance locks, registration gateways, free trial periods, and banking coordinates.
            </p>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              className="h-7 sm:h-8 gap-1 px-2 sm:px-2.5 text-xs cursor-pointer shadow-2xs hover:bg-accent"
            >
              <RefreshCw
                className={`h-3 w-3 ${isLoading ? "animate-spin text-primary" : "text-muted-foreground"}`}
              />
              <span className="hidden sm:inline">Refresh</span>
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={updateMutation.isPending}
              size="sm"
              className="h-7 sm:h-8 gap-1 sm:gap-1.5 px-2 sm:px-3 text-xs font-semibold cursor-pointer shadow-2xs"
            >
              <Save className="h-3.5 w-3.5" />
              <span>{updateMutation.isPending ? "Saving..." : <><span className="hidden sm:inline">Save </span>Settings</>}</span>
            </Button>
          </div>
        </div>

        {/* ── LIVE STATUS CHIPS (SLIM, ONLY 34px TALL) ───────────────────── */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar scroll-smooth border-t border-border/60 pt-2.5 -mx-3 px-3 sm:mx-0 sm:px-0 sm:flex-wrap">
          {/* Status 1: System Mode */}
          <div
            className={`inline-flex shrink-0 items-center gap-2 rounded-lg border px-3 py-1.5 text-xs font-semibold ${
              form.maintenanceMode
                ? "border-destructive bg-destructive/10 text-destructive shadow-2xs"
                : "border-emerald-500 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shadow-2xs"
            }`}
          >
            <span
              className={`h-2 w-2 rounded-full ${
                form.maintenanceMode ? "bg-destructive animate-pulse" : "bg-emerald-500"
              }`}
            />
            <span>
              {form.maintenanceMode
                ? "Maintenance Mode Active"
                : "Platform Production Live"}
            </span>
          </div>

          {/* Status 2: Registration Gateway */}
          <div
            className={`inline-flex shrink-0 items-center gap-2 rounded-lg border px-3 py-1.5 text-xs font-semibold ${
              form.allowNewSignups
                ? "border-primary bg-primary/10 text-primary shadow-2xs"
                : "border-amber-500 bg-amber-500/10 text-amber-600 dark:text-amber-400 shadow-2xs"
            }`}
          >
            <ShieldCheck className="h-3.5 w-3.5" />
            <span>
              {form.allowNewSignups
                ? "Signups Open"
                : "New Signups Paused"}
            </span>
          </div>

          {/* Status 3: Default Trial */}
          <div className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-border/80 bg-background px-3 py-1.5 text-xs text-muted-foreground sm:ml-auto">
            <Clock className="h-3.5 w-3.5 text-primary" />
            <span>Default Trial:</span>
            <span className="font-bold text-foreground font-mono">
              {form.defaultTrialDays} days
            </span>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* ── CORE GOVERNANCE ────────────────────────────────────────────── */}
        <div className="rounded-xl border border-border bg-card p-4 space-y-3.5 shadow-2xs">
          <div className="flex items-center gap-2 pb-2 border-b border-border/80">
            <Lock className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-bold text-foreground">
              Availability & Registration Gateway
            </h2>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="flex items-center justify-between p-3.5 rounded-xl border border-border/80 bg-muted/20">
              <div className="pr-3">
                <p className="text-xs font-semibold text-foreground">Maintenance Mode</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Temporarily lock out store owners and staff for system maintenance.
                </p>
              </div>
              <Switch
                checked={form.maintenanceMode}
                onCheckedChange={(v) =>
                  setForm({ ...form, maintenanceMode: v })
                }
              />
            </div>

            <div className="flex items-center justify-between p-3.5 rounded-xl border border-border/80 bg-muted/20">
              <div className="pr-3">
                <p className="text-xs font-semibold text-foreground">Allow New Store Signups</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Accept onboarding of new store tenants across the platform.
                </p>
              </div>
              <Switch
                checked={form.allowNewSignups}
                onCheckedChange={(v) =>
                  setForm({ ...form, allowNewSignups: v })
                }
              />
            </div>
          </div>
        </div>

        {/* ── ONBOARDING CONFIGURATION ────────────────────────────────────── */}
        <div className="rounded-xl border border-border bg-card p-4 space-y-3.5 shadow-2xs">
          <div className="flex items-center gap-2 pb-2 border-b border-border/80">
            <Clock className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-bold text-foreground">
              Default Onboarding Trial Period
            </h2>
          </div>

          <div className="max-w-sm space-y-1.5">
            <label className="text-xs font-semibold text-foreground">
              Free Trial Duration (Days) *
            </label>
            <Input
              type="number"
              min={0}
              max={90}
              value={form.defaultTrialDays}
              onChange={(e) =>
                setForm({
                  ...form,
                  defaultTrialDays: parseInt(e.target.value) || 0,
                })
              }
              className="text-xs h-9 font-mono"
            />
            <p className="text-[11px] text-muted-foreground">
              Number of complimentary trial days granted upon tenant registration before payment is required.
            </p>
          </div>
        </div>

        {/* ── BROADCAST MESSAGING ─────────────────────────────────────────── */}
        <div className="rounded-xl border border-border bg-card p-4 space-y-3.5 shadow-2xs">
          <div className="flex items-center gap-2 pb-2 border-b border-border/80">
            <Bell className="h-4 w-4 text-amber-500" />
            <h2 className="text-sm font-bold text-foreground">
              Global Platform Broadcast Announcement
            </h2>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">
              Announcement Message (Optional)
            </label>
            <Textarea
              placeholder="e.g. Scheduled database maintenance tonight from 02:00 to 03:00 IST..."
              value={form.globalAnnouncement}
              onChange={(e) =>
                setForm({ ...form, globalAnnouncement: e.target.value })
              }
              rows={3}
              className="resize-none text-xs"
            />
            <p className="text-[11px] text-muted-foreground">
              When populated, this alert appears as a highlighted banner across all tenant dashboards. Clear the text to dismiss.
            </p>
          </div>
        </div>

        {/* ── MANUAL PAYMENT WIRE DETAILS ─────────────────────────────────── */}
        <div className="rounded-xl border border-border bg-card p-4 space-y-3.5 shadow-2xs">
          <div className="flex items-center gap-2 pb-2 border-b border-border/80">
            <CreditCard className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            <div>
              <h2 className="text-sm font-bold text-foreground">
                Offline Bank Settlement & UPI Information
              </h2>
              <p className="text-[11px] text-muted-foreground">
                Presented to store owners choosing offline NEFT / IMPS / UPI payment during subscription checkout.
              </p>
            </div>
          </div>

          <div className="grid gap-3.5 sm:grid-cols-2">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">
                Beneficiary Account Name *
              </label>
              <Input
                value={form.bankDetails.accountName}
                onChange={(e) =>
                  setForm({
                    ...form,
                    bankDetails: {
                      ...form.bankDetails,
                      accountName: e.target.value,
                    },
                  })
                }
                placeholder="e.g. MiniHisab Technologies Pvt Ltd"
                className="text-xs h-9"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">
                Bank Name *
              </label>
              <Input
                value={form.bankDetails.bankName}
                onChange={(e) =>
                  setForm({
                    ...form,
                    bankDetails: {
                      ...form.bankDetails,
                      bankName: e.target.value,
                    },
                  })
                }
                placeholder="e.g. HDFC Bank"
                className="text-xs h-9"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">
                Account Number *
              </label>
              <Input
                value={form.bankDetails.accountNumber}
                onChange={(e) =>
                  setForm({
                    ...form,
                    bankDetails: {
                      ...form.bankDetails,
                      accountNumber: e.target.value,
                    },
                  })
                }
                placeholder="e.g. 50200012345678"
                className="text-xs h-9 font-mono"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">
                IFSC Code *
              </label>
              <Input
                value={form.bankDetails.ifsc}
                onChange={(e) =>
                  setForm({
                    ...form,
                    bankDetails: {
                      ...form.bankDetails,
                      ifsc: e.target.value,
                    },
                  })
                }
                placeholder="e.g. HDFC0000123"
                className="text-xs h-9 font-mono uppercase"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">
                Bank Branch
              </label>
              <Input
                value={form.bankDetails.branch}
                onChange={(e) =>
                  setForm({
                    ...form,
                    bankDetails: {
                      ...form.bankDetails,
                      branch: e.target.value,
                    },
                  })
                }
                placeholder="e.g. Indiranagar Branch, Bengaluru"
                className="text-xs h-9"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">
                Virtual Payment Address (UPI ID)
              </label>
              <Input
                value={form.bankDetails.upiId}
                onChange={(e) =>
                  setForm({
                    ...form,
                    bankDetails: {
                      ...form.bankDetails,
                      upiId: e.target.value,
                    },
                  })
                }
                placeholder="e.g. minihisab@hdfcbank"
                className="text-xs h-9 font-mono"
              />
            </div>

            <div className="sm:col-span-2 space-y-1">
              <label className="text-xs font-semibold text-foreground">
                Remittance Instructions & Remarks
              </label>
              <Textarea
                rows={2}
                className="resize-none text-xs"
                value={form.bankDetails.notes}
                onChange={(e) =>
                  setForm({
                    ...form,
                    bankDetails: {
                      ...form.bankDetails,
                      notes: e.target.value,
                    },
                  })
                }
                placeholder="e.g. Please include your Store ID as transaction remark and upload screenshot proof."
              />
            </div>
          </div>
        </div>

        {/* ── FOOTER SAVE BAR ────────────────────────────────────────────── */}
        <div className="flex items-center justify-end gap-2.5 pt-2">
          <Button
            type="submit"
            disabled={updateMutation.isPending}
            className="h-9 gap-1.5 px-4 text-xs font-semibold cursor-pointer shadow-2xs"
          >
            <Save className="h-3.5 w-3.5" />
            <span>{updateMutation.isPending ? "Saving Configurations..." : "Save Platform Configurations"}</span>
          </Button>
        </div>
      </form>
    </div>
  );
}
