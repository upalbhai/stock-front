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
import { useAuth } from "@/components/auth/auth-provider";
import { getJson, apiFetch } from "@/lib/api-client";
import { getErrorMessage } from "@/lib/error";
import { formatNumber } from "@/lib/format";
import type { Plan } from "@/lib/types";

export default function AdminPlansPage() {
  const { token } = useAuth();
  const qc = useQueryClient();

  const [showPlanCrudModal, setShowPlanCrudModal] = React.useState(false);
  const [editPlanId, setEditPlanId] = React.useState<string | null>(null);
  const [planCrudForm, setPlanCrudForm] = React.useState({
    name: "", monthlyPrice: "", yearlyPrice: "", maxOutlets: "1", maxStaff: "5", maxProducts: "50", features: "", isActive: true, isPopular: false
  });

  const { data: plansData, isLoading: loadingPlans } = useQuery({
    queryKey: ["admin-plans"],
    queryFn: () => getJson<{ data: { plans: Plan[] } }>("/plans/all", token),
    enabled: Boolean(token)
  });

  const createPlanMutation = useMutation({
    mutationFn: (body: any) => apiFetch("/plans", { method: "POST", body, token }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-plans"] }); setShowPlanCrudModal(false); toast.success("Plan created successfully!"); },
    onError: (err) => toast.error(getErrorMessage(err, "Failed to create plan"))
  });

  const updatePlanMutation = useMutation({
    mutationFn: ({ id, body }: { id: string, body: any }) => apiFetch(`/plans/${id}`, { method: "PATCH", body, token }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-plans"] }); setShowPlanCrudModal(false); toast.success("Plan updated successfully!"); },
    onError: (err) => toast.error(getErrorMessage(err, "Failed to update plan"))
  });

  const deletePlanMutation = useMutation({
    mutationFn: (id: string) => apiFetch(`/plans/${id}`, { method: "DELETE", token }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-plans"] }); toast.success("Plan deleted successfully!"); },
    onError: (err) => toast.error(getErrorMessage(err, "Failed to delete plan"))
  });

  const plans = plansData?.data?.plans || [];

  const openCreatePlan = () => {
    setEditPlanId(null);
    setPlanCrudForm({ name: "", monthlyPrice: "", yearlyPrice: "", maxOutlets: "1", maxStaff: "5", maxProducts: "50", features: "", isActive: true, isPopular: false });
    setShowPlanCrudModal(true);
  };

  const openEditPlan = (p: Plan) => {
    setEditPlanId(p._id);
    setPlanCrudForm({ 
      name: p.name, 
      monthlyPrice: p.monthlyPrice.toString(), 
      yearlyPrice: p.yearlyPrice.toString(), 
      maxOutlets: p.maxOutlets.toString(), 
      maxStaff: p.maxStaff.toString(), 
      maxProducts: p.maxProducts.toString(), 
      features: p.features ? p.features.join(", ") : "", 
      isActive: p.isActive, 
      isPopular: p.isPopular || false 
    });
    setShowPlanCrudModal(true);
  };

  const handlePlanCrudSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      ...planCrudForm,
      monthlyPrice: Number(planCrudForm.monthlyPrice),
      yearlyPrice: Number(planCrudForm.yearlyPrice),
      maxOutlets: Number(planCrudForm.maxOutlets),
      maxStaff: Number(planCrudForm.maxStaff),
      maxProducts: Number(planCrudForm.maxProducts),
      features: planCrudForm.features.split(",").map(f => f.trim()).filter(Boolean)
    };
    
    if (editPlanId) {
      updatePlanMutation.mutate({ id: editPlanId, body: payload });
    } else {
      createPlanMutation.mutate(payload);
    }
  };

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="flex justify-end">
        <Button onClick={openCreatePlan} className="gap-1 bg-indigo-600 hover:bg-indigo-700 text-white">
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
            key: "name", header: "Plan Details",
            render: (p) => (
              <div>
                <p className="font-semibold text-sm flex items-center gap-2">
                  {p.name}
                  {p.isPopular && <Badge variant="warning" className="text-[9px] uppercase px-1">Popular</Badge>}
                </p>
                <p className="text-xs text-muted max-w-xs truncate">{p.description || "No description"}</p>
              </div>
            )
          },
          {
            key: "pricing", header: "Pricing",
            render: (p) => (
              <div>
                <p className="text-sm font-bold">₹{formatNumber(p.monthlyPrice)}<span className="text-[10px] font-normal text-muted">/mo</span></p>
                <p className="text-xs text-muted">₹{formatNumber(p.yearlyPrice)}/yr</p>
              </div>
            )
          },
          {
            key: "limits", header: "Limits",
            render: (p) => (
              <div className="text-[10px] text-muted">
                <p>Outlets: {p.maxOutlets}</p>
                <p>Staff: {p.maxStaff}</p>
                <p>Products: {p.maxProducts}</p>
              </div>
            )
          },
          {
            key: "status", header: "Status",
            render: (p) => (
              <Badge variant={p.isActive ? "soft" : "danger"} className="capitalize">
                {p.isActive ? "Active" : "Inactive"}
              </Badge>
            )
          },
          {
            key: "actions", header: "Actions",
            render: (p) => (
              <div className="flex gap-2">
                <Button variant="outline" size="xs" className="gap-1" onClick={() => openEditPlan(p)}>
                  <Edit3 className="h-3 w-3" /> Edit
                </Button>
                <Button variant="destructive" size="xs" className="gap-1" onClick={() => { if(confirm(`Delete plan ${p.name}?`)) deletePlanMutation.mutate(p._id); }}>
                  <Trash2 className="h-3 w-3" /> Delete
                </Button>
              </div>
            )
          }
        ]}
      />

      <Modal open={showPlanCrudModal} onClose={() => setShowPlanCrudModal(false)} title={editPlanId ? "Edit Subscription Plan" : "Create New Plan"} size="md">
        <form onSubmit={handlePlanCrudSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2"><label className="mb-1 block text-xs font-medium text-muted">Plan Name *</label><Input required value={planCrudForm.name} onChange={(e) => setPlanCrudForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Pro Plan" /></div>
            <div><label className="mb-1 block text-xs font-medium text-muted">Monthly Price (INR) *</label><Input required type="number" min="0" value={planCrudForm.monthlyPrice} onChange={(e) => setPlanCrudForm(f => ({ ...f, monthlyPrice: e.target.value }))} /></div>
            <div><label className="mb-1 block text-xs font-medium text-muted">Yearly Price (INR) *</label><Input required type="number" min="0" value={planCrudForm.yearlyPrice} onChange={(e) => setPlanCrudForm(f => ({ ...f, yearlyPrice: e.target.value }))} /></div>
            <div><label className="mb-1 block text-xs font-medium text-muted">Max Outlets *</label><Input required type="number" min="1" value={planCrudForm.maxOutlets} onChange={(e) => setPlanCrudForm(f => ({ ...f, maxOutlets: e.target.value }))} /></div>
            <div><label className="mb-1 block text-xs font-medium text-muted">Max Staff *</label><Input required type="number" min="1" value={planCrudForm.maxStaff} onChange={(e) => setPlanCrudForm(f => ({ ...f, maxStaff: e.target.value }))} /></div>
            <div><label className="mb-1 block text-xs font-medium text-muted">Max Products *</label><Input required type="number" min="1" value={planCrudForm.maxProducts} onChange={(e) => setPlanCrudForm(f => ({ ...f, maxProducts: e.target.value }))} /></div>
            <div className="col-span-2"><label className="mb-1 block text-xs font-medium text-muted">Features (Comma separated)</label><Input placeholder="Inventory, Unlimited Invoices, Reports..." value={planCrudForm.features} onChange={(e) => setPlanCrudForm(f => ({ ...f, features: e.target.value }))} /></div>
            <div><label className="mb-1 block text-xs font-medium text-muted">Is Active?</label><Select value={planCrudForm.isActive ? "true" : "false"} onValueChange={(v) => setPlanCrudForm(f => ({ ...f, isActive: v === "true" }))} options={[{ value: "true", label: "Active" }, { value: "false", label: "Inactive" }]} /></div>
            <div><label className="mb-1 block text-xs font-medium text-muted">Is Popular? (Highlights Plan)</label><Select value={planCrudForm.isPopular ? "true" : "false"} onValueChange={(v) => setPlanCrudForm(f => ({ ...f, isPopular: v === "true" }))} options={[{ value: "true", label: "Yes" }, { value: "false", label: "No" }]} /></div>
          </div>
          <div className="flex gap-3 pt-2">
            <Button variant="outline" type="button" className="flex-1" onClick={() => setShowPlanCrudModal(false)}>Cancel</Button>
            <Button type="submit" className="flex-1 bg-primary text-white" disabled={createPlanMutation.isPending || updatePlanMutation.isPending}>
              {(createPlanMutation.isPending || updatePlanMutation.isPending) ? "Saving..." : "Save Plan"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
