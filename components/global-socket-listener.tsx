"use client";

import { useEffect } from "react";
import { useSocket } from "@/hooks/useSocket";
import { authService } from "@/services/auth.service";
import { useDispatch } from "react-redux";
import { updateUser } from "@/store/authSlice";

export function GlobalSocketListener() {
  const { socket, isConnected } = useSocket();
  const dispatch = useDispatch();

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

    socket.on("subscriptionUpdated", handleSubscriptionUpdated);

    return () => {
      socket.off("subscriptionUpdated", handleSubscriptionUpdated);
    };
  }, [socket, isConnected, dispatch]);

  return null;
}
