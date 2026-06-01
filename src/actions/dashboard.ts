"use server";

import { connectToDatabase } from "@/lib/db/mongodb";
import Store from "@/models/Store";
import Product from "@/models/Product";
import Order from "@/models/Order";
import Customer from "@/models/Customer";
import Category from "@/models/Category";
import Brand from "@/models/Brand";
import { auth } from "@/lib/auth";
import { serialize } from "@/lib/serialize";
import type { ApiResponse } from "@/types";

// ─── Get Dashboard Stats ──────────────────────────────────────────────────────
export async function getDashboardStatsAction(): Promise<
  ApiResponse<{
    totalProducts: number;
    totalOrders: number;
    totalCustomers: number;
    totalRevenue: number;
    recentOrders: any[];
    lowStockProducts: number;
  }>
> {
  const session = await auth();
  if (!session?.user) return { success: false, error: "Authentication required" };

  try {
    await connectToDatabase();

    // جلب المتجر الخاص بالمستخدم
    const store = await Store.findOne({ ownerId: session.user.id });
    if (!store) return { success: false, error: "Store not found" };

    const storeId = store._id;

    // جلب الإحصائيات
    const [
      totalProducts,
      totalOrders,
      totalCustomers,
      orders,
      lowStockProducts,
    ] = await Promise.all([
      Product.countDocuments({ isActive: true, isDeleted: false }),
      Order.countDocuments({ storeId }),
      Customer.countDocuments({ storeId, isActive: true }),
      Order.aggregate([
        { $match: { storeId } },
        { $group: { _id: null, total: { $sum: "$total" } } },
      ]),
      Product.countDocuments({
        isActive: true,
        isDeleted: false,
        $expr: { $lte: ["$stockQuantity", "$lowStockThreshold"] },
      }),
    ]);

    // أحدث الطلبات
    const recentOrders = await Order.find({ storeId })
      .sort({ createdAt: -1 })
      .limit(5)
      .select("orderNumber total status customerId createdAt")
      .populate("customerId", "name email")
      .lean();

    const totalRevenue = orders.length > 0 ? orders[0].total : 0;

    return {
      success: true,
      data: {
        totalProducts,
        totalOrders,
        totalCustomers,
        totalRevenue: totalRevenue || 0,
        recentOrders: serialize(recentOrders),
        lowStockProducts,
      },
    };
  } catch (err) {
    console.error("Get dashboard stats error:", err);
    return { success: false, error: "Failed to fetch dashboard stats" };
  }
}

// ─── Get Products List ────────────────────────────────────────────────────────
export async function getProductsAction(filters: {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
  brand?: string;
  isActive?: boolean;
  lowStock?: boolean;
}): Promise<ApiResponse<{ products: any[]; total: number }>> {
  const session = await auth();
  if (!session?.user) return { success: false, error: "Authentication required" };

  try {
    await connectToDatabase();

    const store = await Store.findOne({ ownerId: session.user.id });
    if (!store) return { success: false, error: "Store not found" };

    const page = filters.page ?? 1;
    const limit = filters.limit ?? 12;
    const skip = (page - 1) * limit;

    const query: any = { isDeleted: false };

    if (filters.search) {
      query.$or = [
        { name: { $regex: filters.search, $options: "i" } },
        { sku: { $regex: filters.search, $options: "i" } },
      ];
    }
    if (filters.category) query.category = filters.category;
    if (filters.brand) query.brand = filters.brand;
    if (filters.isActive !== undefined) query.isActive = filters.isActive;
    if (filters.lowStock) {
      query.$expr = { $lte: ["$stockQuantity", "$lowStockThreshold"] };
    }

    const [products, total] = await Promise.all([
      Product.find(query)
        .populate("category", "name nameAr")
        .populate("brand", "name nameAr")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Product.countDocuments(query),
    ]);

    return {
      success: true,
      data: {
        products: serialize(products),
        total,
      },
    };
  } catch (err) {
    console.error("Get products error:", err);
    return { success: false, error: "Failed to fetch products" };
  }
}

// ─── Get Orders List ──────────────────────────────────────────────────────────
export async function getOrdersAction(filters: {
  page?: number;
  limit?: number;
  status?: string;
  search?: string;
}): Promise<ApiResponse<{ orders: any[]; total: number }>> {
  const session = await auth();
  if (!session?.user) return { success: false, error: "Authentication required" };

  try {
    await connectToDatabase();

    const store = await Store.findOne({ ownerId: session.user.id });
    if (!store) return { success: false, error: "Store not found" };

    const page = filters.page ?? 1;
    const limit = filters.limit ?? 10;
    const skip = (page - 1) * limit;

    const query: any = { storeId: store._id };

    if (filters.status) query.status = filters.status;
    if (filters.search) {
      query.$or = [
        { orderNumber: { $regex: filters.search, $options: "i" } },
      ];
    }

    const [orders, total] = await Promise.all([
      Order.find(query)
        .populate("customerId", "name email phone")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Order.countDocuments(query),
    ]);

    return {
      success: true,
      data: {
        orders: serialize(orders),
        total,
      },
    };
  } catch (err) {
    console.error("Get orders error:", err);
    return { success: false, error: "Failed to fetch orders" };
  }
}

// ─── Get Customers List ───────────────────────────────────────────────────────
export async function getCustomersAction(filters: {
  page?: number;
  limit?: number;
  search?: string;
}): Promise<ApiResponse<{ customers: any[]; total: number }>> {
  const session = await auth();
  if (!session?.user) return { success: false, error: "Authentication required" };

  try {
    await connectToDatabase();

    const store = await Store.findOne({ ownerId: session.user.id });
    if (!store) return { success: false, error: "Store not found" };

    const page = filters.page ?? 1;
    const limit = filters.limit ?? 12;
    const skip = (page - 1) * limit;

    const query: any = { storeId: store._id, isActive: true };

    if (filters.search) {
      query.$or = [
        { name: { $regex: filters.search, $options: "i" } },
        { email: { $regex: filters.search, $options: "i" } },
        { phone: { $regex: filters.search, $options: "i" } },
      ];
    }

    const [customers, total] = await Promise.all([
      Customer.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Customer.countDocuments(query),
    ]);

    return {
      success: true,
      data: {
        customers: serialize(customers),
        total,
      },
    };
  } catch (err) {
    console.error("Get customers error:", err);
    return { success: false, error: "Failed to fetch customers" };
  }
}

// ─── Get Categories & Brands ──────────────────────────────────────────────────
export async function getCategoriesAction(): Promise<ApiResponse<any[]>> {
  try {
    await connectToDatabase();

    const categories = await Category.find({ isActive: true })
      .select("name nameAr slug icon")
      .sort({ sortOrder: 1 })
      .lean();

    return { success: true, data: serialize(categories) };
  } catch (err) {
    console.error("Get categories error:", err);
    return { success: false, error: "Failed to fetch categories" };
  }
}

export async function getBrandsAction(): Promise<ApiResponse<any[]>> {
  try {
    await connectToDatabase();

    const brands = await Brand.find({ isActive: true })
      .select("name nameAr slug logo")
      .sort({ sortOrder: 1 })
      .lean();

    return { success: true, data: serialize(brands) };
  } catch (err) {
    console.error("Get brands error:", err);
    return { success: false, error: "Failed to fetch brands" };
  }
}
