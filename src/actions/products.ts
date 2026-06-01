"use server";

import { connectToDatabase } from "@/lib/db/mongodb";
import Product from "@/models/Product";
import AuditLog from "@/models/AuditLog";
import { auth } from "@/lib/auth";
import {
  createProductSchema,
  updateProductSchema,
  productFilterSchema,
  addReviewSchema,
} from "@/schemas/product";
import { serialize } from "@/lib/serialize";
import type { ApiResponse, PaginatedResponse } from "@/types";
import type { IProduct } from "@/models/Product";
import slugify from "slugify";
import { nanoid } from "nanoid";
import mongoose from "mongoose";
import Category from "@/models/Category";
import Store from "@/models/Store";
import Brand from "@/models/Brand";




// ─────────────────────────────────────────────────────────────────────────────
// PUBLIC ACTIONS
// ─────────────────────────────────────────────────────────────────────────────

export async function getProductsAction(
  rawFilters: unknown
): Promise<ApiResponse<PaginatedResponse<IProduct>>> {
  const parsed = productFilterSchema.safeParse(rawFilters);
  if (!parsed.success) {
    return { success: false, error: "Invalid filter parameters" };
  }

  const {
    storeSlug, search, category, subcategory, brand,
    minPrice, maxPrice, featured, inStock,
    sortBy, page, limit,
  } = parsed.data;

  try {
    await connectToDatabase();

    const query: mongoose.FilterQuery<IProduct> = {
      isActive: true,
      isDeleted: false,
    };

    if (storeSlug) {
      const store = await Store.findOne({ slug: storeSlug }).select("_id tenantId").lean();
      if (!store) return { success: false, error: "Store not found" };
      query.storeId = store._id;
      query.tenantId = store.tenantId;
    }

    if (search?.trim()) {
      const escapedSearch = search.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const searchRegex = new RegExp(escapedSearch, "i");
      query.$or = [
        { name: searchRegex },
        { nameAr: searchRegex },
        { description: searchRegex },
        { descriptionAr: searchRegex },
        { sku: searchRegex },
        { barcode: searchRegex },
        { tags: searchRegex },
      ];
    }
    if (category)   query.category     = new mongoose.Types.ObjectId(category);
    if (subcategory) query.subcategoryId = subcategory;
    if (brand)      query.brand        = new mongoose.Types.ObjectId(brand);
    if (minPrice !== undefined || maxPrice !== undefined) {
      query.sellingPrice = {};
      if (minPrice !== undefined) query.sellingPrice.$gte = minPrice;
      if (maxPrice !== undefined) query.sellingPrice.$lte = maxPrice;
    }
    if (featured !== undefined) query.isFeatured   = featured;
    if (inStock)                query.stockQuantity = { $gt: 0 };

    const sortOptions: Record<string, Record<string, 1 | -1>> = {
      price_asc:  { sellingPrice: 1 },
      price_desc: { sellingPrice: -1 },
      newest:     { createdAt: -1 },
      oldest:     { createdAt: 1 },
      name_asc:   { name: 1 },
      name_desc:  { name: -1 },
      popular:    { soldQuantity: -1 },
    };

    const sort: Record<string, 1 | -1> =
      sortBy ? (sortOptions[sortBy] ?? { createdAt: -1 }) : { createdAt: -1 };

    const skip = (page - 1) * limit;

    const [products, total] = await Promise.all([
      Product.find(query)
        .populate("category", "name slug")
        // .populate("brand", "name slug logo")
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean(),
      Product.countDocuments(query),
    ]);

    return {
      success: true,
      data: {
        // serialize converts ObjectIds / Dates to plain strings
        data: serialize(products) as unknown as IProduct[],
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
          hasNext: page < Math.ceil(total / limit),
          hasPrev: page > 1,
        },
      },
    };
  } catch (error) {
    console.error("Get products error:", error);
    return { success: false, error: "Failed to fetch products" };
  }
}

export async function getProductBySlugAction(
  slug: string
): Promise<ApiResponse<IProduct>> {
  if (!slug) return { success: false, error: "Slug is required" };

  try {
    await connectToDatabase();

    const product = await Product.findOne({
      slug,
      isActive: true,
      isDeleted: false,
    })
      .populate("category", "name slug subcategories")
      .populate("brand", "name slug logo")
      .populate("supplier", "name")
      .lean();

    if (!product) {
      return { success: false, error: "Product not found" };
    }

    return { success: true, data: serialize(product) as unknown as IProduct };
  } catch (error) {
    console.error("Get product error:", error);
    return { success: false, error: "Failed to fetch product" };
  }
}

