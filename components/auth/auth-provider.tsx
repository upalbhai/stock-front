"use client";

import * as React from "react";
import { useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api-client";
import {
  clearStoredAuth,
  getStoredAuth,
  getStoredOutletId,
  setStoredAuth,
  setStoredOutletId
} from "@/lib/auth-storage";
import { flushOfflineQueue } from "@/lib/offline-queue";
import type { AuthUser, UserRole } from "@/lib/types";

export type { AuthUser, UserRole } from "@/lib/types";

type AuthResponse = {
  token: string;
  user: AuthUser;
};

type RegisterPayload = {
  name: string;
  phone: string;
  pin: string;
  role?: UserRole;
  outletId?: string;
  outletName?: string;
};

type LoginPayload = {
  phone: string;
  pin: string;
};

type AuthContextValue = {
  user: AuthUser | null;
  token: string | null;
  outletId: string | null;
  isLoading: boolean;
  login: (payload: LoginPayload) => Promise<AuthResponse>;
  register: (payload: RegisterPayload) => Promise<AuthResponse>;
  logout: () => void;
  setOutletId: (outletId: string | null) => void;
};

const AuthContext = React.createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();
  const [user, setUser] = React.useState<AuthUser | null>(null);
  const [token, setToken] = React.useState<string | null>(null);
  const [outletId, setOutletIdState] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    const stored = getStoredAuth();
    if (stored) {
      setUser(stored.user);
      setToken(stored.token);
    }
    const selectedOutlet = getStoredOutletId();
    setOutletIdState(selectedOutlet || stored?.user?.outletId || null);
    setIsLoading(false);
  }, []);

  React.useEffect(() => {
    if (!token) {
      return;
    }
    const handleOnline = () => {
      flushOfflineQueue(token).catch(() => {});
    };
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

  const setAuthState = React.useCallback(
    (data: AuthResponse) => {
      setUser(data.user);
      setToken(data.token);
      setOutletIdState(data.user.outletId || null);
      setStoredOutletId(data.user.outletId || null);
      setStoredAuth({ token: data.token, user: data.user });
    },
    []
  );

  const login = React.useCallback(async (payload: LoginPayload) => {
    const response = await apiFetch<AuthResponse>("/auth/login", {
      method: "POST",
      body: payload
    });
    setAuthState(response);
    return response;
  }, [setAuthState]);

  const register = React.useCallback(async (payload: RegisterPayload) => {
    const response = await apiFetch<AuthResponse>("/auth/register", {
      method: "POST",
      body: payload
    });
    setAuthState(response);
    return response;
  }, [setAuthState]);

  const logout = React.useCallback(() => {
    clearStoredAuth();
    setStoredOutletId(null);
    setUser(null);
    setToken(null);
    queryClient.clear();
  }, [queryClient]);

  const value: AuthContextValue = {
    user,
    token,
    outletId,
    isLoading,
    login,
    register,
    logout,
    setOutletId
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = React.useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
