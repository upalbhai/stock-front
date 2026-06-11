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
  featureFlags: {
    orderHistory: boolean;
    customers: boolean;
    gstInvoices: boolean;
    enabledFeatures?: string[];
  }
): SidebarGroupDef[] {
  const featureEnabled = (feature?: string) => {
    if (!feature) return true;
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
      return filterGroups(adminSidebarGroups, role, featureFlags);
    }
    return filterGroups(sidebarGroups, role, featureFlags);
  }, [role, impersonating, hasOrderHistory, hasCustomers, hasGstInvoices, user?.enabledFeatures]);
}

export function useCanAccessItem(item: SidebarItem): boolean {
  const { user, impersonating } = useAuth();
  const role = (user?.role ?? "staff") as UserRole;
  const hasOrderHistory = useFeature("order_history");
  const hasCustomers = useFeature("customers");
  const hasGstInvoices = useFeature("gst_invoices");

  const featureEnabled = (feature?: string) => {
    if (!feature) return true;
    if (feature === "order_history") return hasOrderHistory;
    if (feature === "customers") return hasCustomers;
    if (feature === "gst_invoices") return hasGstInvoices;
    return user?.enabledFeatures?.includes(feature) ?? false;
  };

  if (role === "superadmin" && !impersonating) {
    return item.roles.includes("superadmin");
  }
  return item.roles.includes(role) && featureEnabled(item.feature);
}
