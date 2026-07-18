"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { notificationService } from "@/services/notification.service";
import { useAuth } from "@/components/auth/auth-provider";
import toast from "react-hot-toast";

export function useNotifications() {
  const { token, user } = useAuth();
  const queryClient = useQueryClient();

  const { data: unreadCount = 0 } = useQuery({
    queryKey: ["notifications", "unread-count", user?.id],
    // We don't fetch from API anymore. It is populated by the global socket listener on connect.
    queryFn: () => 0,
    enabled: false,
    initialData: 0,
  });

  const useNotificationsList = (page = 1, limit = 20, enabled = true) => {
    return useQuery({
      queryKey: ["notifications", "list", page, limit, user?.id],
      queryFn: async () => {
        if (!token) return { items: [], totalPages: 1 };
        return notificationService.getNotifications(token, { page, limit });
      },
      enabled: !!token && enabled,
    });
  };

  const markAsReadMutation = useMutation({
    mutationFn: async (id: string) => {
      if (!token) throw new Error("No token");
      return notificationService.markAsRead(id, token);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
    onError: () => {
      toast.error("Failed to mark notification as read");
    }
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      if (!token) throw new Error("No token");
      return notificationService.markAllAsRead(token);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      toast.success("All notifications marked as read");
    },
    onError: () => {
      toast.error("Failed to mark all as read");
    }
  });

  return {
    unreadCount,
    useNotificationsList,
    markAsRead: markAsReadMutation.mutateAsync,
    markAllAsRead: markAllAsReadMutation.mutateAsync,
    isMarkingAllRead: markAllAsReadMutation.isPending,
  };
}
