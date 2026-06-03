"use server";

import { connectToDatabase } from "@/lib/db/mongodb";
import Store from "@/models/Store";
import Tenant from "@/models/Tenant";  // ✅ إضافة Tenant
import { auth } from "@/lib/auth";
import { serialize } from "@/lib/serialize";
import { z } from "zod";
import type { ApiResponse } from "@/types";
import type { IStore } from "@/models/Store";
import { ensureDefaultPlans, createStoreSubscription } from "@/services/subscription.service";
import { cleanupStoreMediaOnUpdate } from "@/lib/store/store-media";

// ✅ تسجيل النماذج
import "@/models/Tenant";
import "@/models/Store";

// ─── Validation schemas ───────────────────────────────────────────────────────
const createStoreSchema = z.object({
  name: z.string().min(2).max(100).trim(),
  nameAr: z.string().min(2).max(100).trim(),
  slug: z.string().min(3).max(50).regex(/^[a-z0-9-]+$/, "Slug must be lowercase letters, numbers, and hyphens only").trim(),
  description: z.string().max(500).optional(),
  descriptionAr: z.string().max(500).optional(),
  logo: z.string().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
});

const updateStoreSchema = z.object({
  storeId: z.string().min(1),
  name: z.string().min(2).max(100).trim().optional(),
  nameEn: z.string().min(2).max(100).trim().optional(),
  slug: z.string().min(3).max(50).regex(/^[a-z0-9-]+$/).trim().optional(),
  description: z.string().max(2000).optional(),
  descriptionEn: z.string().max(2000).optional(),
  shortBio: z.string().max(200).optional(),
  shortBioEn: z.string().max(200).optional(),
  logo: z.string().optional(),
  logoPublicId: z.string().optional(),
  coverImage: z.string().optional(),
  coverPublicId: z.string().optional(),
  coverImages: z
    .array(
      z.object({
        url: z.string().url(),
        publicId: z.string().optional(),
        alt: z.string().optional(),
      })
    )
    .max(3)
    .optional(),
  favicon: z.string().optional(),
  faviconPublicId: z.string().optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  address: z.string().max(500).optional(),
  isActive: z.boolean().optional(),
  settings: z
    .object({
      currency: z.string().min(3).max(3).optional(),
      language: z.enum(["ar", "en"]).optional(),
      timezone: z.string().optional(),
      dateFormat: z.string().optional(),
      theme: z
        .object({
          primaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
          secondaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
        })
        .optional(),
    })
    .optional(),
  seo: z
    .object({
      title: z.string().max(120).optional(),
      titleEn: z.string().max(120).optional(),
      description: z.string().max(300).optional(),
      descriptionEn: z.string().max(300).optional(),
      keywords: z.array(z.string()).optional(),
    })
    .optional(),
});

// ─── Create store ──────────────────────────────────────────────────────────────
// src/actions/stores.ts (أضف هذه الدالة أو حدثها)

