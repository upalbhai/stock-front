import { apiFetch, getJson } from "@/lib/api-client";
import { Plan } from "@/lib/types";

export const planService = {
  getAllPlans: async (token?: string | null) => {
    return getJson<{ plans: Plan[] }>("/plans/all", token);
  },
  getFeatures: async (token?: string | null) => {
    return getJson<{ features: any[] }>("/features", token);
  },
  createPlan: async (data: unknown, token?: string | null) => {
    return apiFetch("/plans", { method: "POST", body: data, token });
  },
  updatePlan: async (id: string, data: unknown, token?: string | null) => {
    return apiFetch(`/plans/${id}`, { method: "PATCH", body: data, token });
  },
  deletePlan: async (id: string, token?: string | null) => {
    return apiFetch(`/plans/${id}`, { method: "DELETE", token });
  },
};
