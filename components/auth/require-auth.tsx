"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "./auth-provider";

const PUBLIC_ROUTES = ["/login", "/subscribe"];

export function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user, isLoading, isTrialExpired } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) {
      return;
    }
    const isPublic = PUBLIC_ROUTES.some((route) => pathname.startsWith(route));
    if (!isPublic && !user) {
      router.replace("/login");
      return;
    }
    
    // Redirect to subscribe if trial expired and not on subscribe page
    if (user && isTrialExpired && !pathname.startsWith("/subscribe") && user.role !== "superadmin") {
      router.replace("/subscribe");
    }
  }, [isLoading, pathname, router, user, isTrialExpired]);

  const isPublic = PUBLIC_ROUTES.some((route) => pathname.startsWith(route));
  if (isPublic) {
    return <>{children}</>;
  }
  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center text-sm text-muted">
        Checking access...
      </div>
    );
  }
  if (!user) {
    return null;
  }
  
  if (isTrialExpired && user.role !== "superadmin" && !pathname.startsWith("/subscribe")) {
    return null;
  }

  return <>{children}</>;
}
