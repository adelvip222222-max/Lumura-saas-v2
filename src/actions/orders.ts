// src/actions/orders.ts
"use server";

import Stripe from "stripe";
import { connectToDatabase } from "@/lib/db/mongodb";
import Order from "@/models/Order";
import Product from "@/models/Product";
import Store from "@/models/Store";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import mongoose from "mongoose";
import { siteConfig } from "@/config/site";

// ✅ التحقق من وجود مفتاح Stripe بشكل آمن
let stripe: Stripe | null = null;
try {
  if (process.env.STRIPE_SECRET_KEY && process.env.STRIPE_SECRET_KEY.startsWith('sk_')) {
    stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: "2023-10-16" as any,
    });
    console.log("✅ Stripe initialized successfully");
  } else {
    console.warn("⚠️ Stripe secret key is missing or invalid. Stripe payments will be disabled.");
  }
} catch (error) {
  console.error("❌ Failed to initialize Stripe:", error);
}

// =============================================
// ✅ دوال إدارة الطلبات للمشرفين
// =============================================

/**
 * ✅ جلب الطلبات للوحة تحكم المتجر
 */
export async function getAdminOrdersAction(storeSlug: string, options?: {
  page?: number;
  limit?: number;
  status?: string;
  search?: string;
  startDate?: string;
  endDate?: string;
}) {
  try {
    await connectToDatabase();
    
    const session = await auth();
    if (!session?.user) {
      return { success: false, error: "غير مصرح لك بالوصول" };
    }

    // ✅ جلب المتجر
    const store = await Store.findOne({ slug: storeSlug });
    if (!store) {
      return { success: false, error: "المتجر غير موجود" };
    }

    // ✅ إعداد خيارات البحث
    const page = options?.page || 1;
    const limit = options?.limit || 20;
    const skip = (page - 1) * limit;

    // ✅ بناء استعلام البحث
    const query: any = { 
      storeId: store._id,
    };

    // ✅ تصفية حسب الحالة
    if (options?.status && options.status !== 'all') {
      query.status = options.status;
    }

    // ✅ البحث بالنص (رقم الطلب أو اسم العميل)
    if (options?.search) {
      query.$or = [
        { orderNumber: { $regex: options.search, $options: 'i' } },
        { 'shippingAddress.fullName': { $regex: options.search, $options: 'i' } },
        { 'shippingAddress.phone': { $regex: options.search, $options: 'i' } },
      ];
    }

    // ✅ تصفية حسب التاريخ
    if (options?.startDate || options?.endDate) {
      query.createdAt = {};
      if (options.startDate) {
        query.createdAt.$gte = new Date(options.startDate);
      }
      if (options.endDate) {
        query.createdAt.$lte = new Date(options.endDate);
      }
    }

    // ✅ جلب الطلبات مع الترتيب
    const orders = await Order.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    // ✅ جلب العدد الإجمالي
    const total = await Order.countDocuments(query);

    // ✅ تحويل البيانات
    const plainOrders = orders.map(order => ({
      ...order,
      _id: order._id.toString(),
      storeId: order.storeId.toString(),
      tenantId: order.tenantId?.toString(),
      userId: order.userId?.toString(),
      items: order.items?.map((item: any) => ({
        ...item,
        productId: item.productId.toString(),
      })),
    }));

    return {
      success: true,
      data: {
        orders: plainOrders,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      },
    };
  } catch (error) {
    console.error("Get admin orders error:", error);
    return { success: false, error: "فشل في جلب الطلبات" };
  }
}

/**
 * ✅ جلب طلب واحد بالتفصيل
 */
