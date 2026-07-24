"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Bell,
  ChevronRight,
  Clock,
  Plus,
  RefreshCw,
  Search,
  Lock,
} from "lucide-react";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { BottomNav } from "@/components/layout/navigation";
import { UserAccountMenu } from "@/components/layout/user-account-menu";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/theme-toggle";
import { RequireAuth } from "@/components/auth/require-auth";
import { useAuth } from "@/components/auth/auth-provider";
import { OutletSwitcher } from "@/components/layout/outlet-switcher";
import { NotificationBell } from "@/components/notifications/notification-bell";
import { useOnlineStatus } from "@/hooks/use-online";
import { useVisibleSidebarGroups } from "@/components/layout/use-visible-sidebar";
import { allSidebarItems } from "@/components/layout/navigation-config";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { APP_BASE_ROUTE, APP_ROUTES, appRoute } from "@/lib/routes";

function useBreadcrumbs(pathname: string) {
  return useMemo(() => {
    const relativePath =
      pathname === APP_BASE_ROUTE
        ? ""
        : pathname.startsWith(`${APP_BASE_ROUTE}/`)
          ? pathname.slice(APP_BASE_ROUTE.length + 1)
          : pathname.replace(/^\//, "");
    const segments = relativePath.split("/").filter(Boolean);
    if (segments.length === 0) return [{ label: "Dashboard", href: APP_ROUTES.DASHBOARD }];

    const breadcrumbs: { label: string; href: string }[] = [
      { label: "Dashboard", href: APP_ROUTES.DASHBOARD },
    ];

    for (let i = 0; i < segments.length; i++) {
      const href = appRoute(`/${segments.slice(0, i + 1).join("/")}`);
      const matchingItem = allSidebarItems.find((item) => item.path === href);
      const segment = segments[i];
      const label =
        matchingItem?.title ??
        segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, " ");
      if (href !== "/") {
        breadcrumbs.push({ label, href });
      }
    }
    return breadcrumbs;
  }, [pathname]);
}

