import { useCallback, useEffect, useState, type MouseEvent } from "react";
import { BellIcon } from "lucide-react";
import {
  deleteNotification,
  getNotifications,
  markAllNotificationsAsRead,
  markNotificationAsRead,
} from "../api/notifications";
import type { Notification as AppNotification } from "../api/types";
import { Alert, AlertDescription } from "./ui/alert";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { Skeleton } from "./ui/skeleton";

function formatNotificationDate(value: string): string {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString(undefined, { dateStyle: "short", timeStyle: "short" });
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Something went wrong. Please try again.";
}

interface NotificationBellProps {
  token: string;
  onNotificationClick?: (notification: AppNotification) => void | Promise<void>;
}

type ActionId = number | "all" | null;

function NotificationBell({ token, onNotificationClick }: NotificationBellProps) {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(Boolean(token));
  const [error, setError] = useState("");
  const [actionId, setActionId] = useState<ActionId>(null);

  const loadNotifications = useCallback(async () => {
    if (!token || isLoading) return;
    const hasExistingNotifications = notifications.length > 0;
    if (!hasExistingNotifications) setIsLoading(true);
    setError("");
    try {
      const data = await getNotifications(token);
      setNotifications(data.notifications);
      setUnreadCount(data.unread_count);
    } catch (caught) {
      setError(errorMessage(caught));
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, notifications.length, token]);

  useEffect(() => {
    if (!token) return undefined;
    let active = true;
    getNotifications(token)
      .then((data) => {
        if (!active) return;
        setNotifications(data.notifications);
        setUnreadCount(data.unread_count);
      })
      .catch((caught: unknown) => {
        if (active) setError(errorMessage(caught));
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });
    return () => {
      active = false;
    };
  }, [token]);

  async function handleNotificationClick(notification: AppNotification) {
    setActionId(notification.id);
    try {
      if (!notification.is_read) {
        await markNotificationAsRead(token, notification.id);
        setNotifications((current) =>
          current.map((item) => (item.id === notification.id ? { ...item, is_read: true } : item)),
        );
        setUnreadCount((count) => Math.max(0, count - 1));
      }
      setIsOpen(false);
      await onNotificationClick?.(notification);
    } catch (caught) {
      setError(errorMessage(caught));
    } finally {
      setActionId(null);
    }
  }

  async function handleDismiss(event: MouseEvent<HTMLButtonElement>, notificationId: number) {
    event.stopPropagation();
    setActionId(notificationId);
    try {
      const dismissed = notifications.find((notification) => notification.id === notificationId);
      await deleteNotification(token, notificationId);
      setNotifications((current) =>
        current.filter((notification) => notification.id !== notificationId),
      );
      if (dismissed && !dismissed.is_read) setUnreadCount((count) => Math.max(0, count - 1));
    } catch (caught) {
      setError(errorMessage(caught));
    } finally {
      setActionId(null);
    }
  }

  async function handleMarkAllRead() {
    if (!unreadCount) return;
    setActionId("all");
    try {
      await markAllNotificationsAsRead(token);
      setNotifications((current) =>
        current.map((notification) => ({ ...notification, is_read: true })),
      );
      setUnreadCount(0);
    } catch (caught) {
      setError(errorMessage(caught));
    } finally {
      setActionId(null);
    }
  }

  return (
    <DropdownMenu
      open={isOpen}
      onOpenChange={(open) => {
        setIsOpen(open);
        if (open) void loadNotifications();
      }}
    >
      <DropdownMenuTrigger
        render={
          <Button
            variant="ghost"
            size="icon"
            aria-label={unreadCount ? `Notifications (${unreadCount} unread)` : "Notifications"}
            aria-expanded={isOpen}
            onClick={() => {
              if (!isOpen) {
                setIsOpen(true);
                void loadNotifications();
              }
            }}
            className="relative text-muted-foreground"
          />
        }
      >
        <BellIcon aria-hidden="true" />
        {unreadCount > 0 && (
          <Badge
            variant="destructive"
            className="absolute -top-1 -right-1 min-w-4 px-1 text-[10px] leading-4"
          >
            {unreadCount > 99 ? "99+" : unreadCount}
          </Badge>
        )}
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-[min(22rem,calc(100vw-2rem))] p-0">
        <DropdownMenuGroup>
          <div className="flex items-center justify-between px-4 py-3">
            <DropdownMenuLabel className="p-0 text-foreground">Notifications</DropdownMenuLabel>
            <Button
              variant="link"
              size="xs"
              onClick={() => void handleMarkAllRead()}
              disabled={!unreadCount || actionId === "all"}
            >
              Mark all read
            </Button>
          </div>
          <DropdownMenuSeparator />
        </DropdownMenuGroup>

        {error && (
          <Alert variant="destructive" className="m-3">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {isLoading ? (
          <div className="flex flex-col gap-2 px-4 py-4" aria-label="Loading notifications">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        ) : notifications.length === 0 ? (
          <p className="px-4 py-6 text-center text-sm text-muted-foreground">
            You’re all caught up.
          </p>
        ) : (
          <DropdownMenuGroup>
            <div className="max-h-96 overflow-y-auto">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`flex items-start gap-3 border-b border-border px-4 py-3 last:border-b-0 ${notification.is_read ? "bg-background" : "bg-accent/50"}`}
                >
                  <button
                    type="button"
                    onClick={() => void handleNotificationClick(notification)}
                    disabled={actionId === notification.id}
                    className="min-w-0 flex-1 text-left transition hover:text-primary disabled:cursor-wait"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <span
                        className={
                          notification.is_read
                            ? "text-sm font-medium text-muted-foreground"
                            : "text-sm font-semibold text-foreground"
                        }
                      >
                        {notification.title}
                      </span>
                      {!notification.is_read && (
                        <span
                          className="mt-1 size-2 shrink-0 rounded-full bg-primary"
                          aria-label="Unread"
                        />
                      )}
                    </div>
                    <p className="mt-1 text-xs leading-5 text-muted-foreground">
                      {notification.message}
                    </p>
                    <span className="mt-2 block text-[11px] text-muted-foreground">
                      {formatNotificationDate(notification.created_at)}
                    </span>
                  </button>
                  <Button
                    variant="ghost"
                    size="xs"
                    onClick={(event) => void handleDismiss(event, notification.id)}
                    disabled={actionId === notification.id}
                    className="shrink-0 text-muted-foreground hover:text-destructive"
                  >
                    Dismiss
                  </Button>
                </div>
              ))}
            </div>
          </DropdownMenuGroup>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default NotificationBell;
