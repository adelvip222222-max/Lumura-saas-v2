// src/actions/auth.ts
"use server";

import { signIn, signOut } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db/mongodb";
import User from "@/models/User";
import Tenant from "@/models/Tenant";
import Store from "@/models/Store";
import AuditLog from "@/models/AuditLog";
import { hashPassword, comparePassword } from "@/lib/auth/password";
import { registerSchema, changePasswordSchema, registerStaffSchema } from "@/schemas/auth";
import { auth } from "@/lib/auth";
import type { ApiResponse } from "@/types";
import { headers } from "next/headers";
import { z } from "zod";
import { STAFF_ROLES, MAX_STAFF_PER_TENANT, STAFF_ROLE_LABELS, type StaffRole } from "@/lib/auth/permissions";

export async function loginAction(
  _prevState: ApiResponse,
  formData: FormData
): Promise<ApiResponse> {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const callbackUrl = (formData.get("callbackUrl") as string) || "/";

  try {
    await signIn("credentials", {
      email,
      password,
      redirectTo: callbackUrl,
    });

    return { success: true, message: "Logged in successfully" };
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes("CredentialsSignin")) {
        return { success: false, error: "Invalid email or password" };
      }
      if (error.message.includes("locked")) {
        return {
          success: false,
          error: "Account is temporarily locked. Try again in 30 minutes.",
        };
      }
    }
    throw error;
  }
}

// ✅ التسجيل للعملاء العاديين
export async function registerAction(
  rawData: unknown
): Promise<ApiResponse<{ userId: string }>> {
  const parsed = registerSchema.safeParse(rawData);

  if (!parsed.success) {
    return {
      success: false,
      error: "Validation failed",
      errors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  const { name, email, password } = parsed.data;

  try {
    await connectToDatabase();

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return {
        success: false,
        error: "An account with this email already exists",
      };
    }

    const hashedPassword = await hashPassword(password);

    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      role: "customer",
    });

    await AuditLog.create({
      userId: user._id,
      userEmail: email,
      action: "CREATE",
      resource: "User",
      resourceId: user._id.toString(),
      success: true,
    });

    return {
      success: true,
      data: { userId: user._id.toString() },
      message: "Account created successfully",
    };
  } catch (error) {
    console.error("Register error:", error);
    return {
      success: false,
      error: "Failed to create account. Please try again.",
    };
  }
}

