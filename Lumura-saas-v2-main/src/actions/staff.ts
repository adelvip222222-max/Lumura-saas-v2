// src/actions/staff.ts
/* eslint-disable @typescript-eslint/no-explicit-any */
"use server";

import { auth } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db/mongodb";
import Tenant from "@/models/Tenant";
import Store from "@/models/Store";
import Subscription from "@/models/Subscription";
import bcrypt from "bcryptjs";
import type { ApiResponse } from "@/types";
import {
  ADMIN_PERMISSIONS,
  PERMISSION_LABELS,
  STORE_MANAGER_PERMISSIONS,
  type AdminPermission,
} from "@/lib/auth/permissions";

type StaffStoreAccessInput = {
  storeSlug: string;
  permissions: AdminPermission[];
  isManager: boolean;
};

function normalizePermissions(
  permissions: AdminPermission[],
  isManager: boolean
) {
  const allowed = new Set(ADMIN_PERMISSIONS);
  const source = isManager ? STORE_MANAGER_PERMISSIONS : permissions;

  return [...new Set(source.filter((permission) => allowed.has(permission)))];
}

async function getAssignableStores(tenantId: string, slugs?: string[]) {
  const query: Record<string, unknown> = {
    tenantId,
    isDeleted: false,
    isActive: true,
  };

  if (slugs?.length) {
    query.slug = { $in: slugs };
  }

  const stores = await Store.find(query).select("_id name slug").lean();

  return stores;
}

export async function getTenantAssignableStoresAction(): Promise<
  ApiResponse<any[]>
> {
  const session = await auth();

  if (!session?.user || session.user.role !== "tenant_admin") {
    return { success: false, error: "غير مصرح - مدير المستأجر فقط" };
  }

  try {
    await connectToDatabase();

    const stores = await getAssignableStores(session.user.tenantId);

    return {
      success: true,
      data: stores.map((store: any) => ({
        id: store._id.toString(),
        name: store.name ?? "",
        slug: store.slug ?? "",
      })),
    };
  } catch (error) {
    console.error("getTenantAssignableStoresAction:", error);
    return { success: false, error: "فشل تحميل المتاجر المتاحة" };
  }
}

export async function getStoreStaffAction(
  storeSlug: string
): Promise<ApiResponse<any[]>> {
  const session = await auth();

  if (!session?.user || session.user.role !== "tenant_admin") {
    return { success: false, error: "غير مصرح - مدير المستأجر فقط" };
  }

  try {
    await connectToDatabase();

    const store = (await Store.findOne({
      slug: storeSlug,
      tenantId: session.user.tenantId,
      isDeleted: false,
    })
      .select("_id slug")
      .lean()) as { _id: { toString(): string }; slug: string } | null;

    if (!store) {
      return { success: false, error: "المتجر غير موجود" };
    }

    const staff = await Tenant.find({
      tenantId: session.user.tenantId,
      role: {
        $in: [
          "staff_member",
          "staff_orders",
          "staff_products",
          "staff_reports",
        ],
      },
    })
      .select("-password")
      .sort({ createdAt: 1 })
      .lean();

    return {
      success: true,
      data: staff.map((member: any) => {
        const staffAccess = Array.isArray(member.staffAccess)
          ? member.staffAccess
          : [];

        const currentAccess = staffAccess.find(
          (access: any) => access.storeSlug === store.slug
        );

        const legacyStoreMatch =
          member.storeId?.toString() === store._id.toString();

        return {
          _id: member._id ? member._id.toString() : "",

          name: member.name ?? "",
          email: member.email ?? "",
          role: member.role ?? "",
          prgType: member.prgType ?? "",

          isActive: Boolean(member.isActive),

          storeId: member.storeId ? member.storeId.toString() : null,
          storeSlug: member.storeSlug ?? "",
          storeName: member.storeName ?? "",

          tenantId: member.tenantId ? member.tenantId.toString() : null,

          plan: member.plan ?? "",
          status: member.status ?? "",

          subscriptionStart: member.subscriptionStart
            ? member.subscriptionStart.toISOString()
            : null,

          subscriptionEnd: member.subscriptionEnd
            ? member.subscriptionEnd.toISOString()
            : null,

          createdAt: member.createdAt ? member.createdAt.toISOString() : null,

          updatedAt: member.updatedAt ? member.updatedAt.toISOString() : null,

          permissions: currentAccess?.permissions ?? member.permissions ?? [],

          isManager: Boolean(currentAccess?.isManager),

          isThisStore: Boolean(currentAccess || legacyStoreMatch),

          staffAccess: staffAccess.map((access: any) => ({
            storeId: access.storeId ? access.storeId.toString() : "",
            storeSlug: access.storeSlug ?? "",
            storeName: access.storeName ?? "",
            permissions: access.permissions ?? [],
            isManager: Boolean(access.isManager),
          })),
        };
      }),
    };
  } catch (error) {
    console.error("getStoreStaffAction:", error);
    return { success: false, error: "فشل تحميل فريق العمل" };
  }
}

