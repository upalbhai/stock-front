import { apiFetch, getJson } from "@/lib/api-client";
import type { Order } from "@/lib/types";

export const orderService = {
  getOrders: async (token?: string | null, params?: any) => {
    return getJson<{ orders: Order[]; total: number; payments?: { payment_type: string; amount: number }[] }>("/orders", token, params);
  },
  createOrder: async (data: unknown, token?: string | null) => {
    return apiFetch("/orders", { method: "POST", body: data, token });
  },
  voidOrder: async (id: string, reason: string, token?: string | null) => {
    return apiFetch(`/orders/${id}/void`, { method: "POST", body: { reason }, token });
  },
  getOrder: async (id: string, token?: string | null) => {
    return getJson<{ order: Order }>(`/orders/${id}`, token);
  }
};
