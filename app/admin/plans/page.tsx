"use client";

import * as React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Edit3, Trash2, Plus } from "lucide-react";
import { toast } from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { Select } from "@/components/ui/select";
import { DataTable } from "@/components/ui/data-table";
import { FeatureMultiSelect, type FeatureRegistryItem } from "@/components/ui/feature-multi-select";
import { useAuth } from "@/components/auth/auth-provider";
import { planService } from "@/services/plan.service";
import { getErrorMessage } from "@/lib/error";
import { formatNumber } from "@/lib/format";
import type { Plan } from "@/lib/types";

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
  const { token } = useAuth();
  const qc = useQueryClient();

  const [showPlanCrudModal, setShowPlanCrudModal] = React.useState(false);
  const [editPlanId, setEditPlanId] = React.useState<string | null>(null);
  const [planCrudForm, setPlanCrudForm] = React.useState(EMPTY_FORM);

  const { data: plansData, isLoading: loadingPlans } = useQuery({
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
      toast.success(editPlanId ? "Plan updated successfully!" : "Plan created successfully!");
      setShowPlanCrudModal(false);
    },
    onError: (err) => toast.error(getErrorMessage(err, "Failed to save plan")),
  });

  const deletePlanMutation = useMutation({
    mutationFn: (id: string) => planService.deletePlan(id, token),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-plans"] });
      toast.success("Plan deleted successfully!");
    },
    onError: (err) => toast.error(getErrorMessage(err, "Failed to delete plan")),
  });

  const plans = plansData?.plans || [];
  const featureRegistry = featuresData?.features || [];

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
    <div className="animate-in fade-in slide-in-from-bottom-2 space-y-4 duration-300">
      <div className="flex justify-end">
        <Button onClick={openCreatePlan} className="gap-1">
          <Plus className="h-4 w-4" /> Add New Plan
        </Button>
      </div>

      <DataTable
        loading={loadingPlans}
        data={plans}
        keyExtractor={(p) => p._id}
        emptyMessage="No plans configured."
        columns={[
          {
            key: "name",
            header: "Plan Details",
            render: (p) => (
              <div>
                <p className="flex items-center gap-2 text-sm font-semibold">
                  {p.name}
                  {p.isPopular && (
                    <Badge variant="warning" className="px-1 text-[9px] uppercase">
                      Popular
                    </Badge>
                  )}
                </p>
                <p className="max-w-xs truncate text-xs text-muted-foreground">
                  {p.description || "No description"}
                </p>
              </div>
            ),
          },
          {
            key: "pricing",
            header: "Pricing",
            render: (p) => (
              <div>
                <p className="text-sm font-bold">
                  ₹{formatNumber(p.monthlyPrice)}
                  <span className="text-[10px] font-normal text-muted-foreground">/mo</span>
                </p>
                <p className="text-xs text-muted-foreground">₹{formatNumber(p.yearlyPrice)}/yr</p>
              </div>
            ),
          },
          {
            key: "limits",
            header: "Limits",
            render: (p) => (
              <div className="text-[10px] text-muted-foreground">
                <p>Outlets: {p.maxOutlets}</p>
                <p>Staff: {p.maxStaff}</p>
                <p>Products: {p.maxProducts}</p>
              </div>
            ),
          },
          {
            key: "features",
            header: "Features",
            render: (p) => (
              <div className="flex max-w-[200px] flex-wrap gap-1">
                {(p.featureKeys?.length ? p.featureKeys : []).slice(0, 4).map((key) => {
                  const label =
                    featureRegistry.find((f) => f.key === key)?.label || key;
                  return (
                    <Badge key={key} variant="soft" className="text-[9px]">
                      {label}
                    </Badge>
                  );
                })}
                {(p.featureKeys?.length || 0) > 4 && (
                  <Badge variant="secondary" className="text-[9px]">
                    +{(p.featureKeys?.length || 0) - 4}
                  </Badge>
                )}
              </div>
            ),
          },
          {
            key: "status",
            header: "Status",
            render: (p) => (
              <Badge variant={p.isActive ? "soft" : "danger"} className="capitalize">
                {p.isActive ? "Active" : "Inactive"}
              </Badge>
            ),
          },
          {
            key: "actions",
            header: "Actions",
            render: (p) => (
              <div className="flex gap-2">
                <Button variant="outline" size="xs" className="gap-1" onClick={() => openEditPlan(p)}>
                  <Edit3 className="h-3 w-3" /> Edit
                </Button>
                <Button
                  variant="destructive"
                  size="xs"
                  className="gap-1"
                  onClick={() => {
                    if (confirm(`Delete plan ${p.name}?`)) deletePlanMutation.mutate(p._id);
                  }}
                >
                  <Trash2 className="h-3 w-3" /> Delete
                </Button>
              </div>
            ),
          },
        ]}
      />

      <Modal
        open={showPlanCrudModal}
        onClose={() => setShowPlanCrudModal(false)}
        title={editPlanId ? "Edit Subscription Plan" : "Create New Plan"}
        size="xl"
      >
        <form onSubmit={handlePlanCrudSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="mb-1 block text-xs font-medium text-muted-foreground">
                Plan Name *
              </label>
              <Input
                required
                value={planCrudForm.name}
                onChange={(e) => setPlanCrudForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="e.g. Pro Plan"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">
                Monthly Price (INR) *
              </label>
              <Input
                required
                type="number"
                min="0"
                value={planCrudForm.monthlyPrice}
                onChange={(e) => setPlanCrudForm((f) => ({ ...f, monthlyPrice: e.target.value }))}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">
                Yearly Price (INR) *
              </label>
              <Input
                required
                type="number"
                min="0"
                value={planCrudForm.yearlyPrice}
                onChange={(e) => setPlanCrudForm((f) => ({ ...f, yearlyPrice: e.target.value }))}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">
                Max Outlets *
              </label>
              <Input
                required
                type="number"
                min="1"
                value={planCrudForm.maxOutlets}
                onChange={(e) => setPlanCrudForm((f) => ({ ...f, maxOutlets: e.target.value }))}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">
                Max Staff *
              </label>
              <Input
                required
                type="number"
                min="1"
                value={planCrudForm.maxStaff}
                onChange={(e) => setPlanCrudForm((f) => ({ ...f, maxStaff: e.target.value }))}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">
                Max Products *
              </label>
              <Input
                required
                type="number"
                min="1"
                value={planCrudForm.maxProducts}
                onChange={(e) => setPlanCrudForm((f) => ({ ...f, maxProducts: e.target.value }))}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">
                Plan Type
              </label>
              <Select
                value={planCrudForm.planType}
                onValueChange={(v) => setPlanCrudForm((f) => ({ ...f, planType: v }))}
                options={[
                  { value: "retail", label: "Retail" },
                  { value: "wholesale", label: "Wholesale" },
                  { value: "hybrid", label: "Hybrid" },
                ]}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">
                Is Active?
              </label>
              <Select
                value={planCrudForm.isActive ? "true" : "false"}
                onValueChange={(v) => setPlanCrudForm((f) => ({ ...f, isActive: v === "true" }))}
                options={[
                  { value: "true", label: "Active" },
                  { value: "false", label: "Inactive" },
                ]}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">
                Is Popular?
              </label>
              <Select
                value={planCrudForm.isPopular ? "true" : "false"}
                onValueChange={(v) => setPlanCrudForm((f) => ({ ...f, isPopular: v === "true" }))}
                options={[
                  { value: "true", label: "Yes" },
                  { value: "false", label: "No" },
                ]}
              />
            </div>
            <div className="col-span-2">
              <label className="mb-2 block text-xs font-medium text-muted-foreground">
                Plan Features *
              </label>
              {loadingFeatures ? (
                <p className="text-sm text-muted-foreground">Loading features...</p>
              ) : (
                <FeatureMultiSelect
                  features={featureRegistry}
                  value={planCrudForm.featureKeys}
                  onChange={(featureKeys) => setPlanCrudForm((f) => ({ ...f, featureKeys }))}
                />
              )}
              <p className="mt-2 text-[11px] text-muted-foreground">
                Selected features are enforced for businesses on this plan after purchase or manual
                subscription.
              </p>
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <Button
              variant="outline"
              type="button"
              className="flex-1"
              onClick={() => setShowPlanCrudModal(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1"
              disabled={
                savePlanMutation.isPending ||
                planCrudForm.featureKeys.length === 0
              }
            >
              {savePlanMutation.isPending
                ? "Saving..."
                : "Save Plan"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
