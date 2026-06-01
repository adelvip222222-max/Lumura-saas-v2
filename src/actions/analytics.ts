// src/actions/analytics.ts
"use server";

import mongoose from "mongoose";  // ✅ أضف هذا السطر
import { connectToDatabase } from "@/lib/db/mongodb";
import Order from "@/models/Order";
import Product from "@/models/Product";
import User from "@/models/User";
import Tenant from "@/models/Tenant";
import Store from "@/models/Store";
import { auth } from "@/lib/auth";
import { serialize } from "@/lib/serialize";
import type { ApiResponse, DashboardStats, SalesData, TopProduct } from "@/types";

// تأكد من تسجيل جميع النماذج
import "@/models";

export async function getDashboardStatsAction(): Promise<
  ApiResponse<DashboardStats>
> {
  const session = await auth();
  
  // ✅ تعديل الشرط ليشمل الأدوار الجديدة
  if (!session?.user || !["super_admin", "tenant_admin", "store_admin"].includes(session.user.role)) {
    return { success: false, error: "Insufficient permissions" };
  }

  try {
    await connectToDatabase();

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

    // ✅ بناء query مع tenantId للمستأجر
    let orderQuery: any = { status: { $ne: "cancelled" } };
    let productQuery: any = { isDeleted: false, isActive: true };
    let userQuery: any = { isActive: true };
    
    // إذا كان مستأجر عادي (وليس super_admin)
    if (session.user.role !== "super_admin" && session.user.tenantId) {
      orderQuery.tenantId = new mongoose.Types.ObjectId(session.user.tenantId);
      productQuery.tenantId = new mongoose.Types.ObjectId(session.user.tenantId);
      userQuery.tenantId = new mongoose.Types.ObjectId(session.user.tenantId);
    }
    
    // إضافة شرط الشهر الحالي
    const currentMonthQuery = { ...orderQuery, createdAt: { $gte: startOfMonth } };
    
    // شرط الشهر الماضي
    const lastMonthQuery = { 
      ...orderQuery, 
      createdAt: { $gte: startOfLastMonth, $lte: endOfLastMonth } 
    };

    const [
      currentMonthOrders,
      lastMonthOrders,
      totalProducts,
      totalCustomers,
      lastMonthCustomers,
    ] = await Promise.all([
      Order.aggregate([
        { $match: currentMonthQuery },
        { $group: { _id: null, revenue: { $sum: "$total" }, count: { $sum: 1 } } },
      ]),
      Order.aggregate([
        { $match: lastMonthQuery },
        { $group: { _id: null, revenue: { $sum: "$total" }, count: { $sum: 1 } } },
      ]),
      Product.countDocuments(productQuery),
      User.countDocuments({ ...userQuery, role: "customer" }),
      User.countDocuments({
        ...userQuery,
        role: "customer",
        createdAt: { $gte: startOfLastMonth, $lte: endOfLastMonth },
      }),
    ]);

    const currentRevenue = currentMonthOrders[0]?.revenue ?? 0;
    const lastRevenue = lastMonthOrders[0]?.revenue ?? 0;
    const currentOrders = currentMonthOrders[0]?.count ?? 0;
    const lastOrders = lastMonthOrders[0]?.count ?? 0;

    const revenueGrowth =
      lastRevenue > 0
        ? ((currentRevenue - lastRevenue) / lastRevenue) * 100
        : currentRevenue > 0 ? 100 : 0;
    const ordersGrowth =
      lastOrders > 0
        ? ((currentOrders - lastOrders) / lastOrders) * 100
        : currentOrders > 0 ? 100 : 0;

    return {
      success: true,
      data: {
        totalRevenue: currentRevenue,
        totalOrders: currentOrders,
        totalProducts: totalProducts || 0,
        totalCustomers: totalCustomers || 0,
        revenueGrowth: Math.round(revenueGrowth * 10) / 10,
        ordersGrowth: Math.round(ordersGrowth * 10) / 10,
        productsGrowth: 0,
        customersGrowth: lastMonthCustomers || 0,
      },
    };
  } catch (error) {
    console.error("Get dashboard stats error:", error);
    return { success: false, error: "Failed to fetch dashboard stats" };
  }
}

