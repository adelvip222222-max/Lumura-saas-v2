"use server";

import { connectToDatabase } from "@/lib/db/mongodb";
import Category from "@/models/Category";
import Store from "@/models/Store";
import AuditLog from "@/models/AuditLog";
import { auth } from "@/lib/auth";
import { createCategorySchema, updateCategorySchema } from "@/schemas/category";
import { serialize } from "@/lib/serialize";
import type { ApiResponse } from "@/types";
import type { ICategory } from "@/models/Category";
import type { Permission } from "@/lib/auth/permissions";


function hasPermission(permissions: Permission[] | undefined, permission: Permission) {
  return permissions?.includes("*") || permissions?.includes(permission);
}

async function resolveWritableStore(storeSlug: string, permission: Permission) {
  const session = await auth();
  if (!session?.user) {
    return { error: "Authentication required" as const };
  }

  const role = session.user.role;
  const tenantId = session.user.tenantId;
  const canWrite =
    role === "super_admin" ||
    role === "tenant_admin" ||
    hasPermission(session.user.permissions as Permission[] | undefined, permission) ||
    hasPermission(
      session.user.stores?.find((store) => store.slug === storeSlug)?.permissions as Permission[] | undefined,
      permission
    );

  if (!canWrite) {
    return { error: "Insufficient permissions" as const };
  }

  const store = await Store.findOne({ slug: storeSlug, tenantId, isDeleted: false });
  if (!store) {
    return { error: "Store not found or access denied" as const };
  }

  return { session, store };
}

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


export async function createStoreCategoryAction(
  storeSlug: string,
  rawData: unknown
): Promise<ApiResponse<{ id: string; slug: string }>> {
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
    const resolved = await resolveWritableStore(storeSlug, "manage_categories");
    if ("error" in resolved) {
      return { success: false, error: resolved.error };
    }

    const existing = await Category.findOne({
      tenantId: resolved.store.tenantId,
      storeId: resolved.store._id,
      $or: [{ name: parsed.data.name }, { slug: parsed.data.slug }],
    });

    if (existing) {
      return { success: false, error: "توجد فئة بنفس الاسم أو الرابط داخل هذا المتجر" };
    }

    const category = await Category.create({
      ...parsed.data,
      tenantId: resolved.store.tenantId,
      storeId: resolved.store._id,
    });

    await AuditLog.create({
      userId: resolved.session.user.id,
      userEmail: resolved.session.user.email,
      userRole: resolved.session.user.role,
      tenantId: resolved.store.tenantId.toString(),
      storeId: resolved.store._id.toString(),
      action: "CREATE",
      resource: "Category",
      resourceId: category._id.toString(),
      details: { name: category.name, storeSlug },
      success: true,
    });

    return {
      success: true,
      data: { id: category._id.toString(), slug: category.slug },
      message: "تم إنشاء الفئة بنجاح",
    };
  } catch (error) {
    console.error("Create store category error:", error);
    return { success: false, error: "فشل إنشاء الفئة. تأكد من البيانات والصلاحيات" };
  }
}

export async function getStoreCategoriesAction(
  storeSlug: string,
  activeOnly = false
): Promise<ApiResponse<ICategory[]>> {
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
    });

    if (!store) {
      return { success: false, error: "Store not found or access denied" };
    }

    const query: Record<string, unknown> = {
      tenantId: store.tenantId,
      storeId: store._id,
    };
    if (activeOnly) query.isActive = true;

    const categories = await Category.find(query).sort({ sortOrder: 1, createdAt: -1 }).lean();
    return { success: true, data: serialize(categories) as unknown as ICategory[] };
  } catch (error) {
    console.error("Get store categories error:", error);
    return { success: false, error: "Failed to fetch store categories" };
  }
}

export async function getStoreCategoryBySlugAction(
  storeSlug: string,
  categorySlug: string,
  activeOnly = false
): Promise<ApiResponse<ICategory>> {
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
    });

    if (!store) {
      return { success: false, error: "Store not found or access denied" };
    }

    const query: Record<string, unknown> = {
      slug: categorySlug,
      tenantId: store.tenantId,
      storeId: store._id,
    };
    if (activeOnly) query.isActive = true;

    const category = await Category.findOne(query).lean();
    if (!category) return { success: false, error: "Category not found" };
    return { success: true, data: serialize(category) as unknown as ICategory };
  } catch (error) {
    console.error("Get store category error:", error);
    return { success: false, error: "Failed to fetch category" };
  }
}
