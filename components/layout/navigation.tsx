"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useAuth, type UserRole } from "@/components/auth/auth-provider";
import { bottomNavItems } from "@/components/layout/navigation-config";

export function BottomNav() {
  const pathname = usePathname();
  const { user, impersonating } = useAuth();
  const role = (user?.role ?? "staff") as UserRole;

  if (role === "superadmin" && !impersonating) return null;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 px-4 pb-[calc(0.75rem+env(safe-area-inset-bottom))] pt-2 lg:hidden">
      <div className="mx-auto grid max-w-sm grid-cols-5 gap-1 rounded-2xl border border-border bg-card/95 p-1.5 shadow-lg backdrop-blur-md">
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
                "flex flex-col items-center gap-1 rounded-xl px-2 py-2 text-[10px] font-medium transition",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground"
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
