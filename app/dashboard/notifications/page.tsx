"use client";

import React, { useState } from "react";
import { useNotifications } from "@/hooks/useNotifications";
import {
  Bell,
  CheckCheck,
  Loader2,
  Package,
  ShoppingCart,
  AlertTriangle,
  Info,
  Clock,
  ArrowRight,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatDistanceToNow } from "date-fns";
import Link from "next/link";
import { RoleGate } from "@/components/auth/role-gate";
import { useFeature } from "@/hooks/useFeature";
import { cn } from "@/lib/utils";

function getNotificationIcon(title: string, body: string) {
  const text = `${title} ${body}`.toLowerCase();
  if (text.includes("stock") || text.includes("inventory") || text.includes("product")) {
    return <Package className="h-4 w-4 text-amber-600 dark:text-amber-400" />;
  }
  if (text.includes("order") || text.includes("bill") || text.includes("checkout")) {
    return <ShoppingCart className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />;
  }
  if (text.includes("security") || text.includes("login") || text.includes("password")) {
    return <ShieldCheck className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />;
  }
  return <Bell className="h-4 w-4 text-primary" />;
}

export default function NotificationsPage() {
  const hasNotifications = useFeature("notifications");
  const [page, setPage] = useState(1);
  const [activeTab, setActiveTab] = useState<"all" | "unread" | "read">("all");

  const { useNotificationsList, markAsRead, markAllAsRead, isMarkingAllRead } = useNotifications();
  const { data, isLoading, isFetching } = useNotificationsList(page, 25, hasNotifications);

  const rawItems = data?.items ?? [];
  const unreadItems = rawItems.filter((i: any) => !i.isRead);
  const readItems = rawItems.filter((i: any) => i.isRead);

  const displayedItems = React.useMemo(() => {
    if (activeTab === "unread") return unreadItems;
    if (activeTab === "read") return readItems;
    return rawItems;
  }, [activeTab, rawItems, unreadItems, readItems]);

  if (!hasNotifications) {
    return (
      <div className="rounded-2xl border border-border/70 bg-card p-10 text-center max-w-lg mx-auto my-12 shadow-sm">
        <div className="h-14 w-14 rounded-2xl bg-primary/10 text-primary mx-auto flex items-center justify-center border border-primary/20 mb-4">
          <Bell className="h-7 w-7" />
        </div>
        <h1 className="text-xl font-bold text-foreground">Notifications Unavailable</h1>
        <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
          Real-time notification feeds are not included in your current subscription tier.
        </p>
      </div>
    );
  }

  return (
    <RoleGate allowed={["owner", "manager", "staff"]}>
      <div className="space-y-6 max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/60 pb-5">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight text-foreground">Notifications</h1>
              {unreadItems.length > 0 && (
                <Badge variant="warning" className="text-xs font-bold px-2 py-0.5">
                  {unreadItems.length} New
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground mt-0.5">
              Review real-time system alerts, inventory threshold notifications, and order updates.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <Button
              variant="outline"
              size="sm"
              onClick={() => markAllAsRead()}
              disabled={isMarkingAllRead || unreadItems.length === 0}
              className="h-10 px-4 text-xs font-semibold gap-1.5 cursor-pointer"
            >
              {isMarkingAllRead ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <CheckCheck className="h-4 w-4" />
              )}
              <span>Mark All as Read</span>
            </Button>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
          <Card className="border border-border/70 bg-card shadow-2xs hover:shadow-xs transition-shadow">
            <CardContent className="p-4 flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  Unread Alerts
                </p>
                <p className={cn("text-xl font-extrabold tracking-tight mt-1 truncate", unreadItems.length > 0 ? "text-amber-600 dark:text-amber-400" : "text-foreground")}>
                  {unreadItems.length} Unread
                </p>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Action recommended
                </p>
              </div>
              <div className="h-10 w-10 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 border border-amber-500/20">
                <Bell className="h-5 w-5" />
              </div>
            </CardContent>
          </Card>

          <Card className="border border-border/70 bg-card shadow-2xs hover:shadow-xs transition-shadow">
            <CardContent className="p-4 flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  Total Received
                </p>
                <p className="text-xl font-extrabold text-foreground tracking-tight mt-1 truncate">
                  {rawItems.length} Notices
                </p>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  In your recent feed
                </p>
              </div>
              <div className="h-10 w-10 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 border border-indigo-500/20">
                <CheckCheck className="h-5 w-5" />
              </div>
            </CardContent>
          </Card>

          <Card className="border border-border/70 bg-card shadow-2xs hover:shadow-xs transition-shadow">
            <CardContent className="p-4 flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  Stock Alerts
                </p>
                <p className="text-xl font-extrabold text-foreground tracking-tight mt-1 truncate">
                  Inventory
                </p>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Threshold warnings
                </p>
              </div>
              <div className="h-10 w-10 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 border border-blue-500/20">
                <Package className="h-5 w-5" />
              </div>
            </CardContent>
          </Card>

          <Card className="border border-border/70 bg-card shadow-2xs hover:shadow-xs transition-shadow">
            <CardContent className="p-4 flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  Stream Status
                </p>
                <p className="text-xl font-extrabold text-emerald-600 dark:text-emerald-400 tracking-tight mt-1 truncate">
                  Live Sync
                </p>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Websocket connected
                </p>
              </div>
              <div className="h-10 w-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/20">
                <Sparkles className="h-5 w-5" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Notification Stream Card */}
        <Card className="border border-border/70 bg-card shadow-2xs">
          <CardHeader className="border-b border-border/40 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <CardTitle className="text-base font-bold text-foreground">Activity Stream</CardTitle>
              <CardDescription className="text-xs text-muted-foreground">
                Recent notifications and operational updates.
              </CardDescription>
            </div>

            <Tabs
              value={activeTab}
              onValueChange={(v) => setActiveTab(v as "all" | "unread" | "read")}
              className="w-auto shrink-0"
            >
              <TabsList className="h-9 bg-muted/60 p-0.5 border border-border/40 shrink-0">
                <TabsTrigger
                  value="all"
                  className="h-full text-xs px-3.5 font-semibold whitespace-nowrap shrink-0 text-muted-foreground hover:text-foreground data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-xs transition-all"
                >
                  All ({rawItems.length})
                </TabsTrigger>
                <TabsTrigger
                  value="unread"
                  className="h-full text-xs px-3.5 font-semibold whitespace-nowrap shrink-0 text-muted-foreground hover:text-foreground data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-xs transition-all"
                >
                  Unread ({unreadItems.length})
                </TabsTrigger>
                <TabsTrigger
                  value="read"
                  className="h-full text-xs px-3.5 font-semibold whitespace-nowrap shrink-0 text-muted-foreground hover:text-foreground data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-xs transition-all"
                >
                  Read ({readItems.length})
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </CardHeader>

          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-12 text-center text-muted-foreground">
                <Loader2 className="h-7 w-7 animate-spin mx-auto text-primary mb-3" />
                <p className="text-xs font-medium">Fetching notifications...</p>
              </div>
            ) : displayedItems.length === 0 ? (
              <div className="p-12 text-center text-muted-foreground">
                <Bell className="mx-auto h-12 w-12 opacity-20 mb-3" />
                <p className="text-sm font-semibold text-foreground">No notifications</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  You are all caught up with your store activity feed.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-border/50">
                {displayedItems.map((notif: any) => (
                  <div
                    key={notif._id}
                    className={cn(
                      "p-4 transition-colors hover:bg-muted/20 flex items-start gap-3.5",
                      !notif.isRead && "bg-primary/[0.03]"
                    )}
                  >
                    <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-muted/60 border border-border/60">
                      {getNotificationIcon(notif.title || "", notif.body || "")}
                    </div>

                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        {!notif.isRead && (
                          <span className="h-2 w-2 rounded-full bg-primary shrink-0 animate-pulse" />
                        )}
                        <h4 className="font-semibold text-xs text-foreground truncate">
                          {notif.title}
                        </h4>
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        {notif.body}
                      </p>

                      <div className="flex flex-wrap items-center gap-3 pt-1">
                        <span className="text-[11px] font-mono text-muted-foreground flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatDistanceToNow(new Date(notif.createdAt), { addSuffix: true })}
                        </span>

                        {notif.link && (
                          <Link
                            href={notif.link}
                            onClick={() => !notif.isRead && markAsRead(notif._id)}
                            className="inline-flex items-center gap-1 text-[11px] text-primary font-semibold hover:underline"
                          >
                            <span>View Details</span>
                            <ArrowRight className="h-3 w-3" />
                          </Link>
                        )}
                      </div>
                    </div>

                    {!notif.isRead && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => markAsRead(notif._id)}
                        className="h-8 px-2.5 text-xs font-semibold shrink-0 cursor-pointer"
                      >
                        Mark Read
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Pagination */}
            {data && data.totalPages > 1 && (
              <div className="border-t border-border/50 p-4 flex items-center justify-between">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1 || isFetching}
                  className="h-9 px-3 text-xs font-semibold cursor-pointer"
                >
                  Previous
                </Button>
                <span className="text-xs font-mono text-muted-foreground">
                  Page {page} of {data.totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.min(data.totalPages, p + 1))}
                  disabled={page === data.totalPages || isFetching}
                  className="h-9 px-3 text-xs font-semibold cursor-pointer"
                >
                  Next
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </RoleGate>
  );
}