export async function getAdminOrderAction(storeSlug: string, orderId: string) {
  try {
    await connectToDatabase();
    
    const session = await auth();
    if (!session?.user) {
      return { success: false, error: "غير مصرح لك بالوصول" };
    }

    const store = await Store.findOne({ slug: storeSlug });
    if (!store) {
      return { success: false, error: "المتجر غير موجود" };
    }

    const order = await Order.findOne({
      _id: new mongoose.Types.ObjectId(orderId),
      storeId: store._id,
    }).lean();

    if (!order) {
      return { success: false, error: "الطلب غير موجود" };
    }

    return {
      success: true,
      data: {
        ...order,
        _id: order._id.toString(),
        storeId: order.storeId.toString(),
        tenantId: order.tenantId?.toString(),
        userId: order.userId?.toString(),
        items: order.items?.map((item: any) => ({
          ...item,
          productId: item.productId.toString(),
        })),
      },
    };
  } catch (error) {
    console.error("Get admin order error:", error);
    return { success: false, error: "فشل في جلب الطلب" };
  }
}

/**
 * ✅ تحديث حالة الطلب
 */
// export async function updateOrderStatusAction(
//   storeSlug: string,
//   orderId: string,
//   newStatus: string
// ) {
//   try {
//     await connectToDatabase();
    
//     const session = await auth();
//     if (!session?.user) {
//       return { success: false, error: "غير مصرح لك بالوصول" };
//     }

//     const store = await Store.findOne({ slug: storeSlug });
//     if (!store) {
//       return { success: false, error: "المتجر غير موجود" };
//     }

//     const validStatuses = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];
//     if (!validStatuses.includes(newStatus)) {
//       return { success: false, error: "حالة الطلب غير صالحة" };
//     }

//     const order = await Order.findOneAndUpdate(
//       { _id: new mongoose.Types.ObjectId(orderId), storeId: store._id },
//       { 
//         status: newStatus,
//         ...(newStatus === 'delivered' ? { paymentStatus: 'paid' } : {}),
//         ...(newStatus === 'cancelled' ? { paymentStatus: 'cancelled' } : {}),
//       },
//       { new: true }
//     );

//     if (!order) {
//       return { success: false, error: "الطلب غير موجود" };
//     }

//     revalidatePath(`/dashboard/stores/${storeSlug}/orders`);
//     revalidatePath(`/dashboard/stores/${storeSlug}/orders/${orderId}`);

//     return { 
//       success: true, 
//       message: `تم تحديث حالة الطلب إلى "${newStatus}"`,
//       data: { status: newStatus }
//     };
//   } catch (error) {
//     console.error("Update order status error:", error);
//     return { success: false, error: "فشل في تحديث حالة الطلب" };
//   }
// }

/**
 * ✅ تحديث حالة الدفع
 */
export async function updatePaymentStatusAction(
  storeSlug: string,
  orderId: string,
  paymentStatus: string
) {
  try {
    await connectToDatabase();
    
    const session = await auth();
    if (!session?.user) {
      return { success: false, error: "غير مصرح لك بالوصول" };
    }

    const store = await Store.findOne({ slug: storeSlug });
    if (!store) {
      return { success: false, error: "المتجر غير موجود" };
    }

    const validStatuses = ['pending', 'paid', 'failed', 'refunded', 'cancelled'];
    if (!validStatuses.includes(paymentStatus)) {
      return { success: false, error: "حالة الدفع غير صالحة" };
    }

    const order = await Order.findOneAndUpdate(
      { _id: new mongoose.Types.ObjectId(orderId), storeId: store._id },
      { paymentStatus },
      { new: true }
    );

    if (!order) {
      return { success: false, error: "الطلب غير موجود" };
    }

    revalidatePath(`/dashboard/stores/${storeSlug}/orders/${orderId}`);

    return { 
      success: true, 
      message: `تم تحديث حالة الدفع إلى "${paymentStatus}"` 
    };
  } catch (error) {
    console.error("Update payment status error:", error);
    return { success: false, error: "فشل في تحديث حالة الدفع" };
  }
}

/**
 * ✅ حذف طلب
 */
