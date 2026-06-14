// src/actions/analytics.ts
"use server";

import mongoose from "mongoose";
import { connectToDatabase } from "@/lib/db/mongodb";
import Order from "@/models/Order";
import Product from "@/models/Product";
import User from "@/models/User";
import Tenant from "@/models/Tenant";
import Store from "@/models/Store";
import Wishlist from "@/models/Wishlist";
import { auth } from "@/lib/auth";
import { serialize } from "@/lib/serialize";
import type { ApiResponse, DashboardStats, SalesData, TopProduct } from "@/types";

import "@/models";

export async function getDashboardStatsAction(storeSlug?: string): Promise<
  ApiResponse<DashboardStats>
> {
  const session = await auth();
  
  if (!session?.user || !["super_admin", "tenant_admin", "store_admin"].includes(session.user.role)) {
    return { success: false, error: "Insufficient permissions" };
  }

  try {
    await connectToDatabase();

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

    let storeId: mongoose.Types.ObjectId | undefined;
    if (storeSlug) {
      const store = await Store.findOne({ slug: storeSlug }).select("_id");
      if (store) storeId = store._id;
    }

    let orderQuery: any = { status: { $ne: "cancelled" } };
    let productQuery: any = { isDeleted: false, isActive: true };
    let userQuery: any = { isActive: true };
    
    if (storeId) {
      orderQuery.storeId = storeId;
      productQuery.storeId = storeId;
      userQuery.storeId = storeId;
    } else if (session.user.role !== "super_admin" && session.user.tenantId) {
      orderQuery.tenantId = new mongoose.Types.ObjectId(session.user.tenantId);
      productQuery.tenantId = new mongoose.Types.ObjectId(session.user.tenantId);
      userQuery.tenantId = new mongoose.Types.ObjectId(session.user.tenantId);
    }
    
    const currentMonthQuery = { ...orderQuery, createdAt: { $gte: startOfMonth } };
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
  period: "7d" | "30d" | "90d" | "1y" = "30d",
  storeSlug?: string
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

    let storeId: mongoose.Types.ObjectId | undefined;
    if (storeSlug) {
      const store = await Store.findOne({ slug: storeSlug }).select("_id");
      if (store) storeId = store._id;
    }

    let matchQuery: any = {
      createdAt: { $gte: startDate },
      status: { $ne: "cancelled" },
    };
    
    if (storeId) {
      matchQuery.storeId = storeId;
    } else if (session.user.role !== "super_admin" && session.user.tenantId) {
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
  limit = 10,
  storeSlug?: string
): Promise<ApiResponse<TopProduct[]>> {
  const session = await auth();
  if (!session?.user || !["super_admin", "tenant_admin", "store_admin"].includes(session.user.role)) {
    return { success: false, error: "Insufficient permissions" };
  }

  try {
    await connectToDatabase();

    let query: any = { isDeleted: false, soldQuantity: { $gt: 0 } };
    
    if (storeSlug) {
      const store = await Store.findOne({ slug: storeSlug }).select("_id");
      if (store) query.storeId = store._id;
    } else if (session.user.role !== "super_admin" && session.user.tenantId) {
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
  threshold = 10,
  storeSlug?: string
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
    
    if (storeSlug) {
      const store = await Store.findOne({ slug: storeSlug }).select("_id");
      if (store) query.storeId = store._id;
    } else if (session.user.role !== "super_admin" && session.user.tenantId) {
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

export async function getOrdersStatsByStatusAction(
  storeSlug?: string
): Promise<
  ApiResponse<Array<{ status: string; count: number; revenue: number }>>
> {
  const session = await auth();
  if (!session?.user || !["super_admin", "tenant_admin", "store_admin"].includes(session.user.role)) {
    return { success: false, error: "Insufficient permissions" };
  }

  try {
    await connectToDatabase();

    let matchQuery: any = {};
    if (storeSlug) {
      const store = await Store.findOne({ slug: storeSlug }).select("_id");
      if (store) matchQuery.storeId = store._id;
    } else if (session.user.role !== "super_admin" && session.user.tenantId) {
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

export async function getMostFavoritedProductsAction(
  limit = 10,
  storeSlug?: string
): Promise<ApiResponse<Array<{ _id: string; name: string; thumbnail?: string; count: number }>>> {
  const session = await auth();
  if (!session?.user || !["super_admin", "tenant_admin", "store_admin"].includes(session.user.role)) {
    return { success: false, error: "Insufficient permissions" };
  }

  try {
    await connectToDatabase();

    let query: any = {};
    if (storeSlug) {
      const store = await Store.findOne({ slug: storeSlug }).select("_id");
      if (store) query.storeId = store._id;
    } else if (session.user.role !== "super_admin" && session.user.tenantId) {
      query.tenantId = new mongoose.Types.ObjectId(session.user.tenantId);
    }

    const wishlistCounts = await Wishlist.aggregate([
      { $match: query },
      { $unwind: "$items" },
      { $group: { _id: "$items.productId", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: limit },
    ]);

    const productIds = wishlistCounts.map((w) => w._id);
    const products = await Product.find({ _id: { $in: productIds } })
      .select("name thumbnail")
      .lean();

    const productsMap = new Map(products.map((p) => [p._id.toString(), p]));

    const result = wishlistCounts.map((w) => {
      const p = productsMap.get(w._id.toString());
      return {
        _id: w._id.toString(),
        name: p?.name ?? "Unknown Product",
        thumbnail: p?.thumbnail ?? "",
        count: w.count,
      };
    });

    return { success: true, data: result };
  } catch (error) {
    console.error("Get most favorited products error:", error);
    return { success: false, error: "Failed to fetch most favorited products" };
  }
}

export async function getSalesReportAction(
  startDateStr: string,
  endDateStr: string,
  storeId?: string
): Promise<ApiResponse<{
  totalRevenue: number;
  totalOrders: number;
  totalItemsSold: number;
  totalProfit: number;
  orders: Array<{
    _id: string;
    orderNumber: string;
    storeName: string;
    customerName: string;
    createdAt: string;
    status: string;
    paymentMethod: string;
    total: number;
    itemsCount: number;
    itemsList: string;
  }>;
}>> {
  const session = await auth();
  if (!session?.user || !["super_admin", "tenant_admin", "store_admin"].includes(session.user.role)) {
    return { success: false, error: "Insufficient permissions" };
  }

  try {
    await connectToDatabase();

    const start = new Date(startDateStr);
    start.setHours(0, 0, 0, 0);

    const end = new Date(endDateStr);
    end.setHours(23, 59, 59, 999);

    let matchQuery: any = {
      createdAt: { $gte: start, $lte: end },
      status: { $ne: "cancelled" },
    };

    if (storeId && storeId !== "all") {
      matchQuery.storeId = new mongoose.Types.ObjectId(storeId);
    } else {
      if (session.user.role !== "super_admin") {
        if (!session.user.tenantId) {
          return { success: false, error: "Tenant ID is required" };
        }
        matchQuery.tenantId = new mongoose.Types.ObjectId(session.user.tenantId);
      }
    }

    const orders = await Order.find(matchQuery)
      .populate("storeId", "name")
      .populate("userId", "name email")
      .sort({ createdAt: -1 })
      .lean();

    const productIds = new Set<string>();
    for (const order of orders) {
      for (const item of order.items) {
        if (item.productId) {
          productIds.add(item.productId.toString());
        }
      }
    }

    const products = await Product.find({ _id: { $in: Array.from(productIds) } })
      .select("_id purchasePrice")
      .lean();
    const productPriceMap = new Map(products.map(p => [p._id.toString(), p.purchasePrice || 0]));

    let totalRevenue = 0;
    let totalOrders = 0;
    let totalItemsSold = 0;
    let totalCost = 0;

    const formattedOrders = orders.map((order: any) => {
      totalRevenue += order.total || 0;
      totalOrders += 1;

      let itemsCount = 0;
      const itemsList = order.items.map((item: any) => {
        const qty = item.quantity || 0;
        itemsCount += qty;
        totalItemsSold += qty;

        const purchasePrice = productPriceMap.get(item.productId?.toString() || "") || (item.price * 0.6);
        totalCost += purchasePrice * qty;

        return `${item.name} (${qty})`;
      }).join(", ");

      return {
        _id: order._id.toString(),
        orderNumber: order.orderNumber,
        storeName: order.storeId?.name || "Unknown Store",
        customerName: order.userId?.name || order.userId?.email || "Guest",
        createdAt: order.createdAt.toISOString(),
        status: order.status,
        paymentMethod: order.paymentMethod,
        total: order.total,
        itemsCount,
        itemsList,
      };
    });

    const totalProfit = totalRevenue - totalCost;

    return {
      success: true,
      data: {
        totalRevenue,
        totalOrders,
        totalItemsSold,
        totalProfit,
        orders: formattedOrders,
      },
    };
  } catch (error) {
    console.error("Get sales report error:", error);
    return { success: false, error: "Failed to generate sales report" };
  }
}