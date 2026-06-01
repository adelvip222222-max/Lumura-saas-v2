"use server";

import "server-only";
import { revalidatePath } from "next/cache";
import mongoose from "mongoose";
import { getAdministrationContext } from "@/lib/administration/context";
import { connectToDatabase } from "@/lib/db/mongodb";
import { generateSlug } from "@/lib/utils";
import Brand from "@/models/Brand";

function readText(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function readNumber(formData: FormData, key: string, fallback = 0) {
  const value = Number(formData.get(key));
  return Number.isFinite(value) ? value : fallback;
}

export async function getAdministrationBrands() {
  const ctx = await getAdministrationContext("manage_brands");
  await connectToDatabase();

  const brands = await Brand.find({ storeId: ctx.storeId })
    .select("name nameAr description website isActive isFeatured sortOrder createdAt")
    .sort({ sortOrder: 1, createdAt: -1 })
    .lean();

  return {
    store: { name: ctx.storeName },
    brands: brands.map((brand: any) => ({
      id: brand._id.toString(),
      name: brand.name,
      nameAr: brand.nameAr ?? "",
      description: brand.description ?? "",
      website: brand.website ?? "",
      isActive: Boolean(brand.isActive),
      isFeatured: Boolean(brand.isFeatured),
      sortOrder: brand.sortOrder ?? 0,
    })),
  };
}

export async function createAdministrationBrandAction(formData: FormData) {
  const ctx = await getAdministrationContext("manage_brands");
  await connectToDatabase();

  const name = readText(formData, "name");
  if (name.length < 2) return { success: false, error: "اسم الماركة مطلوب" };

  try {
    await Brand.create({
      tenantId: new mongoose.Types.ObjectId(ctx.tenantId),
      storeId: new mongoose.Types.ObjectId(ctx.storeId),
      name,
      nameAr: readText(formData, "nameAr") || undefined,
      slug: generateSlug(name),
      description: readText(formData, "description") || undefined,
      website: readText(formData, "website") || undefined,
      isActive: formData.get("isActive") === "on",
      isFeatured: formData.get("isFeatured") === "on",
      sortOrder: readNumber(formData, "sortOrder", 0),
      metaTitle: name,
    });
  } catch (error: any) {
    if (error?.code === 11000) return { success: false, error: "توجد ماركة بنفس الاسم" };
    throw error;
  }

  revalidatePath("/ad-i-brands");
  revalidatePath("/ad-i-products");
  return { success: true, message: "تمت إضافة الماركة" };
}

export async function updateAdministrationBrandAction(formData: FormData) {
  const ctx = await getAdministrationContext("manage_brands");
  await connectToDatabase();

  const brandId = readText(formData, "brandId");
  if (!mongoose.Types.ObjectId.isValid(brandId)) return { success: false, error: "معرف الماركة غير صالح" };

  const brand = await Brand.findOne({ _id: brandId, storeId: ctx.storeId });
  if (!brand) return { success: false, error: "الماركة غير موجودة" };

  const name = readText(formData, "name");
  if (name.length < 2) return { success: false, error: "اسم الماركة مطلوب" };

  brand.name = name;
  brand.nameAr = readText(formData, "nameAr") || undefined;
  brand.description = readText(formData, "description") || undefined;
  brand.website = readText(formData, "website") || undefined;
  brand.sortOrder = readNumber(formData, "sortOrder", brand.sortOrder);
  brand.isActive = formData.get("isActive") === "on";
  brand.isFeatured = formData.get("isFeatured") === "on";
  await brand.save();

  revalidatePath("/ad-i-brands");
  revalidatePath("/ad-i-products");
  return { success: true, message: "تم تحديث الماركة" };
}
