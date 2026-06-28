"use client";

import { useRouter, usePathname } from "next/navigation";
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
import { cn } from "@/lib/utils";
import { APP_ROUTES } from "@/lib/routes";

export function AppSidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const { isMobile, setOpenMobile } = useSidebar();
  const visibleSidebarGroups = useVisibleSidebarGroups();

  const closeMobileSidebar = () => {
    if (isMobile) setOpenMobile(false);
  };

  const navigate = (path: string) => {
    router.push(path);
    closeMobileSidebar();
  };

  return (
    <Sidebar collapsible="icon" variant="sidebar" className="border-sidebar-border">
      <SidebarHeader className="border-b border-sidebar-border p-3">
        <div className="flex items-center gap-2.5 px-1 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-sidebar-primary text-[11px] font-bold text-sidebar-primary-foreground shadow-sm">
            OP
          </div>
          <div className="flex min-w-0 flex-col group-data-[collapsible=icon]:hidden">
            <span className="truncate text-[11px] font-extrabold uppercase leading-tight tracking-wider text-sidebar-foreground">
              Outlet Pulse
            </span>
            <span className="truncate text-[9px] font-semibold uppercase leading-tight tracking-wider text-sidebar-foreground/60">
              Operations Hub
            </span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="overflow-x-hidden overflow-y-auto py-2">
        {visibleSidebarGroups.map((group) => (
          <SidebarGroup key={group.label}>
            <SidebarGroupLabel className="px-3 text-[10px] font-bold uppercase tracking-widest text-sidebar-foreground/50 group-data-[collapsible=icon]:hidden">
              {group.label}
            </SidebarGroupLabel>
            <SidebarGroupContent className="mt-0.5">
              <SidebarMenu>
                {group.items.map((item) => {
                  const isActive =
                    pathname === item.path ||
                    (item.path !== APP_ROUTES.DASHBOARD && pathname.startsWith(item.path + "/"));
                  const Icon = item.icon;
                  return (
                    <SidebarMenuItem key={item.path}>
                      <SidebarMenuButton
                        isActive={isActive}
                        tooltip={item.title}
                        className={cn(
                          "relative gap-3 px-3 py-2 text-sm font-semibold transition-all duration-150",
                          isActive
                            ? "bg-sidebar-accent text-sidebar-primary shadow-sm before:absolute before:left-0 before:top-1/2 before:h-5 before:w-[3px] before:-translate-y-1/2 before:rounded-r-full before:bg-sidebar-primary"
                            : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                        )}
                        onClick={() => navigate(item.path)}
                      >
                        <Icon className="h-4 w-4 shrink-0" />
                        <span className="group-data-[collapsible=icon]:hidden">{item.title}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border p-2">
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
