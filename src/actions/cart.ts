"use server";

import { connectToDatabase } from "@/lib/db/mongodb";
import Cart from "@/models/Cart";
import Product from "@/models/Product";
import { auth } from "@/lib/auth";
import type { ApiResponse, CartState } from "@/types";
import { z } from "zod";
import mongoose from "mongoose";
import { siteConfig } from "@/config/site";

const addToCartSchema = z.object({
  productId: z.string().min(1, "Product ID is required"),
  quantity: z.coerce.number().int().min(1, "Quantity must be at least 1"),
});

const updateCartSchema = z.object({
  productId: z.string().min(1),
  quantity: z.coerce.number().int().min(0),
});

function calculateCartTotals(items: CartState["items"], discount = 0): CartState {
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const tax = subtotal * siteConfig.tax.rate;
  const shipping = subtotal === 0 || subtotal >= siteConfig.shipping.freeAbove
    ? 0
    : siteConfig.shipping.basePrice;
  const total = subtotal + tax + shipping - discount;

  return {
    items,
    subtotal,
    tax,
    shipping,
    discount,
    total: Math.max(0, total),
  };
}

async function getCartIdentifier(): Promise<{
  userId?: string;
  sessionId?: string;
}> {
  const session = await auth();
  if (session?.user) {
    return { userId: session.user.id };
  }
  // For guest carts, we'd use a cookie-based session ID
  // This is simplified - in production use cookies
  return { sessionId: "guest" };
}

export async function getCartAction(): Promise<ApiResponse<CartState>> {
  try {
    await connectToDatabase();
    const { userId, sessionId } = await getCartIdentifier();

    const query = userId
      ? { userId: new mongoose.Types.ObjectId(userId) }
      : { sessionId };

    const cart = await Cart.findOne(query).lean();

    if (!cart || cart.items.length === 0) {
      return {
        success: true,
        data: calculateCartTotals([]),
      };
    }

    const items = cart.items.map((item) => ({
      productId: item.productId.toString(),
      name: item.name,
      slug: item.slug,
      image: item.image,
      price: item.price,
      quantity: item.quantity,
      stock: item.stock,
      sku: item.sku,
    }));

    return {
      success: true,
      data: calculateCartTotals(items, cart.discount),
    };
  } catch (error) {
    console.error("Get cart error:", error);
    return { success: false, error: "Failed to fetch cart" };
  }
}

export async function addToCartAction(rawData: unknown): Promise<ApiResponse<CartState>> {
  const parsed = addToCartSchema.safeParse(rawData);
  if (!parsed.success) {
    return {
      success: false,
      error: "Validation failed",
      errors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  const { productId, quantity } = parsed.data;

  try {
    await connectToDatabase();

    // Validate product exists and has stock
    const product = await Product.findOne({
      _id: new mongoose.Types.ObjectId(productId),
      isActive: true,
      isDeleted: false,
    }).select("name slug images thumbnail sellingPrice discountPrice stockQuantity sku");

    if (!product) {
      return { success: false, error: "Product not found" };
    }

    if (product.stockQuantity < quantity) {
      return {
        success: false,
        error: `Only ${product.stockQuantity} items available in stock`,
      };
    }

    const { userId, sessionId } = await getCartIdentifier();
    const query = userId
      ? { userId: new mongoose.Types.ObjectId(userId) }
      : { sessionId };

    const price = product.discountPrice ?? product.sellingPrice;
    const image = product.thumbnail ?? product.images[0]?.url ?? "";

    let cart = await Cart.findOne(query);

    if (!cart) {
      cart = new Cart({
        ...query,
        items: [],
      });
    }

    const existingItemIndex = cart.items.findIndex(
      (item) => item.productId.toString() === productId
    );

    if (existingItemIndex >= 0) {
      const newQty = cart.items[existingItemIndex].quantity + quantity;
      if (newQty > product.stockQuantity) {
        return {
          success: false,
          error: `Cannot add more. Only ${product.stockQuantity} items available.`,
        };
      }
      cart.items[existingItemIndex].quantity = newQty;
    } else {
      cart.items.push({
        productId: new mongoose.Types.ObjectId(productId),
        name: product.name,
        slug: product.slug,
        image,
        price,
        quantity,
        stock: product.stockQuantity,
        sku: product.sku,
      });
    }

    // Extend expiry
    cart.expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await cart.save();

    const items = cart.items.map((item) => ({
      productId: item.productId.toString(),
      name: item.name,
      slug: item.slug,
      image: item.image,
      price: item.price,
      quantity: item.quantity,
      stock: item.stock,
      sku: item.sku,
    }));

    return {
      success: true,
      data: calculateCartTotals(items, cart.discount),
      message: "Item added to cart",
    };
  } catch (error) {
    console.error("Add to cart error:", error);
    return { success: false, error: "Failed to add item to cart" };
  }
}

export async function updateCartItemAction(
  rawData: unknown
): Promise<ApiResponse<CartState>> {
  const parsed = updateCartSchema.safeParse(rawData);
  if (!parsed.success) {
    return { success: false, error: "Invalid data" };
  }

  const { productId, quantity } = parsed.data;

  try {
    await connectToDatabase();
    const { userId, sessionId } = await getCartIdentifier();
    const query = userId
      ? { userId: new mongoose.Types.ObjectId(userId) }
      : { sessionId };

    const cart = await Cart.findOne(query);
    if (!cart) {
      return { success: false, error: "Cart not found" };
    }

    if (quantity === 0) {
      cart.items = cart.items.filter(
        (item) => item.productId.toString() !== productId
      );
    } else {
      const itemIndex = cart.items.findIndex(
        (item) => item.productId.toString() === productId
      );
      if (itemIndex >= 0) {
        // Validate stock
        const product = await Product.findById(productId).select("stockQuantity");
        if (product && quantity > product.stockQuantity) {
          return {
            success: false,
            error: `Only ${product.stockQuantity} items available`,
          };
        }
        cart.items[itemIndex].quantity = quantity;
      }
    }

    await cart.save();

    const items = cart.items.map((item) => ({
      productId: item.productId.toString(),
      name: item.name,
      slug: item.slug,
      image: item.image,
      price: item.price,
      quantity: item.quantity,
      stock: item.stock,
      sku: item.sku,
    }));

    return {
      success: true,
      data: calculateCartTotals(items, cart.discount),
    };
  } catch (error) {
    console.error("Update cart error:", error);
    return { success: false, error: "Failed to update cart" };
  }
}

export async function removeFromCartAction(
  productId: string
): Promise<ApiResponse<CartState>> {
  return updateCartItemAction({ productId, quantity: 0 });
}

export async function clearCartAction(): Promise<ApiResponse> {
  try {
    await connectToDatabase();
    const { userId, sessionId } = await getCartIdentifier();
    const query = userId
      ? { userId: new mongoose.Types.ObjectId(userId) }
      : { sessionId };

    await Cart.findOneAndDelete(query);

    return { success: true, message: "Cart cleared" };
  } catch (error) {
    console.error("Clear cart error:", error);
    return { success: false, error: "Failed to clear cart" };
  }
}
