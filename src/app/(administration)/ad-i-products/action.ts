"use server";

import "server-only";
/* eslint-disable @typescript-eslint/no-explicit-any */
import { revalidatePath } from "next/cache";
import mongoose from "mongoose";
import { z } from "zod";
import { notifyTenantUsers } from "@/actions/notifications";
import { getAdministrationContext } from "@/lib/administration/context";
import { hasPermission } from "@/lib/auth/permissions";
import { connectToDatabase } from "@/lib/db/mongodb";
import { generateSlug } from "@/lib/utils";
import Brand from "@/models/Brand";
import Category from "@/models/Category";
import Product from "@/models/Product";

const unitTypes = ["piece", "kg", "gram", "liter", "meter", "box", "pack", "set", "pair"] as const;

const objectIdSchema = z.string().refine((value) => mongoose.Types.ObjectId.isValid(value), {
  message: "Invalid id",
});

const productImageSchema = z.object({
  url: z.string().url().refine((url) => url.startsWith("https://res.cloudinary.com/"), {
    message: "Only Cloudinary images are accepted",
  }),
  publicId: z.string().min(3).max(250).refine((value) => value.startsWith("lumora-saas/"), {
    message: "Image is outside the application upload scope",
  }),
  alt: z.string().max(160).optional(),
  isPrimary: z.boolean().optional(),
});

const productPayloadSchema = z.object({
  name: z.string().trim().min(2).max(200),
  sku: z.string().trim().min(2).max(80),
  barcode: z.string().trim().max(80).optional(),
  category: objectIdSchema,
  brand: objectIdSchema,
  description: z.string().trim().min(10).max(5000),
  shortDescription: z.string().trim().max(500).optional(),
  purchasePrice: z.number().min(0),
  wholesalePrice: z.number().min(0),
  sellingPrice: z.number().min(0.01),
  discountPrice: z.number().min(0).optional(),
  stockQuantity: z.number().int().min(0),
  lowStockThreshold: z.number().int().min(0),
  unitType: z.enum(unitTypes),
  tags: z.array(z.string().trim().min(1).max(40)).max(20),
  specifications: z
    .array(
      z.object({
        key: z.string().trim().min(1).max(80),
        value: z.string().trim().min(1).max(200),
      })
    )
    .max(20),
  images: z.array(productImageSchema).max(8),
});

function asNumber(value: FormDataEntryValue | null, fallback = 0) {
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
}

function productSlug(name: string, sku: string) {
  const slug = generateSlug(name);
  return slug || generateSlug(sku) || `product-${Date.now()}`;
}

