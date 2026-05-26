import { apiFetch as apiClient } from "@/lib/api-client";
import { API_ROUTES } from "@/lib/routes";

export const authService = {
  checkEmail: async (email: string) => {
    return apiClient.post<{ exists: boolean, message: string }>(API_ROUTES.AUTH.SEND_OTP, { email, type: "login" });
  },

  verifyOtp: async (email: string, otp: string) => {
    return apiClient.post<{ token: string, user: any }>(API_ROUTES.AUTH.VERIFY_OTP, { email, otp });
  },

  loginWithPassword: async (data: any) => {
    return apiClient.post(API_ROUTES.AUTH.LOGIN, data);
  },

  register: async (data: any) => {
    return apiClient.post(API_ROUTES.AUTH.REGISTER, data);
  },

  getMe: async () => {
    return apiClient.get(API_ROUTES.AUTH.ME);
  },

  setupPassword: async (data: any) => {
    return apiClient.post<{ message: string }>("/auth/setup-password", data);
  }
};
