import { apiFetch, getJson } from "@/lib/api-client";
import { Business, AuditLog } from "@/lib/types";

export const adminService = {
  getDashboardStats: async (token?: string | null) => {
    return getJson<{ totalBusinesses: number; activeBusinesses: number; totalUsers: number; activeSubscriptions: number; mrr: number; recentBusinesses: any[] }>("/admin/stats", token);
  },
  getAuditLogs: async (token?: string | null, params?: Record<string, any>) => {
    return getJson<{ logs?: AuditLog[]; data?: AuditLog[]; total?: number; meta?: any }>("/audit-logs", token, params);
  },
  getAdminOutlets: async (token?: string | null, params?: { search?: string; status?: string }) => {
    return getJson<{ outlets: any[] }>("/admin/outlets", token, params);
  },
  getAdminBusinesses: async (token?: string | null, params?: { search?: string; status?: string; page?: number; limit?: number }) => {
    return getJson<{ businesses: (Business & { ownerId?: { name: string; phone: string; email?: string } })[], total: number }>("/admin/businesses", token, params);
  },
  getAllSubscriptions: async (token?: string | null, params?: { search?: string; status?: string; page?: number; limit?: number }) => {
    return getJson<{ subscriptions: any[], total: number }>("/admin/subscriptions", token, params);
  },
  approveOutlet: async (id: string, token?: string | null) => {
    return apiFetch(`/admin/outlets/${id}/approve`, { method: "PATCH", token });
  },
  updateOutletStatus: async (id: string, status: string, token?: string | null) => {
    return apiFetch(`/admin/outlets/${id}/status`, { method: "PATCH", body: { status }, token });
  },
  approveBusiness: async (id: string, token?: string | null) => {
    return apiFetch(`/admin/businesses/${id}/approve`, { method: "PATCH", token });
  },
  updateBusinessStatus: async (id: string, status: string, token?: string | null) => {
    return apiFetch(`/admin/businesses/${id}/status`, { method: "PATCH", body: { status }, token });
  },
  updateBusinessPlan: async (id: string, data: unknown, token?: string | null) => {
    return apiFetch(`/admin/businesses/${id}/plan`, { method: "PATCH", body: data, token });
  },
  manualSubscription: async (data: unknown, token?: string | null) => {
    return apiFetch("/admin/subscriptions/manual", { method: "POST", body: data, token });
  },
  cancelSubscription: async (businessId: string, token?: string | null) => {
    return apiFetch("/admin/subscriptions/cancel", { method: "POST", body: { businessId }, token });
  },
  getSubscriptionEmailPreview: async (businessId: string, token?: string | null) => {
    return getJson<{ html: string; subscriptionId: string }>(`/admin/businesses/${businessId}/preview-email`, token);
  },
  sendSubscriptionEmail: async (businessId: string, token?: string | null) => {
    return apiFetch(`/admin/businesses/${businessId}/send-email`, { method: "POST", token });
  },
  createSystemAdmin: async (data: unknown, token?: string | null) => {
    return apiFetch("/admin/system-users", { method: "POST", body: data, token });
  },
  getSettings: async (token?: string | null) => {
    return getJson<{ settings: any }>("/admin/settings", token);
  },
  updateSettings: async (data: unknown, token?: string | null) => {
    return apiFetch("/admin/settings", { method: "PUT", body: data, token });
  },
  getAgents: async (token?: string | null) => {
    return getJson<{ agents: any[] }>("/admin/agents", token);
  },
  approveAgent: async (id: string, data: any, token?: string | null) => {
    return apiFetch(`/admin/agents/${id}/approve`, { method: "PUT", body: data, token });
  },
  createAgent: async (data: any, token?: string | null) => {
    return apiFetch("/admin/agents", { method: "POST", body: data, token });
  },
  getManualPayments: async (token?: string | null, status?: string) => {
    return getJson<{ payments: any[] }>(`/admin/payments/manual${status ? `?status=${status}` : ""}`, token);
  },
  verifyManualPayment: async (paymentId: string, token?: string | null) => {
    return apiFetch(`/admin/payments/manual/${paymentId}/verify`, { method: "PUT", token });
  },
};
