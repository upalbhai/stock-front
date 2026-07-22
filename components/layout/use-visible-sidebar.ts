"use client";

import { useMemo } from "react";
import { useAuth } from "@/components/auth/auth-provider";
import { useFeature } from "@/hooks/useFeature";
import {
  adminSidebarGroups,
  sidebarGroups,
  type SidebarGroupDef,
  type SidebarItem,
} from "@/components/layout/navigation-config";
import type { UserRole } from "@/lib/types";

function filterGroups(
  groups: SidebarGroupDef[],
  role: UserRole,
  customPermissions: { module: string; actions: string[] }[] | undefined,
  featureFlags: {
    orderHistory: boolean;
    customers: boolean;
    gstInvoices: boolean;
    enabledFeatures?: string[];
  }
): SidebarGroupDef[] {
  const featureEnabled = (feature?: string) => {
    if (!feature) return true;
    if (role === "superadmin") {
      if (!customPermissions || customPermissions.length === 0) return true;
      return customPermissions.some(p => p.module === feature);
    }
    if (feature === "order_history") return featureFlags.orderHistory;
    if (feature === "customers") return featureFlags.customers;
    if (feature === "gst_invoices") return featureFlags.gstInvoices;
    return featureFlags.enabledFeatures?.includes(feature) ?? false;
  };

  return groups
    .map((group) => ({
      ...group,
      items: group.items.filter(
        (item) => item.roles.includes(role) && featureEnabled(item.feature)
      ),
    }))
    .filter((group) => group.items.length > 0);
}

export function useVisibleSidebarGroups(): SidebarGroupDef[] {
  const { user, impersonating } = useAuth();
  const role = (user?.role ?? "staff") as UserRole;
  const hasOrderHistory = useFeature("order_history");
  const hasCustomers = useFeature("customers");
  const hasGstInvoices = useFeature("gst_invoices");

  return useMemo(() => {
    const featureFlags = {
      orderHistory: hasOrderHistory,
      customers: hasCustomers,
      gstInvoices: hasGstInvoices,
      enabledFeatures: user?.enabledFeatures,
    };

    if (role === "superadmin" && !impersonating) {
      return filterGroups(adminSidebarGroups, role, user?.customPermissions, featureFlags);
    }
    return filterGroups(sidebarGroups, role, user?.customPermissions, featureFlags);
  }, [role, impersonating, hasOrderHistory, hasCustomers, hasGstInvoices, user?.enabledFeatures, user?.customPermissions]);
}

export function useCanAccessItem(item: SidebarItem): boolean {
  const { user, impersonating } = useAuth();
  const role = (user?.role ?? "staff") as UserRole;
  const hasOrderHistory = useFeature("order_history");
  const hasCustomers = useFeature("customers");
  const hasGstInvoices = useFeature("gst_invoices");

  const featureEnabled = (feature?: string) => {
    if (!feature) return true;
    if (role === "superadmin" && !impersonating) {
      if (!user?.customPermissions || user.customPermissions.length === 0) return true;
      return user.customPermissions.some(p => p.module === feature);
    }
    if (feature === "order_history") return hasOrderHistory;
    if (feature === "customers") return hasCustomers;
    if (feature === "gst_invoices") return hasGstInvoices;
    return user?.enabledFeatures?.includes(feature) ?? false;
  };

  if (role === "superadmin" && !impersonating) {
    if (!item.roles.includes("superadmin")) return false;
    return featureEnabled(item.feature);
  }
  return item.roles.includes(role) && featureEnabled(item.feature);
}