function splitList(value: FormDataEntryValue | null) {
  return String(value ?? "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function parseSpecifications(formData: FormData) {
  const keys = formData.getAll("specKey").map((value) => String(value).trim());
  const values = formData.getAll("specValue").map((value) => String(value).trim());

  return keys
    .map((key, index) => ({ key, value: values[index] ?? "" }))
    .filter((item) => item.key && item.value);
}

function parseImages(formData: FormData) {
  const raw = String(formData.get("imagesJson") ?? "[]");

  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function readProductPayload(formData: FormData) {
  return productPayloadSchema.safeParse({
    name: String(formData.get("name") ?? ""),
    sku: String(formData.get("sku") ?? "").toUpperCase(),
    barcode: String(formData.get("barcode") ?? "") || undefined,
    category: String(formData.get("category") ?? ""),
    brand: String(formData.get("brand") ?? ""),
    description: String(formData.get("description") ?? ""),
    shortDescription: String(formData.get("shortDescription") ?? "") || undefined,
    purchasePrice: asNumber(formData.get("purchasePrice"), 0),
    wholesalePrice: asNumber(formData.get("wholesalePrice"), 0),
    sellingPrice: asNumber(formData.get("sellingPrice"), 0),
    discountPrice: formData.get("discountPrice") ? asNumber(formData.get("discountPrice"), 0) : undefined,
    stockQuantity: Math.floor(asNumber(formData.get("stockQuantity"), 0)),
    lowStockThreshold: Math.floor(asNumber(formData.get("lowStockThreshold"), 10)),
    unitType: String(formData.get("unitType") ?? "piece"),
    tags: splitList(formData.get("tags")),
    specifications: parseSpecifications(formData),
    images: parseImages(formData),
  });
}

async function assertStoreCatalogRefs(storeId: string, category: string, brand: string) {
  const [categoryExists, brandExists] = await Promise.all([
    Category.exists({ _id: category, storeId, isActive: true }),
    Brand.exists({ _id: brand, storeId, isActive: true }),
  ]);

  return Boolean(categoryExists && brandExists);
}

export async function getAdministrationProducts() {
  const ctx = await getAdministrationContext("manage_products");
  await connectToDatabase();

  const [products, categories, brands] = await Promise.all([
    Product.find({ storeId: ctx.storeId, isDeleted: false })
      .select(
        "name sku sellingPrice discountPrice purchasePrice wholesalePrice stockQuantity lowStockThreshold isActive isFeatured thumbnail images createdAt"
      )
      .sort({ createdAt: -1 })
      .limit(80)
      .lean(),
    Category.find({ storeId: ctx.storeId, isActive: true })
      .select("name nameAr")
      .sort({ sortOrder: 1, name: 1 })
      .lean(),
    Brand.find({ storeId: ctx.storeId, isActive: true })
      .select("name nameAr")
      .sort({ sortOrder: 1, name: 1 })
      .lean(),
  ]);

  return {
    store: { name: ctx.storeName, slug: ctx.storeSlug },
    canApprove:
      ctx.isManager ||
      ctx.role === "tenant_admin" ||
      hasPermission(ctx.role, "manage_settings", ctx.permissions, ctx.isManager),
    products: products.map((product: any) => ({
      id: product._id.toString(),
      name: product.name,
      sku: product.sku,
      price: product.sellingPrice ?? 0,
      discountPrice: product.discountPrice ?? "",
      purchasePrice: product.purchasePrice ?? 0,
      wholesalePrice: product.wholesalePrice ?? 0,
      stockQuantity: product.stockQuantity ?? 0,
      lowStockThreshold: product.lowStockThreshold ?? 10,
      isActive: Boolean(product.isActive),
      isFeatured: Boolean(product.isFeatured),
      thumbnail:
        product.thumbnail ||
        product.images?.find((image: any) => image.isPrimary)?.url ||
        product.images?.[0]?.url ||
        "",
    })),
    categories: categories.map((category: any) => ({
      id: category._id.toString(),
      name: category.nameAr || category.name,
    })),
    brands: brands.map((brand: any) => ({
      id: brand._id.toString(),
      name: brand.nameAr || brand.name,
    })),
  };
}

export async function createAdministrationProductAction(formData: FormData) {
  const ctx = await getAdministrationContext("manage_products");
  await connectToDatabase();

  const parsed = readProductPayload(formData);
  if (!parsed.success) {
    return { success: false, error: "بيانات المنتج غير مكتملة أو غير صالحة" };
  }

  const data = parsed.data;
  const refsAllowed = await assertStoreCatalogRefs(ctx.storeId, data.category, data.brand);
  if (!refsAllowed) {
    return { success: false, error: "الفئة أو الماركة غير تابعة لهذا المتجر" };
  }

  if (data.discountPrice && data.discountPrice >= data.sellingPrice) {
    return { success: false, error: "سعر الخصم يجب أن يكون أقل من سعر البيع" };
  }

  const isPrivileged =
    ctx.isManager ||
    ctx.role === "tenant_admin" ||
    hasPermission(ctx.role, "manage_settings", ctx.permissions, ctx.isManager);

  const images = data.images.map((image, index) => ({
    ...image,
    alt: image.alt || data.name,
    isPrimary: index === 0,
  }));

  let product;
  try {
    product = await Product.create({
      tenantId: new mongoose.Types.ObjectId(ctx.tenantId),
      storeId: new mongoose.Types.ObjectId(ctx.storeId),
      name: data.name,
      slug: productSlug(data.name, data.sku),
      description: data.description,
      shortDescription: data.shortDescription || data.description.slice(0, 180),
      sku: data.sku,
      barcode: data.barcode,
      category: new mongoose.Types.ObjectId(data.category),
      brand: new mongoose.Types.ObjectId(data.brand),
      purchasePrice: data.purchasePrice,
      wholesalePrice: data.wholesalePrice || data.sellingPrice,
      sellingPrice: data.sellingPrice,
      discountPrice: data.discountPrice,
      stockQuantity: data.stockQuantity,
      soldQuantity: 0,
      remainingQuantity: data.stockQuantity,
      lowStockThreshold: data.lowStockThreshold,
      unitType: data.unitType,
      isFeatured: formData.get("isFeatured") === "on",
      isActive: isPrivileged ? formData.get("isActive") === "on" : false,
      images,
      thumbnail: images[0]?.url,
      specifications: data.specifications,
      variants: [],
      tags: data.tags,
      metaTitle: data.name,
      metaDescription: data.shortDescription || data.description.slice(0, 160),
      metaKeywords: data.tags,
    });
  } catch (error: any) {
    if (error?.code === 11000) {
      return { success: false, error: "يوجد منتج بنفس SKU أو الرابط داخل هذا المتجر" };
    }
    throw error;
  }

  await notifyTenantUsers({
    tenantId: ctx.tenantId,
    storeId: ctx.storeId,
    type: isPrivileged ? "product_created" : "product_review_required",
    title: "New product added",
    titleAr: isPrivileged ? "تمت إضافة منتج جديد" : "منتج جديد بانتظار المراجعة",
    message: `${ctx.userName} added ${product.name}`,
    messageAr: `قام ${ctx.userName} بإضافة المنتج ${product.name}`,
    link: "/ad-i-products",
    metadata: { productId: product._id.toString(), sku: product.sku },
  });

  revalidatePath("/ad-i-products");
  return { success: true, message: "تمت إضافة المنتج بنجاح" };
}

export async function updateAdministrationProductAction(formData: FormData) {
  const ctx = await getAdministrationContext("manage_products");
  await connectToDatabase();

  const productId = String(formData.get("productId") ?? "");
  if (!mongoose.Types.ObjectId.isValid(productId)) {
    return { success: false, error: "معرف المنتج غير صالح" };
  }

  const product = await Product.findOne({ _id: productId, storeId: ctx.storeId, isDeleted: false });
  if (!product) return { success: false, error: "المنتج غير موجود" };

  product.name = String(formData.get("name") ?? product.name).trim();
  product.sku = String(formData.get("sku") ?? product.sku).trim().toUpperCase();
  product.sellingPrice = asNumber(formData.get("sellingPrice"), product.sellingPrice);
  product.purchasePrice = asNumber(formData.get("purchasePrice"), product.purchasePrice);
  product.wholesalePrice = asNumber(formData.get("wholesalePrice"), product.wholesalePrice);
  product.discountPrice = formData.get("discountPrice")
    ? asNumber(formData.get("discountPrice"), product.discountPrice ?? 0)
    : undefined;

  if (product.discountPrice && product.discountPrice >= product.sellingPrice) {
    return { success: false, error: "سعر الخصم يجب أن يكون أقل من سعر البيع" };
  }

  product.stockQuantity = Math.max(0, Math.floor(asNumber(formData.get("stockQuantity"), product.stockQuantity)));
  product.lowStockThreshold = Math.max(0, Math.floor(asNumber(formData.get("lowStockThreshold"), product.lowStockThreshold)));
  product.isFeatured = formData.get("isFeatured") === "on";
  product.isActive = formData.get("isActive") === "on";

  try {
    await product.save();
  } catch (error: any) {
    if (error?.code === 11000) {
      return { success: false, error: "يوجد منتج بنفس SKU أو الرابط داخل هذا المتجر" };
    }
    throw error;
  }

  await notifyTenantUsers({
    tenantId: ctx.tenantId,
    storeId: ctx.storeId,
    type: "product_updated",
    title: "Product updated",
    titleAr: "تم تعديل منتج",
    message: `${ctx.userName} updated ${product.name}`,
    messageAr: `قام ${ctx.userName} بتعديل المنتج ${product.name}`,
    link: "/ad-i-products",
    metadata: { productId: product._id.toString(), sku: product.sku },
  });

  revalidatePath("/ad-i-products");
  return { success: true, message: "تم تحديث المنتج بنجاح" };
}

export async function deleteAdministrationProductAction(formData: FormData) {
  const ctx = await getAdministrationContext("manage_products");
  await connectToDatabase();

  const productId = String(formData.get("productId") ?? "");
  if (!mongoose.Types.ObjectId.isValid(productId)) {
    return { success: false, error: "معرف المنتج غير صالح" };
  }

  const product = await Product.findOneAndUpdate(
    { _id: productId, storeId: ctx.storeId, isDeleted: false },
    { isDeleted: true, isActive: false, deletedAt: new Date() },
    { new: true }
  );
  if (!product) return { success: false, error: "المنتج غير موجود" };

  await notifyTenantUsers({
    tenantId: ctx.tenantId,
    storeId: ctx.storeId,
    type: "product_deleted",
    title: "Product deleted",
    titleAr: "تم حذف منتج",
    message: `${ctx.userName} deleted ${product.name}`,
    messageAr: `قام ${ctx.userName} بحذف المنتج ${product.name}`,
    link: "/ad-i-products",
    metadata: { productId: product._id.toString(), sku: product.sku },
  });

  revalidatePath("/ad-i-products");
  return { success: true, message: "تم حذف المنتج" };
}
