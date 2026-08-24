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
import { Settings, Save, AlertTriangle } from "lucide-react";

export default function AdminSettingsPage() {
  const { token } = useAuth();
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
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
      notes: ""
    }
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
          notes: data.settings.bankDetails?.notes ?? ""
        }
      });
    }
  }, [data]);

  const updateMutation = useMutation({
    mutationFn: (body: any) => adminService.updateSettings(body, token),
    onSuccess: (res: any) => {
      qc.invalidateQueries({ queryKey: ["admin-settings"] });
      toast.success(res.message || "Settings updated successfully");
    },
    onError: (err) => {
      toast.error(getErrorMessage(err));
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate(form);
  };

  if (isLoading) {
    return <div className="p-8 text-center text-muted-foreground">Loading settings...</div>;
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
          <Settings className="h-6 w-6" /> Platform Settings
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage global configurations and feature toggles for the entire SaaS platform.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 bg-card border border-border rounded-xl p-6 shadow-sm">
        
        {/* Core Controls */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold border-b border-border pb-2">Core Controls</h2>
          
          <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg border border-border">
            <div>
              <p className="font-medium text-sm text-foreground">Maintenance Mode</p>
              <p className="text-xs text-muted-foreground">
                If enabled, the application will be unavailable for all regular users.
              </p>
            </div>
            <Switch
              checked={form.maintenanceMode}
              onCheckedChange={(v) => setForm({ ...form, maintenanceMode: v })}
            />
          </div>

          <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg border border-border">
            <div>
              <p className="font-medium text-sm text-foreground">Allow New Signups</p>
              <p className="text-xs text-muted-foreground">
                Toggle new business registrations on the platform.
              </p>
            </div>
            <Switch
              checked={form.allowNewSignups}
              onCheckedChange={(v) => setForm({ ...form, allowNewSignups: v })}
            />
          </div>
        </div>

        {/* Configuration */}
        <div className="space-y-4 pt-4">
          <h2 className="text-lg font-semibold border-b border-border pb-2">Configuration</h2>
          
          <div className="grid gap-4 max-w-sm">
            <div>
              <label className="mb-1 block text-sm font-medium text-foreground">Default Trial Days</label>
              <p className="text-xs text-muted-foreground mb-2">Number of free trial days for new signups.</p>
              <Input
                type="number"
                min={0}
                max={90}
                value={form.defaultTrialDays}
                onChange={(e) => setForm({ ...form, defaultTrialDays: parseInt(e.target.value) || 0 })}
              />
            </div>
          </div>
        </div>

        {/* Messaging */}
        <div className="space-y-4 pt-4">
          <h2 className="text-lg font-semibold border-b border-border pb-2">Messaging</h2>
          
          <div className="grid gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-foreground flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-warning" /> Global Announcement
              </label>
              <p className="text-xs text-muted-foreground mb-2">
                This message will be displayed as a banner to all active users on the platform. Leave empty to disable.
              </p>
              <Textarea
                placeholder="e.g. System maintenance scheduled for tonight at 2 AM EST..."
                value={form.globalAnnouncement}
                onChange={(e) => setForm({ ...form, globalAnnouncement: e.target.value })}
                rows={3}
                className="resize-none"
              />
            </div>
          </div>
        </div>

        <div className="space-y-4 pt-4">
          <h2 className="text-lg font-semibold border-b border-border pb-2">Bank transfer details</h2>
          <p className="text-xs text-muted-foreground">
            Shown to owners on the subscribe page when they pay by NEFT / IMPS / UPI.
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium">Account name</label>
              <Input value={form.bankDetails.accountName} onChange={(e) => setForm({ ...form, bankDetails: { ...form.bankDetails, accountName: e.target.value } })} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Bank name</label>
              <Input value={form.bankDetails.bankName} onChange={(e) => setForm({ ...form, bankDetails: { ...form.bankDetails, bankName: e.target.value } })} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Account number</label>
              <Input value={form.bankDetails.accountNumber} onChange={(e) => setForm({ ...form, bankDetails: { ...form.bankDetails, accountNumber: e.target.value } })} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">IFSC</label>
              <Input value={form.bankDetails.ifsc} onChange={(e) => setForm({ ...form, bankDetails: { ...form.bankDetails, ifsc: e.target.value } })} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Branch</label>
              <Input value={form.bankDetails.branch} onChange={(e) => setForm({ ...form, bankDetails: { ...form.bankDetails, branch: e.target.value } })} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">UPI ID</label>
              <Input value={form.bankDetails.upiId} onChange={(e) => setForm({ ...form, bankDetails: { ...form.bankDetails, upiId: e.target.value } })} placeholder="business@upi" />
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1 block text-sm font-medium">Notes for owners</label>
              <Textarea
                rows={2}
                className="resize-none"
                value={form.bankDetails.notes}
                onChange={(e) => setForm({ ...form, bankDetails: { ...form.bankDetails, notes: e.target.value } })}
                placeholder="e.g. Use the business name as the transfer remark"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-4 border-t border-border">
          <Button
            type="submit"
            className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2"
            disabled={updateMutation.isPending}
          >
            <Save className="h-4 w-4" />
            {updateMutation.isPending ? "Saving..." : "Save Settings"}
          </Button>
        </div>
      </form>
    </div>
  );
}
