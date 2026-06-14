import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { connectToDatabase } from "@/lib/db/mongodb";
import Store from "@/models/Store";
import Tenant from "@/models/Tenant";
import { customerLogin as customerLoginFn } from "@/lib/jwt/customer-jwt";
import { rolePermissions, type TenantRole } from "@/lib/auth/permissions";

const JWT_SECRET = process.env.JWT_SECRET || process.env.NEXTAUTH_SECRET || "dev-jwt-secret";
const JWT_EXPIRES_IN = "30d";
const COOKIE_MAX_AGE = 30 * 24 * 60 * 60;

export type UserRoleType = "customer" | "staff" | "tenant";

export interface UnifiedJWTPayload {
  id: string;
  email: string;
  name: string;
  role: UserRoleType;
  storeId?: string;
  storeSlug?: string;
  storeName?: string;
  tenantId?: string;
  tenantSlug?: string;
  permissions?: string[];
  staffRole?: string;
}

function getCookieName(storeSlug?: string, role?: string): string {
  if (role === "staff") return "staff-token";
  if (role === "tenant") return "tenant-token";
  return `customer-token-${storeSlug}`;
}

export function generateUnifiedToken(payload: UnifiedJWTPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

export function verifyUnifiedToken(token: string): UnifiedJWTPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as UnifiedJWTPayload;
  } catch {
    return null;
  }
}

export async function setAuthCookie(role: UserRoleType, token: string, storeSlug?: string) {
  const cookieStore = await cookies();
  const cookieName = getCookieName(storeSlug, role);
  cookieStore.set(cookieName, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: COOKIE_MAX_AGE,
    path: "/",
  });
}

export async function staffLogin(
  email: string,
  password: string
): Promise<{ success: boolean; token?: string; user?: UnifiedJWTPayload; error?: string }> {
  try {
    await connectToDatabase();
    
    // ✅ تصحيح جذري: الموظف مسجل في جدول Tenant وليس User
    const staff = await Tenant.findOne({
      email: email.toLowerCase(),
      role: { $in: ["staff_orders", "staff_products", "staff_reports"] },
      isActive: true,
    }).select("+password");

    if (!staff) return { success: false, error: "البريد الإلكتروني أو كلمة المرور غير صحيحة" };

    const valid = await bcrypt.compare(password, staff.password);
    if (!valid) return { success: false, error: "البريد الإلكتروني أو كلمة المرور غير صحيحة" };

    // ✅ التحقق من المستأجر الأب
    const tenant = await Tenant.findById(staff.tenantId).lean();
    if (!tenant || !tenant.isActive) {
      return { success: false, error: "المتجر التابع له هذا الحساب موقوف حالياً" };
    }

    const store = await Store.findById(staff.storeId).lean();
    const permissions = rolePermissions[staff.role as TenantRole] || [];

    const payload: UnifiedJWTPayload = {
      id: staff._id.toString(),
      email: staff.email,
      name: staff.name,
      role: "staff",
      storeId: store?._id?.toString(),
      storeSlug: store?.slug,
      storeName: store?.name,
      tenantId: staff.tenantId?.toString(),
      tenantSlug: tenant?.slug,
      staffRole: staff.role, // الاعتماد على الـ role الموحد
      permissions: permissions, // حقن الصلاحيات
    };

    const token = generateUnifiedToken(payload);
    return { success: true, token, user: payload };
  } catch (error) {
    console.error("staffLogin error:", error);
    return { success: false, error: "حدث خطأ أثناء تسجيل الدخول" };
  }
}

export async function tenantLogin(
  email: string,
  password: string
): Promise<{ success: boolean; token?: string; user?: UnifiedJWTPayload; error?: string }> {
  try {
    await connectToDatabase();
    const tenant = await Tenant.findOne({ email: email.toLowerCase(), role: "tenant_admin", isActive: true }).select("+password");
    if (!tenant) return { success: false, error: "البريد الإلكتروني أو كلمة المرور غير صحيحة" };

    const valid = await bcrypt.compare(password, tenant.password);
    if (!valid) return { success: false, error: "البريد الإلكتروني أو كلمة المرور غير صحيحة" };

    const permissions = rolePermissions["tenant_admin"] || [];

    const payload: UnifiedJWTPayload = {
      id: tenant._id.toString(),
      email: tenant.email,
      name: tenant.name,
      role: "tenant",
      tenantId: tenant._id.toString(),
      tenantSlug: tenant.slug,
      permissions: permissions,
    };

    const token = generateUnifiedToken(payload);
    return { success: true, token, user: payload };
  } catch (error) {
    console.error("tenantLogin error:", error);
    return { success: false, error: "حدث خطأ أثناء تسجيل الدخول" };
  }
}

export async function unifiedLogin(
  email: string,
  password: string,
  storeSlug?: string,
  userType?: "customer" | "staff" | "tenant"
): Promise<{ success: boolean; token?: string; user?: UnifiedJWTPayload; error?: string }> {
  try {
    if (userType === "tenant") return await tenantLogin(email, password);
    if (userType === "staff") return await staffLogin(email, password);
    if (userType === "customer" && storeSlug) {
      const res = await customerLoginFn(email, password, storeSlug);
      if (res.success && res.token) {
        const payload = jwt.verify(res.token, JWT_SECRET) as UnifiedJWTPayload;
        return { success: true, token: res.token, user: payload };
      }
      return { success: false, error: res.error };
    }

    const tenantRes = await tenantLogin(email, password);
    if (tenantRes.success) return tenantRes;

    const staffRes = await staffLogin(email, password);
    if (staffRes.success) return staffRes;

    if (storeSlug) {
      const customerRes = await customerLoginFn(email, password, storeSlug);
      if (customerRes.success && customerRes.token) {
        const payload = jwt.verify(customerRes.token, JWT_SECRET) as UnifiedJWTPayload;
        return { success: true, token: customerRes.token, user: payload };
      }
      return { success: false, error: customerRes.error };
    }

    return { success: false, error: "البريد الإلكتروني أو كلمة المرور غير صحيحة" };
  } catch (error) {
    console.error("unifiedLogin error:", error);
    return { success: false, error: "حدث خطأ أثناء تسجيل الدخول" };
  }
}

export default null;