"use server";

import { connectToDatabase } from "@/lib/db/mongodb";
import Order from "@/models/Order";
import Wishlist from "@/models/Wishlist";
import Product from "@/models/Product";
import User from "@/models/User";
import Store from "@/models/Store";
import { getCustomerFromCookie } from "@/lib/jwt/customer-jwt";
import { serialize } from "@/lib/serialize";
import { serializeMongoDocs } from "@/lib/utils/serialize";
import mongoose from "mongoose";

export async function requireCustomer(storeSlug: string) {
  const customer = await getCustomerFromCookie(storeSlug);
  if (!customer) {
    return { ok: false as const, error: "يجب تسجيل الدخول" };
  }
  return { ok: true as const, customer };
}

export async function getCustomerAccountData(storeSlug: string) {
  const auth = await requireCustomer(storeSlug);
  if (!auth.ok) return { success: false as const, error: auth.error };

  const { customer } = auth;
  await connectToDatabase();

  const [user, orders, wishlist, store] = await Promise.all([
    User.findById(customer.id).select("-password").lean(),
    Order.find({ userId: customer.id, storeId: customer.storeId })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean(),
    Wishlist.findOne({
      userId: customer.id,
      storeId: customer.storeId,
    })
      .populate({
        path: "items.productId",
        select: "name slug images sellingPrice discountPrice stockQuantity isActive",
      })
      .lean(),
    Store.findById(customer.storeId).select("name slug").lean(),
  ]);

  const wishlistProducts =
    wishlist?.items
      ?.map((i) => i.productId)
      .filter((p) => p && typeof p === "object") ?? [];

  return {
    success: true as const,
    data: {
      customer,
      user: user ? serialize(user) : null,
      orders: serialize(orders),
      wishlist: serializeMongoDocs(wishlistProducts),
      store: store ? serialize(store) : null,
    },
  };
}

export async function getCustomerOrdersAction(
  storeSlug: string,
  options?: { status?: string; page?: number; limit?: number }
) {
  const auth = await requireCustomer(storeSlug);
  if (!auth.ok) return { success: false, error: auth.error };

  await connectToDatabase();
  const page = options?.page ?? 1;
  const limit = options?.limit ?? 10;
  const skip = (page - 1) * limit;

  const query: Record<string, unknown> = {
    userId: new mongoose.Types.ObjectId(auth.customer.id),
    storeId: new mongoose.Types.ObjectId(auth.customer.storeId),
  };
  if (options?.status) query.status = options.status;

  const [orders, total] = await Promise.all([
    Order.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    Order.countDocuments(query),
  ]);

  return {
    success: true,
    data: {
      data: serialize(orders),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1,
      },
    },
  };
}

export async function getCustomerWishlistAction(storeSlug: string) {
  const auth = await requireCustomer(storeSlug);
  if (!auth.ok) return { success: false, error: auth.error };

  await connectToDatabase();
  const wishlist = await Wishlist.findOne({
    userId: auth.customer.id,
    storeId: auth.customer.storeId,
  })
    .populate({
      path: "items.productId",
      select: "name slug images sellingPrice discountPrice stockQuantity",
    })
    .lean();

  const products =
    wishlist?.items
      ?.map((i) => i.productId)
      .filter((p) => p && typeof p === "object") ?? [];

  return { success: true, data: { products: serializeMongoDocs(products as object[]) } };
}

export async function getCustomerOrderByIdAction(storeSlug: string, orderId: string) {
  const auth = await requireCustomer(storeSlug);
  if (!auth.ok) return { success: false, error: auth.error };

  await connectToDatabase();
  const order = await Order.findOne({
    _id: orderId,
    userId: auth.customer.id,
    storeId: auth.customer.storeId,
  }).lean();

  if (!order) return { success: false, error: "الطلب غير موجود" };
  return { success: true, data: serialize(order) };
}

export async function toggleCustomerWishlistAction(
  storeSlug: string,
  productId: string
) {
  const auth = await requireCustomer(storeSlug);
  if (!auth.ok) return { success: false, error: auth.error };

  await connectToDatabase();
  const product = await Product.findOne({
    _id: productId,
    storeId: auth.customer.storeId,
    isDeleted: false,
  }).select("_id");
  if (!product) return { success: false, error: "المنتج غير موجود" };

  let wishlist = await Wishlist.findOne({
    userId: auth.customer.id,
    storeId: auth.customer.storeId,
  });

  if (!wishlist) {
    wishlist = await Wishlist.create({
      userId: auth.customer.id,
      storeId: auth.customer.storeId,
      tenantId: auth.customer.tenantId,
      items: [],
    });
  }

  const idx = wishlist.items.findIndex(
    (i) => i.productId.toString() === productId
  );
  let added: boolean;
  if (idx >= 0) {
    wishlist.items.splice(idx, 1);
    added = false;
  } else {
    wishlist.items.push({
      productId: new mongoose.Types.ObjectId(productId),
      addedAt: new Date(),
    });
    added = true;
  }
  await wishlist.save();

  return { success: true, data: { added } };
}
