import { apiFetch, getJson, getJsonWithMeta } from "@/lib/api-client";
import { PaginationMeta } from "@/lib/types";

export interface AgentStats {
  totalSales?: number;
  wallets: { currency: string; totalSales?: number; pending: number; paid: number }[];
  commissionPercentage: number;
  activeClients: number;
  agentCode: string;
  pendingRequests?: any[];
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
  pendingCustomPlan?: {
    price?: number;
    currency?: string;
    billingCycle?: string;
    maxProducts?: number;
    maxOutlets?: number;
    enabledFeatures?: string[];
    notes?: string;
    requestedAt?: string;
    requestedBy?: { _id: string; name: string; email?: string } | string;
  };
  lastPlanRequestStatus?: {
    status: "approved" | "rejected";
    reason?: string;
    date?: string;
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
  },

  requestPayout: async (data: { currency: string; amount: number }, token: string) => {
    return apiFetch("/agent/payout-requests", { method: "POST", body: data, token });
  },

  getPlanRequestHistory: async (businessId: string, token: string) => {
    return getJson<{ logs: any[] }>(`/agent/clients/${businessId}/plan-history`, token);
  },

  getWalletHistory: async (token: string, currency?: string) => {
    const params = currency ? { currency } : undefined;
    return getJson<{ transactions: any[] }>("/agent/wallet/history", token, params);
  }
};
