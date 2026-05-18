"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  Receipt,
  LineChart,
  Settings
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/stock", label: "Stock", icon: Package },
  { href: "/billing", label: "Billing", icon: Receipt },
  { href: "/reports", label: "Reports", icon: LineChart },
  { href: "/settings", label: "Settings", icon: Settings }
];

export function SideNav() {
  const pathname = usePathname();

  return (
    <nav className="glass-panel rounded-3xl border border-border/70 p-4 shadow-soft">
      <p className="text-xs uppercase tracking-[0.2em] text-muted">Core</p>
      <div className="mt-4 space-y-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
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

  return (
    <nav className="fixed bottom-4 left-0 right-0 z-50 px-4 lg:hidden">
      <div className="glass-panel mx-auto grid max-w-md grid-cols-5 gap-2 rounded-3xl border border-border/70 p-2 shadow-soft">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
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
