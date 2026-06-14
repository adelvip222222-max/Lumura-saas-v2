// src/lib/store/store-stats.ts
import { connectToDatabase } from '@/lib/db/mongodb';
import Order from '@/models/Order';
import Product from '@/models/Product';
import User from '@/models/User';
import Store from '@/models/Store';

// إحصائيات رئيسية للوحة التحكم
export async function getStoreDashboardStats(storeSlug: string) {
  await connectToDatabase();
  
  const store = await Store.findOne({ slug: storeSlug });
  if (!store) throw new Error('Store not found');
  
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());
  
  const [
    totalProducts,
    totalOrders,
    totalCustomers,
    pendingOrders,
    lowStockProducts,
    monthlyRevenue,
    weeklyOrders,
    recentOrders
  ] = await Promise.all([
    Product.countDocuments({ storeId: store._id, isDeleted: false }),
    Order.countDocuments({ storeId: store._id }),
    User.countDocuments({ storeId: store._id, role: 'user' }),
    Order.countDocuments({ storeId: store._id, status: 'pending' }),
    Product.countDocuments({ 
      storeId: store._id, 
      stockQuantity: { $lte: '$lowStockThreshold' },
      isActive: true 
    }),
    Order.aggregate([
      { $match: { storeId: store._id, createdAt: { $gte: startOfMonth }, status: 'delivered' } },
      { $group: { _id: null, total: { $sum: '$total' } } }
    ]),
    Order.countDocuments({ storeId: store._id, createdAt: { $gte: startOfWeek } }),
    Order.find({ storeId: store._id })
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('userId', 'name')
      .lean()
  ]);
  
  return {
    totalProducts,
    totalOrders,
    totalCustomers,
    pendingOrders,
    lowStockProducts: lowStockProducts || 0,
    monthlyRevenue: monthlyRevenue[0]?.total || 0,
    weeklyOrders: weeklyOrders || 0,
    recentOrders: recentOrders || []
  };
}

// إحصائيات المبيعات (رسم بياني)
export async function getSalesChartData(storeSlug: string, days: number = 30) {
  await connectToDatabase();
  
  const store = await Store.findOne({ slug: storeSlug });
  if (!store) throw new Error('Store not found');
  
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  
  const sales = await Order.aggregate([
    {
      $match: {
        storeId: store._id,
        createdAt: { $gte: startDate },
        status: 'delivered'
      }
    },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
        total: { $sum: '$total' },
        count: { $sum: 1 }
      }
    },
    { $sort: { _id: 1 } }
  ]);
  
  return sales;
}

// أفضل المنتجات مبيعاً
export async function getTopProducts(storeSlug: string, limit: number = 10) {
  await connectToDatabase();
  
  const store = await Store.findOne({ slug: storeSlug });
  if (!store) throw new Error('Store not found');
  
  const topProducts = await Order.aggregate([
    { $match: { storeId: store._id, status: 'delivered' } },
    { $unwind: '$items' },
    {
      $group: {
        _id: '$items.productId',
        totalSold: { $sum: '$items.quantity' },
        totalRevenue: { $sum: '$items.subtotal' }
      }
    },
    { $sort: { totalSold: -1 } },
    { $limit: limit },
    {
      $lookup: {
        from: 'products',
        localField: '_id',
        foreignField: '_id',
        as: 'product'
      }
    },
    { $unwind: '$product' }
  ]);
  
  return topProducts;
}

// تقرير المخزون
export async function getInventoryReport(storeSlug: string) {
  await connectToDatabase();
  
  const store = await Store.findOne({ slug: storeSlug });
  if (!store) throw new Error('Store not found');
  
  const products = await Product.find({ storeId: store._id, isDeleted: false })
    .select('name sku stockQuantity soldQuantity remainingQuantity lowStockThreshold')
    .sort({ remainingQuantity: 1 })
    .lean();
  
  const summary = {
    totalProducts: products.length,
    totalStock: products.reduce((sum, p) => sum + p.stockQuantity, 0),
    totalSold: products.reduce((sum, p) => sum + p.soldQuantity, 0),
    lowStockCount: products.filter(p => p.remainingQuantity <= p.lowStockThreshold).length,
    outOfStockCount: products.filter(p => p.remainingQuantity === 0).length
  };
  
  return { products, summary };
}

// تقرير العملاء
export async function getCustomersReport(storeSlug: string) {
  await connectToDatabase();
  
  const store = await Store.findOne({ slug: storeSlug });
  if (!store) throw new Error('Store not found');
  
  const customers = await Order.aggregate([
    { $match: { storeId: store._id } },
    {
      $group: {
        _id: '$userId',
        totalSpent: { $sum: '$total' },
        orderCount: { $sum: 1 },
        lastOrder: { $max: '$createdAt' }
      }
    },
    { $sort: { totalSpent: -1 } },
    {
      $lookup: {
        from: 'users',
        localField: '_id',
        foreignField: '_id',
        as: 'user'
      }
    },
    { $unwind: '$user' }
  ]);
  
  const summary = {
    totalCustomers: customers.length,
    totalRevenue: customers.reduce((sum, c) => sum + c.totalSpent, 0),
    averageOrderValue: customers.length > 0 
      ? customers.reduce((sum, c) => sum + c.totalSpent, 0) / customers.length 
      : 0
  };
  
  return { customers, summary };
}
