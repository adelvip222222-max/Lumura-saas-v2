"use server";

import "server-only";
/* eslint-disable @typescript-eslint/no-explicit-any */
import { revalidatePath } from "next/cache";
import mongoose from "mongoose";
import { getAdministrationContext } from "@/lib/administration/context";
import { connectToDatabase } from "@/lib/db/mongodb";
import Order from "@/models/Order";
import { notifyTenantUsers } from "@/actions/notifications";

const orderStatuses = [
  "pending",
  "confirmed",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
  "refunded",
] as const;

const paymentStatuses = ["pending", "paid", "failed", "refunded"] as const;

export async function getAdministrationOrders() {
  const ctx = await getAdministrationContext("manage_orders");
  await connectToDatabase();

  const orders = await Order.find({ storeId: ctx.storeId })
    .select(
      "orderNumber status paymentStatus paymentMethod total items shippingAddress trackingNumber notes createdAt updatedAt"
    )
    .sort({ createdAt: -1 })
    .limit(50)
    .lean();

  return {
    store: {
      name: ctx.storeName,
      slug: ctx.storeSlug,
    },
    orders: orders.map((order: any) => ({
      id: order._id.toString(),
      orderNumber: order.orderNumber,
      customerName: order.shippingAddress?.fullName ?? "عميل",
      customerPhone: order.shippingAddress?.phone ?? "",
      address: [
        order.shippingAddress?.street,
        order.shippingAddress?.city,
        order.shippingAddress?.state,
        order.shippingAddress?.country,
      ]
        .filter(Boolean)
        .join(" - "),
      status: order.status,
      paymentStatus: order.paymentStatus,
      paymentMethod: order.paymentMethod,
      total: order.total ?? 0,
      itemsCount: order.items?.length ?? 0,
      items:
        order.items?.map((item: any) => ({
          name: item.name,
          sku: item.sku,
          quantity: item.quantity,
          subtotal: item.subtotal,
        })) ?? [],
      trackingNumber: order.trackingNumber ?? "",
      notes: order.notes ?? "",
      createdAt: order.createdAt ? new Date(order.createdAt).toISOString() : null,
      updatedAt: order.updatedAt ? new Date(order.updatedAt).toISOString() : null,
    })),
  };
}

export async function updateAdministrationOrderAction(formData: FormData) {
  const ctx = await getAdministrationContext("manage_orders");
  await connectToDatabase();

  const orderId = String(formData.get("orderId") ?? "");
  const status = String(formData.get("status") ?? "");
  const paymentStatus = String(formData.get("paymentStatus") ?? "");
  const trackingNumber = String(formData.get("trackingNumber") ?? "").trim();
  const notes = String(formData.get("notes") ?? "").trim();

  if (!mongoose.Types.ObjectId.isValid(orderId)) {
    return { success: false, error: "معرف الطلب غير صالح" };
  }

  if (!orderStatuses.includes(status as any) || !paymentStatuses.includes(paymentStatus as any)) {
    return { success: false, error: "حالة الطلب أو الدفع غير صالحة" };
  }

  const order = await Order.findOne({ _id: orderId, storeId: ctx.storeId });
  if (!order) return { success: false, error: "الطلب غير موجود" };

  const previousStatus = order.status;
  order.status = status as any;
  order.paymentStatus = paymentStatus as any;
  order.trackingNumber = trackingNumber;
  order.notes = notes;
  if (status === "delivered" && previousStatus !== "delivered") order.deliveredAt = new Date();
  if (status === "cancelled" && previousStatus !== "cancelled") order.cancelledAt = new Date();
  await order.save();

  await notifyTenantUsers({
    tenantId: ctx.tenantId,
    storeId: ctx.storeId,
    type: "order_status_updated",
    title: "Order status updated",
    titleAr: "تم تعديل حالة طلب",
    message: `Order ${order.orderNumber} is now ${status}`,
    messageAr: `تم تغيير حالة الطلب ${order.orderNumber} إلى ${status}`,
    link: `/ad-i-orders`,
    metadata: { orderId: order._id.toString(), orderNumber: order.orderNumber, status },
  });

  revalidatePath("/ad-i-orders");
  return { success: true, message: "تم تحديث الطلب بنجاح" };
}
