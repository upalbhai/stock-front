import { apiFetch, getJson } from "@/lib/api-client";

export const userService = {
  getUsers: async (token?: string | null, params?: { search?: string; businessId?: string }) => {
    return getJson<{ users: any[] }>("/users", token, params);
  },
  createUser: async (data: unknown, token?: string | null) => {
    return apiFetch("/users", { method: "POST", body: data, token });
  },
  updateUser: async (id: string, data: unknown, token?: string | null) => {
    return apiFetch(`/users/${id}`, { method: "PATCH", body: data, token });
  },
  deleteUser: async (id: string, token?: string | null) => {
    return apiFetch(`/users/${id}`, { method: "DELETE", token });
  },
};
