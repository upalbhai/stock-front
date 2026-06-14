import { apiFetch } from "@/lib/api-client";

export const invoiceService = {
  generateInvoice: async (id: string, token?: string | null) => {
    return apiFetch(`/invoices/${id}/generate`, { method: "POST", token });
  },
};
