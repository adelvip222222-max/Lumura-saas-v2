"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { Bell, Check, CheckCheck, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  deleteNotificationAction,
  getNotificationsAction,
  markAllNotificationsReadAction,
  markNotificationReadAction,
} from "@/actions/notifications";
import { cn, formatRelativeTime } from "@/lib/utils";
import type { INotification } from "@/models/Notification";

const TYPE_ICONS: Record<string, string> = {
  subscription_expiring: "⏰",
  subscription_expired: "!",
  payment_success: "✓",
  payment_failed: "!",
  payment_approved: "✓",
  payment_rejected: "!",
  upgrade_success: "↑",
  limit_reached: "!",
  store_suspended: "!",
  store_activated: "✓",
  new_order: "#",
  low_stock: "!",
  order_status_updated: "↻",
  product_created: "+",
  product_review_required: "?",
  product_updated: "✓",
  product_deleted: "-",
};

export function NotificationsBell() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<INotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isPending, startTransition] = useTransition();

  const fetchNotifications = () => {
    startTransition(async () => {
      const result = await getNotificationsAction(20);
      if (result.success && result.data) {
        setNotifications(result.data.notifications);
        setUnreadCount(result.data.unreadCount);
      }
    });
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 60_000);
    return () => clearInterval(interval);
  }, []);

  const handleMarkRead = async (id: string) => {
    await markNotificationReadAction(id);
    setNotifications((prev) =>
      prev.map((n) => (n._id.toString() === id ? { ...n, isRead: true } : n))
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));
  };

  const handleMarkAllRead = async () => {
    await markAllNotificationsReadAction();
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setUnreadCount(0);
  };

  const handleDelete = async (id: string) => {
    const notif = notifications.find((n) => n._id.toString() === id);
    await deleteNotificationAction(id);
    setNotifications((prev) => prev.filter((n) => n._id.toString() !== id));
    if (notif && !notif.isRead) setUnreadCount((prev) => Math.max(0, prev - 1));
  };

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setOpen(!open)}
        aria-label={`Notifications (${unreadCount} unread)`}
        className="relative h-10 w-10 rounded-full p-0"
        disabled={isPending && notifications.length === 0}
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <Badge className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full p-0 text-xs">
            {unreadCount > 99 ? "99+" : unreadCount}
          </Badge>
        )}
      </Button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />

          <div className="absolute left-0 top-12 z-50 w-80 overflow-hidden rounded-xl border bg-white shadow-lg">
            <div className="flex items-center justify-between border-b px-4 py-3">
              <h3 className="text-sm font-semibold">الإشعارات</h3>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllRead}
                    className="flex items-center gap-1 text-xs text-orange-600 hover:underline"
                  >
                    <CheckCheck className="h-3.5 w-3.5" />
                    تعليم الكل كمقروء
                  </button>
                )}
                <button onClick={() => setOpen(false)} className="text-gray-500 hover:text-gray-900">
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="max-h-96 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-center">
                  <Bell className="mb-2 h-8 w-8 text-gray-300" />
                  <p className="text-sm text-gray-500">لا توجد إشعارات</p>
                </div>
              ) : (
                notifications.map((notif) => {
                  const content = (
                    <div
                      className={cn(
                        "flex items-start gap-3 border-b px-4 py-3 transition-colors last:border-0",
                        !notif.isRead && "bg-orange-50/60"
                      )}
                    >
                      <span className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full bg-gray-100 text-sm font-bold text-orange-600">
                        {TYPE_ICONS[notif.type] ?? "!"}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className={cn("text-sm", !notif.isRead && "font-semibold")}>
                          {notif.titleAr || notif.title}
                        </p>
                        <p className="mt-0.5 line-clamp-2 text-xs text-gray-500">
                          {notif.messageAr || notif.message}
                        </p>
                        <p className="mt-1 text-xs text-gray-400">
                          {formatRelativeTime(notif.createdAt)}
                        </p>
                      </div>
                    </div>
                  );

                  return (
                    <div key={notif._id.toString()} className="relative">
                      {notif.link ? (
                        <Link
                          href={notif.link}
                          onClick={() => {
                            handleMarkRead(notif._id.toString());
                            setOpen(false);
                          }}
                        >
                          {content}
                        </Link>
                      ) : (
                        content
                      )}
                      <div className="absolute left-2 top-3 flex gap-1">
                        {!notif.isRead && (
                          <button
                            onClick={() => handleMarkRead(notif._id.toString())}
                            className="text-gray-400 hover:text-orange-600"
                            title="تعليم كمقروء"
                          >
                            <Check className="h-3.5 w-3.5" />
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(notif._id.toString())}
                          className="text-gray-400 hover:text-red-600"
                          title="حذف"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
