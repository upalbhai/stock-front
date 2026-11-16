"use client";

import * as React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Settings,
  Building2,
  Store,
  Database,
  RefreshCw,
  Landmark,
  ShieldCheck,
  Percent,
  CheckCircle2,
  Sparkles,
  Lock,
  Sliders,
  CreditCard,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { cn } from "@/lib/utils";

const TAX_PRESETS = [0, 5, 12, 18, 28];

export default function SettingsPage() {
  const { token, outletId, businessId, user } = useAuth();
  const { settings, updateSettings } = useSettings();
  const qc = useQueryClient();
  const dispatch = useAppDispatch();
  const outlets = useAppSelector((state) => state.auth.outlets);

  const [activeTab, setActiveTab] = React.useState<"general" | "pos" | "security">("general");

  const [bizForm, setBizForm] = React.useState({
    name: "",
    code: "",
    gstNumber: "",
    currency: "INR",
  });
  const [outletForm, setOutletForm] = React.useState({
    name: "",
    phone: "",
    address: "",
    defaultTaxRate: 5,
  });

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
      filtered = defaultCurrencies.filter(
        (c) =>
          c.name.toLowerCase().includes(search.toLowerCase()) ||
          c.id.toLowerCase().includes(search.toLowerCase())
      );
    }
    return { data: filtered };
  };

  // Get active business detail
  const { data: businessData, isLoading: isBizLoading } = useQuery({
    queryKey: ["business-mine"],
    queryFn: () => businessService.getMyBusiness(token!),
    enabled: Boolean(token),
    staleTime: Infinity,
  });

  // Get active outlet detail
  const { data: outletData, isLoading: isOutletLoading } = useQuery({
    queryKey: ["outlet-current", outletId],
    queryFn: () => outletService.getOutlet(outletId!, token!),
    enabled: Boolean(token && outletId),
  });

  // Mutations
  const saveBusinessMutation = useMutation({
    mutationFn: (body: unknown) => businessService.updateBusiness(businessId!, body, token!),
    onSuccess: (_, variables: any) => {
      qc.invalidateQueries({ queryKey: ["business-mine"] });
      if (user && variables.currency) {
        dispatch(updateUser({ ...user, currency: variables.currency }));
      }
      toast.success("Franchise settings saved successfully");
    },
    onError: (err) => toast.error(getErrorMessage(err, "Failed to save franchise settings")),
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
      toast.success("Outlet location settings saved successfully");
    },
    onError: (err) => toast.error(getErrorMessage(err, "Failed to save outlet settings")),
  });

  React.useEffect(() => {
    if (businessData?.business) {
      const b = businessData.business;
      setBizForm({
        name: b.name || "",
        code: b.code || "",
        gstNumber: b.gstNumber || "",
        currency: b.currency || "INR",
      });
    }
  }, [businessData]);

  React.useEffect(() => {
    if (outletData?.outlet) {
      const o = outletData.outlet;
      setOutletForm({
        name: o.name || "",
        phone: o.phone || "",
        address: o.address || "",
        defaultTaxRate: o.defaultTaxRate ?? 5,
      });
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
    <RoleGate allowed={["owner", "manager", "superadmin"]}>
      <div className="space-y-6 max-w-6xl mx-auto">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/60 pb-5">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight text-foreground">Settings</h1>
              <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 text-xs">
                Administration
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground mt-0.5">
              Manage franchise profile, active outlet parameters, POS preferences, and security.
            </p>
          </div>

          <Tabs
            value={activeTab}
            onValueChange={(v) => setActiveTab(v as "general" | "pos" | "security")}
          >
            <TabsList className="h-10 bg-muted/60 p-0.5 border border-border/40">
              <TabsTrigger
                value="general"
                className="text-xs px-3.5 py-1.5 font-semibold text-muted-foreground hover:text-foreground data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-xs transition-all"
              >
                Store & Locations
              </TabsTrigger>
              <TabsTrigger
                value="pos"
                className="text-xs px-3.5 py-1.5 font-semibold text-muted-foreground hover:text-foreground data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-xs transition-all"
              >
                POS Preferences
              </TabsTrigger>
              <TabsTrigger
                value="security"
                className="text-xs px-3.5 py-1.5 font-semibold text-muted-foreground hover:text-foreground data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-xs transition-all"
              >
                Security & Access
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Tab 1: Store & Locations */}
        {activeTab === "general" && (
          <div className="grid gap-6 lg:grid-cols-[5fr_3fr] items-start">
            <div className="space-y-6">
              {/* Franchise / Business Profile Settings */}
              <Card className="border border-border/70 bg-card shadow-2xs hover:shadow-xs transition-shadow">
                <CardHeader className="border-b border-border/40 pb-4">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2 text-base font-bold text-foreground">
                      <Building2 className="h-5 w-5 text-primary" />
                      <span>Franchise Profile Settings</span>
                    </CardTitle>
                    <Badge variant="outline" className="text-[11px] font-mono">
                      Code: {bizForm.code || "BIZ"}
                    </Badge>
                  </div>
                  <CardDescription className="text-xs text-muted-foreground">
                    Master business identity and currency applied across all outlets.
                  </CardDescription>
                </CardHeader>

                <CardContent className="pt-5">
                  <form onSubmit={handleBizSubmit} className="space-y-4">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-1.5 sm:col-span-2">
                        <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                          Franchise / Company Name *
                        </label>
                        <Input
                          required
                          value={bizForm.name}
                          onChange={(e) => setBizForm((f) => ({ ...f, name: e.target.value }))}
                          placeholder="e.g. 7-Eleven India, Fresh Retail Co."
                          className="h-10 text-sm"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                          Business Short Code
                        </label>
                        <Input
                          disabled
                          value={bizForm.code}
                          className="h-10 bg-muted/40 font-mono text-xs text-muted-foreground cursor-not-allowed"
                        />
                        <span className="text-[10px] text-muted-foreground">
                          Immutable identifier for invoices and SKUs
                        </span>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                          Master GSTIN Registration
                        </label>
                        <Input
                          value={bizForm.gstNumber}
                          onChange={(e) => setBizForm((f) => ({ ...f, gstNumber: e.target.value }))}
                          placeholder="e.g. 24ABCDE1234F1Z5"
                          className="h-10 text-sm font-mono uppercase"
                        />
                      </div>

                      <div className="space-y-1.5 sm:col-span-2">
                        <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                          System Base Currency
                        </label>
                        <AsyncSelect
                          value={bizForm.currency ? { id: bizForm.currency, name: bizForm.currency } : null}
                          onChange={(val: any) =>
                            setBizForm((f) => ({ ...f, currency: val ? val.id ?? val.name : "" }))
                          }
                          loadOptions={loadCurrencyOptions}
                          placeholder="Search or select currency..."
                          creatable={true}
                          className="h-10 text-sm"
                        />
                      </div>
                    </div>

                    <div className="flex justify-end pt-3 border-t border-border/50">
                      <Button
                        type="submit"
                        disabled={saveBusinessMutation.isPending}
                        id="save-biz-btn"
                        className="h-10 px-5 text-xs font-semibold gap-1.5 shadow-xs cursor-pointer"
                      >
                        {saveBusinessMutation.isPending ? (
                          <RefreshCw className="h-4 w-4 animate-spin" />
                        ) : (
                          <Building2 className="h-4 w-4" />
                        )}
                        <span>{saveBusinessMutation.isPending ? "Saving..." : "Save Franchise Profile"}</span>
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>

              {/* Active Outlet Settings */}
              <Card className="border border-border/70 bg-card shadow-2xs hover:shadow-xs transition-shadow">
                <CardHeader className="border-b border-border/40 pb-4">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2 text-base font-bold text-foreground">
                      <Store className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                      <span>Active Location (Outlet) Settings</span>
                    </CardTitle>
                    <Badge variant="soft" className="text-[11px] font-semibold">
                      Current POS Outlet
                    </Badge>
                  </div>
                  <CardDescription className="text-xs text-muted-foreground">
                    Address, contact information, and default sales tax for this registered counter.
                  </CardDescription>
                </CardHeader>

                <CardContent className="pt-5">
                  <form onSubmit={handleOutletSubmit} className="space-y-4">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                          Outlet Name *
                        </label>
                        <Input
                          required
                          value={outletForm.name}
                          onChange={(e) => setOutletForm((f) => ({ ...f, name: e.target.value }))}
                          placeholder="e.g. Bandra West Main Store"
                          className="h-10 text-sm"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                          Contact Phone
                        </label>
                        <Input
                          value={outletForm.phone}
                          onChange={(e) => setOutletForm((f) => ({ ...f, phone: e.target.value }))}
                          placeholder="+91 98765 43210"
                          className="h-10 text-sm font-mono"
                        />
                      </div>

                      <div className="sm:col-span-2 space-y-1.5">
                        <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                          Physical Store Address
                        </label>
                        <Input
                          value={outletForm.address}
                          onChange={(e) => setOutletForm((f) => ({ ...f, address: e.target.value }))}
                          placeholder="e.g. Shop 4, Linking Road, Mumbai 400050"
                          className="h-10 text-sm"
                        />
                      </div>

                      <div className="sm:col-span-2 space-y-2">
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                            Default GST / Tax Rate (%)
                          </label>
                          <span className="text-xs font-bold font-mono text-primary">
                            {outletForm.defaultTaxRate}%
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <Input
                            type="number"
                            min={0}
                            max={100}
                            value={outletForm.defaultTaxRate}
                            onChange={(e) =>
                              setOutletForm((f) => ({ ...f, defaultTaxRate: Number(e.target.value) }))
                            }
                            className="h-10 w-28 text-sm font-mono text-right"
                          />
                          <div className="flex flex-wrap gap-1.5">
                            {TAX_PRESETS.map((rate) => (
                              <button
                                key={rate}
                                type="button"
                                onClick={() => setOutletForm((f) => ({ ...f, defaultTaxRate: rate }))}
                                className={cn(
                                  "px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-colors cursor-pointer",
                                  outletForm.defaultTaxRate === rate
                                    ? "bg-primary text-primary-foreground border-primary"
                                    : "bg-muted/40 border-border/60 text-muted-foreground hover:bg-muted"
                                )}
                              >
                                {rate}%
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-end pt-3 border-t border-border/50">
                      <Button
                        type="submit"
                        disabled={saveOutletMutation.isPending}
                        id="save-outlet-btn"
                        className="h-10 px-5 text-xs font-semibold gap-1.5 shadow-xs cursor-pointer"
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

            {/* Sidebar Cards */}
            <div className="space-y-6">
              {/* Subscription Plan Card */}
              <Card className="border border-border/70 bg-card shadow-2xs hover:shadow-xs transition-shadow">
                <CardHeader className="pb-3 border-b border-border/40">
                  <CardTitle className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    <ShieldCheck className="h-4 w-4 text-primary" />
                    <span>Active Subscription License</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 pt-4 text-xs">
                  <div className="flex justify-between items-center py-1">
                    <span className="text-muted-foreground">Plan Tier:</span>
                    <Badge variant="soft" className="capitalize font-bold text-xs bg-primary/10 text-primary border border-primary/20">
                      {businessData?.business?.plan || "Enterprise"}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center py-1 border-t border-border/40">
                    <span className="text-muted-foreground">Assigned Outlets:</span>
                    <span className="font-semibold text-foreground font-mono">
                      {outlets.length} Registered
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-1 border-t border-border/40">
                    <span className="text-muted-foreground">License Status:</span>
                    <span className="font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Active
                    </span>
                  </div>
                </CardContent>
              </Card>

              {/* Outlet Switcher / Multi-Store Registry */}
              <Card className="border border-border/70 bg-card shadow-2xs hover:shadow-xs transition-shadow">
                <CardHeader className="pb-3 border-b border-border/40">
                  <CardTitle className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    <Store className="h-4 w-4 text-primary" />
                    <span>Locations in Network</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-3 divide-y divide-border/40">
                  {outlets.map((o) => (
                    <div key={o._id} className="py-2.5 flex items-center justify-between text-xs">
                      <div>
                        <p className="font-semibold text-foreground">{o.name}</p>
                        <p className="text-[11px] text-muted-foreground font-mono">ID: {o._id.slice(-6)}</p>
                      </div>
                      {o._id === outletId && (
                        <Badge variant="outline" className="text-[10px] font-bold bg-primary/5 text-primary border-primary/20">
                          Active Counter
                        </Badge>
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* Tab 2: POS Preferences */}
        {activeTab === "pos" && (
          <div className="space-y-6 max-w-3xl">
            <Card className="border border-border/70 bg-card shadow-2xs hover:shadow-xs transition-shadow">
              <CardHeader className="border-b border-border/40 pb-4">
                <CardTitle className="flex items-center gap-2 text-base font-bold text-foreground">
                  <Sliders className="h-5 w-5 text-primary" />
                  <span>Register & Checkout Preferences</span>
                </CardTitle>
                <CardDescription className="text-xs text-muted-foreground">
                  Toggle automatic tax computations, offline queuing, and receipt formatting.
                </CardDescription>
              </CardHeader>

              <CardContent className="p-0 divide-y divide-border/50">
                <div className="flex items-center justify-between p-4 sm:p-5 hover:bg-muted/10 transition-colors">
                  <div className="space-y-0.5 max-w-md">
                    <p className="text-sm font-semibold text-foreground">Enable Sales Tax Computation</p>
                    <p className="text-xs text-muted-foreground">
                      Automatically calculate GST tax breakdown and include in checkout total.
                    </p>
                  </div>
                  <Switch
                    checked={settings.taxEnabled}
                    onCheckedChange={(val) => updateSettings({ taxEnabled: val })}
                  />
                </div>

                <div className="flex items-center justify-between p-4 sm:p-5 hover:bg-muted/10 transition-colors">
                  <div className="space-y-0.5 max-w-md">
                    <p className="text-sm font-semibold text-foreground">Offline Local Queue Mode</p>
                    <p className="text-xs text-muted-foreground">
                      Allow billing transactions to be buffered locally if network connectivity drops.
                    </p>
                  </div>
                  <Switch
                    checked={settings.offlineMode}
                    onCheckedChange={(val) => updateSettings({ offlineMode: val })}
                  />
                </div>

                <div className="flex items-center justify-between p-4 sm:p-5 hover:bg-muted/10 transition-colors">
                  <div className="space-y-0.5 max-w-md">
                    <p className="text-sm font-semibold text-foreground">Detailed GST Invoice Breakdown</p>
                    <p className="text-xs text-muted-foreground">
                      Display split CGST / SGST breakdown lines on digital receipts and invoices.
                    </p>
                  </div>
                  <Switch
                    checked={settings.gstEnabled}
                    onCheckedChange={(val) => updateSettings({ gstEnabled: val })}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Tab 3: Security & Access */}
        {activeTab === "security" && (
          <div className="space-y-6 max-w-3xl">
            <SecuritySettings />
          </div>
        )}
      </div>
    </RoleGate>
  );
}
