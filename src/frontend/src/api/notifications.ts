import { apiRequest } from "./client";
import { emptyResponseSchema, notificationListSchema } from "./schemas";
import type { NotificationList } from "./types";

export interface NotificationQuery {
  unreadOnly?: boolean;
  limit?: number;
  offset?: number;
}

export function getNotifications(
  token: string,
  { unreadOnly = false, limit = 50, offset = 0 }: NotificationQuery = {},
): Promise<NotificationList> {
  const params = new URLSearchParams({
    unread_only: String(unreadOnly),
    limit: String(limit),
    offset: String(offset),
  });
  return apiRequest(`/api/notifications?${params.toString()}`, {
    token,
    fallbackError: "Failed to load notifications.",
    schema: notificationListSchema,
  });
}

export function markNotificationAsRead(token: string, notificationId: number): Promise<unknown> {
  return apiRequest(`/api/notifications/${notificationId}/read`, {
    token,
    method: "PATCH",
    fallbackError: "Failed to mark notification as read.",
    schema: emptyResponseSchema,
  });
}

export function markAllNotificationsAsRead(token: string): Promise<unknown> {
  return apiRequest("/api/notifications/read-all", {
    token,
    method: "PATCH",
    fallbackError: "Failed to mark notifications as read.",
    schema: emptyResponseSchema,
  });
}

export function deleteNotification(token: string, notificationId: number): Promise<unknown> {
  return apiRequest(`/api/notifications/${notificationId}`, {
    token,
    method: "DELETE",
    fallbackError: "Failed to dismiss notification.",
    schema: emptyResponseSchema,
  });
}
