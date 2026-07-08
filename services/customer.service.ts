import { getJson, apiFetchData } from "@/lib/api-client";
import { Customer } from "@/lib/types";

export const customerService = {
  getCustomers: async (token?: string | null, params?: any) => {
    return getJson<any>("/customers", token, params);
  },
  getCustomer: async (id: string, token?: string | null) => {
    return getJson<{ customer: Customer }>(`/customers/${id}`, token);
  },
  getCustomerLedger: async (id: string, token?: string | null, params?: any) => {
    return getJson<any>(`/customers/${id}/ledger`, token, params);
  },
  createCustomer: async (data: unknown, token?: string | null) => {
    return apiFetchData<{ customer: Customer }>("/customers", { method: "POST", body: data, token });
  },
  addPayment: async (id: string, data: unknown, token?: string | null) => {
    return apiFetchData<{ payment: any }>(`/customers/${id}/payments`, { method: "POST", body: data, token });
  },
};
