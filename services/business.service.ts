import { getJson, apiFetch } from "@/lib/api-client";
import { Business } from "@/lib/types";

export const businessService = {
  getMyBusiness: async (token?: string | null) => {
    return getJson<{ business: Business }>("/businesses/mine", token);
  },
  updateBusiness: async (id: string, data: unknown, token?: string | null) => {
    return apiFetch(`/businesses/mine`, { method: "PATCH", body: data, token });
  },
  requestCustomPlan: async (
    data: {
      maxOutlets: number;
      maxProducts: number;
      features: string[];
      notes: string;
      currency?: string;
      billingCycle?: string;
    },
    token?: string | null
  ) => {
    return apiFetch(`/businesses/mine/request-plan`, { method: "POST", body: data, token });
  },
};