export async function getFeaturedProductsAction(
  limit = 8
): Promise<ApiResponse<IProduct[]>> {
  try {
    await connectToDatabase();

    const products = await Product.find({
      isFeatured: true,
      isActive: true,
      isDeleted: false,
      stockQuantity: { $gt: 0 },
    })
      .populate("brand", "name slug logo")
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    return {
      success: true,
      data: serialize(products) as unknown as IProduct[],
    };
  } catch (error) {
    console.error("Get featured products error:", error);
    return { success: false, error: "Failed to fetch featured products" };
  }
}

export async function getRelatedProductsAction(
  productId: string,
  categoryId: string,
  limit = 4
): Promise<ApiResponse<IProduct[]>> {
  try {
    await connectToDatabase();

    const products = await Product.find({
      _id:      { $ne: new mongoose.Types.ObjectId(productId) },
      category: new mongoose.Types.ObjectId(categoryId),
      isActive: true,
      isDeleted: false,
    })
      .populate("brand", "name slug")
      .sort({ soldQuantity: -1 })
      .limit(limit)
      .lean();

    return {
      success: true,
      data: serialize(products) as unknown as IProduct[],
    };
  } catch (error) {
    console.error("Get related products error:", error);
    return { success: false, error: "Failed to fetch related products" };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN ACTIONS
// ─────────────────────────────────────────────────────────────────────────────

// src/actions/products.ts (جزء createProductAction)
// src/actions/products.ts

export async function createProductAction(
  rawData: unknown,
  storeSlug?: string
): Promise<ApiResponse<{ id: string; slug: string }>> {
  const session = await auth();
  if (!session?.user) {
    return { success: false, error: "Unauthorized" };
  }

  if (!["tenant_admin", "store_admin", "super_admin"].includes(session.user.role)) {
    return { success: false, error: "Insufficient permissions" };
  }

  const parsed = createProductSchema.safeParse(rawData);
  if (!parsed.success) {
    return {
      success: false,
      error: "Validation failed",
      errors: parsed.error.flatten().fieldErrors,
    };
  }

  try {
    await connectToDatabase();

    const data = parsed.data;
    
    let store;
    if (storeSlug) {
      store = await Store.findOne({ slug: storeSlug });
    } else if (session.user.storeId) {
      store = await Store.findById(session.user.storeId);
    }
    
    if (!store) {
      console.error("Store not found for slug:", storeSlug);
      console.error("Session user storeId:", session.user.storeId);
      return { success: false, error: "Store not found" };
    }
    
    if (session.user.role === "tenant_admin") {
      if (store.tenantId.toString() !== session.user.tenantId) {
        return { success: false, error: "You do not have access to this store" };
      }
    } else if (session.user.role === "store_admin") {
      if (store._id.toString() !== session.user.storeId) {
        return { success: false, error: "You do not have access to this store" };
      }
    }

    const [category, brand] = await Promise.all([
      Category.findOne({
        _id: data.category,
        storeId: store._id,
        tenantId: store.tenantId,
      }).select("_id"),
      Brand.findOne({
        _id: data.brand,
        storeId: store._id,
        tenantId: store.tenantId,
      }).select("_id"),
    ]);

    if (!category) {
      return { success: false, error: "Category not found for this store" };
    }

    if (!brand) {
      return { success: false, error: "Brand not found for this store" };
    }

    const existingSku = await Product.findOne({
      sku: data.sku,
      storeId: store._id,
      tenantId: store.tenantId,
      isDeleted: false,
    }).select("_id");

    if (existingSku) {
      return { success: false, error: "A product with this SKU already exists" };
    }

    const baseSlug =
      slugify(data.name, { lower: true, strict: true, trim: true }) ||
      nanoid(8).toLowerCase();

    let slug = baseSlug;
    const existingSlug = await Product.findOne({
      slug,
      storeId: store._id,
      tenantId: store.tenantId,
      isDeleted: false,
    }).select("_id");

    if (existingSlug) {
      slug = `${baseSlug}-${nanoid(6).toLowerCase()}`;
    }

    const images = data.images.map((image, index) => ({
      ...image,
      isPrimary: data.images.some((item) => item.isPrimary)
        ? image.isPrimary
        : index === 0,
    }));

    const primaryImage = images.find((image) => image.isPrimary) ?? images[0];

    const product = await Product.create({
      ...data,
      tenantId: store.tenantId,
      storeId: store._id,
      slug,
      category: new mongoose.Types.ObjectId(data.category),
      brand: new mongoose.Types.ObjectId(data.brand),
      supplier: data.supplier ? new mongoose.Types.ObjectId(data.supplier) : undefined,
      images,
      thumbnail: data.thumbnail || primaryImage?.url,
      soldQuantity: 0,
      remainingQuantity: data.stockQuantity,
      isDeleted: false,
      profitMargin:
        data.sellingPrice > 0
          ? ((data.sellingPrice - data.purchasePrice) / data.sellingPrice) * 100
          : 0,
    });

    await Promise.all([
      Store.findByIdAndUpdate(store._id, {
        $inc: { "statistics.totalProducts": 1 },
      }),
      AuditLog.create({
        userId: session.user.id,
        userEmail: session.user.email,
        userRole: session.user.role,
        action: "CREATE",
        resource: "Product",
        resourceId: product._id.toString(),
        details: { name: product.name, sku: product.sku, storeSlug: store.slug },
        success: true,
      }),
    ]);

    return {
      success: true,
      data: { id: product._id.toString(), slug: product.slug },
      message: "Product created successfully",
    };
  } catch (error) {
    console.error("Create product error:", error);
    if (error instanceof mongoose.Error.ValidationError) {
      return { success: false, error: error.message };
    }
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === 11000
    ) {
      return { success: false, error: "Product slug or SKU already exists" };
    }
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create product",
    };
  }
}
export async function updateProductAction(rawData: unknown): Promise<ApiResponse> {
  const session = await auth();
  if (!session?.user || !["tenant_admin", "store_admin", "super_admin"].includes(session.user.role)) {
    return { success: false, error: "Insufficient permissions" };
  }

  const parsed = updateProductSchema.safeParse(rawData);
  if (!parsed.success) {
    return {
      success: false,
      error: "Validation failed",
      errors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  const { id, ...updateData } = parsed.data;

  try {
    await connectToDatabase();

    if (!await Product.findById(id)) {
      return { success: false, error: "Product not found" };
    }

    if (
      updateData.sellingPrice !== undefined &&
      updateData.purchasePrice !== undefined
    ) {
      (updateData as Record<string, unknown>).profitMargin =
        ((updateData.sellingPrice - updateData.purchasePrice) /
          updateData.sellingPrice) * 100;
    }

    await Product.findByIdAndUpdate(id, updateData, { runValidators: true });

    await AuditLog.create({
      userId:    session.user.id,
      userEmail: session.user.email,
      userRole:  session.user.role,
      action:    "UPDATE",
      resource:  "Product",
      resourceId: id,
      success:   true,
    });

    return { success: true, message: "Product updated successfully" };
  } catch (error) {
    console.error("Update product error:", error);
    return { success: false, error: "Failed to update product" };
  }
}

export async function deleteProductAction(id: string): Promise<ApiResponse> {
  const session = await auth();
  if (!session?.user || !["admin", "super_admin"].includes(session.user.role)) {
    return { success: false, error: "Insufficient permissions" };
  }
  if (!id) return { success: false, error: "Product ID is required" };

  try {
    await connectToDatabase();

    await Product.findByIdAndUpdate(id, {
      isDeleted: true,
      deletedAt: new Date(),
      isActive:  false,
    });

    await AuditLog.create({
      userId:    session.user.id,
      userEmail: session.user.email,
      userRole:  session.user.role,
      action:    "DELETE",
      resource:  "Product",
      resourceId: id,
      success:   true,
    });

    return { success: true, message: "Product deleted successfully" };
  } catch (error) {
    console.error("Delete product error:", error);
    return { success: false, error: "Failed to delete product" };
  }
}

export async function addProductReviewAction(rawData: unknown): Promise<ApiResponse> {
  const session = await auth();
  if (!session?.user) return { success: false, error: "Authentication required" };

  const parsed = addReviewSchema.safeParse(rawData);
  if (!parsed.success) {
    return {
      success: false,
      error: "Validation failed",
      errors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  const { productId, rating, comment } = parsed.data;

  try {
    await connectToDatabase();

    const product = await Product.findById(productId);
    if (!product) return { success: false, error: "Product not found" };

    if (product.reviews.some((r) => r.userId.toString() === session.user.id)) {
      return { success: false, error: "You have already reviewed this product" };
    }

    product.reviews.push({
      userId:    new mongoose.Types.ObjectId(session.user.id),
      userName:  session.user.name ?? "Anonymous",
      userImage: session.user.image ?? undefined,
      rating,
      comment,
      isVerified: false,
      createdAt:  new Date(),
    } as IProduct["reviews"][0]);

    const totalRating = product.reviews.reduce((sum, r) => sum + r.rating, 0);
    product.averageRating = totalRating / product.reviews.length;
    product.reviewCount   = product.reviews.length;

    await product.save();

    return { success: true, message: "Review added successfully" };
  } catch (error) {
    console.error("Add review error:", error);
    return { success: false, error: "Failed to add review" };
  }
}

// src/actions/products.ts
export async function getAdminProductsAction(
  rawFilters: unknown,
  storeSlug?: string  // ✅ إضافة storeSlug
): Promise<ApiResponse<PaginatedResponse<IProduct>>> {
  const session = await auth();
  if (!session?.user) {
    return { success: false, error: "غير مصرح" };
  }

  // ✅ المستأجر فقط أو مدير المتجر
  if (!["tenant_admin", "store_admin", "super_admin"].includes(session.user.role)) {
    return { success: false, error: "صلاحيات غير كافية" };
  }

  const parsed = productFilterSchema.safeParse(rawFilters);
  if (!parsed.success) {
    return { success: false, error: "Invalid filter parameters" };
  }

  const { search, category, brand, page, limit } = parsed.data;

  try {
    await connectToDatabase();

    const query: mongoose.FilterQuery<IProduct> = { isDeleted: false };

    // ✅ فلترة حسب المتجر
    if (storeSlug) {
      const store = await Store.findOne({ slug: storeSlug });
      if (!store) {
        return { success: false, error: "المتجر غير موجود" };
      }
      
      // ✅ التحقق من صلاحية الوصول للمتجر
      if (session.user.role === "tenant_admin") {
        if (store.tenantId.toString() !== session.user.tenantId) {
          return { success: false, error: "لا تملك صلاحية الوصول لهذا المتجر" };
        }
      } else if (session.user.role === "store_admin" || session.user.role === "store_staff") {
        if (store._id.toString() !== session.user.storeId) {
          return { success: false, error: "لا تملك صلاحية الوصول لهذا المتجر" };
        }
      }
      
      query.storeId = store._id;
    } else if (session.user.tenantId) {
      // ✅ إذا لم يحدد متجر، اعرض منتجات كل متاجر المستأجر
      const stores = await Store.find({ tenantId: session.user.tenantId });
      const storeIds = stores.map(s => s._id);
      query.storeId = { $in: storeIds };
    } else if (session.user.storeId) {
      query.storeId = session.user.storeId;
    }

    if (search?.trim()) {
      const escapedSearch = search.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const searchRegex = new RegExp(escapedSearch, "i");

      query.$or = [
        { name: searchRegex },
        { nameAr: searchRegex },
        { description: searchRegex },
        { descriptionAr: searchRegex },
        { sku: searchRegex },
        { barcode: searchRegex },
        { tags: searchRegex },
      ];
    }
    if (category) query.category = new mongoose.Types.ObjectId(category);
    if (brand)    query.brand    = new mongoose.Types.ObjectId(brand);

    const skip = (page - 1) * limit;

    const [products, total] = await Promise.all([
      Product.find(query)
        .populate("category", "name")
        .populate("brand", "name")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Product.countDocuments(query),
    ]);

    return {
      success: true,
      data: {
        data: serialize(products) as unknown as IProduct[],
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
          hasNext: page < Math.ceil(total / limit),
          hasPrev: page > 1,
        },
      },
    };
  } catch (error) {
    console.error("Get admin products error:", error);
    return { success: false, error: "Failed to fetch products" };
  }
}
