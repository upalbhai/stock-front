"use client";

import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { ShieldCheck, Search, ChevronRight } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";

import { UserAccountMenu } from "@/components/layout/user-account-menu";
import { useVisibleSidebarGroups } from "@/components/layout/use-visible-sidebar";
import { useAuth } from "@/components/auth/auth-provider";
import { cn } from "@/lib/utils";
import { APP_ROUTES } from "@/lib/routes";

export function AppSidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, impersonating } = useAuth();
  const { isMobile, setOpenMobile } = useSidebar();
  const visibleSidebarGroups = useVisibleSidebarGroups();

  const isSuperAdmin = user?.role === "superadmin" && !impersonating;

  const closeMobileSidebar = () => {
    if (isMobile) setOpenMobile(false);
  };

  const navigate = (path: string) => {
    router.push(path);
    closeMobileSidebar();
  };

  const triggerCommandPalette = () => {
    document.dispatchEvent(new KeyboardEvent("keydown", { key: "k", metaKey: true, bubbles: true }));
  };

  return (
    <Sidebar collapsible="icon" variant="sidebar" className="border-sidebar-border transition-all duration-300">
      {/* ── SIDEBAR HEADER ──────────────────────────────────────────────── */}
      <SidebarHeader className="border-b border-sidebar-border p-3">
        <div className="flex items-center gap-3 px-1 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0">
          <div
            className={cn(
              "relative flex h-9 w-9 shrink-0 items-center justify-center rounded-xl font-bold shadow-xs transition-all duration-300",
              isSuperAdmin
                ? "bg-gradient-to-br from-primary via-primary/95 to-primary/80 text-primary-foreground shadow-[0_2px_10px_rgba(0,102,204,0.25)] ring-1 ring-primary/30 hover:scale-105"
                : "bg-sidebar-primary text-sidebar-primary-foreground"
            )}
          >
            {isSuperAdmin ? (
              <ShieldCheck className="h-5 w-5" />
            ) : (
              <span className="text-xs font-black tracking-wider">MH</span>
            )}
          </div>
          <div className="flex min-w-0 flex-1 flex-col group-data-[collapsible=icon]:hidden">
            <div className="flex items-center justify-between gap-1.5">
              <span className="truncate text-[13px] font-extrabold uppercase leading-tight tracking-wider text-sidebar-foreground">
                Mini Hisab
              </span>
              {isSuperAdmin && (
                <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-primary border border-primary/25">
                  <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                  Admin
                </span>
              )}
            </div>
            <span className="truncate text-[10px] font-medium leading-tight text-sidebar-foreground/60">
              {isSuperAdmin ? "Platform Console" : "Operations Hub"}
            </span>
          </div>
        </div>

        {/* Quick Command Trigger in Sidebar */}
        <button
          type="button"
          onClick={triggerCommandPalette}
          className="mt-3 flex w-full items-center justify-between rounded-lg border border-sidebar-border/80 bg-sidebar-accent/40 px-2.5 py-1.5 text-xs text-sidebar-foreground/60 transition-all hover:bg-sidebar-accent hover:text-sidebar-foreground hover:border-sidebar-border group-data-[collapsible=icon]:hidden cursor-pointer"
          aria-label="Search menu items"
        >
          <span className="flex items-center gap-2">
            <Search className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-[11px] font-medium">Quick jump...</span>
          </span>
          <kbd className="pointer-events-none rounded border border-sidebar-border/80 bg-background/80 px-1.5 py-0.5 font-mono text-[9px] font-semibold text-muted-foreground shadow-2xs">
            ⌘K
          </kbd>
        </button>
      </SidebarHeader>

      {/* ── SIDEBAR CONTENT ─────────────────────────────────────────────── */}
      <SidebarContent className="overflow-x-hidden overflow-y-auto py-2">
        {visibleSidebarGroups.map((group) => (
          <SidebarGroup key={group.label} className="py-1">
            <SidebarGroupLabel className="group-data-[collapsible=icon]:hidden flex items-center justify-between px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-widest text-sidebar-foreground/45 select-none">
              <span>{group.label}</span>
              <span className="h-px flex-1 ml-2 bg-sidebar-border/50" />
            </SidebarGroupLabel>
            <SidebarGroupContent className="mt-0.5 space-y-0.5">
              <SidebarMenu>
                {group.items.map((item) => {
                  const isRootPath =
                    item.path === APP_ROUTES.DASHBOARD ||
                    item.path === APP_ROUTES.ADMIN ||
                    item.path === APP_ROUTES.AGENT;

                  const hasExactMatch = visibleSidebarGroups.some((g) =>
                    g.items.some((i) => i.path === pathname)
                  );

                  const isActive = hasExactMatch
                    ? pathname === item.path
                    : pathname === item.path || (!isRootPath && pathname.startsWith(item.path + "/"));

                  const Icon = item.icon;
                  return (
                    <SidebarMenuItem key={item.path}>
                      <SidebarMenuButton
                        isActive={isActive}
                        tooltip={item.title}
                        className={cn(
                          "group/item relative flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] font-medium transition-all duration-150 cursor-pointer",
                          "hover:bg-sidebar-accent/80 hover:text-sidebar-foreground hover:translate-x-1",
                          "data-[active=true]:bg-primary/10 data-[active=true]:text-primary data-[active=true]:font-semibold data-[active=true]:border data-[active=true]:border-primary/20 data-[active=true]:shadow-2xs",
                          "data-[active=true]:before:absolute data-[active=true]:before:left-0 data-[active=true]:before:top-1/2 data-[active=true]:before:h-4 data-[active=true]:before:w-[3px] data-[active=true]:before:-translate-y-1/2 data-[active=true]:before:rounded-r-full data-[active=true]:before:bg-primary data-[active=true]:before:shadow-[0_0_8px_rgba(0,102,204,0.5)]"
                        )}
                        onClick={() => navigate(item.path)}
                      >
                        <Icon
                          className={cn(
                            "h-[17px] w-[17px] shrink-0 transition-transform duration-150 group-hover/item:scale-110",
                            isActive ? "text-primary" : "text-sidebar-foreground/70 group-hover/item:text-sidebar-foreground"
                          )}
                        />
                        <span className="truncate group-data-[collapsible=icon]:hidden font-medium">
                          {item.title}
                        </span>

                        {item.badge ? (
                          <span
                            className={cn(
                              "ml-auto text-[9px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wider group-data-[collapsible=icon]:hidden shrink-0 transition-transform group-hover/item:scale-105",
                              item.badgeVariant === "warning" && "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20",
                              item.badgeVariant === "success" && "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20",
                              item.badgeVariant === "primary" && "bg-primary/10 text-primary border border-primary/20",
                              (!item.badgeVariant || item.badgeVariant === "neutral") && "bg-muted text-muted-foreground border border-border/80"
                            )}
                          >
                            {item.badge}
                          </span>
                        ) : isActive ? (
                          <span className="ml-auto h-1.5 w-1.5 rounded-full bg-primary group-data-[collapsible=icon]:hidden shrink-0 animate-pulse" />
                        ) : null}
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      {/* ── SIDEBAR FOOTER ──────────────────────────────────────────────── */}
      <SidebarFooter className="border-t border-sidebar-border p-2">
        {isSuperAdmin && (
          <div className="mx-1 mb-2 rounded-xl border border-border/70 bg-muted/30 p-2.5 shadow-2xs group-data-[collapsible=icon]:hidden transition-all hover:bg-muted/50">
            <div className="flex items-center justify-between text-[11px]">
              <span className="flex items-center gap-1.5 font-semibold text-foreground">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                </span>
                Platform Operational
              </span>
              <span className="font-mono text-[9px] font-bold text-muted-foreground uppercase tracking-wider">
                Live
              </span>
            </div>
            <div className="mt-1.5 flex items-center justify-between text-[10px] text-muted-foreground">
              <span>SaaS Telemetry Active</span>
              <Link
                href={APP_ROUTES.ADMIN_SETTINGS}
                className="font-medium text-primary hover:underline flex items-center gap-0.5"
              >
                Settings <ChevronRight className="h-2.5 w-2.5" />
              </Link>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between gap-2 px-2 py-1 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0">
          <UserAccountMenu variant="sidebar" onNavigate={closeMobileSidebar} />
          <SidebarTrigger className="hidden shrink-0 text-sidebar-foreground/70 transition-colors hover:text-sidebar-foreground group-data-[collapsible=icon]:flex" />
        </div>

        <div className="hidden flex-col items-center gap-2 px-1 group-data-[collapsible=icon]:flex">
          <UserAccountMenu variant="sidebar-icon" onNavigate={closeMobileSidebar} />
        </div>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
