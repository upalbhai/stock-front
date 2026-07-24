"use client";

import { useEffect } from "react";
import { useSocket } from "@/hooks/useSocket";
import { authService } from "@/services/auth.service";
import { useDispatch } from "react-redux";
import { updateUser } from "@/store/authSlice";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/components/auth/auth-provider";

export function GlobalSocketListener() {
  const { socket, isConnected } = useSocket();
  const dispatch = useDispatch();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  useEffect(() => {
    if (!socket || !isConnected) return;

    const handleSubscriptionUpdated = async () => {
      try {
        const response = await authService.getMe();
        if (response?.data?.user) {
          dispatch(updateUser(response.data.user));
        }
      } catch (error) {
        console.error("Failed to fetch updated user on subscription socket event:", error);
      }
    };

    // Fetch user on connect/reconnect to sync any missed updates while offline
    if (user?.id) {
      handleSubscriptionUpdated();
    }

    const handleUnreadCount = (data: { count: number }) => {
      if (user?.id) {
        queryClient.setQueryData(["notifications", "unread-count", user.id], data.count);
      }
    };

    const handleNewNotification = () => {
      if (user?.id) {
        queryClient.setQueryData<number>(
          ["notifications", "unread-count", user.id],
          (old) => (old || 0) + 1
        );
        // Also invalidate the notifications list so the bell gets the new item if it's open
        queryClient.invalidateQueries({ queryKey: ["notifications", "list"] });
      }
    };

    socket.on("subscriptionUpdated", handleSubscriptionUpdated);
    socket.on("maintenanceUpdated", handleSubscriptionUpdated);
    socket.on("notification:unread-count", handleUnreadCount);
    socket.on("notification:new", handleNewNotification);

    return () => {
      socket.off("subscriptionUpdated", handleSubscriptionUpdated);
      socket.off("maintenanceUpdated", handleSubscriptionUpdated);
      socket.off("notification:unread-count", handleUnreadCount);
      socket.off("notification:new", handleNewNotification);
    };
  }, [socket, isConnected, dispatch, queryClient, user?.id]);

  return null;
}
