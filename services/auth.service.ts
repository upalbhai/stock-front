import { apiFetch as apiClient } from "@/lib/api-client";
import { API_ROUTES } from "@/lib/routes";

export const authService = {
  checkEmail: async (email: string) => {
    return apiClient<{ exists: boolean, message: string }>(API_ROUTES.AUTH.SEND_OTP, { method: "POST", body: { email, type: "login" } });
  },

  verifyOtp: async (email: string, otp: string) => {
    return apiClient<{ token: string, user: any }>(API_ROUTES.AUTH.VERIFY_OTP, { method: "POST", body: { email, otp } });
  },

  loginWithPassword: async (data: any) => {
    return apiClient<any>(API_ROUTES.AUTH.LOGIN, { method: "POST", body: data });
  },

  register: async (data: any) => {
    return apiClient<any>(API_ROUTES.AUTH.REGISTER, { method: "POST", body: data });
  },

  getMe: async () => {
    return apiClient<any>(API_ROUTES.AUTH.ME, { method: "GET" });
  },

  setupPassword: async (data: any) => {
    return apiClient<{ message: string }>("/auth/setup-password", { method: "POST", body: data });
  }
};
