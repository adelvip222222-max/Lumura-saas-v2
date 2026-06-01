// src/lib/jwt/customer-jwt.ts
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { connectToDatabase } from "@/lib/db/mongodb";
import User from "@/models/User";
import Store from "@/models/Store";
import Tenant from "@/models/Tenant";

const JWT_SECRET = process.env.JWT_SECRET || process.env.NEXTAUTH_SECRET || "dev-jwt-secret";
const JWT_EXPIRES_IN = "30d";
const COOKIE_MAX_AGE = 30 * 24 * 60 * 60;

export interface CustomerJWTPayload {
  id: string;
  email: string;
  name: string;
  role: "customer";
  storeId: string;
  storeSlug: string;
  storeName: string;
  tenantId: string;
  tenantSlug: string;
}

function customerCookieName(storeSlug: string) {
  return `customer-token-${storeSlug}`;
}

export function generateCustomerToken(payload: CustomerJWTPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

export function verifyCustomerToken(token: string): CustomerJWTPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as CustomerJWTPayload;
    if (decoded.role !== "customer") return null;
    return decoded;
  } catch {
    return null;
  }
}

// ✅ جلب العميل من Cookie حسب المتجر
export async function getCustomerFromCookie(
  storeSlug: string
): Promise<CustomerJWTPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(customerCookieName(storeSlug))?.value;
  if (!token) return null;

  const payload = verifyCustomerToken(token);
  if (!payload || payload.storeSlug !== storeSlug) return null;
  return payload;
}

// ✅ جلب المستخدم الحالي (لأي نوع) - للتوافق مع الصفحات
export async function getCurrentUser(): Promise<CustomerJWTPayload | null> {
  const cookieStore = await cookies();
  const allCookies = cookieStore.getAll();
  
  // البحث عن أي customer token
  for (const cookie of allCookies) {
    if (cookie.name.startsWith("customer-token-")) {
      const payload = verifyCustomerToken(cookie.value);
      if (payload) return payload;
    }
  }
  
  return null;
}

// ✅ الحصول على متجر العميل الحالي
export async function getCurrentCustomerStore(): Promise<{ storeSlug: string; storeId: string } | null> {
  const cookieStore = await cookies();
  const allCookies = cookieStore.getAll();
  
  for (const cookie of allCookies) {
    if (cookie.name.startsWith("customer-token-")) {
      const payload = verifyCustomerToken(cookie.value);
      if (payload) {
        return {
          storeSlug: payload.storeSlug,
          storeId: payload.storeId,
        };
      }
    }
  }
  
  return null;
}

export async function setCustomerAuthCookie(storeSlug: string, token: string) {
  const cookieStore = await cookies();
  cookieStore.set(customerCookieName(storeSlug), token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: COOKIE_MAX_AGE,
    path: "/",
  });
}

export async function clearCustomerAuthCookie(storeSlug: string) {
  const cookieStore = await cookies();
  cookieStore.delete(customerCookieName(storeSlug));
}

async function resolveStoreContext(storeSlug: string) {
  await connectToDatabase();
  const store = await Store.findOne({ slug: storeSlug, isDeleted: false, isActive: true })
    .select("_id slug name tenantId")
    .lean();
  if (!store) return null;

  const tenant = await Tenant.findById(store.tenantId).select("slug").lean();

  return {
    storeId: store._id.toString(),
    storeSlug: store.slug,
    storeName: store.name,
    tenantId: store.tenantId.toString(),
    tenantSlug: tenant?.slug || "",
  };
}

async function bindUserToStore(
  userId: string,
  ctx: NonNullable<Awaited<ReturnType<typeof resolveStoreContext>>>
) {
  await User.findByIdAndUpdate(userId, {
    storeId: ctx.storeId,
    tenantId: ctx.tenantId,
    storeSlug: ctx.storeSlug,
    storeName: ctx.storeName,
    tenantSlug: ctx.tenantSlug,
    lastLogin: new Date(),
  });
}

function tokenFromUser(
  user: { _id: { toString(): string }; email: string; name: string },
  ctx: NonNullable<Awaited<ReturnType<typeof resolveStoreContext>>>
): string {
  return generateCustomerToken({
    id: user._id.toString(),
    email: user.email,
    name: user.name,
    role: "customer",
    storeId: ctx.storeId,
    storeSlug: ctx.storeSlug,
    storeName: ctx.storeName,
    tenantId: ctx.tenantId,
    tenantSlug: ctx.tenantSlug,
  });
}

export async function customerLogin(
  email: string,
  password: string,
  storeSlug: string
): Promise<{ success: boolean; token?: string; error?: string }> {
  const ctx = await resolveStoreContext(storeSlug);
  if (!ctx) return { success: false, error: "المتجر غير موجود أو غير نشط" };

  const user = await User.findOne({
    email: email.toLowerCase(),
    role: "customer",
  }).select("+password");

  if (!user?.password) {
    return { success: false, error: "البريد الإلكتروني أو كلمة المرور غير صحيحة" };
  }

  const isValid = await bcrypt.compare(password, user.password);
  if (!isValid) {
    return { success: false, error: "البريد الإلكتروني أو كلمة المرور غير صحيحة" };
  }

  await bindUserToStore(user._id.toString(), ctx);
  const token = tokenFromUser(user, ctx);
  return { success: true, token };
}

export async function customerRegister(
  name: string,
  email: string,
  password: string,
  phone: string,
  storeSlug: string
): Promise<{ success: boolean; token?: string; error?: string }> {
  const ctx = await resolveStoreContext(storeSlug);
  if (!ctx) return { success: false, error: "المتجر غير موجود أو غير نشط" };

  const normalizedEmail = email.toLowerCase();
  const existing = await User.findOne({ email: normalizedEmail }).select("+password role");

  if (existing) {
    if (existing.role !== "customer") {
      return { success: false, error: "هذا البريد مستخدم لحساب إداري" };
    }
    const valid = existing.password
      ? await bcrypt.compare(password, existing.password)
      : false;
    if (!valid) {
      return { success: false, error: "البريد مسجل مسبقاً — سجّل الدخول بكلمة مرورك" };
    }
    await bindUserToStore(existing._id.toString(), ctx);
    return { success: true, token: tokenFromUser(existing, ctx) };
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const user = await User.create({
    name,
    email: normalizedEmail,
    password: hashedPassword,
    phone,
    role: "customer",
    storeId: ctx.storeId,
    tenantId: ctx.tenantId,
    storeSlug: ctx.storeSlug,
    storeName: ctx.storeName,
    tenantSlug: ctx.tenantSlug,
    isActive: true,
    addresses: [],
  });

  return { success: true, token: tokenFromUser(user, ctx) };
}

export async function updateCustomerProfile(
  customerId: string,
  data: { name?: string; phone?: string }
) {
  await connectToDatabase();
  return User.findByIdAndUpdate(
    customerId,
    { ...data, updatedAt: new Date() },
    { new: true, runValidators: true }
  ).select("-password");
}