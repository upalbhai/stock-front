"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { SideNav, BottomNav } from "@/components/layout/navigation";
import { ThemeToggle } from "@/components/theme-toggle";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RequireAuth } from "@/components/auth/require-auth";
import { useAuth } from "@/components/auth/auth-provider";
import { OutletSwitcher } from "@/components/layout/outlet-switcher";
import { useOnlineStatus } from "@/hooks/use-online";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const isAuthRoute = pathname.startsWith("/login");
  const isOnline = useOnlineStatus();

  if (isAuthRoute) {
    return <main className="min-h-screen px-4 py-10">{children}</main>;
  }

  return (
    <RequireAuth>
      <div className="min-h-screen">
        <header className="sticky top-0 z-40 border-b border-border/60 bg-surface/85 backdrop-blur">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-4">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary text-white shadow-soft">
                RO
              </div>
              <div>
                <p className="text-lg font-semibold">Outlet Pulse</p>
                <div className="flex flex-wrap items-center gap-2 text-xs text-muted">
                  <span>{user ? `Hi, ${user.name}` : ""}</span>
                  {user && <Badge variant="soft">{user.role}</Badge>}
                  {!isOnline && <Badge variant="warning">Offline</Badge>}
                </div>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <OutletSwitcher className="hidden sm:block" />
              <Button asChild size="lg">
                <Link href="/billing">New Bill</Link>
              </Button>
              <ThemeToggle />
              <Button variant="ghost" onClick={logout}>
                Logout
              </Button>
            </div>
          </div>
        </header>

        <div className="mx-auto grid max-w-6xl grid-cols-1 gap-6 px-4 pb-24 pt-6 lg:grid-cols-[240px_1fr] lg:pb-10">
          <aside className="hidden lg:block">
            <SideNav />
          </aside>
          <main className="space-y-6">{children}</main>
        </div>

        <BottomNav />
      </div>
    </RequireAuth>
  );
}
