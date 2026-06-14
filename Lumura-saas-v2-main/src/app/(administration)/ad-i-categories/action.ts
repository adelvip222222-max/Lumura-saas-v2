"use server";

import "server-only";
import { revalidatePath } from "next/cache";
import mongoose from "mongoose";
import { getAdministrationContext } from "@/lib/administration/context";
import { connectToDatabase } from "@/lib/db/mongodb";
import { generateSlug } from "@/lib/utils";
import Category from "@/models/Category";

function readText(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function readNumber(formData: FormData, key: string, fallback = 0) {
  const value = Number(formData.get(key));
  return Number.isFinite(value) ? value : fallback;
}

export async function getAdministrationCategories() {
  const ctx = await getAdministrationContext("manage_categories");
  await connectToDatabase();

  const categories = await Category.find({ storeId: ctx.storeId })
    .select("name nameAr description isActive isFeatured sortOrder createdAt")
    .sort({ sortOrder: 1, createdAt: -1 })
    .lean();

  return {
    store: { name: ctx.storeName },
    categories: categories.map((category: any) => ({
      id: category._id.toString(),
      name: category.name,
      nameAr: category.nameAr ?? "",
      description: category.description ?? "",
      isActive: Boolean(category.isActive),
      isFeatured: Boolean(category.isFeatured),
      sortOrder: category.sortOrder ?? 0,
    })),
  };
}

export async function createAdministrationCategoryAction(formData: FormData) {
  const ctx = await getAdministrationContext("manage_categories");
  await connectToDatabase();

  const name = readText(formData, "name");
  if (name.length < 2) return { success: false, error: "اسم الفئة مطلوب" };

  try {
    await Category.create({
      tenantId: new mongoose.Types.ObjectId(ctx.tenantId),
      storeId: new mongoose.Types.ObjectId(ctx.storeId),
      name,
      nameAr: readText(formData, "nameAr") || undefined,
      slug: generateSlug(name),
      description: readText(formData, "description") || undefined,
      isActive: formData.get("isActive") === "on",
      isFeatured: formData.get("isFeatured") === "on",
      sortOrder: readNumber(formData, "sortOrder", 0),
      subcategories: [],
      metaTitle: name,
    });
  } catch (error: any) {
    if (error?.code === 11000) return { success: false, error: "توجد فئة بنفس الاسم" };
    throw error;
  }

  revalidatePath("/ad-i-categories");
  revalidatePath("/ad-i-products");
  return { success: true, message: "تمت إضافة الفئة" };
}

export async function updateAdministrationCategoryAction(formData: FormData) {
  const ctx = await getAdministrationContext("manage_categories");
  await connectToDatabase();

  const categoryId = readText(formData, "categoryId");
  if (!mongoose.Types.ObjectId.isValid(categoryId)) return { success: false, error: "معرف الفئة غير صالح" };

  const category = await Category.findOne({ _id: categoryId, storeId: ctx.storeId });
  if (!category) return { success: false, error: "الفئة غير موجودة" };

  const name = readText(formData, "name");
  if (name.length < 2) return { success: false, error: "اسم الفئة مطلوب" };

  category.name = name;
  category.nameAr = readText(formData, "nameAr") || undefined;
  category.description = readText(formData, "description") || undefined;
  category.sortOrder = readNumber(formData, "sortOrder", category.sortOrder);
  category.isActive = formData.get("isActive") === "on";
  category.isFeatured = formData.get("isFeatured") === "on";
  await category.save();

  revalidatePath("/ad-i-categories");
  revalidatePath("/ad-i-products");
  return { success: true, message: "تم تحديث الفئة" };
}
