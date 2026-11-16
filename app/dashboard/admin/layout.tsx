"use client";

import * as React from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { ShieldAlert, ShieldCheck, Store, ArrowLeft, Settings, Activity } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/components/auth/auth-provider";
import { APP_ROUTES } from "@/lib/routes";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  if (!user) {
    return null;
  }

  if (user.role !== "superadmin") {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 py-16 text-center animate-in fade-in duration-300">
        <div className="w-full max-w-md rounded-2xl border border-destructive/20 bg-card p-8 shadow-lg">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-destructive/10 text-destructive mb-5">
            <ShieldAlert className="h-7 w-7" />
          </div>
          <h2 className="text-xl font-bold tracking-tight text-foreground">Restricted Access</h2>
          <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
            Only Super Administrators with verified credentials can access this platform management portal.
          </p>
          <div className="mt-6 flex justify-center">
            <Button
              onClick={() => router.push(APP_ROUTES.DASHBOARD)}
              className="gap-2 cursor-pointer font-medium"
            >
              <ArrowLeft className="h-4 w-4" />
              Return to Store Dashboard
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* ── TOP ADMIN CONTEXT STRIP ────────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-2 rounded-xl border border-border/80 bg-muted/30 px-3 py-1.5 sm:px-3.5 sm:py-2 text-xs transition-colors">
        <div className="flex items-center gap-2 min-w-0">
          <span className="inline-flex items-center gap-1.5 rounded-md bg-primary/10 px-2 py-0.5 font-semibold text-primary shrink-0">
            <ShieldCheck className="h-3.5 w-3.5" />
            <span>Superadmin</span>
            <span className="hidden md:inline">Console</span>
          </span>

          <span className="hidden sm:inline-block text-muted-foreground/60">•</span>

          <span className="hidden sm:inline-flex items-center gap-1.5 text-muted-foreground font-medium truncate">
            <span className="relative flex h-2 w-2 shrink-0">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
            </span>
            <span>Production Platform Live</span>
          </span>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {pathname !== APP_ROUTES.ADMIN_SETTINGS && (
            <Button
              asChild
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0 sm:w-auto sm:px-2.5 sm:gap-1.5 text-xs text-muted-foreground hover:text-foreground cursor-pointer"
              title="Platform Settings"
            >
              <Link href={APP_ROUTES.ADMIN_SETTINGS}>
                <Settings className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Settings</span>
              </Link>
            </Button>
          )}

          <Button
            asChild
            variant="outline"
            size="sm"
            className="h-7 gap-1 px-2 sm:px-2.5 text-xs font-medium cursor-pointer shadow-2xs hover:bg-accent shrink-0"
          >
            <Link href={APP_ROUTES.DASHBOARD}>
              <Store className="h-3.5 w-3.5 text-primary" />
              <span>Store Ops</span>
            </Link>
          </Button>
        </div>
      </div>

      {/* ── PAGE CONTENT WRAPPER WITH CLEAN ENTRANCE ANIMATION ───────────── */}
      <div className="animate-in fade-in duration-300">
        {children}
      </div>
    </div>
  );
}
