"use client";

import * as React from "react";
import { useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api-client";
import { clearStoredAuth, getStoredAuth, getStoredOutletId, setStoredAuth, setStoredOutletId } from "@/lib/auth-storage";
import { flushOfflineQueue } from "@/lib/offline-queue";
import type { AuthUser, UserRole } from "@/lib/types";

export type { AuthUser, UserRole } from "@/lib/types";

type AuthResponse = { token: string; user: AuthUser };
type RegisterPayload = { name: string; email: string; password?: string; phone?: string; pin?: string; businessName?: string; outletName?: string; outletId?: string };
type LoginPayload = { phone: string; pin: string };
type EmailLoginPayload = { email: string; password?: string };

type AuthContextValue = {
  user: AuthUser | null;
  token: string | null;
  outletId: string | null;
  businessId: string | null;
  isLoading: boolean;
  impersonating: boolean;
  login: (payload: LoginPayload) => Promise<AuthResponse>;
  loginWithEmail: (payload: EmailLoginPayload) => Promise<AuthResponse>;
  checkEmail: (email: string) => Promise<{ method: "password" | "otp"; message?: string }>;
  register: (payload: RegisterPayload) => Promise<AuthResponse>;
  sendOtp: (email: string) => Promise<void>;
  verifyOtp: (payload: { email: string; code: string }) => Promise<AuthResponse | { message: string }>;
  forgotPassword: (email: string) => Promise<{ message: string }>;
  resetPassword: (payload: { email: string; code: string; newPassword: string }) => Promise<{ message: string }>;
  logout: () => void;
  setOutletId: (outletId: string | null) => void;
  exitImpersonation?: () => Promise<void>;
  isTrialExpired: boolean;
};

const AuthContext = React.createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();
  const [user, setUser] = React.useState<AuthUser | null>(null);
  const [token, setToken] = React.useState<string | null>(null);
  const [outletId, setOutletIdState] = React.useState<string | null>(null);
  const [businessId, setBusinessId] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [impersonating, setImpersonating] = React.useState(false);

  React.useEffect(() => {
    const stored = getStoredAuth();
    if (stored) {
      setUser(stored.user);
      setToken(stored.token);
      setBusinessId(stored.user.businessId || null);
      // Detect impersonation from token
      try {
        const payload = JSON.parse(atob(stored.token.split(".")[1]));
        setImpersonating(!!payload.impersonating);
      } catch { /* noop */ }
    }
    const selectedOutlet = getStoredOutletId();
    setOutletIdState(selectedOutlet || stored?.user?.outletId || null);
    setIsLoading(false);
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
    setOutletIdState(selected);
    setStoredOutletId(selected);
  }, []);

  const setAuthState = React.useCallback((data: AuthResponse) => {
    setUser(data.user);
    setToken(data.token);
    setBusinessId(data.user.businessId || null);
    setOutletIdState(data.user.outletId || null);
    setStoredOutletId(data.user.outletId || null);
    setStoredAuth({ token: data.token, user: data.user });
    try {
      const payload = JSON.parse(atob(data.token.split(".")[1]));
      setImpersonating(!!payload.impersonating);
    } catch { /* noop */ }
  }, []);

  const login = React.useCallback(async (payload: LoginPayload) => {
    const response = await apiFetch<AuthResponse>("/auth/login-pin", { method: "POST", body: payload });
    setAuthState(response);
    return response;
  }, [setAuthState]);

  const loginWithEmail = React.useCallback(async (payload: EmailLoginPayload) => {
    const response = await apiFetch<AuthResponse>("/auth/login", { method: "POST", body: payload });
    setAuthState(response);
    return response;
  }, [setAuthState]);

  const checkEmail = React.useCallback(async (email: string) => {
    return await apiFetch<{ method: "password" | "otp"; message?: string }>("/auth/check-email", { method: "POST", body: { email } });
  }, []);

  const sendOtp = React.useCallback(async (email: string) => {
    await apiFetch<void>("/auth/send-otp", { method: "POST", body: { email } });
  }, []);

  const verifyOtp = React.useCallback(async (payload: { email: string; code: string }) => {
    const res = await apiFetch<any>("/auth/verify-otp", { method: "POST", body: payload });
    // if token returned, treat as auth response
    if (res?.token && res?.user) {
      setAuthState(res as AuthResponse);
      return res as AuthResponse;
    }
    // otherwise can be informational message (e.g., awaiting approval)
    return res as { message: string };
  }, [setAuthState]);

  const register = React.useCallback(async (payload: RegisterPayload) => {
    const response = await apiFetch<any>("/auth/register", { method: "POST", body: payload });
    // backend may return a token/user or just a message indicating awaiting approval
    if (response?.token && response?.user) {
      setAuthState(response as AuthResponse);
      return response as AuthResponse;
    }
    // return the informational response for the UI to display
    return response as { message?: string };
  }, [setAuthState]);

  const forgotPassword = React.useCallback(async (email: string) => {
    return await apiFetch<{ message: string }>("/auth/forgot-password", { method: "POST", body: { email } });
  }, []);

  const resetPassword = React.useCallback(async (payload: { email: string; code: string; newPassword: string }) => {
    return await apiFetch<{ message: string }>("/auth/reset-password", { method: "POST", body: payload });
  }, []);

  const logout = React.useCallback(() => {
    clearStoredAuth();
    setStoredOutletId(null);
    setUser(null);
    setToken(null);
    setBusinessId(null);
    setImpersonating(false);
    localStorage.removeItem("original_admin_token");
    queryClient.clear();
  }, [queryClient]);

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
      setToken(orig);
      setUser(restoredUser);
      setBusinessId(null);
      setImpersonating(false);
      setStoredAuth({ token: orig, user: restoredUser });
      window.location.href = "/admin";
    } catch {
      logout();
    }
  }, [token, logout]);

  const isTrialExpired = React.useMemo(() => {
    return user?.trialExpired || false;
  }, [user]);

  return (
    <AuthContext.Provider value={{ 
      user, token, outletId, businessId, isLoading, impersonating, 
      login, loginWithEmail, checkEmail, register, sendOtp, verifyOtp, forgotPassword, resetPassword, 
      logout, setOutletId, exitImpersonation, isTrialExpired
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
