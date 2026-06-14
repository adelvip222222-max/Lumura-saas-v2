import "server-only";
import mongoose from "mongoose";
import { getAdministrationContext } from "@/lib/administration/context";
import { connectToDatabase } from "@/lib/db/mongodb";
import Order from "@/models/Order";
import Product from "@/models/Product";

export async function getAdministrationReport() {
  const ctx = await getAdministrationContext("view_reports");
  await connectToDatabase();
  const storeObjectId = new mongoose.Types.ObjectId(ctx.storeId);

  const [ordersCount, productsCount, revenueAgg, lowStockCount, paidAgg, pendingAgg] =
    await Promise.all([
      Order.countDocuments({ storeId: ctx.storeId }),
      Product.countDocuments({ storeId: ctx.storeId, isDeleted: false }),
      Order.aggregate([
        { $match: { storeId: storeObjectId, status: { $ne: "cancelled" } } },
        { $group: { _id: null, revenue: { $sum: "$total" } } },
      ]),
      Product.countDocuments({
        storeId: ctx.storeId,
        isDeleted: false,
        $expr: { $lte: ["$stockQuantity", "$lowStockThreshold"] },
      }),
      Order.aggregate([
        { $match: { storeId: storeObjectId, paymentStatus: "paid" } },
        { $group: { _id: null, total: { $sum: "$total" } } },
      ]),
      Order.aggregate([
        { $match: { storeId: storeObjectId, paymentStatus: "pending" } },
        { $group: { _id: null, total: { $sum: "$total" } } },
      ]),
    ]);

  return {
    store: { name: ctx.storeName, slug: ctx.storeSlug },
    stats: {
      ordersCount,
      productsCount,
      revenue: revenueAgg[0]?.revenue ?? 0,
      paidRevenue: paidAgg[0]?.total ?? 0,
      pendingRevenue: pendingAgg[0]?.total ?? 0,
      lowStockCount,
    },
  };
}
