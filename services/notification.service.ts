import { getJson, apiFetch } from "@/lib/api-client";

export const notificationService = {
  getNotifications: (token: string, params?: Record<string, any>) => 
    getJson<{ items: any[]; totalPages: number }>("/notifications", token, params),
    
  markAsRead: (id: string, token: string) => 
    apiFetch(`/notifications/${id}/read`, { method: "PATCH", token }),
    
  markAllAsRead: (token: string) => 
    apiFetch("/notifications/mark-all-read", { method: "POST", token }),
    
  getUnreadCount: (token: string) => 
    getJson<{ count: number }>("/notifications/unread-count", token),
};
