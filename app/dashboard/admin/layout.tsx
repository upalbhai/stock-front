"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ShieldAlertIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/components/auth/auth-provider";
import { APP_ROUTES } from "@/lib/routes";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const router = useRouter();

  if (!user) {
    return null;
  }

  if (user.role !== "superadmin") {
    return (
      <div className="flex flex-col items-center justify-center space-y-4 py-20 text-center">
        <ShieldAlertIcon className="h-16 w-16 text-danger" />
        <h2 className="text-xl font-bold">Unauthorized Access</h2>
        <p className="text-sm text-muted-foreground">Only Super Administrators have access to this portal.</p>
        <Button onClick={() => router.push(APP_ROUTES.DASHBOARD)}>Return to Home</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>{children}</div>
    </div>
  );
}
