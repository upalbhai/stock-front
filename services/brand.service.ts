import { apiFetchData, getJson, getJsonWithMeta } from "@/lib/api-client";
import type { Brand } from "@/lib/types";

export const brandService = {
  getBrandsWithMeta: async (
    token: string | null,
    params?: { search?: string; page?: number; limit?: number; includeInactive?: boolean }
  ) => {
    return getJsonWithMeta<Brand[]>("/brands", token, params);
  },

  getBrand: async (id: string, token: string | null) => {
    return getJson<{ brand: Brand }>(`/brands/${id}`, token);
  },

  createBrand: async (data: Partial<Brand>, token: string) => {
    return apiFetchData<{ brand: Brand }>("/brands", {
      method: "POST",
      token,
      body: data
    });
  },

  updateBrand: async (id: string, data: Partial<Brand>, token: string | null) => {
    return apiFetchData<{ brand: Brand }>(`/brands/${id}`, {
      method: "PUT",
      token,
      body: data
    });
  },

  deleteBrand: async (id: string, token: string | null) => {
    return apiFetchData<null>(`/brands/${id}`, {
      method: "DELETE",
      token
    });
  }
};
