import { apiFetch, getJson, getJsonWithMeta, apiFetchData } from "@/lib/api-client";
import type { Unit } from "@/lib/types";

export const unitService = {
  getUnits: async (token?: string | null, params?: any) => {
    return getJson<{ units: Unit[] }>("/units", token, params);
  },
  getUnitsWithMeta: async (token?: string | null, params?: any) => {
    return getJsonWithMeta<Unit[]>("/units", token, params);
  },
  createUnit: async (data: unknown, token?: string | null) => {
    return apiFetchData<{ unit: Unit }>("/units", { method: "POST", body: data, token });
  },
  updateUnit: async (id: string, data: unknown, token?: string | null) => {
    return apiFetch(`/units/${id}`, { method: "PATCH", body: data, token });
  },
  deleteUnit: async (id: string, token?: string | null) => {
    return apiFetch(`/units/${id}`, { method: "DELETE", token });
  },
};
