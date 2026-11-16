import { apiFetch, getJson, getJsonWithMeta } from "@/lib/api-client";
import { Business, AuditLog, ApiResponse } from "@/lib/types";

export const adminService = {
  getDashboardStats: async (token?: string | null) => {
    return getJson<{ totalBusinesses: number; activeBusinesses: number; totalUsers: number; activeSubscriptions: number; mrrByCurrency: {currency: string, mrr: number, grossMrr: number}[]; recentBusinesses: any[] }>("/admin/stats", token);
  },
  getAuditLogs: async (token?: string | null, params?: Record<string, any>) => {
    return getJsonWithMeta<AuditLog[]>("/audit-logs", token, params);
  },
  getAdminOutlets: async (token?: string | null, params?: { search?: string; status?: string; page?: number; limit?: number }) => {
    return getJson<{ outlets: any[]; total?: number }>("/admin/outlets", token, params);
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
  getPlanRequestHistory: async (id: string, token?: string | null) => {
    return getJson<{ logs: any[] }>(`/admin/businesses/${id}/plan-history`, token);
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
  purgeUserTestData: async (userId: string, token?: string | null) => {
    return apiFetch<{
      purgedUser: { id: string; name: string; email?: string; role: string };
      totalDocumentsDeleted: number;
      deletedCounts: Record<string, number>;
    }>(`/admin/users/${userId}/purge`, { method: "DELETE", token });
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
  getAgentPerformanceStats: async (token?: string | null) => {
    return getJson<{ stats: any[] }>("/admin/agents/performance", token);
  },
  approveAgent: async (id: string, data: any, token?: string | null) => {
    return apiFetch(`/admin/agents/${id}/approve`, { method: "PUT", body: data, token });
  },
  createAgent: async (data: any, token?: string | null) => {
    return apiFetch("/admin/agents", { method: "POST", body: data, token });
  },
  getPayoutRequests: async (token?: string | null) => {
    return getJson<{ requests: any[] }>("/admin/payout-requests", token);
  },
  processPayoutRequest: async (id: string, payload: any, token?: string | null) => {
    return apiFetch(`/admin/payout-requests/${id}/process`, { method: "POST", body: payload, token });
  },
  getManualPayments: async (token?: string | null, params?: { status?: string; page?: number; limit?: number }) => {
    return getJsonWithMeta<{ payments: any[] }>("/admin/payments/manual", token, params);
  },
  verifyManualPayment: async (paymentId: string, token?: string | null) => {
    return apiFetch(`/admin/payments/manual/${paymentId}/verify`, { method: "PUT", token });
  },
  resendManualPaymentInvoice: async (paymentId: string, token?: string | null) => {
    return apiFetch(`/admin/payments/manual/${paymentId}/resend-invoice`, { method: "POST", token });
  },
  rejectManualPayment: async (paymentId: string, rejectionReason: string, notes: string, token?: string | null) => {
    return apiFetch(`/admin/payments/manual/${paymentId}/reject`, { 
      method: "PUT", 
      body: { rejectionReason, notes },
      token 
    });
  },
  getPendingPlanRequests: async (
    token?: string | null,
    params?: { search?: string; page?: number; limit?: number; status?: string }
  ) => {
    return getJsonWithMeta<{ requests: any[]; counts?: { pending: number; history: number; all: number } }>(
      "/admin/businesses/pending-plans",
      token,
      params
    );
  },
  approvePlanRequest: async (businessId: string, payload: { reason?: string; price?: number; currency?: string; billingCycle?: string } | string, token?: string | null) => {
    const body = typeof payload === "string" ? { reason: payload } : payload;
    return apiFetch(`/admin/businesses/${businessId}/approve-plan`, { method: "POST", body, token });
  },
  rejectPlanRequest(businessId: string, reason: string, token: string) {
    return apiFetch(`/admin/businesses/${businessId}/reject-plan`, { method: "POST", body: { reason }, token });
  },
  getOtpLogs(token: string, page: number = 1, limit: number = 10) {
    return apiFetch<ApiResponse<{ logs: any[], total: number }>>(`/admin/otp-logs?page=${page}&limit=${limit}`, { token });
  },
  changeUserPassword: async (userId: string, newPassword: string, token?: string | null) => {
    return apiFetch(`/admin/users/${userId}/change-password`, {
      method: "POST",
      body: { newPassword },
      token
    });
  }
};
