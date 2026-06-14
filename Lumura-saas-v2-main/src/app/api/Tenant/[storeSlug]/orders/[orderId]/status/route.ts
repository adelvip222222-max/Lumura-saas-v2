// src/app/api/tenant/[storeSlug]/orders/[orderId]/status/route.ts

import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db/mongodb";
import Order from "@/models/Order";
import Store from "@/models/Store";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import mongoose from "mongoose";

/**
 * PATCH /api/tenant/[storeSlug]/orders/[orderId]/status
 * تحديث حالة الطلب
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: { storeSlug: string; orderId: string } }
) {
  try {
    // ✅ التحقق من الجلسة
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: "غير مصرح لك بالوصول" },
        { status: 401 }
      );
    }

    // ✅ استخراج المعاملات
    const { storeSlug, orderId } = params;
    
    // ✅ قراءة body
    let body;
    try {
      body = await req.json();
    } catch (error) {
      return NextResponse.json(
        { success: false, error: "بيانات الطلب غير صالحة" },
        { status: 400 }
      );
    }

    const { status } = body;

    console.log("📝 Tenant API: Updating order status", {
      storeSlug,
      orderId,
      status,
      userId: session.user.id,
    });

    // ✅ التحقق من صحة المدخلات
    if (!storeSlug || typeof storeSlug !== "string") {
      return NextResponse.json(
        { success: false, error: "معرف المتجر غير صالح" },
        { status: 400 }
      );
    }

    if (!orderId || typeof orderId !== "string") {
      return NextResponse.json(
        { success: false, error: "معرف الطلب غير صالح" },
        { status: 400 }
      );
    }

    // ✅ التحقق من صحة ObjectId
    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      return NextResponse.json(
        { success: false, error: "صيغة معرف الطلب غير صالحة" },
        { status: 400 }
      );
    }

    // ✅ التحقق من الحالة
    const validStatuses = [
      "pending",
      "confirmed",
      "processing",
      "shipped",
      "delivered",
      "cancelled",
    ];

    if (!status || !validStatuses.includes(status)) {
      return NextResponse.json(
        { 
          success: false, 
          error: "حالة الطلب غير صالحة",
          validStatuses 
        },
        { status: 400 }
      );
    }

    // ✅ الاتصال بقاعدة البيانات
    await connectToDatabase();

    // ✅ البحث عن المتجر
    const store = await Store.findOne({ slug: storeSlug });
    if (!store) {
      console.error("❌ Store not found:", storeSlug);
      return NextResponse.json(
        { success: false, error: "المتجر غير موجود" },
        { status: 404 }
      );
    }

    console.log("✅ Store found:", store._id);

    // ✅ تحديث حالة الطلب
    const updateData: any = {
      status,
    };

    // ✅ تحديث حالة الدفع تلقائياً
    if (status === "delivered") {
      updateData.paymentStatus = "paid";
    } else if (status === "cancelled") {
      updateData.paymentStatus = "cancelled";
    }

    const order = await Order.findOneAndUpdate(
      {
        _id: new mongoose.Types.ObjectId(orderId),
        storeId: store._id,
      },
      updateData,
      { new: true }
    );

    if (!order) {
      console.error("❌ Order not found:", orderId);
      return NextResponse.json(
        { success: false, error: "الطلب غير موجود" },
        { status: 404 }
      );
    }

    console.log("✅ Order status updated:", {
      orderId: order._id,
      orderNumber: order.orderNumber,
      newStatus: status,
    });

    // ✅ تحديث المسارات
    try {
      revalidatePath(`/dashboard/stores/${storeSlug}/orders`);
      revalidatePath(`/dashboard/stores/${storeSlug}/orders/${orderId}`);
    } catch (error) {
      console.warn("⚠️ Revalidation warning:", error);
    }

    // ✅ إرجاع النتيجة
    return NextResponse.json({
      success: true,
      message: `تم تحديث حالة الطلب ${order.orderNumber} إلى "${status}"`,
      data: {
        orderId: order._id.toString(),
        orderNumber: order.orderNumber,
        status: status,
        paymentStatus: updateData.paymentStatus || order.paymentStatus,
      },
    });

  } catch (error: any) {
    console.error("❌ Update order status error:", error);
    
    return NextResponse.json(
      {
        success: false,
        error: "فشل في تحديث حالة الطلب",
        details: process.env.NODE_ENV === "development" ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/tenant/[storeSlug]/orders/[orderId]/status
 * جلب حالة الطلب الحالية
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { storeSlug: string; orderId: string } }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: "غير مصرح لك بالوصول" },
        { status: 401 }
      );
    }

    const { storeSlug, orderId } = params;

    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      return NextResponse.json(
        { success: false, error: "صيغة معرف الطلب غير صالحة" },
        { status: 400 }
      );
    }

    await connectToDatabase();

    const store = await Store.findOne({ slug: storeSlug });
    if (!store) {
      return NextResponse.json(
        { success: false, error: "المتجر غير موجود" },
        { status: 404 }
      );
    }

    const order = await Order.findOne({
      _id: new mongoose.Types.ObjectId(orderId),
      storeId: store._id,
    }).select("status paymentStatus orderNumber");

    if (!order) {
      return NextResponse.json(
        { success: false, error: "الطلب غير موجود" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        orderId: order._id.toString(),
        orderNumber: order.orderNumber,
        status: order.status,
        paymentStatus: order.paymentStatus,
      },
    });

  } catch (error: any) {
    console.error("Get order status error:", error);
    return NextResponse.json(
      { success: false, error: "فشل في جلب حالة الطلب" },
      { status: 500 }
    );
  }
}