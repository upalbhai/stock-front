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
  Mail,
  Key,
  Eye,
  EyeOff,
  CheckCircle2,
  Send,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Select } from "@/components/ui/select";

export default function AdminSettingsPage() {
  const { token } = useAuth();
  const qc = useQueryClient();

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["admin-settings"],
    queryFn: () => adminService.getSettings(token),
    enabled: Boolean(token),
  });

  const [showZeptoApiKey, setShowZeptoApiKey] = React.useState(false);
  const [showBrevoApiKey, setShowBrevoApiKey] = React.useState(false);
  const [showRzpKeyId, setShowRzpKeyId] = React.useState(false);
  const [showRzpSecret, setShowRzpSecret] = React.useState(false);
  const [showRzpWebhookSecret, setShowRzpWebhookSecret] = React.useState(false);

  // Test Email dispatcher state
  const [testEmailTarget, setTestEmailTarget] = React.useState("");
  const [testEmailProvider, setTestEmailProvider] = React.useState("AUTO");
  const [isSendingTest, setIsSendingTest] = React.useState(false);

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
    emailConfig: {
      provider: "ZEPTOMAIL",
      fallbackEnabled: true,
      fromEmail: "noreply@minihisab.com",
      fromName: "Mini Hisab",
      zepto: {
        apiKey: "",
        region: "IN",
        hasApiKey: false,
      },
      brevo: {
        apiKey: "",
        hasApiKey: false,
      },
      apiKey: "",
      region: "IN",
      hasApiKey: false,
    },
    razorpayConfig: {
      keyId: "",
      keySecret: "",
      webhookSecret: "",
      hasKeySecret: false,
      hasWebhookSecret: false,
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
        emailConfig: {
          provider: data.settings.emailConfig?.provider ?? "ZEPTOMAIL",
          fallbackEnabled: data.settings.emailConfig?.fallbackEnabled ?? true,
          fromEmail: data.settings.emailConfig?.fromEmail ?? "noreply@minihisab.com",
          fromName: data.settings.emailConfig?.fromName ?? "Mini Hisab",
          zepto: {
            apiKey: data.settings.emailConfig?.zepto?.apiKey ?? data.settings.emailConfig?.apiKey ?? "",
            region: data.settings.emailConfig?.zepto?.region ?? data.settings.emailConfig?.region ?? "IN",
            hasApiKey: Boolean(data.settings.emailConfig?.hasZeptoApiKey ?? data.settings.emailConfig?.zepto?.hasApiKey),
          },
          brevo: {
            apiKey: data.settings.emailConfig?.brevo?.apiKey ?? "",
            hasApiKey: Boolean(data.settings.emailConfig?.hasBrevoApiKey ?? data.settings.emailConfig?.brevo?.hasApiKey),
          },
          apiKey: data.settings.emailConfig?.apiKey ?? "",
          region: data.settings.emailConfig?.region ?? "IN",
          hasApiKey: Boolean(data.settings.emailConfig?.hasApiKey),
        },
        razorpayConfig: {
          keyId: data.settings.razorpayConfig?.keyId ?? "",
          keySecret: data.settings.razorpayConfig?.keySecret ?? "",
          webhookSecret: data.settings.razorpayConfig?.webhookSecret ?? "",
          hasKeySecret: Boolean(data.settings.razorpayConfig?.hasKeySecret),
          hasWebhookSecret: Boolean(data.settings.razorpayConfig?.hasWebhookSecret),
        },
      });
    }
  }, [data]);

  const handleSendTestEmail = async () => {
    if (!testEmailTarget.trim()) {
      toast.error("Please enter a destination email address for testing");
      return;
    }
    setIsSendingTest(true);
    try {
      const res = await adminService.sendTestEmail(
        {
          targetEmail: testEmailTarget.trim(),
          provider: testEmailProvider === "AUTO" ? undefined : testEmailProvider,
        },
        token
      );
      toast.success(res.message || "Test email dispatched successfully!");
    } catch (err: any) {
      toast.error(getErrorMessage(err));
    } finally {
      setIsSendingTest(false);
    }
  };

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
    <div className="space-y-4 animate-in fade-in duration-300 w-full">
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
              Manage system availability, email dispatch, payment credentials, trial periods, and banking coordinates.
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

        {/* ── LIVE STATUS CHIPS ─────────────────────────────────────────── */}
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

          {/* Status 3: ZeptoMail */}
          <div
            className={`inline-flex shrink-0 items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold ${
              form.emailConfig.hasApiKey
                ? "border-emerald-500 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                : "border-amber-500/70 bg-amber-500/10 text-amber-600 dark:text-amber-400"
            }`}
          >
            <Mail className="h-3.5 w-3.5" />
            <span>
              ZeptoMail: {form.emailConfig.hasApiKey ? "Active" : "Dev Console Mode"}
            </span>
          </div>

          {/* Status 4: Razorpay */}
          <div
            className={`inline-flex shrink-0 items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold ${
              form.razorpayConfig.hasKeySecret
                ? "border-emerald-500 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                : "border-amber-500/70 bg-amber-500/10 text-amber-600 dark:text-amber-400"
            }`}
          >
            <CreditCard className="h-3.5 w-3.5" />
            <span>
              Razorpay: {form.razorpayConfig.hasKeySecret ? "Configured" : "Keys Missing"}
            </span>
          </div>

          {/* Status 5: Default Trial */}
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

        {/* ── MULTI-PROVIDER TRANSACTIONAL EMAIL GATEWAY (BREVO & ZEPTOMAIL) ── */}
        <div className="rounded-xl border border-border bg-card p-4 space-y-4 shadow-2xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-border/80 gap-2">
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-primary shrink-0" />
              <div>
                <h2 className="text-sm font-bold text-foreground flex items-center gap-2 flex-wrap">
                  Multi-Provider Email Gateway
                  <Badge variant="outline" className="text-[10px] bg-primary/10 text-primary border-primary/20">
                    Brevo &amp; ZeptoMail
                  </Badge>
                  <span className="text-[11px] font-mono text-muted-foreground">
                    Active: {form.emailConfig.provider}
                  </span>
                </h2>
                <p className="text-[11px] text-muted-foreground">
                  Dynamic credentials stored in database with automated failover fallback. Zero restart required.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 flex-wrap">
              {form.emailConfig.zepto.hasApiKey ? (
                <span className="inline-flex items-center gap-1 text-[10px] font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                  <CheckCircle2 className="h-3 w-3" /> ZeptoMail Active
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[10px] font-medium text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20">
                  Zepto Unconfigured
                </span>
              )}
              {form.emailConfig.brevo.hasApiKey ? (
                <span className="inline-flex items-center gap-1 text-[10px] font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                  <CheckCircle2 className="h-3 w-3" /> Brevo Active
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[10px] font-medium text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20">
                  Brevo Unconfigured
                </span>
              )}
            </div>
          </div>

          {/* Provider Routing & Failover Controls */}
          <div className="grid gap-3 sm:grid-cols-2 p-3 rounded-lg bg-muted/30 border border-border/60">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">
                Primary Active Dispatch Gateway *
              </label>
              <Select
                value={form.emailConfig.provider}
                onValueChange={(val) =>
                  setForm({
                    ...form,
                    emailConfig: {
                      ...form.emailConfig,
                      provider: val,
                    },
                  })
                }
                options={[
                  { value: "ZEPTOMAIL", label: "ZeptoMail (Zoho API v1.1)" },
                  { value: "BREVO", label: "Brevo / Sendinblue (SMTP v3)" },
                ]}
                className="w-full"
                triggerClassName="text-xs h-9"
              />
              <p className="text-[10px] text-muted-foreground">
                Outgoing transactional emails (OTPs, invitations, receipts) route through this provider first.
              </p>
            </div>

            <div className="flex items-center justify-between p-2.5 rounded-md bg-background/60 border border-border/60">
              <div className="space-y-0.5 pr-2">
                <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <RefreshCw className="h-3.5 w-3.5 text-primary" />
                  Automated Secondary Fallback
                </span>
                <p className="text-[10px] text-muted-foreground">
                  If primary fails or reaches rate limits, instantly retry delivery using secondary provider.
                </p>
              </div>
              <Switch
                checked={form.emailConfig.fallbackEnabled}
                onCheckedChange={(checked) =>
                  setForm({
                    ...form,
                    emailConfig: {
                      ...form.emailConfig,
                      fallbackEnabled: checked,
                    },
                  })
                }
              />
            </div>
          </div>

          {/* Dual Provider Setup Cards */}
          <div className="grid gap-3.5 lg:grid-cols-2">
            {/* 1. ZeptoMail Configuration */}
            <div
              className={`p-3.5 rounded-lg border space-y-3 transition-colors ${
                form.emailConfig.provider === "ZEPTOMAIL"
                  ? "border-primary/40 bg-primary/5"
                  : "border-border bg-card"
              }`}
            >
              <div className="flex items-center justify-between pb-1.5 border-b border-border/60">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-blue-500" />
                  <span className="text-xs font-bold text-foreground">
                    ZeptoMail (Zoho) Credentials
                  </span>
                </div>
                {form.emailConfig.provider === "ZEPTOMAIL" && (
                  <Badge variant="outline" className="text-[9px] bg-primary/10 text-primary border-primary/20">
                    Primary Route
                  </Badge>
                )}
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-foreground">
                    Send Mail Token / API Key
                  </label>
                  <span className="text-[10px] text-muted-foreground">
                    {form.emailConfig.zepto.hasApiKey ? "Leave masked to retain key" : "Mail Agent token"}
                  </span>
                </div>
                <div className="relative">
                  <Input
                    type={showZeptoApiKey ? "text" : "password"}
                    value={form.emailConfig.zepto.apiKey}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        emailConfig: {
                          ...form.emailConfig,
                          zepto: {
                            ...form.emailConfig.zepto,
                            apiKey: e.target.value,
                          },
                          // sync legacy
                          apiKey: e.target.value,
                        },
                      })
                    }
                    placeholder={
                      form.emailConfig.zepto.hasApiKey
                        ? "••••••••••••••••••••••••••••••••"
                        : "Zoho-enczapikey wSsVR61... or raw token"
                    }
                    className="text-xs h-9 font-mono pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowZeptoApiKey(!showZeptoApiKey)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer p-0.5 focus:outline-hidden"
                    tabIndex={-1}
                    aria-label={showZeptoApiKey ? "Hide Key" : "Show Key"}
                  >
                    {showZeptoApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-foreground">
                  Datacenter / Region
                </label>
                <Select
                  value={form.emailConfig.zepto.region}
                  onValueChange={(val) =>
                    setForm({
                      ...form,
                      emailConfig: {
                        ...form.emailConfig,
                        zepto: {
                          ...form.emailConfig.zepto,
                          region: val,
                        },
                        region: val,
                      },
                    })
                  }
                  options={[
                    { value: "IN", label: "India (.in) - api.zeptomail.in" },
                    { value: "US", label: "United States (.com) - api.zeptomail.com" },
                    { value: "EU", label: "Europe (.eu) - api.zeptomail.eu" },
                  ]}
                  className="w-full"
                  triggerClassName="text-xs h-9 font-mono"
                />
              </div>
            </div>

            {/* 2. Brevo Configuration */}
            <div
              className={`p-3.5 rounded-lg border space-y-3 transition-colors ${
                form.emailConfig.provider === "BREVO"
                  ? "border-primary/40 bg-primary/5"
                  : "border-border bg-card"
              }`}
            >
              <div className="flex items-center justify-between pb-1.5 border-b border-border/60">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  <span className="text-xs font-bold text-foreground">
                    Brevo (Sendinblue) Credentials
                  </span>
                </div>
                {form.emailConfig.provider === "BREVO" && (
                  <Badge variant="outline" className="text-[9px] bg-primary/10 text-primary border-primary/20">
                    Primary Route
                  </Badge>
                )}
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-foreground">
                    Brevo API Key (v3)
                  </label>
                  <span className="text-[10px] text-muted-foreground">
                    {form.emailConfig.brevo.hasApiKey ? "Leave masked to retain key" : "Starts with xkeysib-"}
                  </span>
                </div>
                <div className="relative">
                  <Input
                    type={showBrevoApiKey ? "text" : "password"}
                    value={form.emailConfig.brevo.apiKey}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        emailConfig: {
                          ...form.emailConfig,
                          brevo: {
                            ...form.emailConfig.brevo,
                            apiKey: e.target.value,
                          },
                        },
                      })
                    }
                    placeholder={
                      form.emailConfig.brevo.hasApiKey
                        ? "••••••••••••••••••••••••••••••••"
                        : "xkeysib-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                    }
                    className="text-xs h-9 font-mono pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowBrevoApiKey(!showBrevoApiKey)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer p-0.5 focus:outline-hidden"
                    tabIndex={-1}
                    aria-label={showBrevoApiKey ? "Hide Key" : "Show Key"}
                  >
                    {showBrevoApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="rounded-md bg-muted/40 p-2.5 text-[11px] text-muted-foreground space-y-1">
                <p>
                  API endpoint: <code className="font-mono text-foreground">https://api.brevo.com/v3/smtp/email</code>
                </p>
                <p>
                  Ensure your sender email address below is verified in your Brevo senders list.
                </p>
              </div>
            </div>
          </div>

          {/* Shared Sender Information */}
          <div className="grid gap-3.5 sm:grid-cols-2 pt-2 border-t border-border/60">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">
                Sender Email Address *
              </label>
              <Input
                type="email"
                value={form.emailConfig.fromEmail}
                onChange={(e) =>
                  setForm({
                    ...form,
                    emailConfig: {
                      ...form.emailConfig,
                      fromEmail: e.target.value,
                    },
                  })
                }
                placeholder="noreply@minihisab.com"
                className="text-xs h-9 font-mono"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">
                Sender Display Name *
              </label>
              <Input
                value={form.emailConfig.fromName}
                onChange={(e) =>
                  setForm({
                    ...form,
                    emailConfig: {
                      ...form.emailConfig,
                      fromName: e.target.value,
                    },
                  })
                }
                placeholder="Mini Hisab"
                className="text-xs h-9"
              />
            </div>
          </div>

          {/* Live Test Dispatcher */}
          <div className="rounded-lg border border-dashed border-border/80 bg-muted/20 p-3.5 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                <Send className="h-3.5 w-3.5 text-primary" />
                Live Dispatch &amp; Gateway Connection Test
              </span>
              <span className="text-[10px] text-muted-foreground">
                Sends a live test template to verify credentials
              </span>
            </div>

            <div className="grid gap-2.5 sm:grid-cols-12 items-center">
              <div className="sm:col-span-5">
                <Input
                  type="email"
                  value={testEmailTarget}
                  onChange={(e) => setTestEmailTarget(e.target.value)}
                  placeholder="recipient@example.com"
                  className="text-xs h-9"
                />
              </div>

              <div className="sm:col-span-4">
                <Select
                  value={testEmailProvider}
                  onValueChange={setTestEmailProvider}
                  options={[
                    { value: "AUTO", label: "Auto (Attempt Chain)" },
                    { value: "ZEPTOMAIL", label: "Force ZeptoMail" },
                    { value: "BREVO", label: "Force Brevo" },
                  ]}
                  className="w-full"
                  triggerClassName="text-xs h-9"
                />
              </div>

              <div className="sm:col-span-3">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleSendTestEmail}
                  disabled={isSendingTest || !testEmailTarget.trim()}
                  className="w-full h-9 text-xs font-semibold gap-1.5 cursor-pointer"
                >
                  {isSendingTest ? (
                    <>
                      <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                      Testing...
                    </>
                  ) : (
                    <>
                      <Send className="h-3.5 w-3.5" />
                      Send Test
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* ── RAZORPAY PAYMENT GATEWAY CREDENTIALS ────────────────────────── */}
        <div className="rounded-xl border border-border bg-card p-4 space-y-3.5 shadow-2xs">
          <div className="flex items-center justify-between pb-2 border-b border-border/80">
            <div className="flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-primary" />
              <div>
                <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
                  Razorpay Payment Gateway Setup
                  <Badge variant="outline" className="text-[10px] bg-primary/10 text-primary border-primary/20">
                    Live / Test
                  </Badge>
                </h2>
                <p className="text-[11px] text-muted-foreground">
                  Stored securely in database and loaded dynamically by checkout and verification endpoints.
                </p>
              </div>
            </div>
            {form.razorpayConfig.hasKeySecret ? (
              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-md border border-emerald-500/20">
                <CheckCircle2 className="h-3 w-3" /> Credentials Active
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-md border border-amber-500/20">
                Keys Required
              </span>
            )}
          </div>

          <div className="grid gap-3.5 sm:grid-cols-2">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">
                Razorpay Key ID *
              </label>
              <div className="relative">
                <Input
                  type={showRzpKeyId ? "text" : "password"}
                  value={form.razorpayConfig.keyId}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      razorpayConfig: {
                        ...form.razorpayConfig,
                        keyId: e.target.value,
                      },
                    })
                  }
                  placeholder="rzp_live_... or rzp_test_..."
                  className="text-xs h-9 font-mono pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowRzpKeyId(!showRzpKeyId)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer p-0.5 focus:outline-hidden"
                  tabIndex={-1}
                  aria-label={showRzpKeyId ? "Hide Key ID" : "Show Key ID"}
                >
                  {showRzpKeyId ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-foreground">
                  Razorpay Key Secret *
                </label>
                <span className="text-[10px] text-muted-foreground">
                  {form.razorpayConfig.hasKeySecret ? "Leave masked to keep active secret" : "Secret Key from Dashboard"}
                </span>
              </div>
              <div className="relative">
                <Input
                  type={showRzpSecret ? "text" : "password"}
                  value={form.razorpayConfig.keySecret}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      razorpayConfig: {
                        ...form.razorpayConfig,
                        keySecret: e.target.value,
                      },
                    })
                  }
                  placeholder={form.razorpayConfig.hasKeySecret ? "••••••••••••••••••••" : "Key Secret"}
                  className="text-xs h-9 font-mono pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowRzpSecret(!showRzpSecret)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
                >
                  {showRzpSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="sm:col-span-2 space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-foreground">
                  Webhook Secret (Optional)
                </label>
                <span className="text-[10px] text-muted-foreground">
                  Used for validating asynchronous subscription webhooks
                </span>
              </div>
              <div className="relative max-w-md">
                <Input
                  type={showRzpWebhookSecret ? "text" : "password"}
                  value={form.razorpayConfig.webhookSecret}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      razorpayConfig: {
                        ...form.razorpayConfig,
                        webhookSecret: e.target.value,
                      },
                    })
                  }
                  placeholder={form.razorpayConfig.hasWebhookSecret ? "••••••••••••••••••••" : "Optional webhook signing secret"}
                  className="text-xs h-9 font-mono pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowRzpWebhookSecret(!showRzpWebhookSecret)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
                >
                  {showRzpWebhookSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
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
