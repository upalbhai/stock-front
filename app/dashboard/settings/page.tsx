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
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { updateUser, setOutlets } from "@/store/authSlice";

export default function SettingsPage() {
  const { token, outletId, businessId, user } = useAuth();
  const { settings, updateSettings } = useSettings();
  const qc = useQueryClient();
  const dispatch = useAppDispatch();
  const outlets = useAppSelector((state) => state.auth.outlets);

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
    onSuccess: (res: any) => {
      qc.invalidateQueries({ queryKey: ["outlet-current"] });
      const updatedOutlet = res?.data?.outlet;
      if (updatedOutlet) {
        const updatedOutlets = outlets.map((o) =>
          o._id === updatedOutlet._id ? { ...o, name: updatedOutlet.name } : o
        );
        dispatch(setOutlets(updatedOutlets));
      }
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
      <div className="space-y-8 max-w-6xl mx-auto px-4 py-2 sm:px-6">
        {/* Header Block */}
        <div className="flex flex-col gap-1 border-b border-border/40 pb-5">
          <h1 className="text-3xl font-extrabold tracking-tight flex items-center gap-3 text-foreground">
            <div className="p-2 bg-primary/10 rounded-lg text-primary">
              <Settings className="h-7 w-7 animate-pulse" />
            </div>
            Settings
          </h1>
          <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
            Manage franchise credentials, active location details, and system parameters.
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-[5fr_3fr] items-start">
          <div className="space-y-8">
            {/* Business/Brand Profile Settings */}
            <Card className="overflow-hidden rounded-2xl border border-border/50 bg-card shadow-lg hover:shadow-xl transition-all duration-300">
              <CardHeader className="border-b border-border/10 bg-muted/5 pb-4">
                <CardTitle className="flex items-center gap-2.5 text-lg font-bold text-card-foreground">
                  <Building2 className="h-5 w-5 text-primary" /> Franchise Brand Settings
                </CardTitle>
                <CardDescription>Configure core system identification across all locations</CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <form onSubmit={handleBizSubmit} className="space-y-6">
                  <div className="grid gap-5 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Brand / Company Name *</label>
                      <Input required value={bizForm.name} onChange={(e) => setBizForm(f => ({ ...f, name: e.target.value }))} className="h-10 border-border/60 focus-visible:ring-primary/40 focus-visible:border-primary" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Short Code *</label>
                      <Input required disabled value={bizForm.code} className="h-10 bg-muted/30 border-border/40 font-mono text-muted-foreground cursor-not-allowed" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Franchise GSTIN</label>
                      <Input value={bizForm.gstNumber} onChange={(e) => setBizForm(f => ({ ...f, gstNumber: e.target.value }))} placeholder="GST Registration No." className="h-10 border-border/60 focus-visible:ring-primary/40 focus-visible:border-primary" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">System Currency</label>
                      <AsyncSelect
                        value={bizForm.currency ? { id: bizForm.currency, name: bizForm.currency } : null}
                        onChange={(val: any) => setBizForm(f => ({ ...f, currency: val ? (val.id ?? val.name) : "" }))}
                        loadOptions={loadCurrencyOptions}
                        placeholder="Search or type custom..."
                        creatable={true}
                        className="h-10"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end pt-2">
                    <Button 
                      type="submit" 
                      disabled={saveBusinessMutation.isPending} 
                      id="save-biz-btn" 
                      className="w-full sm:w-auto min-w-[160px] h-10 transition-all duration-200 active:scale-95 shadow-md flex items-center justify-center gap-2 hover:opacity-95"
                    >
                      {saveBusinessMutation.isPending ? (
                        <RefreshCw className="h-4 w-4 animate-spin" />
                      ) : (
                        <Building2 className="h-4 w-4" />
                      )}
                      <span>{saveBusinessMutation.isPending ? "Saving..." : "Save Brand Settings"}</span>
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>

            {/* Active Outlet Settings */}
            <Card className="overflow-hidden rounded-2xl border border-border/50 bg-card shadow-lg hover:shadow-xl transition-all duration-300">
              <CardHeader className="border-b border-border/10 bg-muted/5 pb-4">
                <CardTitle className="flex items-center gap-2.5 text-lg font-bold text-card-foreground">
                  <Store className="h-5 w-5 text-primary" /> Active Location (Outlet) Settings
                </CardTitle>
                <CardDescription>Update parameters specific to this selected outlet</CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <form onSubmit={handleOutletSubmit} className="space-y-6">
                  <div className="grid gap-5 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Outlet Name *</label>
                      <Input required value={outletForm.name} onChange={(e) => setOutletForm(f => ({ ...f, name: e.target.value }))} className="h-10 border-border/60 focus-visible:ring-primary/40 focus-visible:border-primary" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Contact Phone</label>
                      <Input value={outletForm.phone} onChange={(e) => setOutletForm(f => ({ ...f, phone: e.target.value }))} className="h-10 border-border/60 focus-visible:ring-primary/40 focus-visible:border-primary" />
                    </div>
                    <div className="sm:col-span-2 space-y-1.5">
                      <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Physical Address</label>
                      <Input value={outletForm.address} onChange={(e) => setOutletForm(f => ({ ...f, address: e.target.value }))} placeholder="Location address..." className="h-10 border-border/60 focus-visible:ring-primary/40 focus-visible:border-primary" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Default GST/Tax Rate (%)</label>
                      <Input type="number" min={0} max={100} value={outletForm.defaultTaxRate} onChange={(e) => setOutletForm(f => ({ ...f, defaultTaxRate: Number(e.target.value) }))} className="h-10 border-border/60 focus-visible:ring-primary/40 focus-visible:border-primary" />
                    </div>
                  </div>
                  <div className="flex justify-end pt-2">
                    <Button 
                      type="submit" 
                      disabled={saveOutletMutation.isPending} 
                      id="save-outlet-btn"
                      className="w-full sm:w-auto min-w-[160px] h-10 transition-all duration-200 active:scale-95 shadow-md flex items-center justify-center gap-2 hover:opacity-95"
                    >
                      {saveOutletMutation.isPending ? (
                        <RefreshCw className="h-4 w-4 animate-spin" />
                      ) : (
                        <Store className="h-4 w-4" />
                      )}
                      <span>{saveOutletMutation.isPending ? "Saving..." : "Save Outlet Settings"}</span>
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-8">
            <SecuritySettings />

            {/* System Preferences & Operational toggles */}
            <Card className="overflow-hidden rounded-2xl border border-border/50 bg-card shadow-lg hover:shadow-xl transition-all duration-300">
              <CardHeader className="border-b border-border/10 bg-muted/5 pb-4">
                <CardTitle className="flex items-center gap-2.5 text-lg font-bold text-card-foreground">
                  <Database className="h-5 w-5 text-primary" /> Preferences
                </CardTitle>
                <CardDescription>Adjust billing rules & queue styles</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-border/40">
                  <div className="flex items-center justify-between p-4 sm:p-5 hover:bg-muted/10 transition-colors duration-150">
                    <div className="space-y-0.5">
                      <p className="text-sm font-semibold text-foreground">Enable Sales Tax</p>
                      <p className="text-xs text-muted-foreground">Apply tax rate in billing total</p>
                    </div>
                    <Switch checked={settings.taxEnabled} onCheckedChange={(val) => updateSettings({ taxEnabled: val })} />
                  </div>

                  <div className="flex items-center justify-between p-4 sm:p-5 hover:bg-muted/10 transition-colors duration-150">
                    <div className="space-y-0.5">
                      <p className="text-sm font-semibold text-foreground">Offline Queue Mode</p>
                      <p className="text-xs text-muted-foreground">Queue invoices if offline</p>
                    </div>
                    <Switch checked={settings.offlineMode} onCheckedChange={(val) => updateSettings({ offlineMode: val })} />
                  </div>

                  <div className="flex items-center justify-between p-4 sm:p-5 hover:bg-muted/10 transition-colors duration-150">
                    <div className="space-y-0.5">
                      <p className="text-sm font-semibold text-foreground">GST Invoices View</p>
                      <p className="text-xs text-muted-foreground">Render CGST/SGST breakdowns</p>
                    </div>
                    <Switch checked={settings.gstEnabled} onCheckedChange={(val) => updateSettings({ gstEnabled: val })} />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* License Settings */}
            <Card className="overflow-hidden rounded-2xl border border-border/50 bg-card shadow-lg hover:shadow-xl transition-all duration-300 relative">
              <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full blur-2xl -mr-6 -mt-6"></div>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-sm font-bold text-muted-foreground uppercase tracking-wider">
                  <ShieldCheck className="h-4 w-4 text-primary" /> Subscription License
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 pt-1">
                <div className="flex justify-between items-center py-1.5 border-b border-border/10">
                  <span className="text-xs text-muted-foreground">Plan Level:</span>
                  <Badge variant="soft" className="capitalize font-bold text-xs bg-primary/10 text-primary hover:bg-primary/20 border border-primary/20 transition-colors duration-200">
                    {businessData?.business?.plan || "Starter"}
                  </Badge>
                </div>
                <div className="flex justify-between items-center py-1.5">
                  <span className="text-xs text-muted-foreground">Assigned License Limits:</span>
                  <span className="text-xs font-semibold text-foreground bg-muted/40 px-2.5 py-1 rounded-md border border-border/20">
                    {outletId ? "Unlimited" : "1 Outlet"}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </RoleGate>
  );
}
