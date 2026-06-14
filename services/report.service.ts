import { getJson, getJsonWithMeta, apiFetch } from "@/lib/api-client";
import type { Product } from "@/lib/types";

export const reportService = {
  getProfitLedger: async (token?: string | null, params?: any) => {
    return getJson<any>("/reports/profit-ledger", token, params);
  },
  getDashboardStats: async (token?: string | null, params?: any) => {
    return getJson<any>("/reports/dashboard", token, params);
  },
};
