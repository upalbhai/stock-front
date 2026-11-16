"use client";

import * as React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Edit3,
  Trash2,
  Plus,
  RefreshCw,
  Layers,
  Sparkles,
  CheckCircle2,
  XCircle,
  Store,
  Users,
  Package,
  Zap,
} from "lucide-react";
import { toast } from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { Select } from "@/components/ui/select";
import { DataTable } from "@/components/ui/data-table";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { FeatureMultiSelect } from "@/components/ui/feature-multi-select";
import { useAuth } from "@/components/auth/auth-provider";
import { planService } from "@/services/plan.service";
import { getErrorMessage } from "@/lib/error";
import { formatCurrency } from "@/lib/format";
import type { Plan } from "@/lib/types";
import { useQueryState, parseAsString } from "nuqs";

const EMPTY_FORM = {
  name: "",
  monthlyPrice: "",
  yearlyPrice: "",
  maxOutlets: "1",
  maxStaff: "5",
  maxProducts: "50",
  featureKeys: [] as string[],
  planType: "retail",
  isActive: true,
  isPopular: false,
};

export default function AdminPlansPage() {
  const { token, user } = useAuth();
  const qc = useQueryClient();

  const [showPlanCrudModal, setShowPlanCrudModal] = React.useState(false);
  const [planSearch, setPlanSearch] = useQueryState(
    "search",
    parseAsString.withDefault("")
  );
  const [filterType, setFilterType] = React.useState<"all" | "active" | "popular" | "inactive">("all");
  const [editPlanId, setEditPlanId] = React.useState<string | null>(null);
  const [planToDelete, setPlanToDelete] = React.useState<Plan | null>(null);
  const [planCrudForm, setPlanCrudForm] = React.useState(EMPTY_FORM);

  const {
    data: plansData,
    isLoading: loadingPlans,
    refetch,
  } = useQuery({
    queryKey: ["admin-plans"],
    queryFn: () => planService.getAllPlans(token),
    enabled: Boolean(token),
  });

  const { data: featuresData, isLoading: loadingFeatures } = useQuery({
    queryKey: ["admin-features"],
    queryFn: () => planService.getFeatures(token),
    enabled: Boolean(token),
  });

  const savePlanMutation = useMutation({
    mutationFn: (body: any) => {
      if (editPlanId) {
        return planService.updatePlan(editPlanId, body, token);
      }
      return planService.createPlan(body, token);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-plans"] });
      toast.success(
        editPlanId ? "Plan updated successfully" : "Plan created successfully"
      );
      setShowPlanCrudModal(false);
    },
    onError: (err) => toast.error(getErrorMessage(err, "Failed to save plan")),
  });

  const deletePlanMutation = useMutation({
    mutationFn: (id: string) => planService.deletePlan(id, token),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-plans"] });
      toast.success("Plan deleted successfully");
      setPlanToDelete(null);
    },
    onError: (err) => toast.error(getErrorMessage(err, "Failed to delete plan")),
  });

  const allPlans = plansData?.plans || [];
  const featureRegistry = featuresData?.features || [];

  // Filtered plans
  const filteredPlans = allPlans
    .filter((p) => {
      if (filterType === "active") return p.isActive;
      if (filterType === "popular") return p.isPopular;
      if (filterType === "inactive") return !p.isActive;
      return true;
    })
    .filter(
      (p) =>
        !planSearch.trim() ||
        p.name.toLowerCase().includes(planSearch.toLowerCase()) ||
        p.planType?.toLowerCase().includes(planSearch.toLowerCase())
    );

  // Live counts
  const totalCount = allPlans.length;
  const activeCount = allPlans.filter((p) => p.isActive).length;
  const popularCount = allPlans.filter((p) => p.isPopular).length;
  const inactiveCount = allPlans.filter((p) => !p.isActive).length;

  const openCreatePlan = () => {
    setEditPlanId(null);
    setPlanCrudForm(EMPTY_FORM);
    setShowPlanCrudModal(true);
  };

  const resolvePlanFeatureKeys = React.useCallback(
    (plan: Plan) => {
      if (plan.featureKeys?.length) return plan.featureKeys;
      if (!plan.features?.length || !featureRegistry.length) return [];
      const labelToKey = new Map(
        featureRegistry.map((f) => [f.label.toLowerCase(), f.key])
      );
      return plan.features
        .map((label) => labelToKey.get(label.toLowerCase()))
        .filter((key): key is string => Boolean(key));
    },
    [featureRegistry]
  );

  const openEditPlan = (p: Plan) => {
    setEditPlanId(p._id);
    setPlanCrudForm({
      name: p.name,
      monthlyPrice: p.monthlyPrice.toString(),
      yearlyPrice: p.yearlyPrice.toString(),
      maxOutlets: p.maxOutlets.toString(),
      maxStaff: p.maxStaff.toString(),
      maxProducts: p.maxProducts.toString(),
      featureKeys: resolvePlanFeatureKeys(p),
      planType: p.planType || "retail",
      isActive: p.isActive,
      isPopular: p.isPopular || false,
    });
    setShowPlanCrudModal(true);
  };

  const handlePlanCrudSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      name: planCrudForm.name,
      monthlyPrice: Number(planCrudForm.monthlyPrice),
      yearlyPrice: Number(planCrudForm.yearlyPrice),
      maxOutlets: Number(planCrudForm.maxOutlets),
      maxStaff: Number(planCrudForm.maxStaff),
      maxProducts: Number(planCrudForm.maxProducts),
      featureKeys: planCrudForm.featureKeys,
      planType: planCrudForm.planType,
      isActive: planCrudForm.isActive,
      isPopular: planCrudForm.isPopular,
    };

    savePlanMutation.mutate(payload);
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-300">
      {/* ── COMPACT SECTION HEADER & LIVE METRIC STRIP ───────────────────── */}
      <div className="flex flex-col gap-3 rounded-xl border border-border/80 bg-card p-3 sm:p-3.5 shadow-2xs">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-base sm:text-lg font-bold tracking-tight text-foreground sm:text-xl">
                Pricing & Subscription Plans
              </h1>
              <span className="inline-flex items-center rounded-md bg-primary/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary border border-primary/20 shrink-0">
                Tier Config
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5 hidden sm:block">
              Define SaaS pricing tiers, feature flags, outlet limits, and catalog thresholds.
            </p>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <Button
              variant="default"
              size="sm"
              onClick={openCreatePlan}
              className="h-7 sm:h-8 gap-1 sm:gap-1.5 px-2 sm:px-3 text-xs font-semibold cursor-pointer shadow-2xs"
            >
              <Plus className="h-3.5 w-3.5" />
              <span><span className="hidden sm:inline">Add New </span>Plan</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              className="h-7 sm:h-8 gap-1 px-2 sm:px-2.5 text-xs cursor-pointer shadow-2xs hover:bg-accent"
            >
              <RefreshCw
                className={`h-3 w-3 ${loadingPlans ? "animate-spin text-primary" : "text-muted-foreground"}`}
              />
              <span className="hidden sm:inline">Refresh</span>
            </Button>
          </div>
        </div>

        {/* ── COMPACT METRIC FILTER CHIPS (SLIM, ONLY 34px TALL) ─────────── */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar scroll-smooth border-t border-border/60 pt-2.5 -mx-3 px-3 sm:mx-0 sm:px-0 sm:flex-wrap">
          {/* All Plans */}
          <button
            type="button"
            onClick={() => setFilterType("all")}
            className={`inline-flex shrink-0 items-center gap-2 rounded-lg border px-3 py-1.5 text-xs transition-all cursor-pointer ${
              filterType === "all"
                ? "border-primary bg-primary/10 text-primary font-semibold shadow-2xs"
                : "border-border/80 bg-background text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            <Layers className="h-3.5 w-3.5" />
            <span>All Plans</span>
            <span
              className={`ml-1 rounded-full px-1.5 py-0.2 text-[10px] font-mono ${
                filterType === "all"
                  ? "bg-primary text-primary-foreground font-bold"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {totalCount}
            </span>
          </button>

          {/* Active Tiers */}
          <button
            type="button"
            onClick={() => setFilterType("active")}
            className={`inline-flex shrink-0 items-center gap-2 rounded-lg border px-3 py-1.5 text-xs transition-all cursor-pointer ${
              filterType === "active"
                ? "border-emerald-500 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold shadow-2xs"
                : "border-border/80 bg-background text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
            <span>Active Tiers</span>
            <span
              className={`ml-1 rounded-full px-1.5 py-0.2 text-[10px] font-mono ${
                filterType === "active"
                  ? "bg-emerald-500 text-white font-bold"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {activeCount}
            </span>
          </button>

          {/* Popular */}
          <button
            type="button"
            onClick={() => setFilterType("popular")}
            className={`inline-flex shrink-0 items-center gap-2 rounded-lg border px-3 py-1.5 text-xs transition-all cursor-pointer ${
              filterType === "popular"
                ? "border-amber-500 bg-amber-500/10 text-amber-600 dark:text-amber-400 font-semibold shadow-2xs"
                : "border-border/80 bg-background text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            <Sparkles className="h-3.5 w-3.5 text-amber-500" />
            <span>Popular Flagged</span>
            <span
              className={`ml-1 rounded-full px-1.5 py-0.2 text-[10px] font-mono ${
                filterType === "popular"
                  ? "bg-amber-500 text-white font-bold"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {popularCount}
            </span>
          </button>

          {/* Inactive / Draft */}
          <button
            type="button"
            onClick={() => setFilterType("inactive")}
            className={`inline-flex shrink-0 items-center gap-2 rounded-lg border px-3 py-1.5 text-xs transition-all cursor-pointer ${
              filterType === "inactive"
                ? "border-destructive bg-destructive/10 text-destructive font-semibold shadow-2xs"
                : "border-border/80 bg-background text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            <XCircle className="h-3.5 w-3.5 text-destructive" />
            <span>Inactive / Drafts</span>
            <span
              className={`ml-1 rounded-full px-1.5 py-0.2 text-[10px] font-mono ${
                filterType === "inactive"
                  ? "bg-destructive text-destructive-foreground font-bold"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {inactiveCount}
            </span>
          </button>
        </div>
      </div>

      {/* ── DATA TABLE ─────────────────────────────────────────────────── */}
      <DataTable
        isLoading={loadingPlans}
        data={filteredPlans}
        keyExtractor={(p) => p._id}
        searchQuery={planSearch}
        onSearchChange={setPlanSearch}
        onRefetch={() => refetch()}
        placeholderText="Search plans..."
        emptyStateText="No pricing plans match your criteria."
        emptyStateIcon="📦"
        columns={[
          {
            key: "name",
            header: "Plan Details",
            render: (p) => (
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary ring-1 ring-primary/20">
                  <Zap className="h-4 w-4" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-semibold text-foreground text-xs">{p.name}</span>
                    {p.isPopular && (
                      <span className="inline-flex items-center rounded-full bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.2 text-[9px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wide">
                        Popular
                      </span>
                    )}
                    <span className="inline-flex items-center rounded-full bg-muted px-1.5 py-0.2 text-[10px] font-medium text-muted-foreground capitalize">
                      {p.planType || "Retail"}
                    </span>
                  </div>
                  <p className="max-w-xs truncate text-[11px] text-muted-foreground mt-0.5">
                    {p.description || "Production tier package"}
                  </p>
                </div>
              </div>
            ),
          },
          {
            key: "pricing",
            header: "Pricing Structure",
            render: (p) => (
              <div>
                <div className="text-xs font-bold text-foreground">
                  {formatCurrency(p.monthlyPrice, user?.currency || "INR")}
                  <span className="text-[10px] font-normal text-muted-foreground"> / month</span>
                </div>
                <div className="text-[11px] text-muted-foreground">
                  {formatCurrency(p.yearlyPrice, user?.currency || "INR")} / year
                </div>
              </div>
            ),
          },
          {
            key: "limits",
            header: "Resource Limits",
            render: (p) => (
              <div className="space-y-1 text-xs">
                <div className="flex items-center gap-1.5 text-foreground font-medium">
                  <Store className="h-3 w-3 text-muted-foreground" />
                  <span>{p.maxOutlets} {p.maxOutlets === 1 ? "Outlet" : "Outlets"}</span>
                </div>
                <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                  <Users className="h-3 w-3" />
                  <span>Max {p.maxStaff} Staff</span>
                  <span>•</span>
                  <Package className="h-3 w-3" />
                  <span>{p.maxProducts} SKUs</span>
                </div>
              </div>
            ),
          },
          {
            key: "features",
            header: "Included Features",
            render: (p) => {
              const keys = p.featureKeys?.length ? p.featureKeys : [];
              return (
                <div className="flex max-w-[220px] flex-wrap gap-1">
                  {keys.slice(0, 3).map((key) => {
                    const label =
                      featureRegistry.find((f) => f.key === key)?.label || key;
                    return (
                      <span
                        key={key}
                        className="inline-flex items-center rounded-md bg-muted px-1.5 py-0.5 text-[10px] font-medium text-foreground border border-border/60"
                      >
                        {label}
                      </span>
                    );
                  })}
                  {keys.length > 3 && (
                    <span className="inline-flex items-center rounded-md bg-primary/10 px-1.5 py-0.5 text-[10px] font-bold text-primary border border-primary/20">
                      +{keys.length - 3} more
                    </span>
                  )}
                </div>
              );
            },
          },
          {
            key: "status",
            header: "Status",
            render: (p) => (
              <div className="inline-flex items-center gap-1.5">
                <span
                  className={`h-2 w-2 rounded-full ${
                    p.isActive ? "bg-emerald-500" : "bg-destructive"
                  }`}
                />
                <Badge
                  variant={p.isActive ? "soft" : "danger"}
                  className="capitalize text-[11px] font-medium"
                >
                  {p.isActive ? "Active" : "Inactive"}
                </Badge>
              </div>
            ),
          },
          {
            key: "actions",
            header: "Actions",
            render: (p) => (
              <div className="flex items-center justify-end gap-1.5 pr-2">
                <Button
                  variant="outline"
                  size="xs"
                  className="gap-1 text-xs cursor-pointer shadow-2xs hover:bg-accent"
                  onClick={() => openEditPlan(p)}
                >
                  <Edit3 className="h-3 w-3" /> Edit
                </Button>
                <Button
                  variant="outline"
                  size="xs"
                  className="gap-1 text-destructive hover:bg-destructive/10 border-destructive/30 cursor-pointer shadow-2xs"
                  onClick={() => setPlanToDelete(p)}
                >
                  <Trash2 className="h-3 w-3" /> Delete
                </Button>
              </div>
            ),
          },
        ]}
      />

      {/* ── CREATE / EDIT PLAN MODAL ────────────────────────────────────── */}
      <Modal
        open={showPlanCrudModal}
        onClose={() => setShowPlanCrudModal(false)}
        title={editPlanId ? "Edit Subscription Plan" : "Create New Subscription Plan"}
        size="xl"
      >
        <form onSubmit={handlePlanCrudSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="mb-1 block text-xs font-semibold text-foreground">
                Plan Name *
              </label>
              <Input
                required
                value={planCrudForm.name}
                onChange={(e) =>
                  setPlanCrudForm((f) => ({ ...f, name: e.target.value }))
                }
                placeholder="e.g. Starter POS or Enterprise Growth"
                className="text-xs h-9"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-foreground">
                Monthly Price (INR) *
              </label>
              <Input
                required
                type="number"
                min="0"
                value={planCrudForm.monthlyPrice}
                onChange={(e) =>
                  setPlanCrudForm((f) => ({ ...f, monthlyPrice: e.target.value }))
                }
                className="text-xs h-9 font-mono"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-foreground">
                Yearly Price (INR) *
              </label>
              <Input
                required
                type="number"
                min="0"
                value={planCrudForm.yearlyPrice}
                onChange={(e) =>
                  setPlanCrudForm((f) => ({ ...f, yearlyPrice: e.target.value }))
                }
                className="text-xs h-9 font-mono"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-foreground">
                Max Store Outlets *
              </label>
              <Input
                required
                type="number"
                min="1"
                value={planCrudForm.maxOutlets}
                onChange={(e) =>
                  setPlanCrudForm((f) => ({ ...f, maxOutlets: e.target.value }))
                }
                className="text-xs h-9"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-foreground">
                Max Staff Accounts *
              </label>
              <Input
                required
                type="number"
                min="1"
                value={planCrudForm.maxStaff}
                onChange={(e) =>
                  setPlanCrudForm((f) => ({ ...f, maxStaff: e.target.value }))
                }
                className="text-xs h-9"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-foreground">
                Max Products (SKUs) *
              </label>
              <Input
                required
                type="number"
                min="1"
                value={planCrudForm.maxProducts}
                onChange={(e) =>
                  setPlanCrudForm((f) => ({ ...f, maxProducts: e.target.value }))
                }
                className="text-xs h-9"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-foreground">
                Plan Type
              </label>
              <Select
                value={planCrudForm.planType}
                onValueChange={(v) =>
                  setPlanCrudForm((f) => ({ ...f, planType: v }))
                }
                options={[
                  { value: "retail", label: "Retail POS" },
                  { value: "wholesale", label: "Wholesale & B2B" },
                  { value: "hybrid", label: "Hybrid Retail + Wholesale" },
                ]}
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-foreground">
                Status
              </label>
              <Select
                value={planCrudForm.isActive ? "true" : "false"}
                onValueChange={(v) =>
                  setPlanCrudForm((f) => ({ ...f, isActive: v === "true" }))
                }
                options={[
                  { value: "true", label: "Active (Available for purchase)" },
                  { value: "false", label: "Inactive (Archived)" },
                ]}
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-foreground">
                Highlight as Popular?
              </label>
              <Select
                value={planCrudForm.isPopular ? "true" : "false"}
                onValueChange={(v) =>
                  setPlanCrudForm((f) => ({ ...f, isPopular: v === "true" }))
                }
                options={[
                  { value: "true", label: "Yes (Display Featured badge)" },
                  { value: "false", label: "No" },
                ]}
              />
            </div>

            <div className="col-span-2">
              <label className="mb-1.5 block text-xs font-semibold text-foreground">
                Allowed Feature Modules *
              </label>
              {loadingFeatures ? (
                <p className="text-xs text-muted-foreground">Loading feature registry...</p>
              ) : (
                <FeatureMultiSelect
                  features={featureRegistry}
                  value={planCrudForm.featureKeys}
                  onChange={(featureKeys) =>
                    setPlanCrudForm((f) => ({ ...f, featureKeys }))
                  }
                />
              )}
              <p className="mt-1.5 text-[11px] text-muted-foreground">
                These features are automatically unlocked when a business subscribes to this plan.
              </p>
            </div>
          </div>

          <div className="flex gap-2.5 pt-3 border-t border-border/80">
            <Button
              variant="outline"
              type="button"
              className="flex-1 cursor-pointer text-xs h-9"
              onClick={() => setShowPlanCrudModal(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1 cursor-pointer text-xs h-9 font-semibold shadow-2xs"
              disabled={
                savePlanMutation.isPending ||
                planCrudForm.featureKeys.length === 0
              }
            >
              {savePlanMutation.isPending ? "Saving Plan..." : editPlanId ? "Update Plan" : "Create Plan"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* ── DELETE CONFIRMATION DIALOG ──────────────────────────────────── */}
      <ConfirmDialog
        open={Boolean(planToDelete)}
        onClose={() => setPlanToDelete(null)}
        title="Delete Subscription Plan"
        message={`Are you sure you want to delete the plan "${planToDelete?.name}"? Businesses currently subscribed will remain on their current period, but new subscriptions to this plan will be prevented.`}
        confirmLabel="Delete Plan"
        loading={deletePlanMutation.isPending}
        variant="danger"
        onConfirm={() => {
          if (planToDelete) {
            deletePlanMutation.mutate(planToDelete._id);
          }
        }}
      />
    </div>
  );
}