function LastUpdated() {
  const [time, setTime] = useState("");
  useEffect(() => {
    setTime(
      new Date().toLocaleTimeString("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      })
    );
  }, []);
  return (
    <span className="flex items-center gap-1 font-mono text-[10px] text-muted-foreground">
      <Clock className="h-3 w-3" />
      {time ? `Updated ${time}` : "Loading..."}
    </span>
  );
}



export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, impersonating, exitImpersonation, logout } = useAuth();
  const isAuthRoute = pathname.startsWith(APP_ROUTES.LOGIN);
  const isOnline = useOnlineStatus();
  const [commandOpen, setCommandOpen] = useState(false);
  const visibleSidebarGroups = useVisibleSidebarGroups();
  const breadcrumbs = useBreadcrumbs(pathname);
  const pageTitle = breadcrumbs[breadcrumbs.length - 1]?.label ?? "Dashboard";

  const isSuperAdmin = user?.role === "superadmin";
  const isBillingRoute =
    pathname === APP_ROUTES.BILLING || pathname.startsWith(`${APP_ROUTES.BILLING}/`);

  useEffect(() => {
    if (
      user?.role === "superadmin" &&
      !impersonating &&
      pathname !== APP_ROUTES.ADMIN &&
      !pathname.startsWith(`${APP_ROUTES.ADMIN}/`) &&
      !isAuthRoute
    ) {
      router.push(APP_ROUTES.ADMIN);
    }
    
    if (
      user?.role === "agent" &&
      !impersonating &&
      pathname !== APP_ROUTES.AGENT &&
      !pathname.startsWith(`${APP_ROUTES.AGENT}/`) &&
      !isAuthRoute
    ) {
      router.push(APP_ROUTES.AGENT);
    }
  }, [user, impersonating, pathname, isAuthRoute, router]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setCommandOpen((prev) => !prev);
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  const handleNavigate = (path: string) => {
    setCommandOpen(false);
    router.push(path);
  };

  if (isAuthRoute) {
    return <main className="min-h-svh px-4 py-10">{children}</main>;
  }

  if (user?.maintenanceMode && user?.role !== "superadmin") {
    return (
      <div className="flex h-svh flex-col items-center justify-center bg-muted/30 p-4 text-center">
        <div className="max-w-md w-full bg-card rounded-xl border border-border shadow-xl p-8 animate-in fade-in zoom-in duration-500">
          <div className="mx-auto bg-warning/10 w-16 h-16 rounded-full flex items-center justify-center mb-6">
            <Lock className="h-8 w-8 text-warning" />
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-4">Under Maintenance</h1>
          <p className="text-sm text-muted-foreground mb-8">
            The system is currently undergoing scheduled maintenance. Please try again later.
          </p>
          <div className="pt-6 border-t border-border">
            <Button variant="outline" className="w-full" onClick={logout}>
              Sign out
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (user?.subscriptionStatus === "payment_locked" && pathname !== APP_ROUTES.SUBSCRIBE) {
    return (
      <div className="flex h-svh items-center justify-center bg-muted/30 p-4">
        <div className="max-w-md w-full bg-card rounded-xl border border-border shadow-xl p-8 text-center animate-in fade-in zoom-in duration-500">
          <div className="mx-auto bg-danger/10 w-16 h-16 rounded-full flex items-center justify-center mb-6">
            <Lock className="h-8 w-8 text-danger" />
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-2">Account Locked</h1>
          <p className="text-sm text-muted-foreground mb-8">
            Your grace period has expired. Please complete your payment to resume access to the dashboard.
          </p>
          
          <Button asChild className="w-full" size="lg">
            <Link href={APP_ROUTES.SUBSCRIBE}>Upload Payment Details</Link>
          </Button>

          <div className="mt-8 pt-6 border-t border-border">
            <Button variant="ghost" className="text-xs text-muted-foreground" onClick={logout}>
              Sign out
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <RequireAuth>
        <SidebarProvider defaultOpen={!isBillingRoute} open={isBillingRoute ? false : undefined} className="h-svh overflow-hidden">
        {!isBillingRoute && <AppSidebar />}

        <SidebarInset className="flex min-h-0 flex-1 flex-col overflow-hidden">
          {user?.subscriptionStatus === "trial" && user.trialEndsAt && (
            <div className="flex shrink-0 animate-fade flex-row items-center justify-center gap-3 border-b border-primary/20 bg-primary/10 px-4 py-1.5 text-xs font-semibold text-primary">
              <span className="leading-none">
                Free Trial Active:{" "}
                {Math.max(
                  0,
                  Math.ceil(
                    (new Date(user.trialEndsAt).getTime() - Date.now()) / (1000 * 3600 * 24)
                  )
                )}{" "}
                days remaining
              </span>
              <Button size="xs" variant="default" className="h-6 shrink-0 rounded-full px-2.5 py-0 text-[10px] font-bold shadow-sm" asChild>
                <Link href={APP_ROUTES.SUBSCRIBE}>Upgrade</Link>
              </Button>
            </div>
          )}

          {user?.subscriptionStatus === "grace_period" && (
            <div className="flex shrink-0 animate-fade flex-row items-center justify-center gap-3 border-b border-warning/30 bg-warning/20 px-4 py-2 text-xs font-semibold text-warning-foreground">
              <span className="leading-none flex items-center gap-2">
                <span className="bg-warning w-2 h-2 rounded-full animate-pulse" />
                GRACE PERIOD: Your subscription has expired. Please upload payment details immediately to prevent account lock.
              </span>
              <Button size="xs" variant="default" className="h-6 shrink-0 rounded-full px-2.5 py-0 text-[10px] font-bold shadow-sm" asChild>
                <Link href={APP_ROUTES.SUBSCRIBE}>Pay Now</Link>
              </Button>
            </div>
          )}

          {impersonating && (
            <div className="flex shrink-0 animate-fade flex-col items-center justify-center gap-2 bg-red-100 px-4 py-2.5 text-center text-xs font-semibold text-red-500 sm:flex-row sm:gap-4">
              <span className="leading-snug">
                Impersonation active: Viewing session as {user?.name}. All actions are audited.
              </span>
              <Button
                size="xs"
                variant="soft"
                className=""
                onClick={exitImpersonation}
              >
                Exit Session
              </Button>
            </div>
          )}

          <header className="sticky top-0 z-30 shrink-0 border-b border-border bg-card/95 backdrop-blur-md">
            <div className="flex h-14 items-center justify-between gap-2 px-3 sm:gap-3 sm:px-4 lg:px-6">
              <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3">
                {!isBillingRoute && (
                  <SidebarTrigger className="shrink-0 text-foreground transition-colors hover:bg-accent" />
                )}

                {/* Mobile: current page title only */}
                <span className="truncate text-sm font-semibold text-foreground sm:hidden">
                  {pageTitle}
                </span>

                {/* Tablet+: breadcrumb trail */}
                <nav
                  aria-label="Breadcrumb"
                  className="hidden min-w-0 items-center gap-1 text-sm sm:flex"
                >
                  {breadcrumbs.map((crumb, idx) => (
                    <React.Fragment key={`${crumb.href}-${idx}`}>
                      {idx > 0 && (
                        <ChevronRight className="h-3 w-3 shrink-0 text-muted-foreground" />
                      )}
                      {idx === breadcrumbs.length - 1 ? (
                        <span className="truncate text-sm font-semibold text-foreground">
                          {crumb.label}
                        </span>
                      ) : (
                        <button
                          onClick={() => router.push(crumb.href)}
                          className="truncate rounded-sm text-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        >
                          {crumb.label}
                        </button>
                      )}
                    </React.Fragment>
                  ))}
                </nav>

                {!isOnline && (
                  <Badge variant="warning" className="hidden shrink-0 px-1.5 py-0 text-[10px] md:inline-flex">
                    Offline
                  </Badge>
                )}
              </div>

              <div className="flex shrink-0 items-center gap-1.5 sm:gap-2.5">
                {(!isSuperAdmin || impersonating) && (
                  <OutletSwitcher className="hidden md:block" />
                )}

                {/* Search: icon on mobile/md/lg, full on xl+ */}
                <button
                  onClick={() => setCommandOpen(true)}
                  className="flex h-8 w-8 items-center justify-center rounded-md border border-border bg-muted text-muted-foreground transition-all hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring xl:w-auto xl:justify-between xl:gap-2 xl:px-3"
                  aria-label="Search menu items"
                >
                  <Search className="h-4 w-4" />
                  <span className="hidden text-xs font-medium xl:inline">Search Menu...</span>
                  <kbd className="pointer-events-none hidden h-4 select-none items-center gap-0.5 rounded border border-border bg-muted px-1 font-mono text-[9px] font-bold text-muted-foreground xl:inline-flex">
                    <span className="text-[10px]">⌘</span>K
                  </kbd>
                </button>

                <div className="hidden xl:flex">
                  <LastUpdated />
                </div>

                {(!isSuperAdmin || impersonating) && (
                  <>
                    <Button asChild size="icon-sm" className="xl:hidden h-8 w-8">
                      <Link href={APP_ROUTES.BILLING} aria-label="New Bill">
                        <Plus className="h-4 w-4" />
                      </Link>
                    </Button>
                    <Button asChild size="sm" className="hidden h-8 gap-1.5 xl:flex">
                      <Link href={APP_ROUTES.BILLING}>
                        <Plus className="h-3.5 w-3.5" />
                        New Bill
                      </Link>
                    </Button>
                  </>
                )}

                {isSuperAdmin && !impersonating && (
                  <Button asChild size="sm" variant="outline" className="hidden h-8 md:flex">
                    <Link href={APP_ROUTES.ADMIN}>Portal</Link>
                  </Button>
                )}

                <Button
                  variant="outline"
                  size="sm"
                  className="hidden h-8 w-8 p-0 items-center justify-center transition-all active:scale-95 sm:flex xl:w-auto xl:px-3 xl:gap-1.5"
                  aria-label="Refresh page"
                  onClick={() => router.refresh()}
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  <span className="hidden text-xs font-semibold xl:inline">Refresh</span>
                </Button>

                <div className="hidden h-5 w-px bg-border sm:block" />
                <div className="hidden sm:block">
                  <NotificationBell />
                </div>
                <ThemeToggle />
                <UserAccountMenu />
              </div>
            </div>
          </header>

          <div
            className={cn(
              "min-h-0 flex-1",
              isBillingRoute ? "overflow-hidden" : "overflow-y-auto p-0 pb-[calc(5rem+env(safe-area-inset-bottom))] lg:pb-6"
            )}
          >
            <div
              className={cn(
                isBillingRoute ? "flex h-full min-h-0 flex-col overflow-hidden" : "p-4 md:p-6 xl:p-8"
              )}
            >
              {children}
            </div>
          </div>
        </SidebarInset>

        <CommandDialog open={commandOpen} onOpenChange={setCommandOpen}>
          <CommandInput placeholder="Search pages and actions..." />
          <CommandList className="border-t border-border">
            <CommandEmpty className="py-6 text-center text-sm text-muted-foreground">
              <Search className="mx-auto mb-2 h-8 w-8 opacity-30" />
              No matching pages found.
            </CommandEmpty>
            {visibleSidebarGroups.map((group) => (
              <CommandGroup key={group.label} heading={group.label}>
                {group.items.map((item) => {
                  const Icon = item.icon;
                  return (
                    <CommandItem
                      key={item.path}
                      value={`${item.title} ${item.keywords.join(" ")}`}
                      onSelect={() => handleNavigate(item.path)}
                      className="flex cursor-pointer items-center gap-3 rounded-md px-4 py-2.5 hover:bg-accent aria-selected:bg-accent"
                    >
                      <Icon className="h-4 w-4 text-primary" />
                      <span className="text-sm font-semibold text-foreground">{item.title}</span>
                      <span className="ml-auto font-mono text-[10px] text-muted-foreground">
                        {item.path}
                      </span>
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            ))}
            <CommandGroup heading="Actions">
              <CommandItem
                value="refresh page"
                onSelect={() => {
                  setCommandOpen(false);
                  router.refresh();
                }}
                className="flex cursor-pointer items-center gap-3 rounded-md px-4 py-2.5 hover:bg-accent"
              >
                <RefreshCw className="h-4 w-4 text-primary" />
                <span className="text-sm font-semibold text-foreground">Refresh Page</span>
              </CommandItem>
            </CommandGroup>
          </CommandList>
        </CommandDialog>

        {/* <BottomNav /> */}
      </SidebarProvider>
    </RequireAuth>
  );
}
