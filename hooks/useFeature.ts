"use client";

import { useAuth } from "@/components/auth/auth-provider";

export function useFeature(featureKey: string): boolean {
  const { user } = useAuth();
  if (user?.role === "superadmin") return true;
  return user?.enabledFeatures?.includes(featureKey) ?? false;
}

export function useBusinessProfile() {
  const { user } = useAuth();
  return user?.businessProfile ?? "retail";
}
