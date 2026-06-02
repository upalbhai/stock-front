"use client";

import { usePathname, useRouter } from "next/navigation";
import { SideNav, BottomNav } from "@/components/layout/navigation";
import { ThemeToggle } from "@/components/theme-toggle";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RequireAuth } from "@/components/auth/require-auth";
import { useAuth } from "@/components/auth/auth-provider";
import { OutletSwitcher } from "@/components/layout/outlet-switcher";
import { useOnlineStatus } from "@/hooks/use-online";
import React from "react";
import Link from "next/link";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout, impersonating, exitImpersonation } = useAuth();
  const isAuthRoute = pathname.startsWith("/login");
  const isOnline = useOnlineStatus();

  React.useEffect(() => {
    if (user?.role === "superadmin" && !impersonating && pathname !== "/admin" && !pathname.startsWith("/admin") && !isAuthRoute) {
      router.push("/admin");
    }
  }, [user, impersonating, pathname, isAuthRoute, router]);

  if (isAuthRoute) {
    return <main className="min-h-screen px-4 py-10">{children}</main>;
  }

  const isSuperAdmin = user?.role === "superadmin";

  return (
    <RequireAuth>
      <div className="min-h-screen">
        {user?.subscriptionStatus === "trial" && user.trialEndsAt && (
          <div className="bg-primary/10 text-primary py-2 px-4 text-center text-xs font-semibold flex items-center justify-center gap-4 animate-fade border-b border-primary/20">
            <span>
              ⭐ Free Trial Active: {Math.max(0, Math.ceil((new Date(user.trialEndsAt).getTime() - new Date().getTime()) / (1000 * 3600 * 24)))} days remaining
            </span>
            <Button size="xs" variant="default" className="rounded-xl px-3 py-1 font-bold shadow-sm" asChild>
              <Link href="/subscribe">Upgrade Now</Link>
            </Button>
          </div>
        )}
        {impersonating && (
          <div className="bg-danger text-white py-2 px-4 text-center text-xs font-semibold flex items-center justify-center gap-4 animate-fade">
            <span>⚠️ Impersonation active: Viewing session as {user?.name}. All actions are audited.</span>
            <Button size="xs" variant="outline" className="border-white text-white hover:bg-white hover:text-danger rounded-xl px-3 py-1 font-bold shadow-sm"
              onClick={exitImpersonation}>
              Exit Session
            </Button>
          </div>
        )}
        <header className="sticky top-0 z-40 border-b border-border/60 bg-surface/85 backdrop-blur">
          <div className="mx-auto flex w-full items-center justify-between gap-2 px-3 py-2 sm:px-6 sm:py-4 xl:px-8">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="flex h-8 w-8 sm:h-11 sm:w-11 shrink-0 items-center justify-center rounded-xl sm:rounded-2xl bg-primary text-xs sm:text-base font-bold text-white shadow-soft">
                RO
              </div>
              <div className="min-w-0">
                <p className="text-sm sm:text-lg font-semibold leading-tight truncate">Outlet Pulse</p>
                <div className="flex flex-wrap items-center gap-1.5 text-[10px] sm:text-xs text-muted mt-0.5">
                  <span className="truncate max-w-[70px] sm:max-w-none">{user ? `Hi, ${user.name}` : ""}</span>
                  {user && <Badge variant="soft" className="px-1 py-0 text-[9px] sm:text-xs">{user.role}</Badge>}
                  {!isOnline && <Badge variant="warning" className="px-1 py-0 text-[9px] sm:text-xs">Offline</Badge>}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1 sm:gap-2 shrink-0">
              {(!isSuperAdmin || impersonating) && <OutletSwitcher className="hidden sm:block" />}
              {isSuperAdmin && !impersonating && (
                <Button asChild size="sm" variant="outline" className="h-8 px-2 text-xs sm:h-11 sm:px-8 sm:text-base border-primary/50 text-primary">
                  <Link href="/admin">Portal</Link>
                </Button>
              )}
              {(!isSuperAdmin || impersonating) && (
                <Button asChild size="sm" className="hidden sm:flex h-11 px-8 text-base">
                  <Link href="/billing">New Bill</Link>
                </Button>
              )}
              <ThemeToggle />
              <Button variant="ghost" size="sm" onClick={logout} className="h-8 px-2 text-xs sm:h-10 sm:px-4 sm:text-sm">
                Logout
              </Button>
            </div>
          </div>
        </header>

        <div className="mx-auto grid w-full grid-cols-1 gap-6 px-4 pb-24 pt-6 sm:px-6 xl:px-8 lg:grid-cols-[280px_minmax(0,1fr)] lg:pb-10">
          <aside className="hidden lg:block lg:sticky lg:top-24 lg:self-start">
            <SideNav />
          </aside>
          <main className="min-w-0 space-y-6">{children}</main>
        </div>

        <BottomNav />
      </div>
    </RequireAuth>
  );
}
