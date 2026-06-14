import { getJson, apiFetch } from "@/lib/api-client";
import { Outlet } from "@/lib/types";

export const outletService = {
  getOutlets: async (token?: string | null) => {
    return getJson<{ outlets: Outlet[] }>("/outlets", token);
  },
  getOutlet: async (id: string, token?: string | null) => {
    return getJson<{ outlet: Outlet }>(`/outlets/${id}`, token);
  },
  createOutlet: async (data: unknown, token?: string | null) => {
    return apiFetch("/outlets", { method: "POST", body: data, token });
  },
  updateOutlet: async (id: string, data: unknown, token?: string | null) => {
    return apiFetch(`/outlets/${id}`, { method: "PATCH", body: data, token });
  },
  deleteOutlet: async (id: string, token?: string | null) => {
    return apiFetch(`/outlets/${id}`, { method: "DELETE", token });
  },
};