export async function getSalesDataAction(
  period: "7d" | "30d" | "90d" | "1y" = "30d"
): Promise<ApiResponse<SalesData[]>> {
  const session = await auth();
  if (!session?.user || !["super_admin", "tenant_admin", "store_admin"].includes(session.user.role)) {
    return { success: false, error: "Insufficient permissions" };
  }

  try {
    await connectToDatabase();

    const days = { "7d": 7, "30d": 30, "90d": 90, "1y": 365 }[period];
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    let matchQuery: any = {
      createdAt: { $gte: startDate },
      status: { $ne: "cancelled" },
    };
    
    if (session.user.role !== "super_admin" && session.user.tenantId) {
      matchQuery.tenantId = new mongoose.Types.ObjectId(session.user.tenantId);
    }

    const salesData = await Order.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
          },
          revenue: { $sum: "$total" },
          orders: { $sum: 1 },
          cost: { $sum: "$subtotal" },
        },
      },
      { $sort: { _id: 1 } },
      {
        $project: {
          date: "$_id",
          revenue: 1,
          orders: 1,
          profit: { $subtract: ["$revenue", { $multiply: ["$cost", 0.6] }] },
          _id: 0,
        },
      },
    ]);

    return { success: true, data: serialize(salesData) as SalesData[] };
  } catch (error) {
    console.error("Get sales data error:", error);
    return { success: false, error: "Failed to fetch sales data" };
  }
}

export async function getTopProductsAction(
  limit = 10
): Promise<ApiResponse<TopProduct[]>> {
  const session = await auth();
  if (!session?.user || !["super_admin", "tenant_admin", "store_admin"].includes(session.user.role)) {
    return { success: false, error: "Insufficient permissions" };
  }

  try {
    await connectToDatabase();

    let query: any = { isDeleted: false, soldQuantity: { $gt: 0 } };
    
    if (session.user.role !== "super_admin" && session.user.tenantId) {
      query.tenantId = new mongoose.Types.ObjectId(session.user.tenantId);
    }

    const topProducts = await Product.find(query)
      .select("name slug thumbnail soldQuantity sellingPrice")
      .sort({ soldQuantity: -1 })
      .limit(limit)
      .lean();

    const result: TopProduct[] = topProducts.map((p) => ({
      _id: p._id.toString(),
      name: p.name,
      slug: p.slug,
      image: p.thumbnail ?? "",
      soldQuantity: p.soldQuantity,
      revenue: (p.soldQuantity || 0) * (p.sellingPrice || 0),
    }));

    return { success: true, data: serialize(result) };
  } catch (error) {
    console.error("Get top products error:", error);
    return { success: false, error: "Failed to fetch top products" };
  }
}

export async function getLowStockProductsAction(
  threshold = 10
): Promise<ApiResponse<Array<{ _id: string; name: string; sku: string; stockQuantity: number; lowStockThreshold: number }>>> {
  const session = await auth();
  if (!session?.user || !["super_admin", "tenant_admin", "store_admin"].includes(session.user.role)) {
    return { success: false, error: "Insufficient permissions" };
  }

  try {
    await connectToDatabase();

    let query: any = {
      isDeleted: false,
      isActive: true,
      $expr: { $lte: ["$stockQuantity", "$lowStockThreshold"] },
    };
    
    if (session.user.role !== "super_admin" && session.user.tenantId) {
      query.tenantId = new mongoose.Types.ObjectId(session.user.tenantId);
    }

    const products = await Product.find(query)
      .select("name sku stockQuantity lowStockThreshold")
      .sort({ stockQuantity: 1 })
      .limit(50)
      .lean();

    return {
      success: true,
      data: products.map((p) => ({
        _id: p._id.toString(),
        name: p.name,
        sku: p.sku,
        stockQuantity: p.stockQuantity,
        lowStockThreshold: p.lowStockThreshold,
      })),
    };
  } catch (error) {
    console.error("Get low stock error:", error);
    return { success: false, error: "Failed to fetch low stock products" };
  }
}

export async function getOrdersStatsByStatusAction(): Promise<
  ApiResponse<Array<{ status: string; count: number; revenue: number }>>
> {
  const session = await auth();
  if (!session?.user || !["super_admin", "tenant_admin", "store_admin"].includes(session.user.role)) {
    return { success: false, error: "Insufficient permissions" };
  }

  try {
    await connectToDatabase();

    let matchQuery: any = {};
    if (session.user.role !== "super_admin" && session.user.tenantId) {
      matchQuery.tenantId = new mongoose.Types.ObjectId(session.user.tenantId);
    }

    const stats = await Order.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
          revenue: { $sum: "$total" },
        },
      },
      {
        $project: {
          status: "$_id",
          count: 1,
          revenue: 1,
          _id: 0,
        },
      },
    ]);

    return { success: true, data: stats };
  } catch (error) {
    console.error("Get orders stats error:", error);
    return { success: false, error: "Failed to fetch orders stats" };
  }
}