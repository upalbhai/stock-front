"use client";

import React, { useState } from "react";
import { Bell, CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useNotifications } from "@/hooks/useNotifications";
import { useFeature } from "@/hooks/useFeature";
import { 
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
} from "@/components/ui/dropdown-menu";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";

export function NotificationBell() {
  const hasNotifications = useFeature("notifications");
  const { unreadCount, useNotificationsList, markAsRead, markAllAsRead, isMarkingAllRead } = useNotifications();
  const [isOpen, setIsOpen] = useState(false);
  
  const { data, isLoading, error } = useNotificationsList(1, 10);
  const notifications = data?.items || [];

  if (!hasNotifications) return null;

  const handleNotificationClick = async (notification: any) => {
    if (!notification.isRead) {
      await markAsRead(notification._id);
    }
    setIsOpen(false);
  };

  const getIconForType = (type?: string) => {
    switch (type) {
      default:
        return <Bell className="w-4 h-4 text-zinc-500" />;
    }
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <button className="relative p-2 text-zinc-600 hover:text-black hover:bg-zinc-100 dark:text-zinc-300 dark:hover:text-white dark:hover:bg-zinc-800 rounded-full transition-colors focus:outline-none">
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <Badge
              variant="default"
              className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white shadow-sm ring-2 ring-white dark:ring-black px-0 py-0"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent className="w-80 md:w-96 p-0 z-[100] border-none shadow-xl rounded-xl" align="end" sideOffset={8}>
        <Card className="flex flex-col border-none shadow-none rounded-xl overflow-hidden dark:bg-zinc-950">
          <div className="px-4 py-3 border-b border-zinc-100 dark:border-zinc-800 flex justify-between items-center bg-zinc-50/50 dark:bg-zinc-900/50">
            <h3 className="font-bold text-sm flex items-center gap-2">
              <Bell className="w-4 h-4" /> Notifications
            </h3>
            <div className="flex gap-1">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={(e) => { e.preventDefault(); markAllAsRead(); }} 
                disabled={isMarkingAllRead || notifications.length === 0}
                className="h-7 px-2 text-[10px] uppercase tracking-wider font-bold text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950"
              >
                {isMarkingAllRead ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <CheckCircle2 className="w-3 h-3 mr-1" />} 
                Read All
              </Button>
            </div>
          </div>

          <div className="max-h-[60vh] overflow-y-auto">
            {isLoading ? (
              <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="p-4 flex gap-3 items-start animate-pulse">
                    <Skeleton className="w-8 h-8 rounded-full shrink-0 mt-0.5" />
                    <div className="flex-1 space-y-2">
                      <div className="flex justify-between items-center gap-2 mb-1.5">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-3 w-12" />
                      </div>
                      <Skeleton className="h-3 w-full max-w-[200px]" />
                      <Skeleton className="h-3 w-2/3" />
                    </div>
                  </div>
                ))}
              </div>
            ) : error ? (
              <div className="p-8 text-center text-red-500 text-sm">
                Failed to load notifications.
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-12 text-center flex flex-col items-center">
                <div className="w-12 h-12 bg-zinc-100 dark:bg-zinc-900 rounded-full flex items-center justify-center mb-3">
                  <Bell className="w-5 h-5 text-zinc-300" />
                </div>
                <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">All caught up!</p>
                <p className="text-xs text-zinc-500 mt-1">You have no new notifications.</p>
              </div>
            ) : (
              <ul className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {notifications.map((notif: any) => (
                  <li 
                    key={notif._id} 
                    className={cn(
                      "p-4 transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-900/50 relative group cursor-pointer",
                      !notif.isRead ? "bg-emerald-50/30 dark:bg-emerald-900/10" : ""
                    )}
                    onClick={() => {
                      if (!notif.isRead) {
                        handleNotificationClick(notif);
                      } else if (notif.link) {
                         setIsOpen(false);
                      }
                    }}
                  >
                    {!notif.isRead && (
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-emerald-500" />
                    )}
                    <div className="flex gap-3 items-start">
                      <div className={cn(
                        "p-2 rounded-full mt-0.5 shrink-0 transition-colors",
                        notif.isRead ? "bg-zinc-100 dark:bg-zinc-800" : "bg-white dark:bg-zinc-800 shadow-sm"
                      )}>
                        {getIconForType(notif.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start gap-2 mb-1">
                          <span className={cn(
                            "font-semibold text-sm truncate",
                            !notif.isRead ? "text-zinc-900 dark:text-white" : "text-zinc-600 dark:text-zinc-400"
                          )}>
                            {notif.title}
                          </span>
                          <span className="text-[10px] text-zinc-400 whitespace-nowrap shrink-0 mt-0.5">
                            {formatDistanceToNow(new Date(notif.createdAt), { addSuffix: true })}
                          </span>
                        </div>
                        <p className={cn(
                          "text-xs leading-relaxed",
                          !notif.isRead ? "text-zinc-700 dark:text-zinc-300" : "text-zinc-500"
                        )}>
                          {notif.body}
                        </p>
                        {notif.link && (
                          <Link 
                            href={notif.link}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleNotificationClick(notif);
                            }}
                            className="mt-2 text-xs font-medium text-emerald-600 hover:text-emerald-700 hover:underline w-fit inline-block"
                          >
                            View Details
                          </Link>
                        )}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="border-t border-zinc-100 dark:border-zinc-800 p-2 bg-zinc-50/50 dark:bg-zinc-900/50">
            <Button variant="ghost" className="w-full text-xs text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 font-medium" asChild onClick={() => setIsOpen(false)}>
              <Link href="/dashboard/notifications">View All Notifications</Link>
            </Button>
          </div>
        </Card>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
