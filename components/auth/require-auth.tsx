"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "./auth-provider";

const PUBLIC_ROUTES = ["/login"];

export function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) {
      return;
    }
    const isPublic = PUBLIC_ROUTES.some((route) => pathname.startsWith(route));
    if (!isPublic && !user) {
      router.replace("/login");
    }
  }, [isLoading, pathname, router, user]);

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

  return <>{children}</>;
}
