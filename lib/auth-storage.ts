import type { AuthUser } from "@/lib/types";

const AUTH_KEY = "outlet-auth";
const OUTLET_KEY = "outlet-selected";

type StoredAuth = {
  token: string;
  user: AuthUser;
};

export function getStoredAuth(): StoredAuth | null {
  if (typeof window === "undefined") {
    return null;
  }
  const raw = localStorage.getItem(AUTH_KEY);
  if (!raw) {
    return null;
  }
  try {
    return JSON.parse(raw) as StoredAuth;
  } catch {
    return null;
  }
}

export function setStoredAuth(data: StoredAuth) {
  if (typeof window === "undefined") {
    return;
  }
  localStorage.setItem(AUTH_KEY, JSON.stringify(data));
}

export function clearStoredAuth() {
  if (typeof window === "undefined") {
    return;
  }
  localStorage.removeItem(AUTH_KEY);
}

export function getStoredOutletId(): string | null {
  if (typeof window === "undefined") {
    return null;
  }
  return localStorage.getItem(OUTLET_KEY);
}

export function setStoredOutletId(outletId: string | null) {
  if (typeof window === "undefined") {
    return;
  }
  if (!outletId) {
    localStorage.removeItem(OUTLET_KEY);
    return;
  }
  localStorage.setItem(OUTLET_KEY, outletId);
}
