"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, Package, Receipt, LineChart, Settings, Lock,
  Store, Users, Shield, DollarSign, ArrowLeftRight, ClipboardList, Tag, FolderOpen, Gauge, History, UserCircle, FileText
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth, type UserRole } from "@/components/auth/auth-provider";
import { useFeature } from "@/hooks/useFeature";

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard, roles: ["owner", "manager", "staff"] as UserRole[] },
  { href: "/billing", label: "Billing", icon: Receipt, roles: ["owner", "manager", "staff"] as UserRole[] },
  { href: "/orders", label: "Orders", icon: History, roles: ["owner", "manager"] as UserRole[], feature: "order_history" },
  { href: "/customers", label: "Customers", icon: UserCircle, roles: ["owner", "manager"] as UserRole[], feature: "customers" },
  { href: "/invoices", label: "Invoices", icon: FileText, roles: ["owner", "manager"] as UserRole[], feature: "gst_invoices" },
  { href: "/products", label: "Products", icon: Tag, roles: ["owner", "manager"] as UserRole[] },
  { href: "/categories", label: "Categories", icon: FolderOpen, roles: ["owner", "manager"] as UserRole[] },
  { href: "/units", label: "Units", icon: Gauge, roles: ["owner", "manager"] as UserRole[] },
  { href: "/stock", label: "Inventory", icon: Package, roles: ["owner", "manager"] as UserRole[] },
  { href: "/stock/transfers", label: "Transfers", icon: ArrowLeftRight, roles: ["owner", "manager"] as UserRole[] },
  { href: "/reports", label: "Reports", icon: LineChart, roles: ["owner", "manager"] as UserRole[] },
  { href: "/expenses", label: "Expenses", icon: DollarSign, roles: ["owner", "manager"] as UserRole[] },
  { href: "/outlets", label: "Outlets", icon: Store, roles: ["owner"] as UserRole[] },
  { href: "/staff", label: "Staff", icon: Users, roles: ["owner", "manager"] as UserRole[] },
  { href: "/roles", label: "Roles", icon: Shield, roles: ["owner"] as UserRole[] },
  { href: "/audit-logs", label: "Audit Logs", icon: ClipboardList, roles: ["owner"] as UserRole[] },
  { href: "/settings", label: "Settings", icon: Settings, roles: ["owner", "manager"] as UserRole[] }
];

const bottomNavItems = [
  { href: "/", label: "Home", icon: LayoutDashboard, roles: ["owner", "manager", "staff"] as UserRole[] },
  { href: "/billing", label: "Billing", icon: Receipt, roles: ["owner", "manager", "staff"] as UserRole[] },
  { href: "/products", label: "Products", icon: Tag, roles: ["owner", "manager", "staff"] as UserRole[] },
  { href: "/stock", label: "Stock", icon: Package, roles: ["owner", "manager"] as UserRole[] },
  { href: "/settings", label: "Settings", icon: Settings, roles: ["owner", "manager"] as UserRole[] }
];

function NavLink({ item, isActive, canAccess, compact = false }: {
  item: (typeof navItems)[number]; isActive: boolean; canAccess: boolean; compact?: boolean;
}) {
  const Icon = item.icon;
  if (!canAccess) {
    if (compact) return null;
    return (
      <div className="flex items-center justify-between rounded-2xl px-3 py-2 text-sm font-medium text-muted/50">
        <span className="flex items-center gap-3"><Icon className="h-4 w-4" />{item.label}</span>
        <Lock className="h-3 w-3" />
      </div>
    );
  }
  return (
    <Link
      href={item.href}
      className={cn(
        "flex items-center gap-3 rounded-2xl px-3 py-2 text-sm font-medium transition",
        isActive ? "bg-primary text-white shadow-soft" : "text-muted hover:bg-surface hover:text-text"
      )}
    >
      <Icon className="h-4 w-4" />
      {!compact && item.label}
    </Link>
  );
}

export function SideNav() {
  const pathname = usePathname();
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
    const adminNavItems = [
      { href: "/admin", label: "Dashboard Stats", icon: LayoutDashboard },
      { href: "/admin?tab=businesses", label: "Businesses", icon: Store },
      { href: "/admin?tab=outlets", label: "Outlets", icon: Store },
      { href: "/admin?tab=users", label: "Users Registry", icon: Users },
      { href: "/admin?tab=audit_logs", label: "Audit Trails", icon: ClipboardList }
    ];

    const currentTab = typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("tab") || "businesses" : "businesses";

    return (
      <nav className="glass-panel rounded-3xl border border-border/70 p-4 shadow-soft">
        <p className="text-xs uppercase tracking-[0.2em] text-muted">Platform Admin</p>
        <div className="mt-3 space-y-1">
          {adminNavItems.map((item) => {
            const isStats = item.href === "/admin";
            const isActive = isStats 
              ? pathname === "/admin" && !new URLSearchParams(window.location.search).get("tab")
              : pathname === "/admin" && currentTab === item.href.split("tab=")[1];
            
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-2xl px-3 py-2 text-sm font-medium transition",
                  isActive ? "bg-primary text-white shadow-soft" : "text-muted hover:bg-surface hover:text-text"
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </div>
      </nav>
    );
  }

  const coreItems = navItems.slice(0, 7);
  const mgmtItems = navItems.slice(7);

  return (
    <nav className="glass-panel rounded-3xl border border-border/70 p-4 shadow-soft">
      <p className="text-xs uppercase tracking-[0.2em] text-muted">Operations</p>
      <div className="mt-3 space-y-1">
        {coreItems.map((item) => (
          <NavLink key={item.href} item={item}
            isActive={pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href))}
            canAccess={item.roles.includes(role) && featureEnabled(item.feature)} />
        ))}
      </div>
      <p className="mt-5 text-xs uppercase tracking-[0.2em] text-muted">Management</p>
      <div className="mt-3 space-y-1">
        {mgmtItems.map((item) => (
          <NavLink key={item.href} item={item}
            isActive={pathname.startsWith(item.href) && item.href !== "/"}
            canAccess={item.roles.includes(role) && featureEnabled(item.feature)} />
        ))}
      </div>
    </nav>
  );
}

export function BottomNav() {
  const pathname = usePathname();
  const { user, impersonating } = useAuth();
  const role = (user?.role ?? "staff") as UserRole;

  if (role === "superadmin" && !impersonating) return null;

  return (
    <nav className="fixed bottom-4 left-0 right-0 z-50 px-4 lg:hidden">
      <div className="glass-panel mx-auto grid max-w-sm grid-cols-5 gap-1 rounded-3xl border border-border/70 p-1.5 shadow-soft">
        {bottomNavItems.map((item) => {
          const isActive = pathname === item.href;
          const canAccess = item.roles.includes(role);
          const Icon = item.icon;
          if (!canAccess) return null;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center gap-1 rounded-2xl px-2 py-2 text-[10px] font-medium transition",
                isActive ? "bg-primary text-white" : "text-muted hover:bg-surface"
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
