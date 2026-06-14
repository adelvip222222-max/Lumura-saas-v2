"use server";

import { connectToDatabase } from "@/lib/db/mongodb";
import Wishlist from "@/models/Wishlist";
import Product from "@/models/Product";
import { auth } from "@/lib/auth";
import type { ApiResponse } from "@/types";
import type { IProduct } from "@/models/Product";
import { serialize } from "@/lib/serialize";
import mongoose from "mongoose";

export async function getWishlistAction(): Promise<
  ApiResponse<{ products: IProduct[]; productIds: string[] }>
> {
  const session = await auth();
  if (!session?.user) {
    return { success: false, error: "Authentication required" };
  }

  try {
    await connectToDatabase();

    const wishlist = await Wishlist.findOne({
      userId: new mongoose.Types.ObjectId(session.user.id),
    }).populate({
      path: "items.productId",
      select: "name slug thumbnail images sellingPrice discountPrice stockQuantity averageRating reviewCount brand",
      populate: { path: "brand", select: "name" },
    });

    if (!wishlist) {
      return { success: true, data: { products: [], productIds: [] } };
    }

    const products = wishlist.items
      .map((item) => item.productId)
      .filter(Boolean) as unknown as IProduct[];

    const productIds = wishlist.items.map((item) =>
      item.productId.toString()
    );

    return { success: true, data: { products: serialize(products) as unknown as IProduct[], productIds } };
  } catch (error) {
    console.error("Get wishlist error:", error);
    return { success: false, error: "Failed to fetch wishlist" };
  }
}

export async function toggleWishlistAction(
  productId: string
): Promise<ApiResponse<{ added: boolean }>> {
  const session = await auth();
  if (!session?.user) {
    return { success: false, error: "Authentication required" };
  }

  if (!productId) {
    return { success: false, error: "Product ID is required" };
  }

  try {
    await connectToDatabase();

    // Verify product exists
    const product = await Product.findById(productId).select("_id");
    if (!product) {
      return { success: false, error: "Product not found" };
    }

    const userId = new mongoose.Types.ObjectId(session.user.id);
    const productObjectId = new mongoose.Types.ObjectId(productId);

    let wishlist = await Wishlist.findOne({ userId });

    if (!wishlist) {
      wishlist = new Wishlist({ userId, items: [] });
    }

    const existingIndex = wishlist.items.findIndex(
      (item) => item.productId.toString() === productId
    );

    let added: boolean;

    if (existingIndex >= 0) {
      // Remove from wishlist
      wishlist.items.splice(existingIndex, 1);
      added = false;
    } else {
      // Add to wishlist
      wishlist.items.push({
        productId: productObjectId,
        addedAt: new Date(),
      });
      added = true;
    }

    await wishlist.save();

    return {
      success: true,
      data: { added },
      message: added ? "Added to wishlist" : "Removed from wishlist",
    };
  } catch (error) {
    console.error("Toggle wishlist error:", error);
    return { success: false, error: "Failed to update wishlist" };
  }
}

export async function isInWishlistAction(
  productId: string
): Promise<ApiResponse<boolean>> {
  const session = await auth();
  if (!session?.user) {
    return { success: true, data: false };
  }

  try {
    await connectToDatabase();

    const wishlist = await Wishlist.findOne({
      userId: new mongoose.Types.ObjectId(session.user.id),
      "items.productId": new mongoose.Types.ObjectId(productId),
    });

    return { success: true, data: !!wishlist };
  } catch (error) {
    console.error("Check wishlist error:", error);
    return { success: true, data: false };
  }
}

export async function clearWishlistAction(): Promise<ApiResponse> {
  const session = await auth();
  if (!session?.user) {
    return { success: false, error: "Authentication required" };
  }

  try {
    await connectToDatabase();

    await Wishlist.findOneAndUpdate(
      { userId: new mongoose.Types.ObjectId(session.user.id) },
      { items: [] }
    );

    return { success: true, message: "Wishlist cleared" };
  } catch (error) {
    console.error("Clear wishlist error:", error);
    return { success: false, error: "Failed to clear wishlist" };
  }
}
