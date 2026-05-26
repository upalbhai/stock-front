import { getJson, postJson, apiFetch } from "@/lib/api-client";
import { ApiResponse, Product } from "@/lib/types";

export const productService = {
  // Option 1: Standard Pagination (Page & Limit)
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
    return getJson<ApiResponse<Product[]>>("/products", token, params);
  },

  // Option 2: Pro cursor-based pagination (Infinite Scroll)
  getProductsWithCursor: async (
    token: string,
    params: {
      outletId?: string;
      categoryId?: string;
      search?: string;
      limit?: number;
      cursor?: string; // e.g. the _id of the last item
    }
  ) => {
    return getJson<ApiResponse<Product[]>>("/products", token, params);
  },

  // Create a product
  createProduct: async (token: string, data: any) => {
    return postJson<ApiResponse<Product>>("/products", data, token);
  },

  // Add more as needed...
};
