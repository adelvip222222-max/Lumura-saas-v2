import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { uploadToCloudinary, deleteFromCloudinary } from "@/lib/cloudinary";
import { getCloudinaryUploadTransform } from "@/lib/store/store-media";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const MAX_BYTES = 5 * 1024 * 1024;
const UPLOAD_TYPES = ["product", "store", "cover", "logo", "favicon", "category", "brand"];

function normalizeUploadType(type: string) {
  return UPLOAD_TYPES.includes(type) ? type : "product";
}

export async function POST(request: NextRequest) {
  try {
    // 1. التحقق من الجلسة (أي مستخدم مسجل دخول)
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const type = normalizeUploadType((formData.get("type") as string) || "product");

    if (!file) {
      return NextResponse.json({ error: "لا يوجد ملف" }, { status: 400 });
    }

    if (file.size > MAX_BYTES) {
      return NextResponse.json({ error: "حجم الملف يجب أن يكون أقل من 5MB" }, { status: 400 });
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({ error: "نوع الملف غير مدعوم" }, { status: 400 });
    }

    // 2. تجهيز الملف
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // 3. كل الصور تروح لمجلد المستخدم فقط، بدون صلاحيات متجر
    const folder = `uploads/${session.user.id}/${type}`;

    // 4. رفع الصورة إلى Cloudinary
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

    if (!publicId) {
      return NextResponse.json({ error: "publicId مطلوب" }, { status: 400 });
    }

    // التحقق إن الملف يخص المستخدم نفسه
    const userPrefix = `lumora-saas/uploads/${session.user.id}/`;
    if (!publicId.startsWith(userPrefix)) {
      return NextResponse.json({ error: "لا صلاحية لحذف هذا الملف" }, { status: 403 });
    }

    const deleted = await deleteFromCloudinary(publicId);
    return NextResponse.json({ success: deleted });
  } catch (error) {
    console.error("Delete error:", error);
    return NextResponse.json({ error: "فشل حذف الملف" }, { status: 500 });
  }
}
