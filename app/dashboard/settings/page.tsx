"use client";

import * as React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Settings, Building2, Store, ToggleLeft, ToggleRight,
  Database, RefreshCw, Landmark, ShieldCheck
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import AsyncSelect from "@/components/ui/async-select";
import { useAuth } from "@/components/auth/auth-provider";
import { businessService } from "@/services/business.service";
import { outletService } from "@/services/outlet.service";
import { useSettings } from "@/components/settings/settings-provider";
import { RoleGate } from "@/components/auth/role-gate";
import { SecuritySettings } from "@/components/settings/security-settings";
import toast from "react-hot-toast";
import { getErrorMessage } from "@/lib/error";
import { useAppDispatch } from "@/store/hooks";
import { updateUser } from "@/store/authSlice";

export default function SettingsPage() {
  const { token, outletId, businessId, user } = useAuth();
  const { settings, updateSettings } = useSettings();
  const qc = useQueryClient();
  const dispatch = useAppDispatch();

  const [bizForm, setBizForm] = React.useState({ name: "", code: "", gstNumber: "", currency: "INR" });
  const [outletForm, setOutletForm] = React.useState({ name: "", phone: "", address: "", defaultTaxRate: 5 });

  const loadCurrencyOptions = async ({ search }: { search?: string }) => {
    const defaultCurrencies = [
      { id: "INR", name: "INR (₹)" },
      { id: "USD", name: "USD ($)" },
      { id: "EUR", name: "EUR (€)" },
      { id: "GBP", name: "GBP (£)" },
      { id: "AUD", name: "AUD (A$)" },
      { id: "CAD", name: "CAD (C$)" },
      { id: "AED", name: "AED (د.إ)" },
    ];
    let filtered = defaultCurrencies;
    if (search) {
      filtered = defaultCurrencies.filter((c) =>
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.id.toLowerCase().includes(search.toLowerCase())
      );
    }
    return { data: filtered };
  };

  // Get active business detail
  const { data: businessData } = useQuery({
    queryKey: ["business-mine"],
    queryFn: () => businessService.getMyBusiness(token!),
    enabled: Boolean(token),
    staleTime: Infinity
  });

  // Get active outlet detail
  const { data: outletData } = useQuery({
    queryKey: ["outlet-current", outletId],
    queryFn: () => outletService.getOutlet(outletId!, token!),
    enabled: Boolean(token && outletId)
  });

  // Mutations
  const saveBusinessMutation = useMutation({
    mutationFn: (body: unknown) => businessService.updateBusiness(businessId!, body, token!),
    onSuccess: (_, variables: any) => {
      qc.invalidateQueries({ queryKey: ["business-mine"] });
      if (user && variables.currency) {
        dispatch(updateUser({ ...user, currency: variables.currency }));
      }
      toast.success("Business settings saved");
    },
    onError: (err) => toast.error(getErrorMessage(err, "Failed to save business settings"))
  });

  const saveOutletMutation = useMutation({
    mutationFn: (body: unknown) => outletService.updateOutlet(outletId!, body, token!),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["outlet-current"] });
      toast.success("Outlet settings saved");
    },
    onError: (err) => toast.error(getErrorMessage(err, "Failed to save outlet settings"))
  });

  React.useEffect(() => {
    if (businessData?.business) {
      const b = businessData.business;
      setBizForm({ name: b.name || "", code: b.code || "", gstNumber: b.gstNumber || "", currency: b.currency || "INR" });
    }
  }, [businessData]);

  React.useEffect(() => {
    if (outletData?.outlet) {
      const o = outletData.outlet;
      setOutletForm({ name: o.name || "", phone: o.phone || "", address: o.address || "", defaultTaxRate: o.defaultTaxRate ?? 5 });
    }
  }, [outletData]);

  const handleBizSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveBusinessMutation.mutate(bizForm);
  };

  const handleOutletSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveOutletMutation.mutate(outletForm);
  };

  return (
    <RoleGate allowed={["owner", "manager"]}>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Settings className="h-6 w-6 text-primary" /> Settings
          </h1>
          <p className="text-sm text-muted">Manage franchise credentials, active location details, and system parameters.</p>
        </div>

        <div className="grid gap-6 md:grid-cols-[2fr_1fr]">
          <div className="space-y-6">
            {/* Business/Brand Profile Settings */}
            <Card className="rounded-xl border border-border/70 shadow-soft">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Building2 className="h-5 w-5 text-primary" /> Franchise Brand settings
                </CardTitle>
                <CardDescription>Configure core system identification across all locations</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleBizSubmit} className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="mb-1 block text-xs font-medium text-muted">Brand / Company Name *</label>
                      <Input required value={bizForm.name} onChange={(e) => setBizForm(f => ({ ...f, name: e.target.value }))} />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-medium text-muted">Short Code *</label>
                      <Input required disabled value={bizForm.code} className="bg-border/20 font-mono" />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-medium text-muted">Franchise GSTIN</label>
                      <Input value={bizForm.gstNumber} onChange={(e) => setBizForm(f => ({ ...f, gstNumber: e.target.value }))} placeholder="GST Registration No." />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-medium text-muted">System Currency</label>
                      <AsyncSelect
                        value={bizForm.currency ? { id: bizForm.currency, name: bizForm.currency } : null}
                        onChange={(val: any) => setBizForm(f => ({ ...f, currency: val ? (val.id ?? val.name) : "" }))}
                        loadOptions={loadCurrencyOptions}
                        placeholder="Search or type custom..."
                        creatable={true}
                      />
                    </div>
                  </div>
                  <Button type="submit" disabled={saveBusinessMutation.isPending} id="save-biz-btn">
                    {saveBusinessMutation.isPending ? "Saving..." : "Save Brand Settings"}
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Active Outlet Settings */}
            <Card className="rounded-xl border border-border/70 shadow-soft">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Store className="h-5 w-5 text-primary" /> Active Location (Outlet) Settings
                </CardTitle>
                <CardDescription>Update parameters specific to this selected outlet</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleOutletSubmit} className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="mb-1 block text-xs font-medium text-muted">Outlet Name *</label>
                      <Input required value={outletForm.name} onChange={(e) => setOutletForm(f => ({ ...f, name: e.target.value }))} />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-medium text-muted">Contact Phone</label>
                      <Input value={outletForm.phone} onChange={(e) => setOutletForm(f => ({ ...f, phone: e.target.value }))} />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="mb-1 block text-xs font-medium text-muted">Physical Address</label>
                      <Input value={outletForm.address} onChange={(e) => setOutletForm(f => ({ ...f, address: e.target.value }))} placeholder="Location address..." />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-medium text-muted">Default GST/Tax Rate (%)</label>
                      <Input type="number" min={0} max={100} value={outletForm.defaultTaxRate} onChange={(e) => setOutletForm(f => ({ ...f, defaultTaxRate: Number(e.target.value) }))} />
                    </div>
                  </div>
                  <Button type="submit" disabled={saveOutletMutation.isPending} id="save-outlet-btn">
                    {saveOutletMutation.isPending ? "Saving..." : "Save Outlet Settings"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <SecuritySettings />

            {/* System Preferences & Operational toggles */}
            <Card className="rounded-xl border border-border/70 shadow-soft">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Database className="h-5 w-5 text-primary" /> Preferences
                </CardTitle>
                <CardDescription>Adjust billing rules & queue styles</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between py-2 border-b border-border/20">
                  <div>
                    <p className="text-sm font-semibold">Enable Sales Tax</p>
                    <p className="text-xs text-muted">Apply tax rate in billing total</p>
                  </div>
                  <Switch checked={settings.taxEnabled} onCheckedChange={(val) => updateSettings({ taxEnabled: val })} />
                </div>

                <div className="flex items-center justify-between py-2 border-b border-border/20">
                  <div>
                    <p className="text-sm font-semibold">Offline Queue Mode</p>
                    <p className="text-xs text-muted">Queue invoices if offline</p>
                  </div>
                  <Switch checked={settings.offlineMode} onCheckedChange={(val) => updateSettings({ offlineMode: val })} />
                </div>

                <div className="flex items-center justify-between py-2 border-b border-border/20">
                  <div>
                    <p className="text-sm font-semibold">GST Invoices View</p>
                    <p className="text-xs text-muted">Render CGST/SGST breakdowns</p>
                  </div>
                  <Switch checked={settings.gstEnabled} onCheckedChange={(val) => updateSettings({ gstEnabled: val })} />
                </div>
              </CardContent>
            </Card>

            {/* License Settings */}
            <Card className="rounded-xl border border-border/70 shadow-soft bg-primary/[0.02]">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                  <ShieldCheck className="h-4 w-4 text-primary" /> Subscription License
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-muted">Plan Level:</span>
                  <Badge variant="soft" className="capitalize font-bold">{businessData?.business?.plan || "Starter"}</Badge>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-muted">Assigned License Limits:</span>
                  <span className="font-semibold">{outletId ? "Unlimited" : "1 Outlet"}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </RoleGate>
  );
}
