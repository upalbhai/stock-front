import { apiFetch, getJson } from "@/lib/api-client";
import type { Role } from "@/lib/types";

export const roleService = {
  getRoles: async (token?: string | null, params?: any) => {
    return getJson<{ roles: Role[] }>("/roles", token, params);
  },
  createRole: async (data: unknown, token?: string | null) => {
    return apiFetch("/roles", { method: "POST", body: data, token });
  },
  updateRole: async (id: string, data: unknown, token?: string | null) => {
    return apiFetch(`/roles/${id}`, { method: "PATCH", body: data, token });
  },
  deleteRole: async (id: string, token?: string | null) => {
    return apiFetch(`/roles/${id}`, { method: "DELETE", token });
  },
};