export async function deleteOrderAction(storeSlug: string, orderId: string) {
  try {
    await connectToDatabase();
    
    const session = await auth();
    if (!session?.user) {
      return { success: false, error: "غير مصرح لك بالوصول" };
    }

    const store = await Store.findOne({ slug: storeSlug });
    if (!store) {
      return { success: false, error: "المتجر غير موجود" };
    }

    const order = await Order.findOneAndDelete({
      _id: new mongoose.Types.ObjectId(orderId),
      storeId: store._id,
    });

    if (!order) {
      return { success: false, error: "الطلب غير موجود" };
    }

    // ✅ إعادة المخزون إذا تم حذف الطلب
    for (const item of order.items) {
      await Product.findByIdAndUpdate(item.productId, {
        $inc: {
          stockQuantity: item.quantity,
          soldQuantity: -item.quantity,
        },
      });
    }

    revalidatePath(`/dashboard/stores/${storeSlug}/orders`);

    return { success: true, message: "تم حذف الطلب بنجاح" };
  } catch (error) {
    console.error("Delete order error:", error);
    return { success: false, error: "فشل في حذف الطلب" };
  }
}

/**
 * ✅ إحصائيات الطلبات للوحة التحكم
 */
export async function getOrderStatsAction(storeSlug: string) {
  try {
    await connectToDatabase();
    
    const session = await auth();
    if (!session?.user) {
      return { success: false, error: "غير مصرح لك بالوصول" };
    }

    const store = await Store.findOne({ slug: storeSlug });
    if (!store) {
      return { success: false, error: "المتجر غير موجود" };
    }

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));

    // ✅ إحصائيات عامة
    const [
      totalOrders,
      totalRevenue,
      pendingOrders,
      ordersThisMonth,
      revenueThisMonth,
      ordersByStatus,
    ] = await Promise.all([
      Order.countDocuments({ storeId: store._id }),
      Order.aggregate([
        { $match: { storeId: store._id, status: { $ne: 'cancelled' } } },
        { $group: { _id: null, total: { $sum: '$total' } } },
      ]),
      Order.countDocuments({ storeId: store._id, status: 'pending' }),
      Order.countDocuments({ storeId: store._id, createdAt: { $gte: startOfMonth } }),
      Order.aggregate([
        { 
          $match: { 
            storeId: store._id, 
            status: { $ne: 'cancelled' },
            createdAt: { $gte: startOfMonth }
          } 
        },
        { $group: { _id: null, total: { $sum: '$total' } } },
      ]),
      Order.aggregate([
        { $match: { storeId: store._id } },
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
    ]);

    return {
      success: true,
      data: {
        totalOrders,
        totalRevenue: totalRevenue[0]?.total || 0,
        pendingOrders,
        ordersThisMonth,
        revenueThisMonth: revenueThisMonth[0]?.total || 0,
        ordersByStatus: ordersByStatus.reduce((acc: any, curr: any) => {
          acc[curr._id] = curr.count;
          return acc;
        }, {}),
      },
    };
  } catch (error) {
    console.error("Get order stats error:", error);
    return { success: false, error: "فشل في جلب الإحصائيات" };
  }
}

// =============================================
// ✅ الدوال الأصلية (إنشاء الطلب)
// =============================================

