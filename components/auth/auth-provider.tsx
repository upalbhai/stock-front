"use client";

import * as React from "react";
import { useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api-client";
import { clearStoredAuth, getStoredAuth, getStoredOutletId, setStoredAuth, setStoredOutletId } from "@/lib/auth-storage";
import { flushOfflineQueue } from "@/lib/offline-queue";
import type { AuthUser, UserRole } from "@/lib/types";

export type { AuthUser, UserRole } from "@/lib/types";

type AuthResponse = { token: string; user: AuthUser };
type RegisterPayload = { name: string; phone: string; pin: string; businessName?: string; outletName?: string; outletId?: string };
type LoginPayload = { phone: string; pin: string };

type AuthContextValue = {
  user: AuthUser | null;
  token: string | null;
  outletId: string | null;
  businessId: string | null;
  isLoading: boolean;
  impersonating: boolean;
  login: (payload: LoginPayload) => Promise<AuthResponse>;
  register: (payload: RegisterPayload) => Promise<AuthResponse>;
  logout: () => void;
  setOutletId: (outletId: string | null) => void;
  exitImpersonation?: () => Promise<void>;
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
    const response = await apiFetch<AuthResponse>("/auth/login", { method: "POST", body: payload });
    setAuthState(response);
    return response;
  }, [setAuthState]);

  const register = React.useCallback(async (payload: RegisterPayload) => {
    const response = await apiFetch<AuthResponse>("/auth/register", { method: "POST", body: payload });
    setAuthState(response);
    return response;
  }, [setAuthState]);

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

  return (
    <AuthContext.Provider value={{ user, token, outletId, businessId, isLoading, impersonating, login, register, logout, setOutletId, exitImpersonation }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = React.useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}
