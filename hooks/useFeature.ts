"use client";

import { useAuth } from "@/components/auth/auth-provider";

export function useFeature(featureKey: string): boolean {
  const { user } = useAuth();
  const isEnabled = user?.role === "superadmin" || (user?.enabledFeatures?.includes(featureKey) ?? false);
  if (featureKey === "packaging_units") {
    console.log("Packaging unit feature flag status:", isEnabled, {
      role: user?.role,
      enabledFeatures: user?.enabledFeatures
    });
  }
  return isEnabled;
}

export function useBusinessProfile() {
  const { user } = useAuth();
  return user?.businessProfile ?? "retail";
}