export async function createStoreAction(rawData: {
  name: string;
  slug: string;
  description: string;
  shortBio?: string;
  email: string;
  phone?: string;
  address?: string;
  logo?: string;
  coverImage?: string;
  coverPublicId?: string;
  coverImages?: Array<{ url: string; publicId?: string; alt?: string }>;
  primaryColor?: string;
}): Promise<ApiResponse<{ storeId: string; slug: string }>> {
  const session = await auth();
  if (!session?.user) {
    return { success: false, error: "يجب تسجيل الدخول أولاً" };
  }

  if (!["tenant_admin", "super_admin"].includes(session.user.role)) {
    return { success: false, error: "ليس لديك صلاحية إنشاء متجر" };
  }

  try {
    await connectToDatabase();

    // التحقق من عدم وجود slug مكرر
    const existingStore = await Store.findOne({ slug: rawData.slug });
    if (existingStore) {
      return { success: false, error: "رابط المتجر مستخدم بالفعل" };
    }

    // التحقق من عدد المتاجر المسموح بها
    const tenant = await Tenant.findById(session.user.tenantId);
    const storesCount = await Store.countDocuments({ tenantId: session.user.tenantId });
    
    if (tenant && storesCount >= (tenant.maxStores || 1)) {
      return { success: false, error: `لقد وصلت للحد الأقصى للمتاجر (${tenant.maxStores})` };
    }

    // إنشاء المتجر
    const coverImages = (rawData.coverImages ?? [])
      .filter((image) => image.url)
      .slice(0, 3);
    const primaryCover = coverImages[0];

    const store = await Store.create({
      tenantId: session.user.tenantId,
      slug: rawData.slug,
      name: rawData.name,
      nameEn: rawData.name,
      description: rawData.description,
      descriptionEn: rawData.description,
      shortBio: rawData.shortBio || "",
      shortBioEn: rawData.shortBio || "",
      email: rawData.email,
      phone: rawData.phone || "",
      address: rawData.address || "",
      logo: rawData.logo || "",
      coverImage: primaryCover?.url || rawData.coverImage || "",
      coverPublicId: primaryCover?.publicId || rawData.coverPublicId || "",
      coverImages,
      settings: {
        currency: "EGP",
        language: "ar",
        timezone: "Africa/Cairo",
        dateFormat: "DD/MM/YYYY",
        theme: {
          primaryColor: rawData.primaryColor || "#f97316",
          secondaryColor: "#10b981",
        },
      },
      seo: {
        title: rawData.name,
        titleEn: rawData.name,
        description: rawData.shortBio || rawData.description.slice(0, 160),
        descriptionEn: rawData.shortBio || rawData.description.slice(0, 160),
        keywords: [],
      },
      isActive: true,
    });

    return {
      success: true,
      data: { storeId: store._id.toString(), slug: store.slug },
      message: "تم إنشاء المتجر بنجاح",
    };
  } catch (error) {
    console.error("Create store error:", error);
    return { success: false, error: "فشل إنشاء المتجر" };
  }
}

// ─── Get store by slug (public) ───────────────────────────────────────────────
export async function getStoreBySlugAction(
  slug: string
): Promise<ApiResponse<any>> {
  if (!slug) {
    return { success: false, error: "Slug is required" };
  }

  try {
    await connectToDatabase();

    const store = await Store.findOne({ 
      slug, 
      isActive: true,
      isDeleted: false 
    }).lean();

    if (!store) {
      return { success: false, error: "Store not found" };
    }

    return { 
      success: true, 
      data: serialize(store) 
    };
  } catch (error) {
    console.error("Get store by slug error:", error);
    return { success: false, error: "Failed to fetch store" };
  }
}

// ─── Get store by slug (direct) ───────────────────────────────────────────────
export async function getStoreBySlug(slug: string) {
  await connectToDatabase();
  return await Store.findOne({ slug, isActive: true, isDeleted: false }).lean();
}

// ─── Get my stores (for current tenant) ───────────────────────────────────────
export async function getMyStoresAction(): Promise<ApiResponse<IStore[]>> {
  const session = await auth();
  if (!session?.user) {
    return { success: false, error: "Authentication required" };
  }

  try {
    await connectToDatabase();

    const stores = await Store.find({ 
      tenantId: session.user.tenantId,
      isDeleted: false 
    }).sort({ createdAt: -1 }).lean();

    return { success: true, data: serialize(stores) as unknown as IStore[] };
  } catch (err) {
    console.error("Get stores error:", err);
    return { success: false, error: "Failed to fetch stores" };
  }
}

// ─── Get store settings (for dashboard) ──────────────────────────────────────
export async function getStoreSettingsAction(
  storeSlug: string
): Promise<ApiResponse<Record<string, unknown>>> {
  const session = await auth();
  if (!session?.user) {
    return { success: false, error: "Authentication required" };
  }

  try {
    await connectToDatabase();

    const store = await Store.findOne({
      slug: storeSlug,
      tenantId: session.user.tenantId,
      isDeleted: false,
    }).lean();

    if (!store) {
      return { success: false, error: "Store not found or access denied" };
    }

    return { success: true, data: serialize(store) as Record<string, unknown> };
  } catch (err) {
    console.error("Get store settings error:", err);
    return { success: false, error: "Failed to fetch store settings" };
  }
}