// ✅ التسجيل للموظفين (Staff) مع تحديد الدور
export async function registerStaffAction(
  rawData: unknown
): Promise<ApiResponse<{ userId: string }>> {
  const session = await auth();
  
  // ✅ التحقق من أن المستخدم الحالي هو Tenant Admin
  if (!session?.user || session.user.role !== "tenant_admin") {
    return { success: false, error: "غير مصرح - مدير المستأجر فقط" };
  }

  const parsed = registerStaffSchema.safeParse(rawData);
  if (!parsed.success) {
    return {
      success: false,
      error: "Validation failed",
      errors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  const { name, email, password, storeSlug, staffRole } = parsed.data;

  try {
    await connectToDatabase();

    // ✅ التحقق من وجود المتجر
    const store = await Store.findOne({
      slug: storeSlug,
      tenantId: session.user.tenantId,
      isDeleted: false,
    });

    if (!store) {
      return { success: false, error: "المتجر غير موجود" };
    }

    // ✅ التحقق من عدد الموظفين داخل المستأجر
    const tenant = await Tenant.findById(session.user.tenantId);
    const maxStaff = tenant?.maxStaff ?? MAX_STAFF_PER_TENANT;

    const staffCount = tenant?.staff?.length ?? 0;

    if (staffCount >= maxStaff) {
      return {
        success: false,
        error: `الحد الأقصى ${maxStaff} موظفين لهذا المستأجر`,
      };
    }

    // ✅ التحقق من عدم وجود نفس الدور داخل المستأجر
    const roleTaken = tenant?.staff?.some((s: any) => s.staffRole === staffRole);
    if (roleTaken) {
      return {
        success: false,
        error: `يوجد بالفعل موظف بدور «${STAFF_ROLE_LABELS[staffRole as StaffRole]?.ar || staffRole}»`,
      };
    }

    // ✅ التحقق من عدم وجود البريد في جدول الـ Users أو ضمن موظفي أي مستأجر
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return { success: false, error: "البريد الإلكتروني مستخدم مسبقاً" };
    }

    const tenantEmail = await Tenant.findOne({ email: email.toLowerCase() });
    if (tenantEmail) {
      return { success: false, error: "البريد مرتبط بحساب المستأجر الرئيسي" };
    }

    // also check staff emails across tenants
    const otherTenantWithStaff = await Tenant.findOne({ "staff.email": email.toLowerCase() });
    if (otherTenantWithStaff) {
      return { success: false, error: "البريد مرتبط بحساب موظف آخر" };
    }

    const hashedPassword = await hashPassword(password);

    // push staff into tenant.staff
    const newStaff = {
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      staffRole,
      storeId: store._id,
      storeSlug: store.slug,
      storeName: store.name,
      isActive: true,
    } as any;

    tenant!.staff.push(newStaff);
    await tenant!.save();

    const created = tenant!.staff[tenant!.staff.length - 1];

    await AuditLog.create({
      userId: session.user.id,
      userEmail: session.user.email,
      userRole: session.user.role,
      action: "CREATE",
      resource: "Staff",
      resourceId: String(created._id),
      details: { staffRole, storeSlug },
      success: true,
    });

    return {
      success: true,
      data: { userId: String(created._id) },
      message: `تم إضافة الموظف بنجاح بدور «${STAFF_ROLE_LABELS[staffRole as StaffRole]?.ar || staffRole}»`,
    };
  } catch (error) {
    console.error("Register staff error:", error);
    return {
      success: false,
      error: "فشل إضافة الموظف",
    };
  }
}

// ✅ الحصول على موظفي المتجر
export async function getStoreStaffAction(
  storeSlug: string
): Promise<ApiResponse<unknown[]>> {
  const session = await auth();
  
  if (!session?.user || session.user.role !== "tenant_admin") {
    return { success: false, error: "غير مصرح" };
  }

  try {
    await connectToDatabase();
    
    const store = await Store.findOne({
      slug: storeSlug,
      tenantId: session.user.tenantId,
      isDeleted: false,
    });

    if (!store) {
      return { success: false, error: "المتجر غير موجود" };
    }

    const tenant = await Tenant.findById(session.user.tenantId).lean();
    if (!tenant) return { success: false, error: "المستأجر غير موجود" };

    const staff = (tenant.staff || []).filter((s: any) => s.storeSlug === store.slug);
    const serialized = staff
      .sort((a: any, b: any) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
      .map((s: any) => ({
        _id: String(s._id),
        name: s.name,
        email: s.email,
        staffRole: s.staffRole,
        isActive: Boolean(s.isActive),
        staffRoleLabel: s.staffRole
          ? STAFF_ROLE_LABELS[s.staffRole as StaffRole]?.ar
          : "",
        isThisStore: s.storeSlug === store.slug,
      }));

    return { success: true, data: serialized };
  } catch (error) {
    console.error("getStoreStaffAction:", error);
    return { success: false, error: "فشل تحميل فريق العمل" };
  }
}

// ✅ تحديث حالة الموظف
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
    await connectToDatabase();
    const tenantDoc = await Tenant.findById(session.user.tenantId);
    if (!tenantDoc) return { success: false, error: "المستأجر غير موجود" };

    const staff = tenantDoc.staff.id(userId);
    if (!staff) return { success: false, error: "الموظف غير موجود" };

    staff.isActive = isActive;
    await tenantDoc.save();

    await AuditLog.create({
      userId: session.user.id,
      userEmail: session.user.email,
      userRole: session.user.role,
      action: "UPDATE",
      resource: "Staff",
      resourceId: userId,
      details: { isActive },
      success: true,
    });

    return { success: true, message: isActive ? "تم تفعيل الحساب" : "تم إيقاف الحساب" };
  } catch (error) {
    console.error("toggleStoreStaffAction error:", error);
    return { success: false, error: "فشل تحديث الحساب" };
  }
}

