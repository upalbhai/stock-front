"use client";

import React, { useState } from "react";
import { useNotifications } from "@/hooks/useNotifications";
import { Bell, CheckCheck, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { formatDistanceToNow } from "date-fns";
import Link from "next/link";
import { RoleGate } from "@/components/auth/role-gate";

export default function NotificationsPage() {
  const [page, setPage] = useState(1);
  const { useNotificationsList, markAsRead, markAllAsRead, isMarkingAllRead } = useNotifications();
  const { data, isLoading, isFetching } = useNotificationsList(page, 20);

  return (
    <RoleGate allowed={["owner", "manager", "staff"]}>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Bell className="h-6 w-6 text-primary" /> Notifications
            </h1>
            <p className="text-sm text-muted">View all your alerts and activities.</p>
          </div>
          <Button 
            variant="outline" 
            onClick={() => markAllAsRead()} 
            disabled={isMarkingAllRead || !data?.items?.some((i: any) => !i.isRead)}
          >
            {isMarkingAllRead ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCheck className="mr-2 h-4 w-4" />}
            Mark all read
          </Button>
        </div>

        <Card>
          <CardHeader className="pb-4">
            <CardTitle>Recent Notifications</CardTitle>
            <CardDescription>Your latest updates across the platform.</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-8 flex justify-center text-muted-foreground">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : !data?.items?.length ? (
              <div className="p-12 text-center text-muted-foreground">
                <Bell className="mx-auto h-12 w-12 opacity-20 mb-4" />
                <p>No notifications found.</p>
              </div>
            ) : (
              <div className="flex flex-col divide-y">
                {data.items.map((notif: any) => (
                  <div key={notif._id} className={`p-4 transition-colors hover:bg-muted/50 ${!notif.isRead ? 'bg-primary/5' : ''}`}>
                    <div className="flex justify-between gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          {!notif.isRead && <span className="h-2 w-2 rounded-full bg-primary" />}
                          <h4 className="font-medium text-sm">{notif.title}</h4>
                        </div>
                        <p className="text-sm text-muted-foreground">{notif.body}</p>
                        <div className="flex items-center gap-4 mt-2">
                          <span className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(notif.createdAt), { addSuffix: true })}
                          </span>
                          {notif.link && (
                            <Link 
                              href={notif.link}
                              onClick={() => !notif.isRead && markAsRead(notif._id)}
                              className="text-xs text-primary font-medium hover:underline"
                            >
                              View Details &rarr;
                            </Link>
                          )}
                        </div>
                      </div>
                      {!notif.isRead && (
                        <Button variant="ghost" size="sm" onClick={() => markAsRead(notif._id)}>
                          Mark Read
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            {/* Pagination controls */}
            {data && data.totalPages > 1 && (
              <div className="border-t p-4 flex items-center justify-between">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1 || isFetching}
                >
                  Previous
                </Button>
                <span className="text-xs text-muted-foreground">
                  Page {page} of {data.totalPages}
                </span>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setPage(p => Math.min(data.totalPages, p + 1))}
                  disabled={page === data.totalPages || isFetching}
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