// ─── Update store settings ────────────────────────────────────────────────────
export async function updateStoreAction(rawData: unknown): Promise<ApiResponse> {
  const session = await auth();
  if (!session?.user) {
    return { success: false, error: "Authentication required" };
  }

  const parsed = updateStoreSchema.safeParse(rawData);
  if (!parsed.success) {
    return {
      success: false,
      error: "Validation failed",
      errors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  const { storeId, settings: settingsPatch, seo: seoPatch, ...rest } = parsed.data;

  try {
    await connectToDatabase();

    // ✅ Verify ownership
    const store = await Store.findOne({
      _id: storeId,
      tenantId: session.user.tenantId,
      isDeleted: false,
    });

    if (!store) {
      return { success: false, error: "Store not found or access denied" };
    }

    // ✅ Check slug uniqueness if changing
    if (rest.slug && rest.slug !== store.slug) {
      const slugTaken = await Store.findOne({
        slug: rest.slug,
        _id: { $ne: storeId },
      });
      if (slugTaken) {
        return { success: false, error: "This store URL is already taken" };
      }
    }

    const updatePayload: Record<string, unknown> = { ...rest };

    if (settingsPatch) {
      updatePayload.settings = {
        ...store.settings,
        ...settingsPatch,
        theme: {
          ...store.settings?.theme,
          ...settingsPatch.theme,
        },
      };
    }

    if (seoPatch) {
      updatePayload.seo = {
        ...store.seo,
        ...seoPatch,
      };
    }

    const mediaFields = [
      "logo",
      "logoPublicId",
      "coverImage",
      "coverPublicId",
      "coverImages",
      "favicon",
      "faviconPublicId",
    ] as const;
    const hasMediaUpdate = mediaFields.some((k) => k in rest);

    if (hasMediaUpdate) {
      await cleanupStoreMediaOnUpdate(
        {
          logoPublicId: store.logoPublicId,
          coverPublicId: store.coverPublicId,
          faviconPublicId: store.faviconPublicId,
        },
        {
          logo: rest.logo,
          logoPublicId: rest.logoPublicId,
          coverImage: rest.coverImage,
          coverPublicId: rest.coverPublicId,
          favicon: rest.favicon,
          faviconPublicId: rest.faviconPublicId,
        }
      );

      if (rest.logo === "") {
        updatePayload.logo = "";
        updatePayload.logoPublicId = "";
      }
      if (rest.coverImage === "") {
        updatePayload.coverImage = "";
        updatePayload.coverPublicId = "";
      }
      if (Array.isArray(rest.coverImages)) {
        const coverImages = rest.coverImages.filter((image) => image.url).slice(0, 3);
        updatePayload.coverImages = coverImages;
        updatePayload.coverImage = coverImages[0]?.url ?? "";
        updatePayload.coverPublicId = coverImages[0]?.publicId ?? "";
      }
      if (rest.favicon === "") {
        updatePayload.favicon = "";
        updatePayload.faviconPublicId = "";
      }
    }

    await Store.findByIdAndUpdate(storeId, updatePayload, { runValidators: true });

    return { success: true, message: "Store updated successfully" };
  } catch (err) {
    console.error("Update store error:", err);
    return { success: false, error: "Failed to update store" };
  }
}

// ─── Delete store (soft delete) ───────────────────────────────────────────────
export async function deleteStoreAction(storeId: string): Promise<ApiResponse> {
  const session = await auth();
  if (!session?.user) {
    return { success: false, error: "Authentication required" };
  }

  try {
    await connectToDatabase();

    const store = await Store.findOne({ 
      _id: storeId, 
      tenantId: session.user.tenantId 
    });
    
    if (!store) {
      return { success: false, error: "Store not found" };
    }

    await Store.findByIdAndUpdate(storeId, {
      isDeleted: true,
      isActive: false,
      deletedAt: new Date()
    });

    return { success: true, message: "Store deleted successfully" };
  } catch (err) {
    console.error("Delete store error:", err);
    return { success: false, error: "Failed to delete store" };
  }
}
