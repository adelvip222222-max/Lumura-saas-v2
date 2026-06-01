"use server";

import { connectToDatabase } from "@/lib/db/mongodb";
import Notification from "@/models/Notification";
import User from "@/models/User";
import { auth } from "@/lib/auth";
import { serialize } from "@/lib/serialize";
import type { ApiResponse } from "@/types";
import type { INotification } from "@/models/Notification";
import mongoose from "mongoose";

type TenantNotificationInput = {
  tenantId: string;
  storeId?: string;
  type: INotification["type"];
  title: string;
  titleAr: string;
  message: string;
  messageAr: string;
  link?: string;
  metadata?: Record<string, unknown>;
  includeStaffRoles?: string[];
};

export async function notifyTenantUsers(input: TenantNotificationInput) {
  await connectToDatabase();

  const tenantObjectId = new mongoose.Types.ObjectId(input.tenantId);
  const storeObjectId = input.storeId ? new mongoose.Types.ObjectId(input.storeId) : undefined;
  const users = await User.find({
    tenantId: tenantObjectId,
    isActive: true,
    $or: [
      { role: { $in: ["tenant_admin", "store_admin"] } },
      ...(input.includeStaffRoles?.length
        ? [{ role: "store_staff", staffRole: { $in: input.includeStaffRoles } }]
        : []),
    ],
  })
    .select("_id")
    .lean();

  if (users.length === 0) return;

  await Notification.insertMany(
    users.map((user) => ({
      tenantId: tenantObjectId,
      storeId: storeObjectId,
      userId: user._id,
      type: input.type,
      title: input.title,
      titleAr: input.titleAr,
      message: input.message,
      messageAr: input.messageAr,
      link: input.link,
      metadata: input.metadata,
    }))
  );
}

// ─── Get my notifications ─────────────────────────────────────────────────────
export async function getNotificationsAction(
  limit = 20
): Promise<ApiResponse<{ notifications: INotification[]; unreadCount: number }>> {
  const session = await auth();
  if (!session?.user) return { success: false, error: "Authentication required" };

  try {
    await connectToDatabase();

    const [notifications, unreadCount] = await Promise.all([
      Notification.find({ userId: session.user.id })
        .sort({ createdAt: -1 })
        .limit(limit)
        .lean(),
      Notification.countDocuments({ userId: session.user.id, isRead: false }),
    ]);

    return {
      success: true,
      data: {
        notifications: serialize(notifications) as unknown as INotification[],
        unreadCount,
      },
    };
  } catch {
    return { success: false, error: "Failed to fetch notifications" };
  }
}

// ─── Mark notification as read ────────────────────────────────────────────────
export async function markNotificationReadAction(
  notificationId: string
): Promise<ApiResponse> {
  const session = await auth();
  if (!session?.user) return { success: false, error: "Authentication required" };

  try {
    await connectToDatabase();

    await Notification.findOneAndUpdate(
      { _id: notificationId, userId: session.user.id },
      { isRead: true }
    );

    return { success: true };
  } catch {
    return { success: false, error: "Failed to mark as read" };
  }
}

// ─── Mark all as read ─────────────────────────────────────────────────────────
export async function markAllNotificationsReadAction(): Promise<ApiResponse> {
  const session = await auth();
  if (!session?.user) return { success: false, error: "Authentication required" };

  try {
    await connectToDatabase();

    await Notification.updateMany(
      { userId: session.user.id, isRead: false },
      { isRead: true }
    );

    return { success: true, message: "All notifications marked as read" };
  } catch {
    return { success: false, error: "Failed to update notifications" };
  }
}

// ─── Delete notification ──────────────────────────────────────────────────────
export async function deleteNotificationAction(
  notificationId: string
): Promise<ApiResponse> {
  const session = await auth();
  if (!session?.user) return { success: false, error: "Authentication required" };

  try {
    await connectToDatabase();

    await Notification.findOneAndDelete({
      _id:    notificationId,
      userId: session.user.id,
    });

    return { success: true };
  } catch {
    return { success: false, error: "Failed to delete notification" };
  }
}