export async function createStaffAction(rawData: {
  name: string;
  email: string;
  password: string;
  access: StaffStoreAccessInput[];
}): Promise<ApiResponse> {
  const session = await auth();

  if (!session?.user || session.user.role !== "tenant_admin") {
    return { success: false, error: "غير مصرح - مدير المستأجر فقط" };
  }

  try {
    await connectToDatabase();

    const selectedSlugs = [
      ...new Set(
        rawData.access
          .map((item) => item.storeSlug)
          .filter(Boolean)
      ),
    ];

    if (selectedSlugs.length === 0) {
      return { success: false, error: "اختر متجرًا واحدًا على الأقل" };
    }

    const stores = await getAssignableStores(
      session.user.tenantId,
      selectedSlugs
    );

    if (stores.length !== selectedSlugs.length) {
      return {
        success: false,
        error: "لا يمكن إسناد موظف لمتجر غير نشط أو منتهي الاشتراك",
      };
    }

    const tenant = await Tenant.findById(session.user.tenantId).lean();

    const maxStaff = Number(tenant?.maxStaff || 4);

    const normalizedEmail = rawData.email.toLowerCase().trim();

    const existing = await Tenant.findOne({ email: normalizedEmail }).select(
      "+password"
    );

    if (existing && existing.tenantId?.toString() !== session.user.tenantId) {
      return { success: false, error: "البريد الإلكتروني مستخدم في حساب آخر" };
    }

    if (!existing) {
      const staffCount = await Tenant.countDocuments({
        tenantId: session.user.tenantId,
        role: {
          $in: [
            "staff_member",
            "staff_orders",
            "staff_products",
            "staff_reports",
          ],
        },
      });

      if (staffCount >= maxStaff) {
        return { success: false, error: `الحد الأقصى ${maxStaff} موظفين` };
      }
    }

    const storeBySlug = new Map(
      stores.map((store: any) => [store.slug, store])
    );

    const staffAccess = rawData.access.map((item) => {
      const store: any = storeBySlug.get(item.storeSlug);

      const permissions = normalizePermissions(
        item.permissions,
        item.isManager
      );

      return {
        storeId: store._id,
        storeSlug: store.slug,
        storeName: store.name,
        permissions,
        isManager: Boolean(item.isManager),
      };
    });

    const firstAccess = staffAccess[0];

    const flattenedPermissions = [
      ...new Set(staffAccess.flatMap((item) => item.permissions)),
    ];

    const hashedPassword = rawData.password
      ? await bcrypt.hash(rawData.password, 10)
      : undefined;

    if (existing) {
      existing.name = rawData.name.trim();
      existing.role = "staff_member";
      existing.prgType = "staff";

      existing.storeId = firstAccess.storeId;
      existing.storeSlug = firstAccess.storeSlug;
      existing.storeName = firstAccess.storeName;

      existing.staffAccess = staffAccess;
      existing.permissions = flattenedPermissions;
      existing.isActive = true;

      if (hashedPassword) {
        existing.password = hashedPassword;
      }

      await existing.save();

      return { success: true, message: "تم تحديث صلاحيات الموظف بنجاح" };
    }

    if (!hashedPassword) {
      return {
        success: false,
        error: "كلمة المرور مطلوبة عند إنشاء موظف جديد",
      };
    }

    await Tenant.create({
      slug: `${normalizedEmail.split("@")[0]}-${Date.now()}`,
      name: rawData.name.trim(),
      email: normalizedEmail,
      password: hashedPassword,

      role: "staff_member",
      prgType: "staff",

      storeId: firstAccess.storeId,
      storeSlug: firstAccess.storeSlug,
      storeName: firstAccess.storeName,

      tenantId: session.user.tenantId,

      staffAccess,
      permissions: flattenedPermissions,

      plan: "MONTHLY",
      status: "ACTIVE",

      subscriptionStart: new Date(),
      subscriptionEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),

      maxStores: 0,
      maxProducts: 0,
      maxStaff: 0,

      isActive: true,
    });

    const managerAccessCount = staffAccess.filter(
      (item) => item.isManager
    ).length;

    const permissionNames = flattenedPermissions
      .map((permission) => PERMISSION_LABELS[permission]?.ar)
      .filter(Boolean)
      .join("، ");

    return {
      success: true,
      message:
        managerAccessCount > 0
          ? "تم حفظ الموظف كمدير للمتاجر المحددة"
          : `تم حفظ الموظف بالصلاحيات: ${permissionNames}`,
    };
  } catch (error) {
    console.error("createStaffAction:", error);
    return { success: false, error: "فشل إضافة الموظف" };
  }
}

export async function toggleStoreStaffAction(
  userId: string,
  isActive: boolean
): Promise<ApiResponse> {
  const session = await auth();

  if (!session?.user || session.user.role !== "tenant_admin") {
    return { success: false, error: "غير مصرح" };
  }

  try {
    await connectToDatabase();

    await Tenant.findOneAndUpdate(
      {
        _id: userId,
        tenantId: session.user.tenantId,
      },
      {
        isActive,
      }
    );

    return {
      success: true,
      message: isActive ? "تم تفعيل الموظف" : "تم إيقاف الموظف",
    };
  } catch (error) {
    console.error("toggleStoreStaffAction:", error);
    return { success: false, error: "فشل تحديث حالة الموظف" };
  }
}

export async function deleteStoreStaffAction(
  userId: string
): Promise<ApiResponse> {
  const session = await auth();

  if (!session?.user || session.user.role !== "tenant_admin") {
    return { success: false, error: "غير مصرح" };
  }

  try {
    await connectToDatabase();

    await Tenant.findOneAndDelete({
      _id: userId,
      tenantId: session.user.tenantId,
    });

    return { success: true, message: "تم حذف الموظف بنجاح" };
  } catch (error) {
    console.error("deleteStoreStaffAction:", error);
    return { success: false, error: "فشل حذف الموظف" };
  }
}