export async function createOrderAction(formData: any) {
  try {
    await connectToDatabase();
    
    // ✅ التحقق من صحة البيانات
    if (!formData.items || formData.items.length === 0) {
      return { success: false, error: "السلة فارغة" };
    }

    // ✅ جلب المتجر
    const store = await Store.findOne({ slug: formData.storeSlug });
    if (!store) {
      return { success: false, error: "المتجر غير موجود" };
    }

    // ✅ جلسة المستخدم (إذا كان مسجلاً)
    const session = await auth();
    const userId = session?.user?.id || null;

    // ✅ حساب الإجمالي والتحقق من المنتجات
    let calculatedSubtotal = 0;
    const verifiedItems = [];
    
    for (const item of formData.items) {
      // التحقق من وجود المنتج في قاعدة البيانات
      const product = await Product.findOne({
        _id: new mongoose.Types.ObjectId(item.productId),
        storeId: store._id,
        isActive: true,
        isDeleted: false
      });
      
      if (!product) {
        console.error(`Product not found: ${item.productId} - Name: ${item.name}`);
        return { 
          success: false, 
          error: `المنتج "${item.name}" غير موجود. يرجى تحديث الصفحة والمحاولة مرة أخرى.` 
        };
      }
      
      // استخدام السعر من قاعدة البيانات (وليس من العميل) لمنع التلاعب
      const requestedQuantity = Math.max(1, Number(item.quantity) || 1);
      if (product.stockQuantity < requestedQuantity) {
        return {
          success: false,
          error: `الكمية المتاحة من "${product.name}" هي ${product.stockQuantity} فقط.`,
        };
      }

      const hasDiscount =
        typeof product.discountPrice === "number" &&
        product.discountPrice > 0 &&
        product.discountPrice < product.sellingPrice;
      const currentPrice = hasDiscount ? product.discountPrice : product.sellingPrice;
      const subtotal = currentPrice * requestedQuantity;
      calculatedSubtotal += subtotal;
      
      verifiedItems.push({
        productId: product._id,
        name: product.name,
        slug: product.slug,
        image: product.images?.[0]?.url || "",
        sku: product.sku,
        price: currentPrice,
        quantity: requestedQuantity,
        subtotal: subtotal,
      });
    }

    // ✅ حساب الإجمالي النهائي
    const tax = calculatedSubtotal * siteConfig.tax.rate;
    const shipping =
      calculatedSubtotal === 0 || calculatedSubtotal >= siteConfig.shipping.freeAbove
        ? 0
        : siteConfig.shipping.basePrice;
    const discount = Math.max(0, Number(formData.discount) || 0);
    const total = Math.max(0, calculatedSubtotal + tax + shipping - discount);

    // ✅ إنشاء معرف طلب فريد
    const orderNumber = "ORD-" + Date.now() + "-" + Math.random().toString(36).substr(2, 6).toUpperCase();

    // ✅ حفظ الطلب في قاعدة البيانات
    const order = await Order.create({
      orderNumber: orderNumber,
      userId: userId,
      storeId: store._id,
      tenantId: store.tenantId,
      items: verifiedItems,
      shippingAddress: {
        fullName: formData.shippingAddress?.fullName,
        phone: formData.shippingAddress?.phone,
        street: formData.shippingAddress?.street,
        city: formData.shippingAddress?.city,
        state: formData.shippingAddress?.state,
        country: formData.shippingAddress?.country,
        zipCode: formData.shippingAddress?.zipCode,
      },
      subtotal: calculatedSubtotal,
      tax: tax,
      shipping: shipping,
      discount: discount,
      total: total,
      paymentMethod: formData.paymentMethod,
      paymentStatus: "pending",
      status: "pending",
      notes: formData.notes || "",
    });

    // ✅ تحديث مخزون المنتجات
    // ✅ معالجة الدفع عبر Stripe
    if (formData.paymentMethod === "stripe") {
      if (!stripe) {
        return { 
          success: false, 
          error: "طريقة الدفع غير متاحة حالياً. يرجى استخدام الدفع عند الاستلام." 
        };
      }

      try {
        const lineItems = verifiedItems.map((item: any) => ({
          price_data: {
            currency: "egp",
            product_data: {
              name: item.name,
              images: item.image ? [item.image] : [],
            },
            unit_amount: Math.round(item.price * 100),
          },
          quantity: item.quantity,
        }));

        const session = await stripe.checkout.sessions.create({
          payment_method_types: ["card"],
          line_items: lineItems,
          mode: "payment",
          success_url: `${process.env.NEXT_PUBLIC_APP_URL}/${formData.storeSlug}/orders/${order._id}?success=true`,
          cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/${formData.storeSlug}/checkout?canceled=true`,
          metadata: {
            orderId: order._id.toString(),
            storeSlug: formData.storeSlug,
          },
          customer_email: formData.shippingAddress?.email || undefined,
        });

        await Order.findByIdAndUpdate(order._id, {
          paymentIntentId: session.id,
        });

        for (const item of verifiedItems) {
          await Product.findByIdAndUpdate(item.productId, {
            $inc: {
              stockQuantity: -item.quantity,
              soldQuantity: item.quantity,
            },
          });
        }

        return {
          success: true,
          data: {
            orderId: order._id.toString(),
            checkoutUrl: session.url,
          },
        };
      } catch (stripeError: any) {
        console.error("Stripe error:", stripeError.message);
        return { 
          success: false, 
          error: "حدث خطأ في بوابة الدفع. يرجى استخدام الدفع عند الاستلام." 
        };
      }
    }

    // ✅ الدفع عند الاستلام
    for (const item of verifiedItems) {
      await Product.findByIdAndUpdate(item.productId, {
        $inc: {
          stockQuantity: -item.quantity,
          soldQuantity: item.quantity,
        },
      });
    }

    revalidatePath(`/${formData.storeSlug}/orders`);
    
    return {
      success: true,
      data: { 
        orderId: order._id.toString(),
        message: "تم إنشاء الطلب بنجاح! سيتم الدفع عند الاستلام."
      },
    };

  } catch (error: any) {
    console.error("Create order error:", error);
    return {
      success: false,
      error: error.message || "حدث خطأ أثناء معالجة الطلب.",
    };
  }
}

// src/actions/orders.ts

/**
 * ✅ تحديث حالة الطلب - النسخة المصححة
 */
export async function updateOrderStatusAction(
  storeSlug: string,  // ✅ المعامل الأول: storeSlug
  orderId: string,    // ✅ المعامل الثاني: orderId
  newStatus: string   // ✅ المعامل الثالث: newStatus
) {
  try {
    await connectToDatabase();
    
    const session = await auth();
    if (!session?.user) {
      return { success: false, error: "غير مصرح لك بالوصول" };
    }

    // ✅ التحقق من صحة المدخلات
    if (!storeSlug || typeof storeSlug !== 'string') {
      console.error("Invalid storeSlug:", storeSlug);
      return { success: false, error: "معرف المتجر غير صالح" };
    }

    if (!orderId || typeof orderId !== 'string') {
      console.error("Invalid orderId:", orderId);
      return { success: false, error: "معرف الطلب غير صالح" };
    }

    const store = await Store.findOne({ slug: storeSlug });
    if (!store) {
      return { success: false, error: "المتجر غير موجود" };
    }

    const validStatuses = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];
    if (!validStatuses.includes(newStatus)) {
      return { success: false, error: "حالة الطلب غير صالحة" };
    }

    const order = await Order.findOneAndUpdate(
      { 
        _id: new mongoose.Types.ObjectId(orderId), 
        storeId: store._id 
      },
      { 
        status: newStatus,
        ...(newStatus === 'delivered' ? { paymentStatus: 'paid' } : {}),
        ...(newStatus === 'cancelled' ? { paymentStatus: 'cancelled' } : {}),
      },
      { new: true }
    );

    if (!order) {
      return { success: false, error: "الطلب غير موجود" };
    }

    revalidatePath(`/dashboard/stores/${storeSlug}/orders`);
    revalidatePath(`/dashboard/stores/${storeSlug}/orders/${orderId}`);

    return { 
      success: true, 
      message: `تم تحديث حالة الطلب إلى "${newStatus}"`,
      data: { status: newStatus }
    };
  } catch (error) {
    console.error("Update order status error:", error);
    return { success: false, error: "فشل في تحديث حالة الطلب" };
  }
}
