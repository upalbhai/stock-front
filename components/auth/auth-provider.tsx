"use client";

import * as React from "react";
import { useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api-client";
import { flushOfflineQueue } from "@/lib/offline-queue";
import type { AuthUser, UserRole, ApiResponse } from "@/lib/types";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { setAuth, setOutlet as setOutletAction, clearAuth } from "@/store/authSlice";
import { APP_ROUTES } from "@/lib/routes";

export type { AuthUser, UserRole } from "@/lib/types";

type AuthResponse = { token: string; user: AuthUser };
type RegisterPayload = { name: string; email: string; password?: string; phone?: string; businessName?: string; outletName?: string; outletId?: string };
type EmailLoginPayload = { email: string; password?: string };

type AuthContextValue = {
  user: AuthUser | null;
  token: string | null;
  outletId: string | null;
  businessId: string | null;
  isLoading: boolean;
  impersonating: boolean;
  loginWithEmail: (payload: EmailLoginPayload) => Promise<AuthResponse>;
  checkEmail: (email: string) => Promise<{ method: "password" | "otp"; message?: string }>;
  register: (payload: RegisterPayload) => Promise<AuthResponse | { message?: string }>;
  sendOtp: (email: string) => Promise<void>;
  verifyOtp: (payload: { email: string; code: string }) => Promise<AuthResponse | { message: string }>;
  forgotPassword: (email: string) => Promise<{ message: string }>;
  resetPassword: (payload: { email: string; code: string; newPassword: string }) => Promise<{ message: string }>;
  logout: () => void;
  setOutletId: (outletId: string | null) => void;
  impersonate: (targetUserId: string) => Promise<void>;
  exitImpersonation?: () => Promise<void>;
  isTrialExpired: boolean;
};

const AuthContext = React.createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();
  const dispatch = useAppDispatch();
  const { user, token, outletId, businessId, impersonating } = useAppSelector((state) => state.auth);
  // Redux persist handles rehydration, but to avoid hydration mismatch, track if we're mounted/rehydrated if necessary.
  const [isMounted, setIsMounted] = React.useState(false);

  React.useEffect(() => {
    setIsMounted(true);
  }, []);

  React.useEffect(() => {
    if (!token) return;
    const handleOnline = () => { flushOfflineQueue(token).catch(() => {}); };
    window.addEventListener("online", handleOnline);
    if (typeof navigator !== "undefined" && navigator.onLine) {
      flushOfflineQueue(token).catch(() => {});
    }
    return () => window.removeEventListener("online", handleOnline);
  }, [token]);

  const setOutletId = React.useCallback((selected: string | null) => {
    dispatch(setOutletAction(selected));
  }, [dispatch]);

  const setAuthState = React.useCallback((data: AuthResponse) => {
    dispatch(setAuth({ user: data.user, token: data.token }));
  }, [dispatch]);

  const loginWithEmail = React.useCallback(async (payload: EmailLoginPayload) => {
    const response = await apiFetch<ApiResponse<AuthResponse>>("/auth/login", { method: "POST", body: payload });
    setAuthState(response.data);
    return response.data;
  }, [setAuthState]);

  const checkEmail = React.useCallback(async (email: string) => {
    const response = await apiFetch<ApiResponse<{ method: "password" | "otp" }>>("/auth/check-email", { method: "POST", body: { email } });
    return {
      method: response.data.method,
      message: response.message
    };
  }, []);

  const sendOtp = React.useCallback(async (email: string) => {
    await apiFetch<ApiResponse<void>>("/auth/send-otp", { method: "POST", body: { email } });
  }, []);

  const verifyOtp = React.useCallback(async (payload: { email: string; code: string }) => {
    const res = await apiFetch<ApiResponse<any>>("/auth/verify-otp", { method: "POST", body: payload });
    // if token returned, treat as auth response
    if (res?.data?.token && res?.data?.user) {
      setAuthState(res.data as AuthResponse);
      return res.data as AuthResponse;
    }
    // otherwise can be informational message (e.g., awaiting approval)
    return { message: res.message || "Email verified" };
  }, [setAuthState]);

  const register = React.useCallback(async (payload: RegisterPayload) => {
    const response = await apiFetch<ApiResponse<any>>("/auth/register", { method: "POST", body: payload });
    // backend may return a token/user or just a message indicating awaiting approval
    if (response?.data?.token && response?.data?.user) {
      setAuthState(response.data as AuthResponse);
      return response.data as AuthResponse;
    }
    // return the informational response for the UI to display
    return { message: response.message };
  }, [setAuthState]);

  const forgotPassword = React.useCallback(async (email: string) => {
    return await apiFetch<{ message: string }>("/auth/forgot-password", { method: "POST", body: { email } });
  }, []);

  const resetPassword = React.useCallback(async (payload: { email: string; code: string; newPassword: string }) => {
    return await apiFetch<{ message: string }>("/auth/reset-password", { method: "POST", body: payload });
  }, []);

  const logout = React.useCallback(() => {
    dispatch(clearAuth());
    localStorage.removeItem("original_admin_token");
    queryClient.clear();
  }, [dispatch, queryClient]);

  const exitImpersonation = React.useCallback(async () => {
    const orig = localStorage.getItem("original_admin_token");
    if (!orig) return;

    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api"}/admin/impersonate`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` }
      });
    } catch { /* noop */ }

    localStorage.removeItem("original_admin_token");
    
    try {
      const payload = JSON.parse(atob(orig.split(".")[1]));
      const restoredUser: AuthUser = {
        id: payload.userId,
        name: "Super Admin",
        role: "superadmin"
      };
      dispatch(setAuth({ user: restoredUser, token: orig }));
      window.location.href = APP_ROUTES.ADMIN;
    } catch {
      logout();
    }
  }, [token, dispatch, logout]);

  const impersonate = React.useCallback(async (targetUserId: string) => {
    const response = await apiFetch<ApiResponse<{ token: string; user: AuthUser }>>("/admin/impersonate", {
      method: "POST",
      body: { targetUserId },
      token
    });
    // Store current admin credentials in local storage to preserve state
    localStorage.setItem("original_admin_token", token || "");
    
    // Clear all cached queries so the impersonated user gets fresh data
    queryClient.clear();
    
    // Update Redux state with target user token
    dispatch(setAuth({ user: response.data.user, token: response.data.token }));
  }, [token, dispatch, queryClient]);

  const isTrialExpired = React.useMemo(() => {
    return user?.trialExpired || false;
  }, [user]);

  // isMounted tracking will prevent hydration mismatch, but effectively it means 
  // on first render it returns the states from the store which might be persisted.
  return (
    <AuthContext.Provider value={{ 
      user, token, outletId, businessId, isLoading: !isMounted, impersonating, 
      loginWithEmail, checkEmail, register, sendOtp, verifyOtp, forgotPassword, resetPassword, 
      logout, setOutletId, impersonate, exitImpersonation, isTrialExpired
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = React.useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}
