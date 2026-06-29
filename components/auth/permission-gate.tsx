"use client";

import { useAuth } from "./auth-provider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function PermissionGate({
  module,
  action,
  children,
  fallback
}: {
  module: string;
  action: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}) {
  const { user } = useAuth();
  if (!user) {
    return null;
  }

  // Superadmin or owner (without specific roleId) have full access
  if (user.role === "superadmin" || (user.role === "owner" && !user.permissions?.length)) {
    return <>{children}</>;
  }

  // Check if the unified permissions array contains the module and action
  const hasPermission = user.permissions?.some(
    (p) => p.module === module && p.actions.includes(action)
  );

  if (!hasPermission) {
    return (
      fallback || (
        <Card>
          <CardHeader>
            <CardTitle>Access restricted</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted">
              You do not have permission to perform this action.
            </p>
          </CardContent>
        </Card>
      )
    );
  }

  return <>{children}</>;
}
