"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "./auth-provider";
import { APP_ROUTES } from "@/lib/routes";

export function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user, isLoading, isTrialExpired } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) {
      return;
    }
    if (!user) {
      router.replace(APP_ROUTES.LOGIN);
      return;
    }
    
    // Redirect to subscribe if trial expired and not on subscribe page
    if (
      user &&
      isTrialExpired &&
      !pathname.startsWith(APP_ROUTES.SUBSCRIBE) &&
      user.role !== "superadmin"
    ) {
      router.replace(APP_ROUTES.SUBSCRIBE);
    }
  }, [isLoading, pathname, router, user, isTrialExpired]);

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
  
  if (
    isTrialExpired &&
    user.role !== "superadmin" &&
    !pathname.startsWith(APP_ROUTES.SUBSCRIBE)
  ) {
    return null;
  }

  return <>{children}</>;
}
