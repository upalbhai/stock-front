import { apiFetch, getJson, getJsonWithMeta } from "@/lib/api-client";
import { PaginationMeta } from "@/lib/types";

export interface AgentStats {
  totalSales: number;
  wallets: { currency: string; pending: number; paid: number }[];
  commissionPercentage: number;
  activeClients: number;
  agentCode: string;
}

export interface AgentClient {
  _id: string;
  name: string;
  email?: string;
  phone?: string;
  status: string;
  subscriptionStatus: string;
  customPlanDetails?: {
    price?: number;
    currency?: string;
    maxProducts?: number;
    maxOutlets?: number;
    enabledFeatures?: string[];
  };
  createdAt: string;
}

export const agentService = {
  getStats: async (token: string) => {
    return getJson<AgentStats>("/agent/stats", token);
  },
  
  getClients: async (token: string, params?: { page?: number; limit?: number; search?: string }) => {
    return getJsonWithMeta<{ clients: AgentClient[] }>("/agent/clients", token, params);
  },
  
  createClient: async (data: any, token: string) => {
    return apiFetch("/agent/clients", { method: "POST", body: data, token });
  },

  updateCustomPlan: async (businessId: string, data: any, token: string) => {
    return apiFetch(`/agent/clients/${businessId}/custom-plan`, { method: "PUT", body: data, token });
  }
};
