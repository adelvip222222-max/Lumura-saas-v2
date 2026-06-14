// src/actions/order-status.ts
"use server";

import { connectToDatabase } from "@/lib/db/mongodb";
import Order from "@/models/Order";
import Store from "@/models/Store";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import mongoose from "mongoose";

/**
 * ✅ تحديث حالة الطلب - Server Action
 */
export async function updateOrderStatus(
  storeSlug: string,
  orderId: string,
  status: string
) {
  try {
    console.log("🔵 updateOrderStatus called:", { storeSlug, orderId, status });
    
    // ✅ التحقق من الجلسة
    const session = await auth();
    if (!session?.user) {
      console.error("🔴 No session found");
      return { 
        success: false, 
        error: "غير مصرح لك بالوصول. يرجى تسجيل الدخول أولاً." 
      };
    }

    console.log("🟢 User authenticated:", session.user.id);

    // ✅ التحقق من المدخلات
    if (!storeSlug) {
      console.error("🔴 storeSlug is missing");
      return { success: false, error: "معرف المتجر مفقود" };
    }

    if (!orderId) {
      console.error("🔴 orderId is missing");
      return { success: false, error: "معرف الطلب مفقود" };
    }

    if (!status) {
      console.error("🔴 status is missing");
      return { success: false, error: "الحالة الجديدة مفقودة" };
    }

    // ✅ التحقق من صحة ObjectId
    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      console.error("🔴 Invalid orderId format:", orderId);
      return { 
        success: false, 
        error: "صيغة معرف الطلب غير صالحة. يرجى التحقق من الرقم." 
      };
    }

    // ✅ التحقق من صحة الحالة
    const validStatuses = [
      'pending', 
      'confirmed', 
      'processing', 
      'shipped', 
      'delivered', 
      'cancelled'
    ];
    
    if (!validStatuses.includes(status)) {
      console.error("🔴 Invalid status:", status);
      return { 
        success: false, 
        error: `الحالة "${status}" غير صالحة. الحالات المتاحة: ${validStatuses.join(', ')}` 
      };
    }

    // ✅ الاتصال بقاعدة البيانات
    try {
      await connectToDatabase();
      console.log("🟢 Database connected");
    } catch (dbError: any) {
      console.error("🔴 Database connection failed:", dbError.message);
      return { 
        success: false, 
        error: "فشل الاتصال بقاعدة البيانات. يرجى المحاولة لاحقاً." 
      };
    }

    // ✅ البحث عن المتجر
    const store = await Store.findOne({ slug: storeSlug });
    if (!store) {
      console.error("🔴 Store not found:", storeSlug);
      return { 
        success: false, 
        error: `المتجر "${storeSlug}" غير موجود. يرجى التحقق من الرابط.` 
      };
    }

    console.log("🟢 Store found:", store._id, store.name);

    // ✅ البحث عن الطلب أولاً للتأكد من وجوده
    const existingOrder = await Order.findOne({
      _id: new mongoose.Types.ObjectId(orderId),
      storeId: store._id,
    });

    if (!existingOrder) {
      console.error("🔴 Order not found:", orderId);
      return { 
        success: false, 
        error: `الطلب برقم ${orderId} غير موجود في المتجر ${store.name}. قد يكون تم حذفه.` 
      };
    }

    console.log("🟢 Order found:", {
      orderNumber: existingOrder.orderNumber,
      currentStatus: existingOrder.status,
    });

    // ✅ التحقق من إمكانية تغيير الحالة
    if (existingOrder.status === status) {
      console.warn("⚠️ Order already has this status:", status);
      return { 
        success: false, 
        error: `الطلب بالفعل في حالة "${status}". لا يمكن تحديثه لنفس الحالة.` 
      };
    }

    // ✅ التحقق من تسلسل الحالات
    const statusFlow: Record<string, string[]> = {
      pending: ['confirmed', 'cancelled'],
      confirmed: ['processing', 'cancelled'],
      processing: ['shipped', 'cancelled'],
      shipped: ['delivered'],
      delivered: [],
      cancelled: [],
    };

    const allowedStatuses = statusFlow[existingOrder.status] || [];
    if (!allowedStatuses.includes(status)) {
      console.error("🔴 Invalid status transition:", {
        from: existingOrder.status,
        to: status,
        allowed: allowedStatuses,
      });
      
      const statusLabels: Record<string, string> = {
        confirmed: 'مؤكد',
        processing: 'قيد التجهيز',
        shipped: 'تم الشحن',
        delivered: 'تم التوصيل',
        cancelled: 'ملغي',
      };
      
      return { 
        success: false, 
        error: `لا يمكن تغيير حالة الطلب من "${existingOrder.status}" إلى "${status}".` +
               `الحالات المتاحة: ${allowedStatuses.map(s => statusLabels[s] || s).join(', ')}` 
      };
    }

    // ✅ تحديث حالة الطلب
    const updateData: any = { 
      status,
      updatedAt: new Date(),
    };
    
    if (status === 'delivered') {
      updateData.paymentStatus = 'paid';
      updateData.deliveredAt = new Date();
    }
    
    if (status === 'cancelled') {
      updateData.paymentStatus = 'cancelled';
      updateData.cancelledAt = new Date();
    }

    const order = await Order.findOneAndUpdate(
      { _id: new mongoose.Types.ObjectId(orderId), storeId: store._id },
      updateData,
      { new: true }
    );

    if (!order) {
      console.error("🔴 Failed to update order");
      return { 
        success: false, 
        error: "فشل تحديث الطلب. يرجى المحاولة مرة أخرى." 
      };
    }

    console.log("🟢 Order updated successfully:", {
      orderNumber: order.orderNumber,
      newStatus: order.status,
      paymentStatus: order.paymentStatus,
    });

    // ✅ تحديث الصفحات
    try {
      revalidatePath(`/dashboard/stores/${storeSlug}/orders`);
      revalidatePath(`/dashboard/stores/${storeSlug}/orders/${orderId}`);
      console.log("🟢 Pages revalidated");
    } catch (revalidateError) {
      console.warn("⚠️ Revalidation failed:", revalidateError);
      // لا نعيد خطأ لأن التحديث تم بنجاح
    }

    const statusLabels: Record<string, string> = {
      confirmed: 'مؤكد',
      processing: 'قيد التجهيز',
      shipped: 'تم الشحن',
      delivered: 'تم التوصيل',
      cancelled: 'ملغي',
    };

    return { 
      success: true, 
      message: `✅ تم تحديث حالة الطلب ${order.orderNumber} إلى "${statusLabels[status] || status}" بنجاح`,
      data: {
        orderId: order._id.toString(),
        orderNumber: order.orderNumber,
        status: order.status,
        paymentStatus: order.paymentStatus,
      }
    };

  } catch (error: any) {
    // ✅ تسجيل الخطأ الكامل
    console.error("🔴 Update order status error:", {
      message: error.message,
      stack: error.stack,
      name: error.name,
    });

    // ✅ تحليل نوع الخطأ
    let errorMessage = "فشل في تحديث حالة الطلب";
    
    if (error instanceof mongoose.Error.CastError) {
      errorMessage = "خطأ في تنسيق البيانات. يرجى التحقق من المدخلات.";
    } else if (error instanceof mongoose.Error.ValidationError) {
      errorMessage = "بيانات الطلب غير صالحة.";
    } else if (error.name === 'MongoNetworkError') {
      errorMessage = "فشل الاتصال بقاعدة البيانات. يرجى التحقق من اتصال الإنترنت.";
    } else if (error.message) {
      errorMessage = error.message;
    }

    return { 
      success: false, 
      error: errorMessage,
      details: process.env.NODE_ENV === 'development' ? {
        message: error.message,
        name: error.name,
      } : undefined
    };
  }
}