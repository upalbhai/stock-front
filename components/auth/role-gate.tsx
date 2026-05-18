"use client";

import { useAuth, type UserRole } from "./auth-provider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function RoleGate({
  allowed,
  children,
  fallback
}: {
  allowed: readonly UserRole[];
  children: React.ReactNode;
  fallback?: React.ReactNode;
}) {
  const { user } = useAuth();
  if (!user) {
    return null;
  }
  if (!allowed.includes(user.role)) {
    return (
      fallback || (
        <Card>
          <CardHeader>
            <CardTitle>Access restricted</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted">
              Your role does not have permission for this section.
            </p>
          </CardContent>
        </Card>
      )
    );
  }
  return <>{children}</>;
}
