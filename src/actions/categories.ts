"use server";

import { connectToDatabase } from "@/lib/db/mongodb";
import Category from "@/models/Category";
import AuditLog from "@/models/AuditLog";
import { auth } from "@/lib/auth";
import { createCategorySchema, updateCategorySchema } from "@/schemas/category";
import { serialize } from "@/lib/serialize";
import type { ApiResponse } from "@/types";
import type { ICategory } from "@/models/Category";

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
  rawData: unknown
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

    const existing = await Category.findOne({
      $or: [{ name: parsed.data.name }, { slug: parsed.data.slug }],
    });

    if (existing) {
      return { success: false, error: "Category with this name or slug already exists" };
    }

    const category = await Category.create(parsed.data);

    await AuditLog.create({
      userId: session.user.id,
      userEmail: session.user.email,
      userRole: session.user.role,
      action: "CREATE",
      resource: "Category",
      resourceId: category._id.toString(),
      details: { name: category.name },
      success: true,
    });

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
