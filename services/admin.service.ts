import { apiFetch, getJson } from "@/lib/api-client";
import { Business, AuditLog } from "@/lib/types";

export const adminService = {
  getDashboardStats: async (token?: string | null) => {
    return getJson<{ totalBusinesses: number; activeBusinesses: number; totalUsers: number }>("/admin/stats", token);
  },
  getAuditLogs: async (token?: string | null, params?: Record<string, any>) => {
    return getJson<{ logs?: AuditLog[]; data?: AuditLog[]; total?: number; meta?: any }>("/audit-logs", token, params);
  },
  getAdminOutlets: async (token?: string | null, params?: { search?: string; status?: string }) => {
    return getJson<{ outlets: any[] }>("/admin/outlets", token, params);
  },
  getAdminBusinesses: async (token?: string | null, params?: { search?: string; status?: string }) => {
    return getJson<{ businesses: (Business & { ownerId?: { name: string; phone: string; email?: string } })[] }>("/admin/businesses", token, params);
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
};