// ✅ حذف الموظف
export async function deleteStoreStaffAction(userId: string): Promise<ApiResponse> {
  const session = await auth();
  
  if (!session?.user || session.user.role !== "tenant_admin") {
    return { success: false, error: "غير مصرح" };
  }

  try {
    await connectToDatabase();
    await connectToDatabase();
    const tenantDoc = await Tenant.findById(session.user.tenantId);
    if (!tenantDoc) return { success: false, error: "المستأجر غير موجود" };

    const staff = tenantDoc.staff.id(userId);
    if (!staff) return { success: false, error: "الموظف غير موجود" };

    staff.remove();
    await tenantDoc.save();

    await AuditLog.create({
      userId: session.user.id,
      userEmail: session.user.email,
      userRole: session.user.role,
      action: "DELETE",
      resource: "Staff",
      resourceId: userId,
      success: true,
    });

    return { success: true, message: "تم حذف الموظف" };
  } catch (error) {
    console.error("deleteStoreStaffAction error:", error);
    return { success: false, error: "فشل الحذف" };
  }
}

export async function logoutAction(): Promise<void> {
  await signOut({ redirectTo: "/" });
}

export async function changePasswordAction(
  rawData: unknown
): Promise<ApiResponse> {
  const session = await auth();

  if (!session?.user) {
    return { success: false, error: "Authentication required" };
  }

  const parsed = changePasswordSchema.safeParse(rawData);
  if (!parsed.success) {
    return {
      success: false,
      error: "Validation failed",
      errors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  const { currentPassword, newPassword } = parsed.data;

  try {
    await connectToDatabase();

    const user = await User.findById(session.user.id).select("+password");
    if (!user || !user.password) {
      return { success: false, error: "User not found" };
    }

    const isValid = await comparePassword(currentPassword, user.password);
    if (!isValid) {
      return { success: false, error: "Current password is incorrect" };
    }

    user.password = await hashPassword(newPassword);
    await user.save();

    const headersList = await headers();
    await AuditLog.create({
      userId: user._id,
      userEmail: user.email,
      userRole: user.role,
      action: "PASSWORD_CHANGE",
      resource: "User",
      resourceId: user._id.toString(),
      ipAddress: headersList.get("x-forwarded-for") ?? "unknown",
      success: true,
    });

    return { success: true, message: "Password changed successfully" };
  } catch (error) {
    console.error("Change password error:", error);
    return { success: false, error: "Failed to change password" };
  }
}

export async function updateProfileAction(
  rawData: unknown
): Promise<ApiResponse> {
  const session = await auth();

  if (!session?.user) {
    return { success: false, error: "Authentication required" };
  }

  const schema = z.object({
    name: z.string().min(2).max(100).trim(),
    phone: z.string().optional(),
    image: z.string().url().optional(),
  });

  const parsed = schema.safeParse(rawData);
  if (!parsed.success) {
    return {
      success: false,
      error: "Validation failed",
      errors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  try {
    await connectToDatabase();

    if (["tenant_admin", "super_admin", "store_admin"].includes(session.user.role)) {
      const Tenant = (await import("@/models/Tenant")).default;
      await Tenant.findByIdAndUpdate(session.user.id, {
        name: parsed.data.name,
        ...(parsed.data.phone && { phone: parsed.data.phone }),
      });
    } else {
      await User.findByIdAndUpdate(session.user.id, {
        name: parsed.data.name,
        phone: parsed.data.phone,
        image: parsed.data.image,
      });
    }

    return { success: true, message: "Profile updated successfully" };
  } catch (error) {
    console.error("Update profile error:", error);
    return { success: false, error: "Failed to update profile" };
  }
}