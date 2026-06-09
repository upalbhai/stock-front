import { getJsonWithMeta, postJson, apiFetch } from "@/lib/api-client";
import { Product } from "@/lib/types";

export const productService = {
  getProductsWithOffset: async (
    token: string,
    params: {
      outletId?: string;
      categoryId?: string;
      search?: string;
      page?: number;
      limit?: number;
    }
  ) => {
    return getJsonWithMeta<Product[]>("/products", token, params);
  },

  getProductsWithCursor: async (
    token: string,
    params: {
      outletId?: string;
      categoryId?: string;
      search?: string;
      limit?: number;
      cursor?: string;
    }
  ) => {
    return getJsonWithMeta<Product[]>("/products", token, params);
  },

  createProduct: async (token: string, data: unknown) => {
    return postJson<{ product: Product }>("/products", data, token);
  },
};
