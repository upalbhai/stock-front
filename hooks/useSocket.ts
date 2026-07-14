import { useEffect, useState, useRef } from "react";
import { io, Socket } from "socket.io-client";
import { useAuth } from "@/components/auth/auth-provider";

let socketInstance: Socket | null = null;

export function useSocket() {
  const { token, user } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  
  // We use a ref so the same socket instance is tracked across renders
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    // Only connect if we have a token and user is logged in
    if (!token || !user) {
      if (socketInstance) {
        socketInstance.disconnect();
        socketInstance = null;
        setIsConnected(false);
      }
      return;
    }

    // Reuse existing singleton connection if available
    if (!socketInstance) {
      const url = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
      socketInstance = io(url, {
        auth: { token },
        transports: ["websocket", "polling"],
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
      });

      socketInstance.on("connect", () => {
        setIsConnected(true);
        console.log("Socket connected");
      });

      socketInstance.on("disconnect", () => {
        setIsConnected(false);
        console.log("Socket disconnected");
      });
      
      socketInstance.on("connect_error", (err) => {
        console.error("Socket connection error:", err.message);
      });
    }

    socketRef.current = socketInstance;
    setIsConnected(socketInstance.connected);

    // Don't disconnect on unmount of a single component since it's a singleton,
    // it will be disconnected when the token becomes null (user logs out).
  }, [token, user]);

  return {
    socket: socketRef.current,
    isConnected
  };
}
