// src/lib/store/store-orders.ts
import { connectToDatabase } from '@/lib/db/mongodb';
import Order from '@/models/Order';
import Store from '@/models/Store';
import Product from '@/models/Product';
import mongoose from 'mongoose';

// جلب طلبات المتجر
export async function getStoreOrders(
  storeSlug: string,
  filters?: {
    status?: string;
    paymentStatus?: string;
    page?: number;
    limit?: number;
  }
) {
  await connectToDatabase();
  
  const store = await Store.findOne({ slug: storeSlug });
  if (!store) throw new Error('Store not found');
  
  const query: any = {
    storeId: store._id,
    tenantId: store.tenantId
  };
  
  if (filters?.status) query.status = filters.status;
  if (filters?.paymentStatus) query.paymentStatus = filters.paymentStatus;
  
  const page = filters?.page || 1;
  const limit = filters?.limit || 20;
  const skip = (page - 1) * limit;
  
  const [orders, total] = await Promise.all([
    Order.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('userId', 'name email')
      .lean(),
    Order.countDocuments(query)
  ]);
  
  return {
    orders,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  };
}

// جلب طلب محدد
export async function getStoreOrderById(storeSlug: string, orderId: string) {
  await connectToDatabase();
  
  const store = await Store.findOne({ slug: storeSlug });
  if (!store) throw new Error('Store not found');
  
  return await Order.findOne({
    _id: orderId,
    storeId: store._id,
    tenantId: store.tenantId
  })
    .populate('userId', 'name email phone')
    .populate('items.productId', 'name slug images')
    .lean();
}

// تحديث حالة الطلب
export async function updateOrderStatus(
  storeSlug: string,
  orderId: string,
  status: string
) {
  await connectToDatabase();
  
  const store = await Store.findOne({ slug: storeSlug });
  if (!store) throw new Error('Store not found');
  
  const updateData: any = { status };
  
  if (status === 'delivered') {
    updateData.deliveredAt = new Date();
  }
  
  if (status === 'cancelled') {
    updateData.cancelledAt = new Date();
  }
  
  return await Order.findOneAndUpdate(
    { _id: orderId, storeId: store._id },
    updateData,
    { new: true }
  ).lean();
}

// تحديث حالة الدفع
export async function updatePaymentStatus(
  storeSlug: string,
  orderId: string,
  paymentStatus: string
) {
  await connectToDatabase();
  
  const store = await Store.findOne({ slug: storeSlug });
  if (!store) throw new Error('Store not found');
  
  return await Order.findOneAndUpdate(
    { _id: orderId, storeId: store._id },
    { paymentStatus },
    { new: true }
  ).lean();
}

// إضافة رقم تتبع
export async function addTrackingNumber(
  storeSlug: string,
  orderId: string,
  trackingNumber: string
) {
  await connectToDatabase();
  
  const store = await Store.findOne({ slug: storeSlug });
  if (!store) throw new Error('Store not found');
  
  return await Order.findOneAndUpdate(
    { _id: orderId, storeId: store._id },
    { trackingNumber, status: 'shipped' },
    { new: true }
  ).lean();
}
