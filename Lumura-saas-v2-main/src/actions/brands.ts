"use server";

import { connectToDatabase } from "@/lib/db/mongodb";
import Brand from "@/models/Brand";
import Store from "@/models/Store";
import AuditLog from "@/models/AuditLog";
import { auth } from "@/lib/auth";
import { createBrandSchema, updateBrandSchema } from "@/schemas/brand";
import { serialize } from "@/lib/serialize";
import type { ApiResponse } from "@/types";
import type { IBrand } from "@/models/Brand";
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

export async function getBrandsAction(
  activeOnly = true
): Promise<ApiResponse<IBrand[]>> {
  try {
    await connectToDatabase();

    const query = activeOnly ? { isActive: true } : {};
    const brands = await Brand.find(query)
      .sort({ sortOrder: 1, name: 1 })
      .lean();

    return { success: true, data: serialize(brands) as unknown as IBrand[] };
  } catch (error) {
    console.error("Get brands error:", error);
    return { success: false, error: "Failed to fetch brands" };
  }
}

export async function createBrandAction(
  rawData: unknown
): Promise<ApiResponse<{ id: string }>> {
  const session = await auth();
  if (!session?.user || !["tenant_admin", "super_admin", "staff_products"].includes(session.user.role)) {
    return { success: false, error: "Insufficient permissions" };
  }

  const parsed = createBrandSchema.safeParse(rawData);
  if (!parsed.success) {
    return {
      success: false,
      error: "Validation failed",
      errors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  try {
    await connectToDatabase();

    const existing = await Brand.findOne({
      $or: [{ name: parsed.data.name }, { slug: parsed.data.slug }],
    });

    if (existing) {
      return { success: false, error: "Brand with this name or slug already exists" };
    }

    const brand = await Brand.create(parsed.data);

    await AuditLog.create({
      userId: session.user.id,
      userEmail: session.user.email,
      userRole: session.user.role,
      action: "CREATE",
      resource: "Brand",
      resourceId: brand._id.toString(),
      details: { name: brand.name },
      success: true,
    });

    return {
      success: true,
      data: { id: brand._id.toString() },
      message: "Brand created successfully",
    };
  } catch (error) {
    console.error("Create brand error:", error);
    return { success: false, error: "Failed to create brand" };
  }
}

export async function updateBrandAction(rawData: unknown): Promise<ApiResponse> {
  const session = await auth();
  if (!session?.user || !["tenant_admin", "super_admin", "staff_products"].includes(session.user.role)) {
    return { success: false, error: "Insufficient permissions" };
  }

  const parsed = updateBrandSchema.safeParse(rawData);
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

    const brand = await Brand.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    });

    if (!brand) {
      return { success: false, error: "Brand not found" };
    }

    await AuditLog.create({
      userId: session.user.id,
      userEmail: session.user.email,
      userRole: session.user.role,
      action: "UPDATE",
      resource: "Brand",
      resourceId: id,
      success: true,
    });

    return { success: true, message: "Brand updated successfully" };
  } catch (error) {
    console.error("Update brand error:", error);
    return { success: false, error: "Failed to update brand" };
  }
}

export async function deleteBrandAction(id: string): Promise<ApiResponse> {
  const session = await auth();
  if (!session?.user || !["tenant_admin", "super_admin", "staff_products"].includes(session.user.role)) {
    return { success: false, error: "Insufficient permissions" };
  }

  try {
    await connectToDatabase();

    await Brand.findByIdAndDelete(id);

    await AuditLog.create({
      userId: session.user.id,
      userEmail: session.user.email,
      userRole: session.user.role,
      action: "DELETE",
      resource: "Brand",
      resourceId: id,
      success: true,
    });

    return { success: true, message: "Brand deleted successfully" };
  } catch (error) {
    console.error("Delete brand error:", error);
    return { success: false, error: "Failed to delete brand" };
  }
}


export async function createStoreBrandAction(
  storeSlug: string,
  rawData: unknown
): Promise<ApiResponse<{ id: string }>> {
  const parsed = createBrandSchema.safeParse(rawData);
  if (!parsed.success) {
    return {
      success: false,
      error: "Validation failed",
      errors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  try {
    await connectToDatabase();
    const resolved = await resolveWritableStore(storeSlug, "manage_brands");
    if ("error" in resolved) {
      return { success: false, error: resolved.error };
    }

    const existing = await Brand.findOne({
      tenantId: resolved.store.tenantId,
      storeId: resolved.store._id,
      $or: [{ name: parsed.data.name }, { slug: parsed.data.slug }],
    });

    if (existing) {
      return { success: false, error: "توجد ماركة بنفس الاسم أو الرابط داخل هذا المتجر" };
    }

    const brand = await Brand.create({
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
      resource: "Brand",
      resourceId: brand._id.toString(),
      details: { name: brand.name, storeSlug },
      success: true,
    });

    return {
      success: true,
      data: { id: brand._id.toString() },
      message: "تم إنشاء الماركة بنجاح",
    };
  } catch (error) {
    console.error("Create store brand error:", error);
    return { success: false, error: "فشل إنشاء الماركة. تأكد من البيانات والصلاحيات" };
  }
}

export async function getStoreBrandsAction(
  storeSlug: string,
  activeOnly = false
): Promise<ApiResponse<IBrand[]>> {
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

    const brands = await Brand.find(query).sort({ sortOrder: 1, name: 1 }).lean();
    return { success: true, data: serialize(brands) as unknown as IBrand[] };
  } catch (error) {
    console.error("Get store brands error:", error);
    return { success: false, error: "Failed to fetch store brands" };
  }
}
