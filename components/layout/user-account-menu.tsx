"use client";

import { useRouter } from "next/navigation";
import { ChevronDown, LayoutDashboard, LogOut, User } from "lucide-react";
import { useAuth } from "@/components/auth/auth-provider";
import { useIsMobile } from "@/hooks/use-mobile";
import { Avatar } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { APP_ROUTES } from "@/lib/routes";

type UserAccountMenuProps = {
  variant?: "header" | "sidebar" | "sidebar-icon";
  className?: string;
  onNavigate?: () => void;
};

export function UserAccountMenu({
  variant = "header",
  className,
  onNavigate,
}: UserAccountMenuProps) {
  const router = useRouter();
  const { user, logout } = useAuth();
  const isMobile = useIsMobile();

  const displayName = user?.name ?? "User";
  const userRole = user?.role?.toUpperCase() ?? "STAFF";

  const run = (fn: () => void) => {
    fn();
    onNavigate?.();
  };

  const handleLogout = () => {
    logout();
    router.push(APP_ROUTES.LOGIN);
    onNavigate?.();
  };

  const isSidebar = variant === "sidebar" || variant === "sidebar-icon";
  const menuSide = isSidebar ? (isMobile ? "top" : "right") : "bottom";
  const menuAlign = isSidebar ? "start" : "end";

  const menuContent = (
    <>
      <DropdownMenuLabel className="font-normal">
        {variant === "header" ? (
          <div className="flex items-center gap-3">
            <Avatar name={displayName} size="lg" />
            <div className="flex flex-col">
              <p className="text-sm font-bold text-foreground">{displayName}</p>
              <p className="mt-0.5 text-[10px] font-semibold uppercase text-muted-foreground">
                {userRole}
              </p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-1">
            <p className="text-sm font-bold text-foreground">{displayName}</p>
            <p className="text-[10px] font-semibold uppercase text-muted-foreground">{userRole}</p>
          </div>
        )}
      </DropdownMenuLabel>
      <DropdownMenuSeparator />
      <DropdownMenuGroup>
        <DropdownMenuItem
          onClick={() => run(() => router.push(APP_ROUTES.SETTINGS))}
          className="cursor-pointer"
        >
          <User className="mr-2 h-4 w-4" />
          Settings
        </DropdownMenuItem>
        {variant === "header" && (
          <DropdownMenuItem
            onClick={() => run(() => router.push(APP_ROUTES.DASHBOARD))}
            className="cursor-pointer"
          >
            <LayoutDashboard className="mr-2 h-4 w-4" />
            Dashboard
          </DropdownMenuItem>
        )}
      </DropdownMenuGroup>
      <DropdownMenuSeparator />
      <DropdownMenuItem onClick={handleLogout} variant="destructive" className="cursor-pointer">
        <LogOut className="mr-2 h-4 w-4" />
        Sign Out
      </DropdownMenuItem>
    </>
  );

  if (variant === "sidebar") {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            className={cn(
              "flex min-w-0 flex-1 items-center gap-2.5 rounded-md p-1 text-left transition-colors hover:bg-sidebar-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring group-data-[collapsible=icon]:hidden",
              className
            )}
          >
            <Avatar name={displayName} size="sm" className="ring-2 ring-sidebar-border" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-bold leading-tight text-sidebar-foreground">
                {displayName}
              </p>
              <p className="truncate text-[9px] font-semibold uppercase leading-tight text-sidebar-foreground/60">
                {userRole}
              </p>
            </div>
            <ChevronDown className="h-3 w-3 shrink-0 text-sidebar-foreground/50" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          side={menuSide}
          align={menuAlign}
          sideOffset={8}
          collisionPadding={16}
          className="w-56"
        >
          {menuContent}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  if (variant === "sidebar-icon") {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            className={cn(
              "rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring",
              className
            )}
            aria-label="Account menu"
          >
            <Avatar name={displayName} size="sm" className="ring-2 ring-sidebar-border" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          side={menuSide}
          align={menuAlign}
          sideOffset={8}
          collisionPadding={16}
          className="w-56"
        >
          {menuContent}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className={cn(
            "rounded-full transition-transform hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            className
          )}
          aria-label="Account menu"
        >
          <Avatar
            name={displayName}
            size={isMobile ? "sm" : "md"}
            className="cursor-pointer ring-2 ring-border"
          />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        side={menuSide}
        align={menuAlign}
        sideOffset={6}
        collisionPadding={16}
        className="w-64"
      >
        {menuContent}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
