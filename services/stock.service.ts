import { apiFetch } from "@/lib/api-client";

export const stockService = {
  adjustStock: async (data: unknown, token?: string | null) => {
    return apiFetch("/stock/adjust", { method: "POST", body: data, token });
  },
  createTransfer: async (data: unknown, token?: string | null) => {
    return apiFetch("/stock/transfers", { method: "POST", body: data, token });
  },
  approveTransfer: async (id: string, token?: string | null) => {
    return apiFetch(`/stock/transfers/${id}/approve`, { method: "POST", token });
  },
};
