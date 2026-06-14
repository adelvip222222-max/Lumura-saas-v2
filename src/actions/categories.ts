"use server";

import { connectToDatabase } from "@/lib/db/mongodb";
import Category from "@/models/Category";
import AuditLog from "@/models/AuditLog";
import { auth } from "@/lib/auth";
import { createCategorySchema, updateCategorySchema } from "@/schemas/category";
import { serialize } from "@/lib/serialize";
import type { ApiResponse } from "@/types";
import type { ICategory } from "@/models/Category";
import Store from "@/models/Store";
import { notifyTenantUsers } from "@/actions/notifications";
import mongoose from "mongoose";

export async function getCategoriesAction(
  activeOnly = true
): Promise<ApiResponse<ICategory[]>> {
  try {
    await connectToDatabase();

    const query = activeOnly ? { isActive: true } : {};
    const categories = await Category.find(query)
      .sort({ sortOrder: 1, name: 1 })
      .lean();

    return { success: true, data: serialize(categories) as unknown as ICategory[] };
  } catch (error) {
    console.error("Get categories error:", error);
    return { success: false, error: "Failed to fetch categories" };
  }
}

export async function getCategoryBySlugAction(
  slug: string,
  activeOnly = true
): Promise<ApiResponse<ICategory>> {
  try {
    await connectToDatabase();

    const query = activeOnly ? { slug, isActive: true } : { slug };
    const category = await Category.findOne(query).lean();
    if (!category) {
      return { success: false, error: "Category not found" };
    }

    return { success: true, data: serialize(category) as unknown as ICategory };
  } catch (error) {
    console.error("Get category error:", error);
    return { success: false, error: "Failed to fetch category" };
  }
}

export async function createCategoryAction(
  rawData: unknown,
  storeSlug?: string
): Promise<ApiResponse<{ id: string }>> {
  const session = await auth();
  if (!session?.user || !["tenant_admin", "super_admin", "staff_products"].includes(session.user.role)) {
    console.log("session?.user" , session?.user)
    return { success: false, error: "Insufficient permissions" };
  }

  const parsed = createCategorySchema.safeParse(rawData);
  if (!parsed.success) {
    return {
      success: false,
      error: "Validation failed",
      errors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  try {
    await connectToDatabase();

    let store;
    if (storeSlug) {
      store = await Store.findOne({ slug: storeSlug });
    } else if (session.user.storeId) {
      store = await Store.findById(session.user.storeId);
    }

    if (!store) {
      return { success: false, error: "Store not found" };
    }

    const existing = await Category.findOne({
      storeId: store._id,
      $or: [{ name: parsed.data.name }, { slug: parsed.data.slug }],
    });

    if (existing) {
      return { success: false, error: "Category with this name or slug already exists" };
    }

    const category = await Category.create({
      ...parsed.data,
      tenantId: store.tenantId,
      storeId: store._id,
    });

    await Promise.all([
      AuditLog.create({
        userId: session.user.id,
        userEmail: session.user.email,
        userRole: session.user.role,
        action: "CREATE",
        resource: "Category",
        resourceId: category._id.toString(),
        details: { name: category.name },
        success: true,
      }),
      notifyTenantUsers({
        tenantId: store.tenantId.toString(),
        storeId: store._id.toString(),
        type: "category_created" as any,
        title: "New Category Created",
        titleAr: "تم إضافة فئة جديدة",
        message: `Category "${category.name}" has been created in store "${store.name}".`,
        messageAr: `تم إضافة فئة جديدة باسم "${category.name}" في متجر "${store.name}".`,
        link: `/dashboard/stores/${store.slug}/categories`,
      })
    ]);

    return {
      success: true,
      data: { id: category._id.toString() },
      message: "Category created successfully",
    };
  } catch (error) {
    console.error("Create category error:", error);
    return { success: false, error: "Failed to create category" };
  }
}

export async function updateCategoryAction(
  rawData: unknown
): Promise<ApiResponse> {
  const session = await auth();
  if (!session?.user || !["tenant_admin", "super_admin", "staff_products"].includes(session.user.role)) {
    console.log("session?.user" , session?.user)
    return { success: false, error: "Insufficient permissions" };
  }

  const parsed = updateCategorySchema.safeParse(rawData);
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

    const category = await Category.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    });

    if (!category) {
      return { success: false, error: "Category not found" };
    }

    await AuditLog.create({
      userId: session.user.id,
      userEmail: session.user.email,
      userRole: session.user.role,
      action: "UPDATE",
      resource: "Category",
      resourceId: id,
      success: true,
    });

    return { success: true, message: "Category updated successfully" };
  } catch (error) {
    console.error("Update category error:", error);
    return { success: false, error: "Failed to update category" };
  }
}

export async function deleteCategoryAction(id: string): Promise<ApiResponse> {
  const session = await auth();
  if (!session?.user || !["admin", "super_admin", "tenant"].includes(session.user.role)) {
    return { success: false, error: "Insufficient permissions" };
  }

  try {
    await connectToDatabase();

    await Category.findByIdAndDelete(id);

    await AuditLog.create({
      userId: session.user.id,
      userEmail: session.user.email,
      userRole: session.user.role,
      action: "DELETE",
      resource: "Category",
      resourceId: id,
      success: true,
    });

    return { success: true, message: "Category deleted successfully" };
  } catch (error) {
    console.error("Delete category error:", error);
    return { success: false, error: "Failed to delete category" };
  }
}
