"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  Receipt,
  LineChart,
  Settings,
  Lock
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth, type UserRole } from "@/components/auth/auth-provider";

const navItems = [
  {
    href: "/",
    label: "Dashboard",
    icon: LayoutDashboard,
    roles: ["owner", "manager", "staff"] as UserRole[]
  },
  {
    href: "/stock",
    label: "Stock",
    icon: Package,
    roles: ["owner", "manager"] as UserRole[]
  },
  {
    href: "/billing",
    label: "Billing",
    icon: Receipt,
    roles: ["owner", "manager", "staff"] as UserRole[]
  },
  {
    href: "/reports",
    label: "Reports",
    icon: LineChart,
    roles: ["owner", "manager"] as UserRole[]
  },
  {
    href: "/settings",
    label: "Settings",
    icon: Settings,
    roles: ["owner", "manager"] as UserRole[]
  }
];

export function SideNav() {
  const pathname = usePathname();
  const { user } = useAuth();
  const role = user?.role ?? "staff";

  return (
    <nav className="glass-panel rounded-3xl border border-border/70 p-4 shadow-soft">
      <p className="text-xs uppercase tracking-[0.2em] text-muted">Core</p>
      <div className="mt-4 space-y-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          const canAccess = item.roles.includes(role);
          if (!canAccess) {
            return (
              <div
                key={item.href}
                className="flex items-center justify-between rounded-2xl px-3 py-2 text-sm font-medium text-muted/60"
              >
                <span className="flex items-center gap-3">
                  <Icon className="h-4 w-4" />
                  {item.label}
                </span>
                <Lock className="h-3 w-3" />
              </div>
            );
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-2xl px-3 py-2 text-sm font-medium transition",
                isActive
                  ? "bg-primary text-white"
                  : "text-muted hover:bg-surface"
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

export function BottomNav() {
  const pathname = usePathname();
  const { user } = useAuth();
  const role = user?.role ?? "staff";

  return (
    <nav className="fixed bottom-4 left-0 right-0 z-50 px-4 lg:hidden">
      <div className="glass-panel mx-auto grid max-w-md grid-cols-5 gap-2 rounded-3xl border border-border/70 p-2 shadow-soft">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          const canAccess = item.roles.includes(role);
          if (!canAccess) {
            return (
              <div
                key={item.href}
                className="flex flex-col items-center gap-1 rounded-2xl px-2 py-2 text-[11px] font-medium text-muted/60"
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </div>
            );
          }
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center gap-1 rounded-2xl px-2 py-2 text-[11px] font-medium transition",
                isActive
                  ? "bg-primary text-white"
                  : "text-muted hover:bg-surface"
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
