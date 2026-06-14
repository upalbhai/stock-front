import { getJson, getJsonWithMeta, apiFetch } from "@/lib/api-client";
import { Category } from "@/lib/types";

export const categoryService = {
  getCategories: async (token?: string | null, params?: { flat?: string; limit?: number; search?: string }) => {
    return getJson<{ categories: Category[] }>("/categories", token, params);
  },
  getCategoriesWithMeta: async (token?: string | null, params?: { flat?: string; limit?: number; page?: number; search?: string }) => {
    return getJsonWithMeta<Category[]>("/categories", token, params);
  },
  createCategory: async (data: unknown, token?: string | null) => {
    return apiFetch("/categories", { method: "POST", body: data, token });
  },
  updateCategory: async (id: string, data: unknown, token?: string | null) => {
    return apiFetch(`/categories/${id}`, { method: "PATCH", body: data, token });
  },
  deleteCategory: async (id: string, token?: string | null) => {
    return apiFetch(`/categories/${id}`, { method: "DELETE", token });
  },
};
