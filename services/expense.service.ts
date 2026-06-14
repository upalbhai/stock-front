import { apiFetch, getJson } from "@/lib/api-client";
import type { Expense } from "@/lib/types";

export const expenseService = {
  getExpenses: async (token?: string | null, params?: any) => {
    return getJson<{ expenses: Expense[]; total: number; totalAmount: number }>("/expenses", token, params);
  },
  createExpense: async (data: unknown, token?: string | null) => {
    return apiFetch("/expenses", { method: "POST", body: data, token });
  },
  voidExpense: async (id: string, reason: string, token?: string | null) => {
    return apiFetch(`/expenses/${id}/void`, { method: "POST", body: { reason }, token });
  },
};
