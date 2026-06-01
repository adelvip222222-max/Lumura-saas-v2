import { NextRequest, NextResponse } from "next/server";
import type { Session } from "next-auth";
import { auth } from "@/lib/auth";
import {
  getStoreAccessPermissions,
  hasPermission,
  isStoreManager,
  type TenantRole,
} from "@/lib/auth/permissions";
import { uploadToCloudinary, deleteFromCloudinary } from "@/lib/cloudinary";
import { connectToDatabase } from "@/lib/db/mongodb";
import { getCloudinaryUploadTransform } from "@/lib/store/store-media";
import Store from "@/models/Store";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const MAX_BYTES = 5 * 1024 * 1024;
const UPLOAD_TYPES = ["product", "store", "cover", "logo"];

function normalizeUploadType(type: string) {
  return UPLOAD_TYPES.includes(type) ? type : "product";
}

async function verifyStoreAccess(storeSlug: string, tenantId?: string | null) {
  if (!tenantId) return false;
  await connectToDatabase();
  const store = await Store.findOne({
    slug: storeSlug,
    tenantId,
    isDeleted: false,
  }).select("_id");
  return Boolean(store);
}

function hasUploadPermission(session: Session, storeSlug: string, type: string) {
  const role = session?.user?.role as TenantRole | undefined;
  if (!role) return false;
  if (role === "super_admin" || role === "tenant_admin") return true;

  const permissions = getStoreAccessPermissions(session.user.stores, storeSlug);
  const manager = isStoreManager(session.user.stores, storeSlug);
  const permission = type === "product" ? "manage_products" : "manage_settings";

  return hasPermission(role, permission, permissions, manager);
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const type = normalizeUploadType((formData.get("type") as string) || "product");
    const storeSlug = (formData.get("storeSlug") as string) || "";

    if (!file) {
      return NextResponse.json({ error: "لا يوجد ملف" }, { status: 400 });
    }

    if (file.size > MAX_BYTES) {
      return NextResponse.json({ error: "حجم الملف يجب أن يكون أقل من 5MB" }, { status: 400 });
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({ error: "نوع الملف غير مدعوم" }, { status: 400 });
    }

    if (storeSlug) {
      const allowed = await verifyStoreAccess(storeSlug, session.user.tenantId);
      if (!allowed || !hasUploadPermission(session, storeSlug, type)) {
        return NextResponse.json({ error: "لا صلاحية لهذا المتجر" }, { status: 403 });
      }
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const folder = storeSlug ? `stores/${storeSlug}/${type}` : `uploads/${session.user.id}/${type}`;

    const result = await uploadToCloudinary(buffer, folder, {
      publicId: `${type}_${Date.now()}`,
      transformation: getCloudinaryUploadTransform(type),
    });

    return NextResponse.json({
      success: true,
      url: result.url,
      publicId: result.publicId,
    });
  } catch (error) {
    console.error("Upload error:", error);
    const message = error instanceof Error ? error.message : "فشل رفع الملف";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
    }

    const url = new URL(request.url);
    const publicId = url.searchParams.get("publicId");
    const storeSlug = url.searchParams.get("storeSlug") || "";
    const type = normalizeUploadType(url.searchParams.get("type") || "product");

    if (!publicId) {
      return NextResponse.json({ error: "publicId مطلوب" }, { status: 400 });
    }

    if (storeSlug) {
      const allowed = await verifyStoreAccess(storeSlug, session.user.tenantId);
      const prefix = `lumora-saas/stores/${storeSlug}/${type}/`;
      if (!allowed || !hasUploadPermission(session, storeSlug, type) || !publicId.startsWith(prefix)) {
        return NextResponse.json({ error: "لا صلاحية لحذف هذا الملف" }, { status: 403 });
      }
    } else if (!publicId.startsWith(`lumora-saas/uploads/${session.user.id}/`)) {
      return NextResponse.json({ error: "لا صلاحية لحذف هذا الملف" }, { status: 403 });
    }

    const deleted = await deleteFromCloudinary(publicId);
    return NextResponse.json({ success: deleted });
  } catch (error) {
    console.error("Delete error:", error);
    return NextResponse.json({ error: "فشل حذف الملف" }, { status: 500 });
  }
}
